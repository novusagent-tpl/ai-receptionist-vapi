/**
 * Adapter OctoTable per prenotazioni (v5 — testato con CRUD reale su sandbox).
 *
 * URL verificati (testati con creazione/modifica/cancellazione reale, 2026-02-10):
 *   PMS API:  https://api.octotable.com/octotable-pms/api/v2
 *   Auth API: https://api.octotable.com/octotable-auth/api/v2
 *   Token:    POST /oauth2/token (x-www-form-urlencoded body, NON JSON)
 *
 * NOTA: api.octocrate.com NON ESISTE. Entrambi i servizi sono su api.octotable.com
 *
 * Campi OBBLIGATORI per CREATE prenotazione:
 *   - service_id (da config o auto-discover via GET /services)
 *   - room_id (da config o auto-discover via GET /rooms)
 *   - start_date, start_hour (HH:mm:ss), pax, channel, customer
 *
 * Campi OBBLIGATORI per UPDATE prenotazione:
 *   - start_date (NON start_day!), start_hour, pax
 *   - customer con il suo ID (customer.id dal create originale)
 *   - service_id, room_id, channel
 *
 * Altre note:
 *   - property_id va nell'HEADER "Property"
 *   - customer è { first_name, last_name, phone, id (per update) }
 *   - channel: "OCTOTABLE_ADMIN"
 *   - Risposta wrappata in { "data": [...] }
 *   - Cerca per telefono: text_search query param
 *   - people → pax
 *   - DELETE cambia lo status a CANCELLED
 *
 * Credenziali per-tenant: ogni ristorante può avere le sue credenziali OctoTable.
 * In ristoranti.json: "octotable_client_id_env", "octotable_client_secret_env"
 * Fallback: OCTOTABLE_CLIENT_ID / OCTOTABLE_CLIENT_SECRET globali.
 */

const { getRestaurantConfig } = require('./config/restaurants');
const logger = require('./logger');

require('dotenv').config();

// URL verificati OctoTable (testati direttamente sugli endpoint, 2026-02-10)
const PMS_BASE_URL = (process.env.OCTOTABLE_PMS_URL || 'https://api.octotable.com/octotable-pms/api/v2').replace(/\/$/, '');
const AUTH_BASE_URL = (process.env.OCTOTABLE_AUTH_URL || 'https://api.octotable.com/octotable-auth/api/v2').replace(/\/$/, '');

const GLOBAL_CLIENT_ID = process.env.OCTOTABLE_CLIENT_ID || '';
const GLOBAL_CLIENT_SECRET = process.env.OCTOTABLE_CLIENT_SECRET || '';

// Token cache per credenziale
const tokenCache = {};

/**
 * Restituisce il property_id OctoTable per un ristorante.
 */
function getPropertyId(restaurantId) {
  try {
    const cfg = getRestaurantConfig(restaurantId);
    if (cfg.octotable_property_id != null) return String(cfg.octotable_property_id);
    if (cfg.octotable_restaurant_id != null) return String(cfg.octotable_restaurant_id);
    return String(restaurantId);
  } catch {
    return String(restaurantId);
  }
}

/**
 * Restituisce le credenziali OctoTable per un ristorante.
 */
function getCredentials(restaurantId) {
  try {
    const cfg = getRestaurantConfig(restaurantId);
    const idEnv = cfg.octotable_client_id_env;
    const secretEnv = cfg.octotable_client_secret_env;
    const clientId = (idEnv && process.env[idEnv]) ? process.env[idEnv].trim() : GLOBAL_CLIENT_ID;
    const clientSecret = (secretEnv && process.env[secretEnv]) ? process.env[secretEnv].trim() : GLOBAL_CLIENT_SECRET;
    return { clientId, clientSecret };
  } catch {
    return { clientId: GLOBAL_CLIENT_ID, clientSecret: GLOBAL_CLIENT_SECRET };
  }
}

/**
 * Ottiene un access token OAuth 2.0 Client Credentials.
 * POST {AUTH_BASE_URL}/oauth2/token — x-www-form-urlencoded body
 * (verificato: JSON restituisce 415 Unsupported Media Type)
 */
