const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX = 100;

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

module.exports = {
  createCorsMiddleware,
  createRateLimitMiddleware,
};
