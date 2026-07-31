const test = require('node:test');
const assert = require('node:assert/strict');
const { createUserService } = require('../apps/api/src/users.cjs');

test('createUserService registra usuarios locales y autentica con email/password', () => {
  const service = createUserService();

  const created = service.registerUser({
    email: 'maria@example.com',
    password: 'secret123',
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