async function getAccessToken(restaurantId) {
  const { clientId, clientSecret } = getCredentials(restaurantId);

  const cached = tokenCache[clientId];
  if (cached && Date.now() < cached.expiresAt - 60000) {
    return cached.token;
  }

  const url = `${AUTH_BASE_URL}/oauth2/token`;
  const formBody = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  }).toString();

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: formBody
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OctoTable token failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const ttl = (data.expires_in || 3600) * 1000;
  tokenCache[clientId] = { token: data.access_token, expiresAt: Date.now() + ttl };
  return data.access_token;
}

/**
 * Chiamata generica API OctoTable PMS.
 * Il property_id va nell'header "Property".
 */
async function api(method, path, body = null, query = {}, restaurantId = null) {
  const token = await getAccessToken(restaurantId);
  const propertyId = getPropertyId(restaurantId);

  const qs = new URLSearchParams(query).toString();
  const url = `${PMS_BASE_URL}${path}` + (qs ? `?${qs}` : '');

  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Property': propertyId
    }
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
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
    const msg = json?.message || json?.error_description || json?.error || text || res.statusText;
    throw new Error(`OctoTable API ${method} ${path}: ${res.status} ${msg}`);
  }

  return json;
}

/**
 * Estrai la lista di prenotazioni dalla risposta OctoTable.
 * La risposta è sempre { "data": [...] }
 */
