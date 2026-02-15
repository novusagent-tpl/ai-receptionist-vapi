/**
 * Test locale per capacity-utils.js
 * Verifica: overlap bidirezionale, nearestSlots, applyCutoffToSlots
 *
 * Eseguire: node scripts/test-capacity-utils.js
 */

const {
  countActiveAt,
  nearestSlots,
  applyCutoffToSlots,
  hhmmToMinutes,
  isValidHHMM
} = require('../src/capacity-utils');

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.log(`  FAIL  ${label}  (got: ${JSON.stringify(actual)}, expected: ${JSON.stringify(expected)})`);
    failed++;
  }
}

console.log('\n=== Test capacity-utils ===\n');

// --- countActiveAt (overlap bidirezionale) ---
console.log('-- countActiveAt (overlap bidirezionale, 90 min stay) --');

const day = '2026-02-10';
const stay = 90;
const tz = 'Europe/Rome';

// Scenario: booking A=19:30, booking B=19:00 → alle 20:00 entrambi attivi
const bookings1 = ['19:30', '19:00'];
assert(
  '20:00 con A(19:30) e B(19:00) → 2 attivi',
  countActiveAt(day, '20:00', bookings1, stay, tz),
  2
);

// Alle 21:00: A(19:30-21:00) finisce, B(19:00-20:30) finito → 0 attivi
assert(
  '21:00 con A(19:30) e B(19:00) → 0 attivi',
  countActiveAt(day, '21:00', bookings1, stay, tz),
  0
);

// Alle 18:00: new=[18:00-19:30), A=[19:30-21:00) → 18:00 < 21:00 AND 19:30 < 19:30 = false → 0 overlap con A
// B=[19:00-20:30) → 18:00 < 20:30 AND 19:00 < 19:30 = true → 1 overlap
assert(
  '18:00 con A(19:30) e B(19:00) → 1 attivo (solo B)',
  countActiveAt(day, '18:00', bookings1, stay, tz),
  1
);

// Nessuna prenotazione → 0
assert(
  '20:00 senza prenotazioni → 0',
  countActiveAt(day, '20:00', [], stay, tz),
  0
);

// Alle 20:30: A=[19:30-21:00) → overlap SI. B=[19:00-20:30) → new=20:30 existEnd=20:30 → 19:00 < 22:00 AND 20:30 < 20:30 = false → 0
assert(
  '20:30 con A(19:30) e B(19:00) → 1 attivo (solo A)',
  countActiveAt(day, '20:30', bookings1, stay, tz),
  1
);

// --- nearestSlots ---
console.log('\n-- nearestSlots --');

const slots = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];

assert(
  'nearest to 20:00 → [20:00, 19:30, 20:30]',
  nearestSlots(slots, '20:00', 3),
  ['20:00', '19:30', '20:30']
);

assert(
  'nearest to 22:00 → [22:00, 21:30, 21:00]',
  nearestSlots(slots, '22:00', 3),
  ['22:00', '21:30', '21:00']
);

assert(
  'empty slots → []',
  nearestSlots([], '20:00', 3),
  []
);

// --- applyCutoffToSlots ---
console.log('\n-- applyCutoffToSlots --');

const dinnerSlots = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];
const bookableSet = applyCutoffToSlots(dinnerSlots, 45, 30);
const bookable = dinnerSlots.filter(s => bookableSet.has(hhmmToMinutes(s)));

// dinner block: last slot 22:30, closing=23:00, threshold=23:00-45=22:15 (= 1335 min)
// So 22:30 (=1350) > 1335 → excluded. 22:00 (=1320) <= 1335 → included.
assert(
  'cutoff 45min su dinner → 22:30 escluso',
  bookable.includes('22:30'),
  false
);
assert(
  'cutoff 45min su dinner → 22:00 incluso',
  bookable.includes('22:00'),
  true
);
assert(
  'cutoff 45min su dinner → 19:00 incluso',
  bookable.includes('19:00'),
  true
);

// --- isValidHHMM ---
console.log('\n-- isValidHHMM --');
assert('20:00 → true', isValidHHMM('20:00'), true);
assert('25:00 → false', isValidHHMM('25:00'), false);
assert('abc → false', isValidHHMM('abc'), false);
assert('null → false', isValidHHMM(null), false);

// --- Riepilogo ---
console.log(`\n=== Risultati: ${passed} PASS, ${failed} FAIL ===\n`);
process.exit(failed > 0 ? 1 : 0);
