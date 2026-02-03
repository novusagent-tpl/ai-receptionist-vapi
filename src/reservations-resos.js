/**
 * Adapter resOS per prenotazioni.
 * API resOS v1: Basic Auth (API key), base URL https://api.resos.com/v1, endpoint /bookings.
 *
 * Richiede: RESOS_API_KEY (e opz. RESOS_BASE_URL, RESOS_DEFAULT_DURATION_MINUTES).
 * Config ristorante: resos_restaurant_id (restaurantId resOS, es. "JLAs2CviunNCSEfbt").
 *
 * Mapping:
 * - createReservation -> POST /bookings (whitelist: restaurantId, date, time, people, duration, source, guest)
 * - listReservationsByDay -> GET /bookings?fromDateTime&toDateTime + filtro restaurantId
 * - listReservationsByPhone -> GET /bookings range (oggi +60gg) + filtro guest.phone + restaurantId
 * - updateReservation -> PUT /bookings/{id} (people / date / time)
 * - deleteReservation -> PUT /bookings/{id} { status: "canceled" }
 */

const { getRestaurantConfig } = require('./config/restaurants');
const kb = require('./kb');
const logger = require('./logger');
const { DateTime } = require('luxon');

require('dotenv').config();

const BASE_URL = (process.env.RESOS_BASE_URL || 'https://api.resos.com/v1').replace(/\/$/, '');
const API_KEY = (process.env.RESOS_API_KEY || '').trim();
const ENV_DEFAULT_DURATION = Math.max(1, parseInt(process.env.RESOS_DEFAULT_DURATION_MINUTES || '120', 10));

/** Durata prenotazione in minuti: prima KB (avg_stay_minutes), poi .env RESOS_DEFAULT_DURATION_MINUTES. */
function getDurationMinutes(restaurantId) {
  try {
    const info = kb.getRestaurantInfo(restaurantId);
    const fromKb = Number(info && info.avg_stay_minutes);
    if (Number.isFinite(fromKb) && fromKb >= 1) return Math.round(fromKb);
  } catch {
    // ignore
  }
  return ENV_DEFAULT_DURATION;
}

/**
 * RestaurantId da inviare a resOS. Usa sempre config.resos_restaurant_id se presente;
 * non assumere che l'id interno del progetto (restaurantId) coincida con quello resOS.
 */
function getResOSRestaurantId(restaurantId) {
  try {
    const cfg = getRestaurantConfig(restaurantId);
    const id = cfg.resos_restaurant_id ?? cfg.resos_venue_id;
    return id != null ? String(id) : String(restaurantId);
  } catch {
    return String(restaurantId);
  }
}

