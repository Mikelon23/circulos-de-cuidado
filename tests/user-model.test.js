const test = require('node:test');
const assert = require('node:assert/strict');
const { createUserService } = require('../apps/api/src/users.cjs');
const { createAuthService, requireAuth } = require('../apps/api/src/auth.cjs');

test('createUserService registra usuarios locales y autentica con email/password', () => {
  const service = createUserService();

  const created = service.registerUser({
    email: 'maria@example.com',
    password: 'secret123',
    emailVerified: true,
    role: 'cuidador',
    nombreVisible: 'María',
  });

  assert.equal(created.email, 'maria@example.com');
  assert.equal(created.rol, 'cuidador');
  assert.ok(created.id);
  assert.notEqual(created.passwordHash, 'secret123');

  const auth = service.loginUser({ email: 'maria@example.com', password: 'secret123' });
  assert.equal(auth.user.email, 'maria@example.com');
  assert.equal(auth.user.rol, 'cuidador');
  assert.match(auth.accessToken, /^[\w-]+\.[\w-]+\.[\w-]+$/);
  assert.ok(auth.refreshToken);
  assert.equal(auth.tokenType, 'Bearer');

  const list = service.listUsers();
  assert.equal(list.length, 1);
});

test('createUserService soporta registro OAuth con proveedor externo', () => {
  const service = createUserService();

  const created = service.registerUser({
    email: 'sofia@github.example',
    password: '',
    role: 'facilitador',
    oauthProvider: 'github',
    oauthId: 'gh-001',
    emailVerified: true,
  });

  assert.equal(created.oauthProvider, 'github');
  assert.equal(created.oauthId, 'gh-001');
  assert.equal(created.emailVerificado, true);
});

test('createUserService valida el email y la contraseña local', () => {
  const service = createUserService();

  assert.throws(
    () => service.registerUser({ email: 'not-an-email', password: 'secret123' }),
    /email no es válido/
  );
  assert.throws(
    () => service.registerUser({ email: 'ana@example.com', password: 'short' }),
    /al menos 8 caracteres/
  );
  assert.throws(
    () =>
      service.registerUser({
        email: 'ana@example.com',
        password: 'secret123',
        passwordConfirmation: 'different',
      }),
    /no coinciden/
  );
});

test('createUserService permite confirmar el email con un token de un solo uso', () => {
  const service = createUserService();
  const created = service.registerUser({
    email: 'lucia@example.com',
    password: 'secret123',
  });

  assert.equal(created.emailVerificado, false);
  assert.ok(created.verificationToken);
  assert.equal(created.passwordHash, undefined);

  const verified = service.verifyEmail(created.verificationToken);
  assert.equal(verified.emailVerificado, true);
  assert.throws(() => service.verifyEmail(created.verificationToken), /no es válido/);
});

test('createUserService bloquea login local hasta verificar el email', () => {
  const service = createUserService();
  service.registerUser({ email: 'no-verificada@example.com', password: 'secret123' });

  assert.throws(
    () => service.loginUser({ email: 'no-verificada@example.com', password: 'secret123' }),
    /no está verificado/
  );
});

test('createAuthService verifica, rota y expira refresh tokens', () => {
  let userService;
  const authService = createAuthService({
    secret: 'test-secret',
    accessTokenTtlSeconds: 60,
    refreshTokenTtlSeconds: 60,
    findUserById: (id) => userService.getUserById(id),
  });
  userService = createUserService({ authService });
  const user = userService.registerUser({
    email: 'token@example.com',
    password: 'secret123',
    emailVerified: true,
  });

  const tokens = userService.loginUser({ email: user.email, password: 'secret123' });
  const claims = authService.verifyAccessToken(tokens.accessToken);
  assert.equal(claims.sub, user.id);

  const renewedTokens = authService.refreshTokens(tokens.refreshToken);
  assert.notEqual(renewedTokens.refreshToken, tokens.refreshToken);
  assert.throws(() => authService.refreshTokens(tokens.refreshToken), /no es válido/);

  const expiredAuthService = createAuthService({
    secret: 'expired-secret',
    accessTokenTtlSeconds: -1,
  });
  const expiredToken = expiredAuthService.issueTokens(user).accessToken;
  assert.throws(() => expiredAuthService.verifyAccessToken(expiredToken), /ha expirado/);
});

test('requireAuth rechaza solicitudes sin bearer token y adjunta claims válidos', () => {
  const authService = createAuthService({ secret: 'middleware-secret' });
  const user = { id: 'user-1', email: 'user@example.com', rol: 'cuidador' };
  const tokens = authService.issueTokens(user);
  const middleware = requireAuth(authService);
  let nextCalled = false;
  const response = {
    status() {
      return this;
    },
    json() {
      return this;
    },
  };

  middleware({ headers: {} }, response, () => {
    throw new Error('No debe continuar sin token');
  });

  middleware({ headers: { authorization: `Bearer ${tokens.accessToken}` } }, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});
