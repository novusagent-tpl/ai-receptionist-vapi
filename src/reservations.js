const { google } = require('googleapis');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const calendar = require('./calendar');
const { getRestaurantConfig } = require('./config/restaurants');

require('dotenv').config();

// -----------------------------
// Google Sheets Setup
// -----------------------------
function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '..', 'credentials', 'google-service-account.json'),
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

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:I',
      valueInputOption: 'RAW',
      resource: {
        values
      }
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
      range: 'A:I'
    });

    const rows = response.data.values || [];

    // Skip header row
    const dataRows = rows.slice(1);

    const results = dataRows
      .filter(r => (r[5] || "").trim() === phone.trim())
      .map(r => ({
        booking_id: r[0],
        day: r[1],
        time: r[2],
        people: Number(r[3]),
        name: r[4],
        phone: r[5],
        notes: r[6] || null
        // event_id: r[8] // se ti serve in futuro
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
      range: 'A:I'
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
      range: `A${googleRow}:I${googleRow}`,
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
      range: 'A:I'
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
    const eventId = old[8] || null;

    if (eventId) {
      await calendar.deleteCalendarEvent({
        calendarId,
        eventId
      });
    }

    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: `A${googleRow}:I${googleRow}`
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
  updateReservation,
  deleteReservation
};