function getAuthHeader() {
  if (!API_KEY) return {};
  const encoded = Buffer.from(API_KEY + ':', 'utf8').toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

async function api(method, path, body = null, query = {}) {
  const qs = new URLSearchParams(query).toString();
  const url = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}${qs ? `?${qs}` : ''}`;
  const opts = {
    method,
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json'
    }
  };
  if (body && (method === 'POST' || method === 'PUT')) {
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
    const msg = (json?.message ?? json?.error ?? text) || res.statusText;
    throw new Error(`resOS API ${method} ${path}: ${res.status} ${msg}`);
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
 * Body whitelist: restaurantId, date, time, people, duration, source, guest.
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
  if (!API_KEY) {
    return {
      ok: false,
      error_code: 'RESOS_NOT_CONFIGURED',
      error_message: 'RESOS_API_KEY non configurato.'
    };
  }
  try {
    const restId = getResOSRestaurantId(restaurantId);
    const timeStr = /^\d{1,2}:\d{2}(:\d{2})?$/.test(time) ? time.slice(0, 5) : `${time}:00`.slice(0, 5);
    const durationMin = getDurationMinutes(restaurantId);

    const body = {
      restaurantId: restId,
      date: day,
      time: timeStr,
      people: Number(people) || 0,
      duration: durationMin,
      source: 'phone',
      guest: {
        name: (name || '').trim() || 'Cliente',
        phone: (phone || '').trim() || '',
        email: ''
      }
    };

    const data = await api('POST', '/bookings', body);
    const id = data._id ?? data.id;

    logger.info('resos_create_reservation', {
      restaurant_id: restaurantId,
      resos_restaurant_id: restId,
      reservation_id: id
    });

    return {
      ok: true,
      booking_id: id,
      day,
      time: timeStr,
      people: body.people,
      name,
      phone: body.guest.phone,
      notes: notes || null,
      event_id: null
    };
  } catch (err) {
    logger.error('resos_create_error', { restaurant_id: restaurantId, message: err.message });
    const msg = (err && err.message) ? String(err.message) : '';
    // resOS 422 "no suitable table found" → messaggio chiaro per la receptionist
    if (msg.toLowerCase().includes('no suitable table') || msg.includes('422')) {
      return {
        ok: false,
        error_code: 'NO_TABLE_AVAILABLE',
        error_message: 'Non ci sono più tavoli disponibili per quell\'orario. Posso proporle un altro orario?'
      };
    }
    return {
      ok: false,
      error_code: 'CREATE_ERROR',
      error_message: err.message
    };
  }
}

/**
 * Lista prenotazioni per telefono.
 * resOS non filtra per phone: list per range (oggi → +60gg) + filtro locale su guest.phone e restaurantId.
 */
async function listReservationsByPhone(restaurantId, phone) {
  if (!API_KEY) {
    return {
      ok: false,
      error_code: 'RESOS_NOT_CONFIGURED',
      error_message: 'RESOS_API_KEY non configurato.'
    };
  }
  try {
    const restId = getResOSRestaurantId(restaurantId);
    const normPhone = normalizePhone(phone);
    const restCfg = getRestaurantConfig(restaurantId);
    const tz = restCfg.timezone || 'Europe/Rome';
    const today = DateTime.now().setZone(tz).startOf('day');
    const end = today.plus({ days: 60 });
    const fromDateTime = today.toISO();
    const toDateTime = end.toISO();

    const raw = await api('GET', '/bookings', null, { fromDateTime, toDateTime });
    const list = raw == null ? [] : (Array.isArray(raw) ? raw : raw.data ?? raw.bookings ?? []);

    const now = DateTime.now().setZone(tz);
    const results = list
      .filter(r => String(r.restaurantId || r.restaurant_id || '') === restId)
      .filter(r => !normPhone || normalizePhone(r.guest?.phone || r.phone || '') === normPhone)
      .map(r => ({
        booking_id: r._id ?? r.id,
        day: r.date ?? r.day,
        time: r.time,
        people: Number(r.people) ?? null,
        name: r.guest?.name ?? r.name ?? null,
        phone: r.guest?.phone ?? r.phone ?? null,
        notes: r.notes ?? null
      }))
      .filter(b => {
        if (!b.day || !b.time) return false;
        const bookingDay = DateTime.fromISO(b.day, { zone: tz }).startOf('day');
        if (!bookingDay.isValid || bookingDay < today) return false;
        if (bookingDay > today) return true;
        const [h, m] = (b.time || '').split(':').map(Number);
        const bookingStart = today.set({ hour: h || 0, minute: m || 0, second: 0, millisecond: 0 });
        return bookingStart.isValid && bookingStart > now;
      });

    return { ok: true, results };
  } catch (err) {
    logger.error('resos_list_phone_error', { restaurant_id: restaurantId, message: err.message });
    return {
      ok: false,
      error_code: 'LIST_ERROR',
      error_message: err.message
    };
  }
}

/**
 * Lista prenotazioni per giorno. GET /bookings?fromDateTime&toDateTime + filtro restaurantId e data.
 */
async function listReservationsByDay(restaurantId, dayISO) {
  if (!API_KEY) {
    return {
      ok: false,
      error_code: 'RESOS_NOT_CONFIGURED',
      error_message: 'RESOS_API_KEY non configurato.'
    };
  }
  try {
    const restId = getResOSRestaurantId(restaurantId);
    const day = (dayISO || '').trim();
    const restCfg = getRestaurantConfig(restaurantId);
    const tz = restCfg.timezone || 'Europe/Rome';
    const start = DateTime.fromISO(day, { zone: tz }).startOf('day');
    const end = start.endOf('day');
    const fromDateTime = start.toISO();
    const toDateTime = end.toISO();

    const raw = await api('GET', '/bookings', null, { fromDateTime, toDateTime });
    const list = raw == null ? [] : (Array.isArray(raw) ? raw : raw.data ?? raw.bookings ?? []);

    const results = list
      .filter(r => String(r.restaurantId || r.restaurant_id || '') === restId)
      .filter(r => (r.date ?? r.day) === day)
      .map(r => ({
        booking_id: r._id ?? r.id,
        day: r.date ?? r.day,
        time: r.time
      }))
      .filter(x => x.day && x.time);

    return { ok: true, results };
  } catch (err) {
    logger.error('resos_list_day_error', { restaurant_id: restaurantId, message: err.message });
    return {
      ok: false,
      error_code: 'LIST_BY_DAY_ERROR',
      error_message: err.message
    };
  }
}

/**
 * Modifica una prenotazione. PUT /bookings/{id} con campi people / date / time (PATCH non supportato).
 */
async function updateReservation(restaurantId, bookingId, fields) {
  if (!API_KEY) {
    return {
      ok: false,
      error_code: 'RESOS_NOT_CONFIGURED',
      error_message: 'RESOS_API_KEY non configurato.'
    };
  }
  try {
    const body = {};
    if (fields.new_people !== undefined && fields.new_people !== null) body.people = Number(fields.new_people);
    if (fields.new_day) body.date = fields.new_day;
    if (fields.new_time) body.time = /^\d{1,2}:\d{2}(:\d{2})?$/.test(fields.new_time) ? fields.new_time.slice(0, 5) : `${fields.new_time}:00`.slice(0, 5);

    if (Object.keys(body).length === 0) {
      return {
        ok: false,
        error_code: 'UPDATE_ERROR',
        error_message: 'Nessun campo da aggiornare (new_day, new_time, new_people).'
      };
    }

    await api('PUT', `/bookings/${bookingId}`, body);

    logger.info('resos_update_reservation', { restaurant_id: restaurantId, booking_id: bookingId });

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
    logger.error('resos_update_error', { restaurant_id: restaurantId, booking_id: bookingId, message: err.message });
    return {
      ok: false,
      error_code: 'UPDATE_ERROR',
      error_message: err.message
    };
  }
}

/**
 * Cancella una prenotazione. DELETE non supportato: PUT /bookings/{id} con { status: "canceled" }.
 */
async function deleteReservation(restaurantId, bookingId) {
  if (!API_KEY) {
    return {
      ok: false,
      error_code: 'RESOS_NOT_CONFIGURED',
      error_message: 'RESOS_API_KEY non configurato.'
    };
  }
  try {
    await api('PUT', `/bookings/${bookingId}`, { status: 'canceled' });

    logger.info('resos_delete_reservation', { restaurant_id: restaurantId, booking_id: bookingId });

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
    logger.error('resos_delete_error', { restaurant_id: restaurantId, booking_id: bookingId, message: err.message });
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
