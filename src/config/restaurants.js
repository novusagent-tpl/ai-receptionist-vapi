const config = require('./ristoranti.json');

function getRestaurantConfig(restaurantId) {
  const cfg = config[restaurantId];
  if (!cfg) {
    throw new Error(`Config non trovata per restaurantId=${restaurantId}`);
  }
  return cfg;
}

module.exports = {
  getRestaurantConfig
};
