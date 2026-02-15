/**
 * Implementazione prenotazioni con Google Sheets + Google Calendar.
 * Usata quando RESERVATIONS_BACKEND non è "octotable" (default).
 */

const { google } = require('googleapis');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { DateTime } = require('luxon');
const logger = require('./logger');

const calendar = require('./calendar');
const { getRestaurantConfig } = require('./config/restaurants');
const kb = require('./kb');
const timeUtils = require('./time-utils');
const {
  hhmmToMinutes,
  applyCutoffToSlots,
  countActiveAt,
  nearestSlots
} = require('./capacity-utils');

require('dotenv').config();

/**
 * Verifica se un errore è un timeout o errore di rete (Google APIs).
 * Google APIs: ETIMEDOUT, ECONNREFUSED, ENOTFOUND, socket hang up, timeout.
 */
function isNetworkError(err) {
  if (!err) return false;
  const msg = String(err.message || '').toLowerCase();
  const code = String(err.code || '').toLowerCase();
  return (
    code === 'etimedout' ||
    code === 'econnrefused' ||
    code === 'enotfound' ||
    code === 'econnreset' ||
    msg.includes('timeout') ||
    msg.includes('socket hang up') ||
    msg.includes('network')
  );
}

function normalizePhone(p) {
  if (!p) return "";
  const digits = String(p).replace(/\D/g, "");

  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  return google.sheets({ version: 'v4', auth });
}

