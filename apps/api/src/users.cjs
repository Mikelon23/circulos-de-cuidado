const crypto = require('node:crypto');
const { createAuthService } = require('./auth.cjs');

const VALID_ROLES = new Set(['cuidador', 'facilitador', 'admin']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(email) {
  return String(email ?? '')
    .trim()
    .toLowerCase();
}

function verifyPassword(password, passwordHash) {
  if (!passwordHash || !password) {
    return false;
  }

  const [salt, originalHash] = passwordHash.split(':');
  if (!salt || !originalHash) {
    return false;
  }

  const candidateHash = crypto.pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex');

  return crypto.timingSafeEqual(
    Buffer.from(candidateHash, 'hex'),
    Buffer.from(originalHash, 'hex')
  );
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex');

  return `${salt}:${hash}`;
}

function sanitizeUser(user) {
  const { passwordHash, emailVerificationToken, createdAt, updatedAt, ...safeUser } = user;

  return {
    ...safeUser,
    createdAt,
    updatedAt,
  };
}

function createUserService({ authService = createAuthService() } = {}) {
  const users = [];

  return {
    registerUser(payload = {}) {
      const email = normalizeEmail(payload.email);
      const role = String(payload.role || 'cuidador').toLowerCase();
      const oauthProvider = payload.oauthProvider
        ? String(payload.oauthProvider).toLowerCase()
        : null;
      const oauthId = payload.oauthId ? String(payload.oauthId) : null;
      const password = typeof payload.password === 'string' ? payload.password : '';
      const passwordConfirmation = payload.passwordConfirmation ?? payload.confirmPassword;

      if (!email) {
        throw new Error('El email es obligatorio');
      }

      if (email.length > 255 || !EMAIL_PATTERN.test(email)) {
        throw new Error('El email no es válido');
      }

      if (!VALID_ROLES.has(role)) {
        throw new Error('El rol no es válido');
      }

      if (users.some((user) => user.email === email)) {
        throw new Error('El email ya está registrado');
      }

      if (oauthProvider && oauthId) {
        const created = {
          id: crypto.randomUUID(),
          email,
          nombreReal: payload.nombreReal ?? null,
          nombreVisible: payload.nombreVisible ?? null,
          avatarUrl: payload.avatarUrl ?? null,
          rol: role,
          emailVerificado: payload.emailVerified ?? true,
          anonimo: payload.anonimo ?? false,
          oauthProvider,
          oauthId,
          passwordHash: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        users.push(created);
        return sanitizeUser(created);
      }

      if (!password) {
        throw new Error('La contraseña es obligatoria para registros locales');
      }

      if (password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
      }

      if (passwordConfirmation !== undefined && password !== passwordConfirmation) {
        throw new Error('Las contraseñas no coinciden');
      }

      const created = {
        id: crypto.randomUUID(),
        email,
        nombreReal: payload.nombreReal ?? null,
        nombreVisible: payload.nombreVisible ?? null,
        avatarUrl: payload.avatarUrl ?? null,
        rol: role,
        emailVerificado: payload.emailVerified ?? false,
        anonimo: payload.anonimo ?? false,
        oauthProvider: 'local',
        oauthId: null,
        passwordHash: hashPassword(password),
        emailVerificationToken: payload.emailVerified
          ? null
          : crypto.randomBytes(32).toString('hex'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      users.push(created);
      const safeUser = sanitizeUser(created);

      if (created.emailVerificationToken) {
        return {
          ...safeUser,
          verificationToken: created.emailVerificationToken,
        };
      }

      return safeUser;
    },

    verifyEmail(token) {
      if (typeof token !== 'string' || !token) {
        throw new Error('El token de verificación es obligatorio');
      }

      const user = users.find((candidate) => candidate.emailVerificationToken === token);
      if (!user) {
        throw new Error('El token de verificación no es válido');
      }

      user.emailVerificado = true;
      user.emailVerificationToken = null;
      user.updatedAt = new Date().toISOString();

      return sanitizeUser(user);
    },

    loginUser(payload = {}) {
      const email = normalizeEmail(payload.email);
      const password = typeof payload.password === 'string' ? payload.password : '';

      if (!email) {
        throw new Error('El email es obligatorio');
      }

      const user = users.find((candidate) => candidate.email === email);
      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      if (user.oauthProvider !== 'local') {
        if (!password && user.oauthProvider) {
          return {
            user: sanitizeUser(user),
            ...authService.issueTokens(user),
          };
        }

        throw new Error('Este usuario usa autenticación OAuth');
      }

      if (!user.emailVerificado) {
        throw new Error('El email no está verificado');
      }

      if (!password || !verifyPassword(password, user.passwordHash)) {
        throw new Error('Credenciales inválidas');
      }

      return {
        user: sanitizeUser(user),
        ...authService.issueTokens(user),
      };
    },

    getUserById(id) {
      const user = users.find((candidate) => candidate.id === id);
      return user ? sanitizeUser(user) : null;
    },

    getUserByEmail(email) {
      const normalizedEmail = normalizeEmail(email);
      const user = users.find((candidate) => candidate.email === normalizedEmail);
      return user ? sanitizeUser(user) : null;
    },

    getUserByOAuth(provider, providerId) {
      const user = users.find(
        (candidate) => candidate.oauthProvider === provider && candidate.oauthId === providerId
      );
      return user ? sanitizeUser(user) : null;
    },

    listUsers() {
      return users.map((user) => sanitizeUser(user));
    },
  };
}

module.exports = {
  createUserService,
};
