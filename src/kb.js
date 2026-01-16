const fs = require('fs');
const path = require('path');

const KB_CACHE = {};

function loadKB(restaurantId) {
  if (!restaurantId) {
    throw new Error('restaurantId mancante in loadKB');
  }

  if (KB_CACHE[restaurantId]) {
    return KB_CACHE[restaurantId];
  }

  const filePath = path.join(__dirname, '..', 'kb', `${restaurantId}.json`);

  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`Errore nel leggere la KB per restaurantId=${restaurantId}:`, err.message);
    throw new Error(`KB non trovata per restaurantId=${restaurantId}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`Errore nel fare parse della KB per restaurantId=${restaurantId}:`, err.message);
    throw new Error(`KB non valida per restaurantId=${restaurantId}`);
  }

  KB_CACHE[restaurantId] = data;
  return data;
}

function getRestaurantInfo(restaurantId) {
  const kb = loadKB(restaurantId);
  return {
    id: kb.id,
    name: kb.name,
    timezone: kb.timezone || 'Europe/Rome',
    address: kb.address || null,
    phone: kb.phone || null,
    max_people: kb.max_people || null
    // G20 capacity
    max_concurrent_bookings: kb.max_concurrent_bookings ?? null,
    avg_stay_minutes: kb.avg_stay_minutes ?? null
  };
}

function getOpeningsConfig(restaurantId) {
  const kb = loadKB(restaurantId);
  return kb.openings || {};
}

function getFaqEntries(restaurantId) {
  const kb = loadKB(restaurantId);
  return Array.isArray(kb.faq) ? kb.faq : [];
}

module.exports = {
  loadKB,
  getRestaurantInfo,
  getOpeningsConfig,
  getFaqEntries
};
