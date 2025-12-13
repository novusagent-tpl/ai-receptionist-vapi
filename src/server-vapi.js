require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
// Tools API handlers
const checkOpenings = require('./api/check_openings');
const createBooking = require('./api/create_booking');
const listBookings = require('./api/list_bookings');
const modifyBooking = require('./api/modify_booking');
const cancelBooking = require('./api/cancel_booking');
const faq = require('./api/faq');
const sendSms = require('./api/send_sms');
const resolveRelativeDay = require('./api/resolve_relative_day');
const resolveRelativeTime = require('./api/resolve_relative_time');


const app = express();

// Middleware base
app.use(bodyParser.json());

// Porta
const PORT = process.env.PORT || 3000;

// Healthcheck
app.get('/status', (req, res) => {
  return res.json({
    ok: true,
    env: process.env.NODE_ENV || 'dev'
  });
});

// Debug openings
const kb = require('./kb');
const timeUtils = require('./time-utils');

app.get('/debug/openings', (req, res) => {
  const restaurantId = req.query.restaurant_id;
  const dateISO = req.query.date;

  if (!restaurantId || !dateISO) {
    return res.status(400).json({
      ok: false,
      error: "Missing restaurant_id or date"
    });
  }

  try {
    const openingsConfig = kb.getOpeningsConfig(restaurantId);
    const result = timeUtils.openingsFor(dateISO, openingsConfig);

    return res.json({
      ok: true,
      restaurant_id: restaurantId,
      date: dateISO,
      closed: result.closed,
      slots: result.slots
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

const reservations = require('./reservations');

// DEBUG: create booking
app.get('/debug/create_booking', async (req, res) => {
  try {
    const result = await reservations.createReservation({
      restaurantId: 'roma',
      day: "2025-02-14",
      time: "20:00",
      people: 2,
      name: "Test AI",
      phone: "+393331234567",
      notes: "Debug test"
    });

    return res.json(result);

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/debug/list_bookings', async (req, res) => {
  try {
    const result = await reservations.listReservationsByPhone(
      'roma',
      "+393331234567"
    );

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/debug/update_booking', async (req, res) => {
  try {
    const bookingId = req.query.id;
    if (!bookingId) {
      return res.json({ ok: false, error: "Missing id" });
    }

    const result = await reservations.updateReservation(
      'roma',
      bookingId,
      {
        new_day: "2025-02-15",
        new_time: "21:00",
        new_people: 3
      }
    );

    return res.json(result);

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/debug/delete_booking', async (req, res) => {
  try {
    const bookingId = req.query.id;
    if (!bookingId) {
      return res.json({ ok: false, error: "Missing id" });
    }

    const result = await reservations.deleteReservation(
      'roma',
      bookingId
    );

    return res.json(result);

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

const calendar = require('./calendar');

app.get('/debug/calendar_create', async (req, res) => {
  try {
    const result = await calendar.createCalendarEvent({
      calendarId: "09855ac5f977a03d174f27c715e8f9d10a726b35b28e45a2da23b05e9b3cb106@group.calendar.google.com",
      day: "2025-02-20",
      time: "19:30",
      people: 2,
      name: "Calendar Test",
      phone: "+393331234567",
      notes: "Test evento manuale"
    });

    return res.json(result);

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});


app.get('/debug/calendar_update', async (req, res) => {
  try {
    const eventId = req.query.id;
    if (!eventId) {
      return res.json({ ok: false, error: "Missing id" });
    }

    const result = await calendar.updateCalendarEvent({
      calendarId: "09855ac5f977a03d174f27c715e8f9d10a726b35b28e45a2da23b05e9b3cb106@group.calendar.google.com",
      eventId,
      day: "2025-02-20",
      time: "21:00",
      people: 3,
      name: "Calendar Update",
      phone: "+393331234567",
      notes: "Modificato da debug"
    });

    return res.json(result);

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/debug/calendar_delete', async (req, res) => {
  try {
    const eventId = req.query.id;
    if (!eventId) {
      return res.json({ ok: false, error: "Missing id" });
    }

    const result = await calendar.deleteCalendarEvent({
      calendarId: "09855ac5f977a03d174f27c715e8f9d10a726b35b28e45a2da23b05e9b3cb106@group.calendar.google.com",
      eventId
    });

    return res.json(result);

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------
// Tools API (VAPI)
// -----------------------------------------
app.post('/api/check_openings', checkOpenings);
app.post('/api/create_booking', createBooking);
app.post('/api/list_bookings', listBookings);
app.post('/api/modify_booking', modifyBooking);
app.post('/api/cancel_booking', cancelBooking);
app.post('/api/faq', faq);
app.post('/api/send_sms', sendSms);
app.post('/api/resolve_relative_day', resolveRelativeDay);
app.post('/api/resolve_relative_time', resolveRelativeTime);


// Avvio server
app.listen(PORT, () => {
  console.log(`AI Receptionist VAPI backend listening on port ${PORT}`);
});
