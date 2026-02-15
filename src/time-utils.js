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
function openingsFor(dateISO, openingsConfig, stepMinutes = 30) {

  // -----------------------------
  // OVERRIDES per data (priorità assoluta)
  // openingsConfig.overrides = { "YYYY-MM-DD": { closed:true | lunch:[..] | dinner:[..] } }
  // -----------------------------
  const override = openingsConfig?.overrides?.[dateISO];
  if (override) {
    if (override.closed === true) {
      return { closed: true, slots: [] };
    }

    const slots = [];
    let lunchRange = null;
    let dinnerRange = null;

    if (override.lunch && Array.isArray(override.lunch) && override.lunch.length === 2) {
      slots.push(...generateTimeSlots(override.lunch[0], override.lunch[1], stepMinutes));
      lunchRange = [override.lunch[0], override.lunch[1]];
    }

    if (override.dinner && Array.isArray(override.dinner) && override.dinner.length === 2) {
      slots.push(...generateTimeSlots(override.dinner[0], override.dinner[1], stepMinutes));
      dinnerRange = [override.dinner[0], override.dinner[1]];
    }

    return {
      closed: slots.length === 0,
      slots,
      lunch_range: lunchRange,
      dinner_range: dinnerRange
    };
  }

  const dow = getDayOfWeek(dateISO);

  const config = openingsConfig[dow];
  if (!config) return { closed: true, slots: [] };

  if (config.closed) {
    return { closed: true, slots: [] };
  }

  const slots = [];
  let lunchRange = null;
  let dinnerRange = null;

  // lunch
  if (config.lunch && Array.isArray(config.lunch) && config.lunch.length === 2) {
    slots.push(...generateTimeSlots(config.lunch[0], config.lunch[1], stepMinutes));
    lunchRange = [config.lunch[0], config.lunch[1]];
  }

  // dinner
  if (config.dinner && Array.isArray(config.dinner) && config.dinner.length === 2) {
    slots.push(...generateTimeSlots(config.dinner[0], config.dinner[1], stepMinutes));
    dinnerRange = [config.dinner[0], config.dinner[1]];
  }

  return {
    closed: slots.length === 0,
    slots,
    lunch_range: lunchRange,
    dinner_range: dinnerRange
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
