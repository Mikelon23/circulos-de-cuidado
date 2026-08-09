const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX = 100;
const DEFAULT_INPUT_MAX_DEPTH = 8;
const DEFAULT_INPUT_MAX_KEYS = 100;
const DEFAULT_INPUT_MAX_STRING_LENGTH = 10_000;
const SENSITIVE_INPUT_KEYS = new Set([
  'password',
  'passwordConfirmation',
  'confirmPassword',
  'token',
  'refreshToken',
  'oauthId',
]);

function resolveAllowedOrigins(configuredOrigins = process.env.CORS_ORIGINS) {
  const origins = Array.isArray(configuredOrigins)
    ? configuredOrigins
    : String(configuredOrigins || DEFAULT_CORS_ORIGIN).split(',');

  return new Set(origins.map((origin) => String(origin).trim()).filter(Boolean));
}

function createCorsMiddleware({ allowedOrigins = process.env.CORS_ORIGINS } = {}) {
  const origins = resolveAllowedOrigins(allowedOrigins);
  const allowAllOrigins = origins.has('*');

  return (req, res, next) => {
    const requestOrigin = req.headers.origin;

    if (!requestOrigin) {
      return next();
    }

    if (!allowAllOrigins && !origins.has(requestOrigin)) {
      return res.status(403).json({ error: 'Origen no permitido' });
    }

    res.setHeader('Access-Control-Allow-Origin', allowAllOrigins ? '*' : requestOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '600');
    res.setHeader('Vary', 'Origin');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    return next();
  };
}

function createRateLimitMiddleware({
  windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || DEFAULT_RATE_LIMIT_WINDOW_MS,
  max = Number(process.env.RATE_LIMIT_MAX) || DEFAULT_RATE_LIMIT_MAX,
  now = () => Date.now(),
  keyGenerator = (req) => req.ip || req.socket?.remoteAddress || 'unknown',
  skip = (req) => req.path === '/health' || req.method === 'OPTIONS',
} = {}) {
  if (!Number.isFinite(windowMs) || windowMs <= 0) {
    throw new Error('RATE_LIMIT_WINDOW_MS debe ser un número positivo');
  }

  if (!Number.isInteger(max) || max <= 0) {
    throw new Error('RATE_LIMIT_MAX debe ser un entero positivo');
  }

  const clients = new Map();

  return (req, res, next) => {
    if (skip(req)) {
      return next();
    }

    const currentTime = now();
    const key = keyGenerator(req);
    let entry = clients.get(key);

    if (!entry || currentTime >= entry.resetAt) {
      entry = { count: 0, resetAt: currentTime + windowMs };
      clients.set(key, entry);
    }

    const remaining = Math.max(max - entry.count - 1, 0);
    const resetSeconds = Math.ceil((entry.resetAt - currentTime) / 1000);
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(resetSeconds));

    if (entry.count >= max) {
      res.setHeader('Retry-After', String(resetSeconds));
      return res.status(429).json({ error: 'Demasiadas solicitudes, inténtalo más tarde' });
    }

    entry.count += 1;
    return next();
  };
}

function sanitizeString(value, key) {
  if (SENSITIVE_INPUT_KEYS.has(key)) {
    return value;
  }

  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\b(?:javascript|vbscript|data):/gi, '')
    .trim();
}

function sanitizeValue(value, options, key = '') {
  const { depth, maxDepth, keys, maxKeys, maxStringLength } = options;

  if (depth > maxDepth) {
    throw new Error('El cuerpo de la solicitud es demasiado profundo');
  }

  if (typeof value === 'string') {
    if (value.length > maxStringLength) {
      throw new Error('El cuerpo de la solicitud contiene un texto demasiado largo');
    }
    return sanitizeString(value, key);
  }

  if (Array.isArray(value)) {
    if (value.length > maxKeys) {
      throw new Error('El cuerpo de la solicitud contiene demasiados elementos');
    }
    return value.map((item) => sanitizeValue(item, { ...options, depth: depth + 1 }, key));
  }

  if (value && typeof value === 'object') {
    const sanitized = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      if (childKey === '__proto__' || childKey === 'constructor' || childKey === 'prototype') {
        continue;
      }
      if (keys >= maxKeys) {
        throw new Error('El cuerpo de la solicitud contiene demasiados campos');
      }
      sanitized[childKey] = sanitizeValue(
        childValue,
        {
          ...options,
          depth: depth + 1,
          keys: keys + 1,
        },
        childKey
      );
    }
    return sanitized;
  }

  return value;
}

function createInputSanitizationMiddleware({
  maxDepth = DEFAULT_INPUT_MAX_DEPTH,
  maxKeys = DEFAULT_INPUT_MAX_KEYS,
  maxStringLength = DEFAULT_INPUT_MAX_STRING_LENGTH,
} = {}) {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      if (req.body === undefined) {
        return next();
      }
      return res.status(400).json({ error: 'El cuerpo de la solicitud debe ser un objeto' });
    }

    try {
      req.body = sanitizeValue(req.body, {
        depth: 0,
        maxDepth,
        keys: 0,
        maxKeys,
        maxStringLength,
      });
      return next();
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  };
}

module.exports = {
  createCorsMiddleware,
  createInputSanitizationMiddleware,
  createRateLimitMiddleware,
};
