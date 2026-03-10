const config = require('./ristoranti.json');

function getRestaurantConfig(restaurantId) {
  const cfg = config[restaurantId];
  if (!cfg) {
    throw new Error(`Config non trovata per restaurantId=${restaurantId}`);
  }
  return cfg;
}

/**
 * Controlla se un ristorante è attivo.
 * Se il campo `enabled` non esiste, si considera attivo (backward-compatible).
 */
function isRestaurantEnabled(restaurantId) {
  const cfg = config[restaurantId];
  if (!cfg) return false;
  return cfg.enabled !== false; // default true se non specificato
}

/**
 * Release channel per tenant.
 * Default backward-compatible: "stable" se il campo non esiste.
 */
function getReleaseChannel(restaurantId) {
  const cfg = getRestaurantConfig(restaurantId);
  const channel = cfg && typeof cfg.release_channel === 'string'
    ? cfg.release_channel.trim().toLowerCase()
    : '';
  return channel || 'stable';
}

function isCanaryTenant(restaurantId) {
  return getReleaseChannel(restaurantId) === 'canary';
}

module.exports = {
  getRestaurantConfig,
  isRestaurantEnabled,
  getReleaseChannel,
  isCanaryTenant,
};
