const test = require('node:test');
const assert = require('node:assert/strict');
const { createCorsMiddleware, createRateLimitMiddleware } = require('../apps/api/src/security.cjs');

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    ended: false,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };
}

test('createCorsMiddleware permite el frontend configurado y responde preflight', () => {
  const middleware = createCorsMiddleware({ allowedOrigins: ['https://web.example'] });
  const response = createResponse();
  let nextCalled = false;

  middleware({ method: 'OPTIONS', headers: { origin: 'https://web.example' } }, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 204);
  assert.equal(response.ended, true);
  assert.equal(nextCalled, false);
  assert.equal(response.headers['Access-Control-Allow-Origin'], 'https://web.example');
});

test('createCorsMiddleware rechaza orígenes no autorizados', () => {
  const middleware = createCorsMiddleware({ allowedOrigins: ['https://web.example'] });
  const response = createResponse();

  middleware({ method: 'GET', headers: { origin: 'https://evil.example' } }, response, () =>
    assert.fail('No debe continuar un origen no autorizado')
  );

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { error: 'Origen no permitido' });
});

test('createRateLimitMiddleware devuelve 429 y reinicia la ventana', () => {
  let currentTime = 1_000;
  const middleware = createRateLimitMiddleware({
    windowMs: 1_000,
    max: 2,
    now: () => currentTime,
  });
  const request = { ip: '127.0.0.1', method: 'GET', path: '/api/v1/users' };
  let nextCalls = 0;
  const next = () => {
    nextCalls += 1;
  };

  const firstResponse = createResponse();
  middleware(request, firstResponse, next);
  assert.equal(firstResponse.headers['RateLimit-Remaining'], '1');

  const secondResponse = createResponse();
  middleware(request, secondResponse, next);
  assert.equal(secondResponse.headers['RateLimit-Remaining'], '0');

  const blockedResponse = createResponse();
  middleware(request, blockedResponse, next);
  assert.equal(blockedResponse.statusCode, 429);
  assert.equal(blockedResponse.headers['Retry-After'], '1');

  currentTime += 1_000;
  const resetResponse = createResponse();
  middleware(request, resetResponse, next);
  assert.equal(resetResponse.statusCode, 200);
  assert.equal(nextCalls, 3);
});

test('createRateLimitMiddleware no limita health checks ni preflight', () => {
  const middleware = createRateLimitMiddleware({ max: 1 });
  const next = () => {};

  const healthResponse = createResponse();
  middleware({ ip: '127.0.0.1', method: 'GET', path: '/health' }, healthResponse, next);
  middleware({ ip: '127.0.0.1', method: 'GET', path: '/health' }, healthResponse, next);

  const optionsResponse = createResponse();
  middleware({ ip: '127.0.0.1', method: 'OPTIONS', path: '/api/v1/users' }, optionsResponse, next);

  assert.equal(healthResponse.statusCode, 200);
  assert.equal(optionsResponse.statusCode, 200);
});
