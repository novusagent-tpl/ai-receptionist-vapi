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

module.exports = {
  getRestaurantConfig,
  isRestaurantEnabled,
};
