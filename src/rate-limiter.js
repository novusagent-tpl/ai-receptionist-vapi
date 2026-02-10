// rate-limiter.js — In-memory rate limiter per tenant e per IP/caller
// Protegge da abuso senza dipendenze esterne.

const logger = require('./logger');

/**
 * Configurazione (override via env vars)
 * RATE_LIMIT_PER_TENANT   = max richieste per tenant per finestra (default 60)
 * RATE_LIMIT_PER_CALLER   = max richieste per IP per finestra (default 30)
 * RATE_LIMIT_WINDOW_MS    = finestra temporale in ms (default 60000 = 1 minuto)
 */
const TENANT_LIMIT = parseInt(process.env.RATE_LIMIT_PER_TENANT || '60', 10);
const CALLER_LIMIT = parseInt(process.env.RATE_LIMIT_PER_CALLER || '30', 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

// Bucket: { key: { count, resetAt } }
const buckets = {};

/**
 * Pulisce i bucket scaduti (ogni 5 minuti) per evitare memory leak.
 */
setInterval(() => {
  const now = Date.now();
  for (const key of Object.keys(buckets)) {
    if (buckets[key].resetAt <= now) {
      delete buckets[key];
    }
  }
}, 5 * 60 * 1000);

/**
 * Controlla e incrementa il contatore per una chiave.
 * Ritorna { allowed: true/false, remaining, resetAt }
 */
function check(key, limit) {
  const now = Date.now();

  if (!buckets[key] || buckets[key].resetAt <= now) {
    buckets[key] = { count: 1, resetAt: now + WINDOW_MS };
    return { allowed: true, remaining: limit - 1, resetAt: buckets[key].resetAt };
  }

  buckets[key].count++;

  if (buckets[key].count > limit) {
    return { allowed: false, remaining: 0, resetAt: buckets[key].resetAt };
  }

  return { allowed: true, remaining: limit - buckets[key].count, resetAt: buckets[key].resetAt };
}

/**
 * Middleware Express per rate limiting.
 * Applica due livelli:
 * 1) Per tenant (restaurant_id) — max TENANT_LIMIT req/min
 * 2) Per caller (IP) — max CALLER_LIMIT req/min
 */
function rateLimitMiddleware(req, res, next) {
  // Solo per /api/
  if (!req.path.startsWith('/api/')) return next();

  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const tenantId = req.restaurantId || 'unknown';

  // Check per caller (IP)
  const callerKey = `caller:${ip}`;
  const callerResult = check(callerKey, CALLER_LIMIT);

  if (!callerResult.allowed) {
    logger.warn('rate_limit_exceeded', {
      type: 'caller',
      ip: ip,
      restaurant_id: tenantId,
      limit: CALLER_LIMIT,
      window_ms: WINDOW_MS,
    });

    return res.status(429).json({
      ok: false,
      error_code: 'RATE_LIMIT_EXCEEDED',
      error_message: `Troppe richieste. Riprova tra qualche secondo.`,
    });
  }

  // Check per tenant
  const tenantKey = `tenant:${tenantId}`;
  const tenantResult = check(tenantKey, TENANT_LIMIT);

  if (!tenantResult.allowed) {
    logger.warn('rate_limit_exceeded', {
      type: 'tenant',
      restaurant_id: tenantId,
      limit: TENANT_LIMIT,
      window_ms: WINDOW_MS,
    });

    return res.status(429).json({
      ok: false,
      error_code: 'RATE_LIMIT_EXCEEDED',
      error_message: `Troppe richieste per questo ristorante. Riprova tra qualche secondo.`,
    });
  }

  // Aggiungi headers informativi
  res.set('X-RateLimit-Limit', String(CALLER_LIMIT));
  res.set('X-RateLimit-Remaining', String(callerResult.remaining));

  next();
}

/**
 * Ritorna uno snapshot dei bucket attivi (per /metrics o debug).
 */
function getSnapshot() {
  const now = Date.now();
  const active = {};
  for (const [key, val] of Object.entries(buckets)) {
    if (val.resetAt > now) {
      active[key] = { count: val.count, resets_in_ms: val.resetAt - now };
    }
  }
  return {
    config: { tenant_limit: TENANT_LIMIT, caller_limit: CALLER_LIMIT, window_ms: WINDOW_MS },
    active_buckets: Object.keys(active).length,
    buckets: active,
  };
}

module.exports = { rateLimitMiddleware, getSnapshot };
