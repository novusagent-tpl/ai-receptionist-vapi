/**
 * Adapter OctoTable per prenotazioni.
 * Espone lo stesso interface di reservations.js (createReservation, listReservationsByPhone,
 * listReservationsByDay, updateReservation, deleteReservation) chiamando l'API OctoTable v1.
 *
 * Richiede: OCTOTABLE_CLIENT_ID, OCTOTABLE_CLIENT_SECRET (e opz. OCTOTABLE_BASE_URL).
 * Per ristorante: in config si può usare octotable_restaurant_id; se assente usa restaurantId.
 */

const { getRestaurantConfig } = require('./config/restaurants');
const logger = require('./logger');

require('dotenv').config();

const BASE_URL = (process.env.OCTOTABLE_BASE_URL || 'https://api.octotable.com/v1').replace(/\/$/, '');
const CLIENT_ID = process.env.OCTOTABLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.OCTOTABLE_CLIENT_SECRET || '';

let cachedToken = null;
let tokenExpiresAt = 0;

function getOctoTableRestaurantId(restaurantId) {
  try {
    const cfg = getRestaurantConfig(restaurantId);
    return cfg.octotable_restaurant_id != null
      ? String(cfg.octotable_restaurant_id)
      : String(restaurantId);
  } catch {
    return String(restaurantId);
  }
}

/**
 * Ottiene un access token OAuth 2.0 Client Credentials (cachato fino a scadenza).
 */
