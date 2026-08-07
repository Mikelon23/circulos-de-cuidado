const crypto = require('node:crypto');

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signToken(header, payload, secret) {
  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const content = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(content).digest('base64url');

  return `${content}.${signature}`;
}

function hasValidSignature(expected, actual) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

function createAuthService(options = {}) {
  const configuredSecret = options.secret || process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && !configuredSecret) {
    throw new Error('JWT_SECRET es obligatorio en producción');
  }

  const secret = configuredSecret || 'development-only-jwt-secret';
  const accessTokenTtlSeconds = options.accessTokenTtlSeconds || DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
  const refreshTokenTtlSeconds =
    options.refreshTokenTtlSeconds || DEFAULT_REFRESH_TOKEN_TTL_SECONDS;
  const findUserById = options.findUserById || (() => null);
  const refreshSessions = new Map();

  function createToken(user, type, ttlSeconds, tokenId = null) {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      type,
      iat: now,
      exp: now + ttlSeconds,
    };

    if (tokenId) {
      payload.jti = tokenId;
    }

    return signToken({ alg: 'HS256', typ: 'JWT' }, payload, secret);
  }

  function verifyToken(token, expectedType) {
    if (typeof token !== 'string') {
      throw new Error('El token es obligatorio');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('El token no es válido');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (!hasValidSignature(expectedSignature, signature)) {
      throw new Error('El token no es válido');
    }

    let header;
    let payload;
    try {
      header = JSON.parse(decodeBase64Url(encodedHeader));
      payload = JSON.parse(decodeBase64Url(encodedPayload));
    } catch (_error) {
      throw new Error('El token no es válido');
    }

    if (header.alg !== 'HS256' || header.typ !== 'JWT' || payload.type !== expectedType) {
      throw new Error('El token no es válido');
    }

    if (!Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new Error('El token ha expirado');
    }

    return payload;
  }

  function issueTokens(user) {
    const refreshTokenId = crypto.randomUUID();
    const refreshToken = createToken(user, 'refresh', refreshTokenTtlSeconds, refreshTokenId);

    refreshSessions.set(refreshTokenId, {
      userId: user.id,
      expiresAt: Date.now() + refreshTokenTtlSeconds * 1000,
    });

    return {
      accessToken: createToken(user, 'access', accessTokenTtlSeconds),
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessTokenTtlSeconds,
    };
  }

  return {
    issueTokens,

    verifyAccessToken(token) {
      return verifyToken(token, 'access');
    },

    refreshTokens(refreshToken) {
      const payload = verifyToken(refreshToken, 'refresh');
      const session = refreshSessions.get(payload.jti);

      if (!session || session.expiresAt <= Date.now()) {
        refreshSessions.delete(payload.jti);
        throw new Error('El refresh token no es válido');
      }

      const user = findUserById(session.userId);
      if (!user) {
        refreshSessions.delete(payload.jti);
        throw new Error('El usuario no existe');
      }

      refreshSessions.delete(payload.jti);
      return issueTokens(user);
    },
  };
}

function requireAuth(authService) {
  return (req, res, next) => {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    try {
      req.auth = authService.verifyAccessToken(token);
      return next();
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  };
}

module.exports = {
  createAuthService,
  requireAuth,
};
