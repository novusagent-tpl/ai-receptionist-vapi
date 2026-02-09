/**
 * metrics.js — In-memory metrics tracker per monitoring & alerting
 *
 * Traccia per ogni ristorante e globalmente:
 *  - Totale richieste API
 *  - Totale errori (ok:false o status >= 400)
 *  - Latency media per tool
 *  - Provider failures (PROVIDER_UNAVAILABLE)
 *  - Handover count
 *  - Prenotazioni riuscite vs tentate
 *
 * I dati si resettano al riavvio del server (in-memory).
 * Per persistenza futura: salvare su file/DB o usare servizio esterno.
 */

const logger = require('./logger');

// Soglie per alert (configurabili)
const ALERT_THRESHOLDS = {
  error_rate_percent: 25,      // alert se >25% delle richieste sono errori
  provider_failures_window: 3, // alert se >=3 provider failure in 5 min
  latency_ms: 10000,           // alert se latency media >10s
};

// ── Struttura dati ──

const stats = {
  global: createBucket(),
  by_restaurant: {},    // { restaurant_id: bucket }
  by_tool: {},          // { tool_path: { total, errors, latency_sum } }
  provider_failures: [] // [{ ts, restaurant_id }] — ultimi 5 min
};

function createBucket() {
  return {
    total_requests: 0,
    total_errors: 0,
    provider_failures: 0,
    handovers: 0,
    bookings_attempted: 0,
    bookings_succeeded: 0,
    latency_sum_ms: 0,
    started_at: new Date().toISOString(),
  };
}

function getBucket(restaurantId) {
  if (!restaurantId) return null;
  if (!stats.by_restaurant[restaurantId]) {
    stats.by_restaurant[restaurantId] = createBucket();
  }
  return stats.by_restaurant[restaurantId];
}

function getToolBucket(toolPath) {
  if (!toolPath) return null;
  if (!stats.by_tool[toolPath]) {
    stats.by_tool[toolPath] = { total: 0, errors: 0, latency_sum_ms: 0 };
  }
  return stats.by_tool[toolPath];
}

// ── Registrazione eventi ──

/**
 * Registra una richiesta API completata.
 * Chiamare dal middleware response-finish.
 */
function recordRequest({ restaurantId, toolPath, durationMs, isError, errorCode, isBookingAttempt, isBookingSuccess }) {
  // Globale
  stats.global.total_requests++;
  if (isError) stats.global.total_errors++;
  stats.global.latency_sum_ms += (durationMs || 0);

  // Per ristorante
  const rb = getBucket(restaurantId);
  if (rb) {
    rb.total_requests++;
    if (isError) rb.total_errors++;
    rb.latency_sum_ms += (durationMs || 0);
  }

  // Per tool
  const tb = getToolBucket(toolPath);
  if (tb) {
    tb.total++;
    if (isError) tb.errors++;
    tb.latency_sum_ms += (durationMs || 0);
  }

  // Provider failure
  if (errorCode === 'PROVIDER_UNAVAILABLE' || errorCode === 'PROVIDER_ERROR') {
    stats.global.provider_failures++;
    if (rb) rb.provider_failures++;
    stats.provider_failures.push({ ts: Date.now(), restaurant_id: restaurantId });
    cleanOldProviderFailures();
    checkProviderAlert(restaurantId);
  }

  // Handover
  if (toolPath && toolPath.includes('is_open_now')) {
    // is_open_now viene chiamato prima di handover, lo contiamo come proxy
    stats.global.handovers++;
    if (rb) rb.handovers++;
  }

  // Booking tracking
  if (isBookingAttempt) {
    stats.global.bookings_attempted++;
    if (rb) rb.bookings_attempted++;
  }
  if (isBookingSuccess) {
    stats.global.bookings_succeeded++;
    if (rb) rb.bookings_succeeded++;
  }

  // Check error rate alert
  checkErrorRateAlert(restaurantId);
}

// ── Alert checks ──

function cleanOldProviderFailures() {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  stats.provider_failures = stats.provider_failures.filter(f => f.ts > fiveMinAgo);
}

