/**
 * Funzioni condivise per il calcolo della capacità (tavoli/slot).
 * Usate da check_openings.js e reservations-sheets.js.
 */

const { DateTime } = require('luxon');

function hhmmToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (h * 60) + m;
}

function splitIntoBlocks(slots, stepMinutes = 30) {
  const mins = (slots || []).map(hhmmToMinutes).sort((a, b) => a - b);
  const blocks = [];
  let cur = [];

  for (const x of mins) {
    if (!cur.length) { cur.push(x); continue; }
    const prev = cur[cur.length - 1];
    if (x - prev > stepMinutes) { blocks.push(cur); cur = [x]; }
    else cur.push(x);
  }
  if (cur.length) blocks.push(cur);
  return blocks;
}

function applyCutoffToSlots(slots, cutoffMinutes, stepMinutes = 30) {
  if (!cutoffMinutes || cutoffMinutes <= 0) {
    return new Set((slots || []).map(hhmmToMinutes));
  }

  const blocks = splitIntoBlocks(slots, stepMinutes);
  const bookable = new Set();

  for (const block of blocks) {
    const lastStart = block[block.length - 1];
    const closing = lastStart + stepMinutes;
    const threshold = closing - cutoffMinutes;
    for (const t of block) {
      if (t <= threshold) bookable.add(t);
    }
  }
  return bookable;
}

function buildDateTime(dayISO, hhmm, tz = 'Europe/Rome') {
  const [hh, mm] = hhmm.split(':').map(Number);
  return DateTime.fromISO(dayISO, { zone: tz }).set({
    hour: hh, minute: mm, second: 0, millisecond: 0
  });
}

function countActiveAt(dayISO, atTime, bookingTimes, avgStayMinutes, tz = 'Europe/Rome') {
  const newStart = buildDateTime(dayISO, atTime, tz);
  const newEnd = newStart.plus({ minutes: avgStayMinutes });
  let count = 0;

  for (const bt of bookingTimes) {
    if (!bt || typeof bt !== 'string' || !/^\d{2}:\d{2}$/.test(bt)) continue;
    const existStart = buildDateTime(dayISO, bt, tz);
    const existEnd = existStart.plus({ minutes: avgStayMinutes });
    if (existStart < newEnd && newStart < existEnd) count++;
  }

  return count;
}

function nearestSlots(slots, requestedTime, max = 3) {
  if (!Array.isArray(slots) || slots.length === 0) return [];
  const req = hhmmToMinutes(requestedTime);

  return slots
    .map(s => ({ s, d: Math.abs(hhmmToMinutes(s) - req) }))
    .sort((a, b) => a.d - b.d)
    .map(x => x.s)
    .slice(0, max);
}

function isValidHHMM(s) {
  if (!s || typeof s !== 'string') return false;
  const m = s.match(/^(\d{2}):(\d{2})$/);
  if (!m) return false;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  return Number.isInteger(hh) && Number.isInteger(mm) && hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

module.exports = {
  hhmmToMinutes,
  splitIntoBlocks,
  applyCutoffToSlots,
  buildDateTime,
  countActiveAt,
  nearestSlots,
  isValidHHMM
};
