const { google } = require('googleapis');
const path = require('path');
const { DateTime } = require('luxon');

require('dotenv').config();

// -----------------------------
// Google Calendar Setup
// -----------------------------
function getCalendarClient() {
  const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
  },
  scopes: ['https://www.googleapis.com/auth/calendar']
});

  return google.calendar({ version: 'v3', auth });
}

// Helper: costruisce start/end ISO da day + time
// durationMinutes: durata evento in minuti (default 120 = 2h)
function buildDateTimes(day, time, timezone = 'Europe/Rome', durationMinutes = 120) {
  const [hourStr, minuteStr] = time.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  const start = DateTime.fromISO(day, { zone: timezone }).set({ hour, minute });
  const end = start.plus({ minutes: durationMinutes });

  return {
    start: start.toISO(),
    end: end.toISO(),
    timezone
  };
}

// -----------------------------
// Create Calendar Event
// -----------------------------
async function createCalendarEvent({
  calendarId,
  day,
  time,
  people,
  name,
  phone,
  notes,
  durationMinutes
}) {
  try {
    const calendar = getCalendarClient();
    const { start, end, timezone } = buildDateTimes(day, time, 'Europe/Rome', durationMinutes || 120);

    const summary = `Prenotazione - ${name} (${people} pax)`;
    const description = [
      `Nome: ${name}`,
      `Persone: ${people}`,
      `Telefono: ${phone}`,
      notes ? `Note: ${notes}` : null
    ].filter(Boolean).join('\n');

    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary,
        description,
        start: {
          dateTime: start,
          timeZone: timezone
        },
        end: {
          dateTime: end,
          timeZone: timezone
        }
      }
    });

    return {
      ok: true,
      event_id: response.data.id
    };

  } catch (err) {
    console.error('Errore createCalendarEvent:', err.message);

    return {
      ok: false,
      error_code: 'CAL_CREATE_ERROR',
      error_message: err.message
    };
  }
}

// -----------------------------
// Update Calendar Event
// -----------------------------
async function updateCalendarEvent({
  calendarId,
  eventId,
  day,
  time,
  people,
  name,
  phone,
  notes,
  durationMinutes
}) {
  try {
    const calendar = getCalendarClient();
    const { start, end, timezone } = buildDateTimes(day, time, 'Europe/Rome', durationMinutes || 120);

    const summary = `Prenotazione - ${name} (${people} pax)`;
    const description = [
      `Nome: ${name}`,
      `Persone: ${people}`,
      `Telefono: ${phone}`,
      notes ? `Note: ${notes}` : null
    ].filter(Boolean).join('\n');

    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: {
        summary,
        description,
        start: {
          dateTime: start,
          timeZone: timezone
        },
        end: {
          dateTime: end,
          timeZone: timezone
        }
      }
    });

    return {
      ok: true,
      event_id: response.data.id
    };

  } catch (err) {
    console.error('Errore updateCalendarEvent:', err.message);

    return {
      ok: false,
      error_code: 'CAL_UPDATE_ERROR',
      error_message: err.message
    };
  }
}

// -----------------------------
// Delete Calendar Event
// -----------------------------
async function deleteCalendarEvent({
  calendarId,
  eventId
}) {
  try {
    const calendar = getCalendarClient();

    await calendar.events.delete({
      calendarId,
      eventId
    });

    return {
      ok: true,
      event_id: eventId,
      deleted: true
    };

  } catch (err) {
    console.error('Errore deleteCalendarEvent:', err.message);

    return {
      ok: false,
      error_code: 'CAL_DELETE_ERROR',
      error_message: err.message
    };
  }
}

module.exports = {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
};