async function createReservation({
  restaurantId,
  day,
  time,
  people,
  name,
  phone,
  notes
}) {
  try {
    const sheets = getSheetsClient();
    const restCfg = getRestaurantConfig(restaurantId);

    const sheetId = restCfg.sheet_id;
    const calendarId = restCfg.calendar_id;

    // Controllo preventivo: evita duplicati (stesso telefono, giorno, orario)
    const existing = await listReservationsByPhone(restaurantId, phone);
    if (existing.ok && Array.isArray(existing.results)) {
      const timeStr = String(time || '').slice(0, 5);
      const duplicate = existing.results.find(
        b => b.day === day && (b.time || '').slice(0, 5) === timeStr
      );
      if (duplicate) {
        logger.warn('sheets_duplicate_booking_blocked', {
          restaurant_id: restaurantId,
          day,
          time: timeStr,
          phone,
          existing_booking_id: duplicate.booking_id,
        });
        return {
          ok: false,
          error_code: 'DUPLICATE_BOOKING',
          error_message: `Esiste già una prenotazione per ${day} alle ${timeStr} con questo numero.`,
        };
      }
    }

    // --- VALIDAZIONE ORARIO DI APERTURA (server-side) ---
    const info = kb.getRestaurantInfo(restaurantId);
    const openingsConfig = kb.getOpeningsConfig(restaurantId);
    const slotStep = Number(info && info.slot_step_minutes) || 30;
    const openingsResult = timeUtils.openingsFor(day, openingsConfig, slotStep);
    const tz = (info && info.timezone) || 'Europe/Rome';
    const stayMin = Number(info && info.avg_stay_minutes) || 120;

    const allSlots = Array.isArray(openingsResult.slots) ? openingsResult.slots : [];
    const timeStr5 = String(time || '').slice(0, 5);
    const cutoffMin = Number(info && info.booking_cutoff_minutes) || 0;
    const maxNearestSlots = Number(info && info.max_nearest_slots) || 3;

    // Slot prenotabili = slot apertura filtrati per cutoff
    const bookableSet = applyCutoffToSlots(allSlots, cutoffMin, slotStep);
    const bookableSlots = allSlots.filter(s => bookableSet.has(hhmmToMinutes(s)));

    if (openingsResult.closed) {
      logger.warn('sheets_create_blocked_closed', {
        restaurant_id: restaurantId, day, time: timeStr5,
      });
      return {
        ok: false,
        error_code: 'OUTSIDE_HOURS',
        error_message: `Il ristorante è chiuso il ${day}.`,
      };
    }

    if (!bookableSlots.includes(timeStr5)) {
      const inOpenings = allSlots.includes(timeStr5);
      const reason = inOpenings ? 'cutoff' : 'not_in_openings';
      const near = nearestSlots(bookableSlots, timeStr5, maxNearestSlots);
      logger.warn('sheets_create_blocked_outside_hours', {
        restaurant_id: restaurantId, day, time: timeStr5, reason, nearest: near,
      });
      return {
        ok: false,
        error_code: 'OUTSIDE_HOURS',
        error_message: reason === 'cutoff'
          ? `L'orario ${timeStr5} è troppo vicino alla chiusura.`
          : `L'orario ${timeStr5} non rientra nelle fasce di apertura.`,
        nearest_slots: near,
      };
    }

    // --- VALIDAZIONE CAPACITÀ (server-side) ---
    const maxConc = Number(info && info.max_concurrent_bookings);
    if (Number.isFinite(maxConc) && maxConc > 0 && Number.isFinite(stayMin) && stayMin > 0) {
      const dayRes = await listReservationsByDay(restaurantId, day);
      if (dayRes && dayRes.ok) {
        const bookingTimes = (dayRes.results || []).map(x => x && x.time).filter(Boolean);
        const activeCount = countActiveAt(day, timeStr5, bookingTimes, stayMin, tz);

        if (activeCount >= maxConc) {
          const capacityOkSlots = bookableSlots.filter(s => {
            const c = countActiveAt(day, s, bookingTimes, stayMin, tz);
            return c < maxConc;
          });
          const near = nearestSlots(capacityOkSlots, timeStr5, maxNearestSlots);

          logger.warn('sheets_create_blocked_full', {
            restaurant_id: restaurantId, day, time: timeStr5,
            active: activeCount, max: maxConc, nearest: near,
          });
          return {
            ok: false,
            error_code: 'SLOT_FULL',
            error_message: `Non ci sono posti disponibili alle ${timeStr5}. Prova un altro orario.`,
            nearest_slots: near,
          };
        }
      }
    }

    const bookingId = uuidv4();
    const createdAt = new Date().toISOString();

    const calRes = await calendar.createCalendarEvent({
      calendarId,
      day,
      time,
      people,
      name,
      phone,
      notes,
      durationMinutes: stayMin
    });

    const eventId = calRes.ok ? calRes.event_id : null;

    const values = [
      [
        bookingId,
        day,
        time,
        people,
        name,
        phone,
        notes || "",
        createdAt,
        eventId
      ]
    ];

    const colA = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Bookings!A:A'
    });

    const rowsA = (colA.data.values || []).length;
    const nextRow = Math.max(rowsA + 1, 2);

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Bookings!A${nextRow}:I${nextRow}`,
      valueInputOption: 'RAW',
      resource: { values }
    });

    logger.info('sheets_write_booking_row', {
      restaurant_id: restaurantId,
      sheet_id: sheetId,
      tab: 'Bookings',
      row: nextRow,
      booking_id: bookingId || null
    });

    return {
      ok: true,
      booking_id: bookingId,
      day,
      time,
      people,
      name,
      phone,
      notes,
      event_id: eventId
    };

  } catch (err) {
    logger.error('sheets_create_error', { restaurant_id: restaurantId, message: err.message });
    if (isNetworkError(err)) {
      return { ok: false, error_code: 'PROVIDER_UNAVAILABLE', error_message: 'Il sistema di prenotazione non è raggiungibile in questo momento.' };
    }
    return {
      ok: false,
      error_code: "CREATE_ERROR",
      error_message: err.message
    };
  }
}

async function listReservationsByPhone(restaurantId, phone) {
  try {
    const sheets = getSheetsClient();
    const restCfg = getRestaurantConfig(restaurantId);
    const sheetId = restCfg.sheet_id;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Bookings!A:I'
    });

    const rows = response.data.values || [];
    const dataRows = rows.slice(1);

    const normQuery = normalizePhone(phone);
    const restCfgTimezone = restCfg.timezone || 'Europe/Rome';
    const today = DateTime.now().setZone(restCfgTimezone).startOf('day');

    const results = dataRows
      .filter(r => normalizePhone(r[5] || "") === normQuery)
      .map(r => ({
        booking_id: r[0],
        day: r[1],
        time: r[2],
        people: Number(r[3]),
        name: r[4],
        phone: r[5],
        notes: r[6] || null
      }))
      .filter(booking => {
        if (!booking.day) return false;
        const bookingDay = DateTime.fromISO(booking.day, { zone: restCfgTimezone }).startOf('day');
        if (!bookingDay.isValid) return false;
        return bookingDay >= today;
      });

    return {
      ok: true,
      results
    };

  } catch (err) {
    logger.error('sheets_list_phone_error', { restaurant_id: restaurantId, message: err.message });
    if (isNetworkError(err)) {
      return { ok: false, error_code: 'PROVIDER_UNAVAILABLE', error_message: 'Il sistema di prenotazione non è raggiungibile in questo momento.' };
    }
    return {
      ok: false,
      error_code: "LIST_ERROR",
      error_message: err.message
    };
  }
}

async function listReservationsByDay(restaurantId, dayISO) {
  try {
    const sheets = getSheetsClient();
    const restCfg = getRestaurantConfig(restaurantId);
    const spreadsheetId = restCfg.sheet_id;

    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Bookings!A:I'
    });

    const rows = resp.data.values || [];
    const data = rows.slice(1);

    const results = data
      .filter(r => String(r[1] || '').trim() === String(dayISO || '').trim())
      .map(r => ({
        booking_id: r[0] || null,
        day: r[1] || null,
        time: r[2] || null
      }))
      .filter(x => x.day && x.time);

    return { ok: true, results };
  } catch (err) {
    logger.error('sheets_list_day_error', { restaurant_id: restaurantId, message: err.message });
    if (isNetworkError(err)) {
      return { ok: false, error_code: 'PROVIDER_UNAVAILABLE', error_message: 'Il sistema di prenotazione non è raggiungibile in questo momento.' };
    }
    return {
      ok: false,
      error_code: 'LIST_BY_DAY_ERROR',
      error_message: err && err.message ? err.message : String(err)
    };
  }
}

async function updateReservation(restaurantId, bookingId, fields) {
  try {
    const sheets = getSheetsClient();
    const restCfg = getRestaurantConfig(restaurantId);

    const sheetId = restCfg.sheet_id;
    const calendarId = restCfg.calendar_id;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Bookings!A:I'
    });

    const rows = response.data.values || [];
    const dataRows = rows.slice(1);

    const rowIndex = dataRows.findIndex(r => r[0] === bookingId);
    if (rowIndex === -1) {
      return {
        ok: false,
        error_code: "BOOKING_NOT_FOUND",
        error_message: "Prenotazione non trovata."
      };
    }

    const googleRow = rowIndex + 2;
    const old = dataRows[rowIndex];

    const updated = {
      booking_id: old[0],
      day: fields.new_day || old[1],
      time: fields.new_time || old[2],
      people: fields.new_people !== undefined ? fields.new_people : old[3],
      name: old[4],
      phone: old[5],
      notes: old[6],
      created_at: old[7],
      event_id: old[8] || null
    };

    if (updated.event_id) {
      const updInfo = kb.getRestaurantInfo(restaurantId);
      const updStayMin = Number(updInfo && updInfo.avg_stay_minutes) || 120;
      await calendar.updateCalendarEvent({
        calendarId,
        eventId: updated.event_id,
        day: updated.day,
        time: updated.time,
        people: updated.people,
        name: updated.name,
        phone: updated.phone,
        notes: updated.notes,
        durationMinutes: updStayMin
      });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Bookings!A${googleRow}:I${googleRow}`,
      valueInputOption: "RAW",
      resource: {
        values: [[
          updated.booking_id,
          updated.day,
          updated.time,
          updated.people,
          updated.name,
          updated.phone,
          updated.notes,
          updated.created_at,
          updated.event_id
        ]]
      }
    });

    const peopleNum = updated.people != null && updated.people !== '' ? Number(updated.people) : null;
    return {
      ok: true,
      booking_id: updated.booking_id,
      day: updated.day,
      time: updated.time,
      people: Number.isFinite(peopleNum) ? peopleNum : null,
      name: updated.name,
      phone: updated.phone,
      notes: updated.notes
    };

  } catch (err) {
    logger.error('sheets_update_error', { restaurant_id: restaurantId, message: err.message });
    if (isNetworkError(err)) {
      return { ok: false, error_code: 'PROVIDER_UNAVAILABLE', error_message: 'Il sistema di prenotazione non è raggiungibile in questo momento.' };
    }
    return {
      ok: false,
      error_code: "UPDATE_ERROR",
      error_message: err.message
    };
  }
}