async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }
  const url = `${BASE_URL}/oauth/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OctoTable token failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  cachedToken = data.access_token;
  const ttl = (data.expires_in || 3600) * 1000;
  tokenExpiresAt = Date.now() + ttl;
  return cachedToken;
}

async function api(method, path, body = null, query = {}) {
  const token = await getAccessToken();
  const qs = new URLSearchParams(query).toString();
  const url = path + (qs ? `?${qs}` : '');
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  if (body && (method === 'POST' || method === 'PATCH')) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // leave json null
  }
  if (!res.ok) {
    const msg = json?.message || json?.error_description || text || res.statusText;
    throw new Error(`OctoTable API ${method} ${path}: ${res.status} ${msg}`);
  }
  return json;
}

function normalizePhone(p) {
  if (!p) return '';
  const digits = String(p).replace(/\D/g, '');
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

/**
 * Crea una prenotazione. Stessa firma di reservations.createReservation.
 */
async function createReservation({
  restaurantId,
  day,
  time,
  people,
  name,
  phone,
  notes
}) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      ok: false,
      error_code: 'OCTOTABLE_NOT_CONFIGURED',
      error_message: 'OCTOTABLE_CLIENT_ID e OCTOTABLE_CLIENT_SECRET non configurati.'
    };
  }
  try {
    const restId = getOctoTableRestaurantId(restaurantId);
    // time: accetta HH:MM o HH:MM:SS
    const timeStr = /^\d{1,2}:\d{2}(:\d{2})?$/.test(time) ? time : `${time}:00`;
    const nameParts = (name || '').trim().split(/\s+/);
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    const body = {
      restaurant_id: restId,
      date: day,
      time: timeStr,
      people: Number(people) || 0,
      first_name,
      last_name,
      phone: (phone || '').trim() || undefined,
      notes: (notes || '').trim() || undefined
    };

    const data = await api('POST', `${BASE_URL}/reservations`, body);
    const id = data.id ?? data.reservation_id ?? data.booking_id;

    logger.info('octotable_create_reservation', {
      restaurant_id: restaurantId,
      octotable_restaurant_id: restId,
      reservation_id: id
    });

    return {
      ok: true,
      booking_id: id,
      day,
      time: timeStr,
      people: body.people,
      name,
      phone: body.phone,
      notes: body.notes,
      event_id: null
    };
  } catch (err) {
    logger.error('octotable_create_error', { restaurant_id: restaurantId, message: err.message });
    return {
      ok: false,
      error_code: 'CREATE_ERROR',
      error_message: err.message
    };
  }
}

/**
 * Lista prenotazioni per telefono. Stessa firma di reservations.listReservationsByPhone.
 */
async function listReservationsByPhone(restaurantId, phone) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      ok: false,
      error_code: 'OCTOTABLE_NOT_CONFIGURED',
      error_message: 'OCTOTABLE_CLIENT_ID e OCTOTABLE_CLIENT_SECRET non configurati.'
    };
  }
  try {
    const restId = getOctoTableRestaurantId(restaurantId);
    const normPhone = normalizePhone(phone);
    const query = { restaurantId: restId };
    if (normPhone) query.client_phone = normPhone;

    const data = await api('GET', `${BASE_URL}/reservations`, null, query);
    const list = Array.isArray(data) ? data : data.reservations || data.data || [];

    const restCfg = require('./config/restaurants').getRestaurantConfig(restaurantId);
    const tz = restCfg.timezone || 'Europe/Rome';
    const today = require('luxon').DateTime.now().setZone(tz).startOf('day');

    const results = list
      .filter(r => !normPhone || normalizePhone(r.phone || r.client_phone || '') === normPhone)
      .map(r => ({
        booking_id: r.id ?? r.reservation_id ?? r.booking_id,
        day: r.date ?? r.day,
        time: r.time,
        people: Number(r.people) ?? null,
        name: [r.first_name, r.last_name].filter(Boolean).join(' ') || r.name,
        phone: r.phone ?? r.client_phone ?? null,
        notes: r.notes ?? null
      }))
      .filter(b => {
        if (!b.day) return false;
        const bookingDay = require('luxon').DateTime.fromISO(b.day, { zone: tz }).startOf('day');
        return bookingDay.isValid && bookingDay >= today;
      });

    return { ok: true, results };
  } catch (err) {
    logger.error('octotable_list_phone_error', { restaurant_id: restaurantId, message: err.message });
    return {
      ok: false,
      error_code: 'LIST_ERROR',
      error_message: err.message
    };
  }
}

/**
 * Lista prenotazioni per giorno. Stessa firma di reservations.listReservationsByDay.
 */
async function listReservationsByDay(restaurantId, dayISO) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      ok: false,
      error_code: 'OCTOTABLE_NOT_CONFIGURED',
      error_message: 'OCTOTABLE_CLIENT_ID e OCTOTABLE_CLIENT_SECRET non configurati.'
    };
  }
  try {
    const restId = getOctoTableRestaurantId(restaurantId);
    const day = (dayISO || '').trim();
    const raw = await api('GET', `${BASE_URL}/reservations`, null, {
      restaurantId: restId,
      start_date: day,
      end_date: day
    });
    const list = Array.isArray(raw) ? raw : raw.reservations || raw.data || raw.items || [];

    const results = list
      .filter(r => (r.date ?? r.day) === day)
      .map(r => ({
        booking_id: r.id ?? r.reservation_id ?? r.booking_id,
        day: r.date ?? r.day,
        time: r.time
      }))
      .filter(x => x.day && x.time);

    return { ok: true, results };
  } catch (err) {
    logger.error('octotable_list_day_error', { restaurant_id: restaurantId, message: err.message });
    return {
      ok: false,
      error_code: 'LIST_BY_DAY_ERROR',
      error_message: err.message
    };
  }
}

/**
 * Modifica una prenotazione. Stessa firma di reservations.updateReservation.
 */
async function updateReservation(restaurantId, bookingId, fields) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      ok: false,
      error_code: 'OCTOTABLE_NOT_CONFIGURED',
      error_message: 'OCTOTABLE_CLIENT_ID e OCTOTABLE_CLIENT_SECRET non configurati.'
    };
  }
  try {
    const body = {};
    if (fields.new_day) body.date = fields.new_day;
    if (fields.new_time) body.time = /^\d{1,2}:\d{2}(:\d{2})?$/.test(fields.new_time) ? fields.new_time : `${fields.new_time}:00`;
    if (fields.new_people !== undefined && fields.new_people !== null) body.people = Number(fields.new_people);

    if (Object.keys(body).length === 0) {
      return {
        ok: false,
        error_code: 'UPDATE_ERROR',
        error_message: 'Nessun campo da aggiornare (new_day, new_time, new_people).'
      };
    }

    await api('PATCH', `${BASE_URL}/reservations/${bookingId}`, body);

    logger.info('octotable_update_reservation', { restaurant_id: restaurantId, booking_id: bookingId });

    return {
      ok: true,
      booking_id: bookingId,
      day: body.date,
      time: body.time,
      people: body.people,
      name: null,
      phone: null,
      notes: null
    };
  } catch (err) {
    if (err.message.includes('404')) {
      return {
        ok: false,
        error_code: 'BOOKING_NOT_FOUND',
        error_message: 'Prenotazione non trovata.'
      };
    }
    logger.error('octotable_update_error', { restaurant_id: restaurantId, booking_id: bookingId, message: err.message });
    return {
      ok: false,
      error_code: 'UPDATE_ERROR',
      error_message: err.message
    };
  }
}

/**
 * Cancella una prenotazione. Stessa firma di reservations.deleteReservation.
 */
async function deleteReservation(restaurantId, bookingId) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      ok: false,
      error_code: 'OCTOTABLE_NOT_CONFIGURED',
      error_message: 'OCTOTABLE_CLIENT_ID e OCTOTABLE_CLIENT_SECRET non configurati.'
    };
  }
  try {
    await api('DELETE', `${BASE_URL}/reservations/${bookingId}`);

    logger.info('octotable_delete_reservation', { restaurant_id: restaurantId, booking_id: bookingId });

    return {
      ok: true,
      booking_id: bookingId,
      canceled: true
    };
  } catch (err) {
    if (err.message.includes('404')) {
      return {
        ok: false,
        error_code: 'BOOKING_NOT_FOUND',
        error_message: 'Prenotazione non trovata.'
      };
    }
    logger.error('octotable_delete_error', { restaurant_id: restaurantId, booking_id: bookingId, message: err.message });
    return {
      ok: false,
      error_code: 'DELETE_ERROR',
      error_message: err.message
    };
  }
}

module.exports = {
  createReservation,
  listReservationsByPhone,
  listReservationsByDay,
  updateReservation,
  deleteReservation
};
