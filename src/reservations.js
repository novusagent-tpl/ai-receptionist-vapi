/**
 * Modulo prenotazioni: dispatcher PER RISTORANTE tra backend OctoTable, resOS e Google Sheets/Calendar.
 *
 * Per ogni ristorante si usa il backend indicato in config (ristoranti.json → reservations_backend).
 * Se reservations_backend non è impostato, si usa RESERVATIONS_BACKEND da .env.
 * Valori: "resos" | "octotable" | "sheets".
 * Le credenziali (API key, client id/secret, ecc.) restano in .env.
 *
 * - reservations_backend = "resos" (e RESOS_API_KEY in .env) → reservations-resos.js
 * - reservations_backend = "octotable" (e OCTOTABLE_CLIENT_ID in .env) → reservations-octotable.js
 * - "sheets" o non impostato → reservations-sheets.js (Google Sheets + Calendar)
 *
 * I tool (create_booking, list_bookings, modify_booking, cancel_booking) non cambiano.
 */

require('dotenv').config();

const { getRestaurantConfig } = require('./config/restaurants');
const sheetsImpl = require('./reservations-sheets');
const octotableImpl = require('./reservations-octotable');
const resosImpl = require('./reservations-resos');

/**
 * Restituisce il backend prenotazioni per un ristorante.
 * Regola (scalabile): prima config.reservations_backend (per-tenant), poi env RESERVATIONS_BACKEND, default sheets.
 * @param {string} restaurantId
 * @returns {'resos'|'octotable'|'sheets'}
 */
function getReservationsBackend(restaurantId) {
  const cfg = getRestaurantConfig(restaurantId);
  const backend = (cfg.reservations_backend || process.env.RESERVATIONS_BACKEND || 'sheets').toLowerCase();

  if (backend === 'resos' && (process.env.RESOS_API_KEY || '').trim()) return 'resos';
  if (backend === 'octotable' && (process.env.OCTOTABLE_CLIENT_ID || '').trim()) return 'octotable';
  return 'sheets';
}

function getImpl(restaurantId) {
  const backend = getReservationsBackend(restaurantId);
  if (backend === 'resos') return resosImpl;
  if (backend === 'octotable') return octotableImpl;
  return sheetsImpl;
}

module.exports = {
  getReservationsBackend,
  async createReservation(params) {
    const impl = getImpl(params.restaurantId);
    return impl.createReservation(params);
  },

  async listReservationsByPhone(restaurantId, phone) {
    const impl = getImpl(restaurantId);
    return impl.listReservationsByPhone(restaurantId, phone);
  },

  async listReservationsByDay(restaurantId, dayISO) {
    const impl = getImpl(restaurantId);
    return impl.listReservationsByDay(restaurantId, dayISO);
  },

  async updateReservation(restaurantId, bookingId, fields) {
    const impl = getImpl(restaurantId);
    return impl.updateReservation(restaurantId, bookingId, fields);
  },

  async deleteReservation(restaurantId, bookingId) {
    const impl = getImpl(restaurantId);
    return impl.deleteReservation(restaurantId, bookingId);
  }
};