async function deleteReservation(restaurantId, bookingId) {
  try {
    const sheets = getSheetsClient();
    const restCfg = getRestaurantConfig(restaurantId);

    const sheetId = restCfg.sheet_id;
    const calendarId = restCfg.calendar_id;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Bookings!A:I'
    });

    const rows = response.data.values || [];
    const dataRows = rows.slice(1);

    const rowIndex = dataRows.findIndex(r => r[0] === bookingId);
    if (rowIndex === -1) {
      return {
        ok: false,
        error_code: "BOOKING_NOT_FOUND",
        error_message: "Prenotazione non trovata."
      };
    }

    const sheetRowNumber = rowIndex + 2;
    const old = dataRows[rowIndex];
    const eventId = old[8] || null;

    if (eventId) {
      await calendar.deleteCalendarEvent({
        calendarId,
        eventId
      });
    }

    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const bookingSheet = (meta.data.sheets || []).find(
      s => s.properties && s.properties.title === 'Bookings'
    );

    if (!bookingSheet) {
      return {
        ok: false,
        error_code: 'SHEET_NOT_FOUND',
        error_message: 'Tab Bookings non trovata.'
      };
    }

    const sheetIdNum = bookingSheet.properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetIdNum,
              dimension: 'ROWS',
              startIndex: sheetRowNumber - 1,
              endIndex: sheetRowNumber
            }
          }
        }]
      }
    });

    logger.info('sheets_delete_booking_row', {
      restaurant_id: restaurantId,
      sheet_id: sheetId,
      tab: 'Bookings',
      row: sheetRowNumber,
      booking_id: bookingId
    });

    return {
      ok: true,
      booking_id: bookingId,
      canceled: true
    };

  } catch (err) {
    logger.error('sheets_delete_error', { restaurant_id: restaurantId, message: err.message });
    if (isNetworkError(err)) {
      return { ok: false, error_code: 'PROVIDER_UNAVAILABLE', error_message: 'Il sistema di prenotazione non è raggiungibile in questo momento.' };
    }
    return {
      ok: false,
      error_code: "DELETE_ERROR",
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
