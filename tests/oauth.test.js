const test = require('node:test');
const assert = require('node:assert/strict');
const { createAuthService } = require('../apps/api/src/auth.cjs');
const { createOAuthService } = require('../apps/api/src/oauth.cjs');
const { createUserService } = require('../apps/api/src/users.cjs');

function response(body, ok = true) {
  return {
    ok,
    async json() {
      return body;
    },
  };
}

function createServices(fetchImpl, providers) {
  let userService;
  const authService = createAuthService({
    secret: 'oauth-test-secret',
    findUserById: (id) => userService.getUserById(id),
  });
  userService = createUserService({ authService });
  const oauthService = createOAuthService({
    authService,
    userService,
    fetchImpl,
    providers,
  });

  return { authService, userService, oauthService };
}

test('OAuth Google intercambia el código, registra el usuario y emite JWT', async () => {
  const requests = [];
  const services = createServices(
    async (url, options = {}) => {
      requests.push({ url, options });
      if (url === 'https://oauth.test/google/token') {
        return response({ access_token: 'google-access-token' });
      }

      return response({
        sub: 'google-123',
        email: 'ana@google.example',
        name: 'Ana Google',
        picture: 'https://example.com/ana.png',
      });
    },
    {
      google: {
        clientId: 'google-client',
        clientSecret: 'google-secret',
        authorizationEndpoint: 'https://oauth.test/google/authorize',
        tokenEndpoint: 'https://oauth.test/google/token',
        userEndpoint: 'https://oauth.test/google/userinfo',
      },
    }
  );
  const redirectUri = 'http://localhost:3000/api/v1/auth/google/callback';
  const authorizationUrl = services.oauthService.begin('google', redirectUri);
  const authorization = new URL(authorizationUrl);

  assert.equal(authorization.searchParams.get('client_id'), 'google-client');
  assert.equal(authorization.searchParams.get('scope'), 'openid email profile');

  const auth = await services.oauthService.complete('google', {
    code: 'google-code',
    state: authorization.searchParams.get('state'),
    redirectUri,
  });

  assert.equal(auth.user.email, 'ana@google.example');
  assert.equal(auth.user.oauthProvider, 'google');
  assert.equal(services.userService.listUsers().length, 1);
  assert.equal(services.authService.verifyAccessToken(auth.accessToken).sub, auth.user.id);
  assert.equal(requests[0].options.method, 'POST');
});

test('OAuth GitHub obtiene el email verificado cuando el perfil no lo incluye', async () => {
  const services = createServices(
    async (url) => {
      if (url === 'https://oauth.test/github/token') {
        return response({ access_token: 'github-access-token' });
      }

      if (url === 'https://oauth.test/github/user/emails') {
        return response([{ email: 'sofia@github.example', primary: true, verified: true }]);
      }

      return response({ id: 456, login: 'sofia', avatar_url: 'https://example.com/sofia.png' });
    },
    {
      github: {
        clientId: 'github-client',
        clientSecret: 'github-secret',
        authorizationEndpoint: 'https://oauth.test/github/authorize',
        tokenEndpoint: 'https://oauth.test/github/token',
        userEndpoint: 'https://oauth.test/github/user',
        emailEndpoint: 'https://oauth.test/github/user/emails',
      },
    }
  );
  const redirectUri = 'http://localhost:3000/api/v1/auth/github/callback';
  const authorization = new URL(services.oauthService.begin('github', redirectUri));

  const auth = await services.oauthService.complete('github', {
    code: 'github-code',
    state: authorization.searchParams.get('state'),
    redirectUri,
  });

  assert.equal(auth.user.email, 'sofia@github.example');
  assert.equal(auth.user.oauthId, '456');
});

test('OAuth rechaza reutilizar el state y callbacks con redirect URI distinto', async () => {
  const services = createServices(async () => response({ access_token: 'unused' }), {
    google: {
      clientId: 'google-client',
      clientSecret: 'google-secret',
    },
  });
  const redirectUri = 'http://localhost:3000/api/v1/auth/google/callback';
  const authorization = new URL(services.oauthService.begin('google', redirectUri));
  const state = authorization.searchParams.get('state');

  await assert.rejects(
    () =>
      services.oauthService.complete('google', {
        code: 'code',
        state,
        redirectUri: 'http://malicious.example/callback',
      }),
    /estado OAuth no es válido/
  );
  await assert.rejects(
    () => services.oauthService.complete('google', { code: 'code', state, redirectUri }),
    /estado OAuth no es válido/
  );
});
