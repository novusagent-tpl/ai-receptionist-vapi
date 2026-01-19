const { google } = require('googleapis');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');


const calendar = require('./calendar');
const { getRestaurantConfig } = require('./config/restaurants');

require('dotenv').config();

function normalizePhone(p) {
  if (!p) return "";
  const digits = String(p).replace(/\D/g, ""); // tieni solo numeri

  // Prendiamo sempre le ULTIME 9–10 cifre (tipico numero italiano)
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}


// -----------------------------
// Google Sheets Setup
// -----------------------------
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

// -----------------------------
// Create Reservation
// -----------------------------
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

    const bookingId = uuidv4();
    const createdAt = new Date().toISOString();

    // 1) Crea evento su Calendar
    const calRes = await calendar.createCalendarEvent({
      calendarId,
      day,
      time,
      people,
      name,
      phone,
      notes
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
    console.error("Errore createReservation:", err.message);

    return {
      ok: false,
      error_code: "CREATE_ERROR",
      error_message: err.message
    };
  }
}

// -----------------------------
// List Reservations by Phone
// -----------------------------
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

    // Skip header row
    const dataRows = rows.slice(1);

    const normQuery = normalizePhone(phone);

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
  }));


    return {
      ok: true,
      results
    };

  } catch (err) {
    console.error("Errore listReservationsByPhone:", err.message);

    return {
      ok: false,
      error_code: "LIST_ERROR",
      error_message: err.message
    };
  }
}


// -----------------------------
// List Reservations By Day
// -----------------------------
async function listReservationsByDay(restaurantId, dayISO) {
  try {
    // Riusa gli stessi helper già usati nel file (NON inventare client nuovi)
    const sheets = getSheetsClient();
    const restCfg = getRestaurantConfig(restaurantId);
    const spreadsheetId = restCfg.sheet_id;

    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Bookings!A:I'
    });

    const rows = resp.data.values || [];
    const data = rows.slice(1); // skip header

    const results = data
      .filter(r => String(r[1] || '').trim() === String(dayISO || '').trim()) // col day
      .map(r => ({
        booking_id: r[0] || null,
        day: r[1] || null,
        time: r[2] || null
      }))
      .filter(x => x.day && x.time); // minimo indispensabile

    return { ok: true, results };
  } catch (err) {
    return {
      ok: false,
      error_code: 'LIST_BY_DAY_ERROR',
      error_message: err && err.message ? err.message : String(err)
    };
  }
}


// -----------------------------
// Update Reservation
// -----------------------------
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
      await calendar.updateCalendarEvent({
        calendarId,
        eventId: updated.event_id,
        day: updated.day,
        time: updated.time,
        people: updated.people,
        name: updated.name,
        phone: updated.phone,
        notes: updated.notes
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

    return {
      ok: true,
      booking_id: updated.booking_id,
      day: updated.day,
      time: updated.time,
      people: updated.people,
      name: updated.name,
      phone: updated.phone,
      notes: updated.notes
    };

  } catch (err) {
    console.error("Errore updateReservation:", err.message);

    return {
      ok: false,
      error_code: "UPDATE_ERROR",
      error_message: err.message
    };
  }
}

// -----------------------------
// Delete Reservation
// -----------------------------
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

    const sheetRowNumber = rowIndex + 2; // header + 1-based
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
          startIndex: sheetRowNumber - 1, // 0-based, inclusivo
          endIndex: sheetRowNumber        // 0-based, esclusivo
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
    console.error("Errore deleteReservation:", err.message);

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