function checkProviderAlert(restaurantId) {
  cleanOldProviderFailures();
  const recentForRestaurant = stats.provider_failures.filter(f => f.restaurant_id === restaurantId);
  if (recentForRestaurant.length >= ALERT_THRESHOLDS.provider_failures_window) {
    logger.warn('ALERT_PROVIDER_DOWN', {
      restaurant_id: restaurantId,
      failures_last_5min: recentForRestaurant.length,
      threshold: ALERT_THRESHOLDS.provider_failures_window,
      message: `Provider per ${restaurantId} ha fallito ${recentForRestaurant.length} volte negli ultimi 5 minuti`,
    });
  }
}

function checkErrorRateAlert(restaurantId) {
  const rb = getBucket(restaurantId);
  if (!rb || rb.total_requests < 10) return; // minimo 10 richieste prima di alertare
  const rate = (rb.total_errors / rb.total_requests) * 100;
  if (rate > ALERT_THRESHOLDS.error_rate_percent) {
    logger.warn('ALERT_HIGH_ERROR_RATE', {
      restaurant_id: restaurantId,
      error_rate_percent: Math.round(rate * 10) / 10,
      total_requests: rb.total_requests,
      total_errors: rb.total_errors,
      threshold: ALERT_THRESHOLDS.error_rate_percent,
      message: `Error rate ${Math.round(rate)}% per ${restaurantId} supera soglia ${ALERT_THRESHOLDS.error_rate_percent}%`,
    });
  }
}

// ── Snapshot per endpoint /metrics ──

function getSnapshot() {
  const g = stats.global;
  const avgLatency = g.total_requests > 0 ? Math.round(g.latency_sum_ms / g.total_requests) : 0;
  const errorRate = g.total_requests > 0 ? Math.round((g.total_errors / g.total_requests) * 1000) / 10 : 0;
  const bookingRate = g.bookings_attempted > 0
    ? Math.round((g.bookings_succeeded / g.bookings_attempted) * 1000) / 10
    : null;

  cleanOldProviderFailures();

  const byRestaurant = {};
  for (const [id, b] of Object.entries(stats.by_restaurant)) {
    const rAvg = b.total_requests > 0 ? Math.round(b.latency_sum_ms / b.total_requests) : 0;
    const rErr = b.total_requests > 0 ? Math.round((b.total_errors / b.total_requests) * 1000) / 10 : 0;
    const rBook = b.bookings_attempted > 0
      ? Math.round((b.bookings_succeeded / b.bookings_attempted) * 1000) / 10
      : null;

    byRestaurant[id] = {
      total_requests: b.total_requests,
      total_errors: b.total_errors,
      error_rate_percent: rErr,
      avg_latency_ms: rAvg,
      provider_failures: b.provider_failures,
      handovers: b.handovers,
      bookings_attempted: b.bookings_attempted,
      bookings_succeeded: b.bookings_succeeded,
      booking_success_rate_percent: rBook,
    };
  }

  const byTool = {};
  for (const [path, t] of Object.entries(stats.by_tool)) {
    byTool[path] = {
      total: t.total,
      errors: t.errors,
      avg_latency_ms: t.total > 0 ? Math.round(t.latency_sum_ms / t.total) : 0,
    };
  }

  return {
    uptime_seconds: Math.floor(process.uptime()),
    started_at: g.started_at,
    global: {
      total_requests: g.total_requests,
      total_errors: g.total_errors,
      error_rate_percent: errorRate,
      avg_latency_ms: avgLatency,
      provider_failures: g.provider_failures,
      provider_failures_last_5min: stats.provider_failures.length,
      handovers: g.handovers,
      bookings_attempted: g.bookings_attempted,
      bookings_succeeded: g.bookings_succeeded,
      booking_success_rate_percent: bookingRate,
    },
    by_restaurant: byRestaurant,
    by_tool: byTool,
    alert_thresholds: ALERT_THRESHOLDS,
  };
}

module.exports = {
  recordRequest,
  getSnapshot,
};
