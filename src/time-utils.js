const { DateTime } = require('luxon');

// -----------------------------
// Helpers date & time
// -----------------------------

function parseDate(dateStr) {
  // Ex: "2025-02-14"
  return DateTime.fromISO(dateStr, { zone: 'Europe/Rome' });
}

function parseTime(timeStr) {
  // Ex: "19:30"
  return DateTime.fromFormat(timeStr, 'HH:mm', { zone: 'Europe/Rome' });
}

function formatTime(dt) {
  return dt.toFormat('HH:mm');
}

function getDayOfWeek(dateISO) {
  // returns monday, tuesday, ...
  const dt = parseDate(dateISO);
  return dt.toFormat('cccc').toLowerCase(); // monday, tuesday...
}

// -----------------------------
// Slot generator
// -----------------------------
function generateTimeSlots(startStr, endStr, stepMinutes = 30) {
  if (!startStr || !endStr) return [];

  let current = parseTime(startStr);
  const end = parseTime(endStr);

  const slots = [];
  while (current <= end) {
    slots.push(formatTime(current));
    current = current.plus({ minutes: stepMinutes });
  }

  return slots;
}

// -----------------------------
// openingsFor(date, openingsConfig)
// openingsConfig = restaurantKB.openings
// -----------------------------
function openingsFor(dateISO, openingsConfig) {
  const dow = getDayOfWeek(dateISO);

  const config = openingsConfig[dow];
  if (!config) return { closed: true, slots: [] };

  if (config.closed) {
    return { closed: true, slots: [] };
  }

  const slots = [];

  // lunch
  if (config.lunch && Array.isArray(config.lunch) && config.lunch.length === 2) {
    slots.push(...generateTimeSlots(config.lunch[0], config.lunch[1]));
  }

  // dinner
  if (config.dinner && Array.isArray(config.dinner) && config.dinner.length === 2) {
    slots.push(...generateTimeSlots(config.dinner[0], config.dinner[1]));
  }

  return {
    closed: slots.length === 0,
    slots
  };
}

module.exports = {
  parseDate,
  parseTime,
  formatTime,
  getDayOfWeek,
  generateTimeSlots,
  openingsFor
};