function extractList(response) {
  if (!response) return [];
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

// Cache per service_id e room_id per restaurant
const serviceCache = {};
const roomCache = {};

/**
 * Ottiene il service_id per un ristorante (da config o auto-discover).
 * Per ora: prende il primo servizio "Dinner" o il primo disponibile.
 */
async function getServiceId(restaurantId) {
  // Prima controlla config
  try {
    const cfg = getRestaurantConfig(restaurantId);
    if (cfg.octotable_service_id) return Number(cfg.octotable_service_id);
  } catch {}

  // Cache
  if (serviceCache[restaurantId]) return serviceCache[restaurantId];

  // Auto-discover
  try {
    const response = await api('GET', '/services', null, {}, restaurantId);
    const services = extractList(response);
    // Preferisci Dinner, poi il primo bookable
    const dinner = services.find(s => s.name && s.name.toLowerCase().includes('dinner') && s.bookable);
    const first = services.find(s => s.bookable) || services[0];
    const svc = dinner || first;
    if (svc) {
      serviceCache[restaurantId] = svc.id;
      return svc.id;
    }
  } catch (err) {
    logger.warn('octotable_service_discover_error', { restaurant_id: restaurantId, message: err.message });
  }
  return null;
}

/**
 * Ottiene il room_id per un ristorante (da config o auto-discover).
 * Prende la prima room bookable.
 */
async function getRoomId(restaurantId) {
  // Prima controlla config
  try {
    const cfg = getRestaurantConfig(restaurantId);
    if (cfg.octotable_room_id) return Number(cfg.octotable_room_id);
  } catch {}

  // Cache
  if (roomCache[restaurantId]) return roomCache[restaurantId];

  // Auto-discover
  try {
    const response = await api('GET', '/rooms', null, {}, restaurantId);
    const rooms = extractList(response);
    const room = rooms.find(r => r.bookable) || rooms[0];
    if (room) {
      roomCache[restaurantId] = room.id;
      return room.id;
    }
  } catch (err) {
    logger.warn('octotable_room_discover_error', { restaurant_id: restaurantId, message: err.message });
  }
  return null;
}

/**
 * Seleziona il service_id corretto in base all'orario.
 * Se l'orario è prima delle 16:00, usa Lunch; altrimenti Dinner.
 */
async function getServiceIdForTime(restaurantId, time) {
  // Se c'è un service_id fisso in config, usa quello
  try {
    const cfg = getRestaurantConfig(restaurantId);
    if (cfg.octotable_service_id) return Number(cfg.octotable_service_id);
  } catch {}

  try {
    const response = await api('GET', '/services', null, {}, restaurantId);
    const services = extractList(response).filter(s => s.bookable);

    if (services.length === 1) return services[0].id;

    // Cerca di fare match per orario
    const hour = parseInt((time || '20:00').split(':')[0], 10);
    for (const svc of services) {
      const startH = parseInt((svc.start_time || '00:00').split(':')[0], 10);
      const endH = parseInt((svc.end_time || '23:59').split(':')[0], 10);
      if (hour >= startH && hour < endH) return svc.id;
    }

    // Fallback: dinner o primo
    const dinner = services.find(s => s.name && s.name.toLowerCase().includes('dinner'));
    return dinner ? dinner.id : services[0]?.id || null;
  } catch {
    return await getServiceId(restaurantId);
  }
}

function normalizePhone(p) {
  if (!p) return '';
  const digits = String(p).replace(/\D/g, '');
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

/**
 * Mappa una prenotazione OctoTable al nostro formato interno.
 */
function mapReservation(r) {
  const customer = r.customer || {};
  return {
    booking_id: r.id,
    day: r.start_date || r.start_day || null,
    time: r.start_hour ? r.start_hour.substring(0, 5) : null, // "13:00:00" → "13:00"
    people: r.pax || null,
    name: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || null,
    phone: customer.phone || null,
    notes: r.notes || r.special_request || null,
    status: r.status || null
  };
}

/**
 * Crea una prenotazione.
 * POST /reservations
 * Body OBBLIGATORIO: { start_date, start_hour, pax, channel, service_id, room_id,
 *                      customer: { first_name, last_name, phone } }
 * Header: Property: <property_id>, Authorization: Bearer <token>
 */
async function createReservation({ restaurantId, day, time, people, name, phone, notes }) {
  const _creds = getCredentials(restaurantId);
  if (!_creds.clientId || !_creds.clientSecret) {
    return { ok: false, error_code: 'OCTOTABLE_NOT_CONFIGURED', error_message: 'Credenziali OctoTable non configurate per questo ristorante.' };
  }

  try {
    // start_hour deve essere HH:mm:ss
    let startHour = (time || '').trim();
    if (/^\d{1,2}:\d{2}$/.test(startHour)) startHour = `${startHour}:00`;

    // service_id e room_id sono obbligatori
    const serviceId = await getServiceIdForTime(restaurantId, time);
    const roomId = await getRoomId(restaurantId);

    if (!serviceId) {
      return { ok: false, error_code: 'OCTOTABLE_NO_SERVICE', error_message: 'Nessun servizio disponibile per questo ristorante in OctoTable. Configura octotable_service_id.' };
    }
    if (!roomId) {
      return { ok: false, error_code: 'OCTOTABLE_NO_ROOM', error_message: 'Nessuna sala disponibile per questo ristorante in OctoTable. Configura octotable_room_id.' };
    }

    const nameParts = (name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const body = {
      start_date: day,
      start_hour: startHour,
      pax: Number(people) || 0,
      channel: 'OCTOTABLE_ADMIN',
      service_id: serviceId,
      room_id: roomId,
      customer: {
        first_name: firstName,
        last_name: lastName,
        phone: (phone || '').trim() || undefined
      }
    };

    // notes non è un campo standard nel create, ma lo aggiungiamo se supportato
    if (notes && notes.trim()) {
      body.notes = notes.trim();
    }

    const response = await api('POST', '/reservations', body, {}, restaurantId);
    const list = extractList(response);
    const created = list[0] || {};
    const id = created.id;

    logger.info('octotable_create_reservation', {
      restaurant_id: restaurantId,
      octotable_property_id: getPropertyId(restaurantId),
      reservation_id: id,
      status: created.status
    });

    return {
      ok: true,
      booking_id: id,
      day,
      time: startHour.substring(0, 5),
      people: body.pax,
      name,
      phone: body.customer.phone,
      notes: body.notes || null,
      event_id: null
    };
  } catch (err) {
    logger.error('octotable_create_error', { restaurant_id: restaurantId, message: err.message });
    return { ok: false, error_code: 'CREATE_ERROR', error_message: err.message };
  }
}

/**
 * Lista prenotazioni per telefono.
 * GET /reservations?text_search=<phone>
 * Header: Property: <property_id>
 */
async function listReservationsByPhone(restaurantId, phone) {
  const _creds = getCredentials(restaurantId);
  if (!_creds.clientId || !_creds.clientSecret) {
    return { ok: false, error_code: 'OCTOTABLE_NOT_CONFIGURED', error_message: 'Credenziali OctoTable non configurate per questo ristorante.' };
  }

  try {
    const normPhone = normalizePhone(phone);
    const query = {};
    if (normPhone) query.text_search = normPhone;
    // Solo prenotazioni future
    query.incoming = 'true';

    const response = await api('GET', '/reservations', null, query, restaurantId);
    const list = extractList(response);

    const restCfg = getRestaurantConfig(restaurantId);
    const tz = restCfg.timezone || 'Europe/Rome';
    const today = require('luxon').DateTime.now().setZone(tz).startOf('day');

    const results = list
      .filter(r => {
        // Filtra per telefono (conferma match)
        const rPhone = normalizePhone(r.customer?.phone || '');
        return !normPhone || rPhone === normPhone;
      })
      .filter(r => {
        // Filtra solo prenotazioni non cancellate
        const status = (r.status || '').toUpperCase();
        return status !== 'CANCELLED' && status !== 'REJECTED' && status !== 'EXPIRED';
      })
      .map(mapReservation)
      .filter(b => {
        if (!b.day) return false;
        const bookingDay = require('luxon').DateTime.fromISO(b.day, { zone: tz }).startOf('day');
        return bookingDay.isValid && bookingDay >= today;
      });

    return { ok: true, results };
  } catch (err) {
    logger.error('octotable_list_phone_error', { restaurant_id: restaurantId, message: err.message });
    return { ok: false, error_code: 'LIST_ERROR', error_message: err.message };
  }
}

/**
 * Lista prenotazioni per giorno.
 * GET /reservations?start_date=...&end_date=...
 * Header: Property: <property_id>
 */
async function listReservationsByDay(restaurantId, dayISO) {
  const _creds = getCredentials(restaurantId);
  if (!_creds.clientId || !_creds.clientSecret) {
    return { ok: false, error_code: 'OCTOTABLE_NOT_CONFIGURED', error_message: 'Credenziali OctoTable non configurate per questo ristorante.' };
  }

  try {
    const day = (dayISO || '').trim();
    const response = await api('GET', '/reservations', null, {
      start_date: day,
      end_date: day
    }, restaurantId);

    const list = extractList(response);

    const results = list
      .filter(r => {
        const status = (r.status || '').toUpperCase();
        return status !== 'CANCELLED' && status !== 'REJECTED' && status !== 'EXPIRED';
      })
      .map(r => ({
        booking_id: r.id,
        day: r.start_date || r.start_day || day,
        time: r.start_hour ? r.start_hour.substring(0, 5) : null,
        people: r.pax || null,
        status: r.status
      }))
      .filter(x => x.day && x.time);

    return { ok: true, results };
  } catch (err) {
    logger.error('octotable_list_day_error', { restaurant_id: restaurantId, message: err.message });
    return { ok: false, error_code: 'LIST_BY_DAY_ERROR', error_message: err.message };
  }
}

/**
 * Modifica una prenotazione.
 * PUT /reservations/{reservation_id}
 *
 * IMPORTANTE (verificato con test reale):
 *   - Richiede body COMPLETO: start_date, start_hour, pax, service_id, room_id, channel, customer (con id!)
 *   - Il campo è start_date (NON start_day — start_day causa errore 500)
 *   - customer.id è obbligatorio → prima leggiamo la prenotazione esistente
 */
async function updateReservation(restaurantId, bookingId, fields) {
  const _creds = getCredentials(restaurantId);
  if (!_creds.clientId || !_creds.clientSecret) {
    return { ok: false, error_code: 'OCTOTABLE_NOT_CONFIGURED', error_message: 'Credenziali OctoTable non configurate per questo ristorante.' };
  }

  try {
    // Prima leggi la prenotazione esistente per avere customer.id e gli altri campi
    let existing = null;
    try {
      const getRes = await api('GET', `/reservations`, null, { text_search: String(bookingId) }, restaurantId);
      const all = extractList(getRes);
      existing = all.find(r => String(r.id) === String(bookingId));
    } catch {}

    // Fallback: prova con lista completa
    if (!existing) {
      try {
        const getRes = await api('GET', '/reservations', null, {}, restaurantId);
        const all = extractList(getRes);
        existing = all.find(r => String(r.id) === String(bookingId));
      } catch {}
    }

    if (!existing) {
      return { ok: false, error_code: 'BOOKING_NOT_FOUND', error_message: 'Prenotazione non trovata per aggiornamento.' };
    }

    // Costruisci body completo partendo dai dati esistenti
    const newDay = fields.new_day || existing.start_date || null;
    let newHour = existing.start_hour || '20:00:00';
    if (fields.new_time) {
      newHour = fields.new_time.trim();
      if (/^\d{1,2}:\d{2}$/.test(newHour)) newHour = `${newHour}:00`;
    }
    const newPax = (fields.new_people !== undefined && fields.new_people !== null)
      ? Number(fields.new_people)
      : (existing.pax || 2);

    const body = {
      start_date: newDay,
      start_hour: newHour,
      pax: newPax,
      channel: existing.channel || 'OCTOTABLE_ADMIN',
      service_id: existing.service?.id || await getServiceIdForTime(restaurantId, newHour),
      room_id: existing.room?.id || await getRoomId(restaurantId),
      customer: {
        id: existing.customer?.id,
        first_name: existing.customer?.first_name || '',
        last_name: existing.customer?.last_name || '',
        phone: existing.customer?.phone || ''
      }
    };

    if (!body.customer.id) {
      return { ok: false, error_code: 'UPDATE_ERROR', error_message: 'Impossibile aggiornare: customer.id non trovato nella prenotazione originale.' };
    }

    const response = await api('PUT', `/reservations/${bookingId}`, body, {}, restaurantId);
    const list = extractList(response);
    const updated = list[0] || {};

    logger.info('octotable_update_reservation', { restaurant_id: restaurantId, booking_id: bookingId });

    return {
      ok: true,
      booking_id: bookingId,
      day: updated.start_date || newDay,
      time: (updated.start_hour || newHour).substring(0, 5),
      people: updated.pax || newPax,
      name: [body.customer.first_name, body.customer.last_name].filter(Boolean).join(' ') || null,
      phone: body.customer.phone || null,
      notes: null
    };
  } catch (err) {
    if (err.message.includes('404')) {
      return { ok: false, error_code: 'BOOKING_NOT_FOUND', error_message: 'Prenotazione non trovata.' };
    }
    logger.error('octotable_update_error', { restaurant_id: restaurantId, booking_id: bookingId, message: err.message });
    return { ok: false, error_code: 'UPDATE_ERROR', error_message: err.message };
  }
}

/**
 * Cancella una prenotazione.
 * DELETE /reservations/{reservation_id}
 */
async function deleteReservation(restaurantId, bookingId) {
  const _creds = getCredentials(restaurantId);
  if (!_creds.clientId || !_creds.clientSecret) {
    return { ok: false, error_code: 'OCTOTABLE_NOT_CONFIGURED', error_message: 'Credenziali OctoTable non configurate per questo ristorante.' };
  }

  try {
    await api('DELETE', `/reservations/${bookingId}`, null, {}, restaurantId);

    logger.info('octotable_delete_reservation', { restaurant_id: restaurantId, booking_id: bookingId });

    return { ok: true, booking_id: bookingId, canceled: true };
  } catch (err) {
    if (err.message.includes('404')) {
      return { ok: false, error_code: 'BOOKING_NOT_FOUND', error_message: 'Prenotazione non trovata.' };
    }
    logger.error('octotable_delete_error', { restaurant_id: restaurantId, booking_id: bookingId, message: err.message });
    return { ok: false, error_code: 'DELETE_ERROR', error_message: err.message };
  }
}

module.exports = {
  createReservation,
  listReservationsByPhone,
  listReservationsByDay,
  updateReservation,
  deleteReservation
};
