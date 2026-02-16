/**
 * Regression Tests – AI Receptionist VAPI
 *
 * Eseguire con:   node scripts/regression-tests.js [BASE_URL]
 *
 * Se non specifichi BASE_URL, usa http://localhost:3000
 * Per testare su Render: node scripts/regression-tests.js https://tuo-deploy.onrender.com
 *
 * Cosa testa:
 *  - check_openings (giorno aperto, chiuso, orario passato, validazione)
 *  - resolve_relative_day (domani, sabato, oggi, stasera, non riconosciuto)
 *  - resolve_relative_time (tra mezz'ora, tra 2 ore, orario vago, non riconosciuto)
 *  - is_open_now (ristorante valido, ristorante mancante)
 *  - faq (match trovato, nessun match, validazione)
 *  - create_booking (validazione campi mancanti)
 *  - modify_booking (validazione campi mancanti)
 *  - cancel_booking (validazione campi mancanti)
 *  - list_bookings (validazione campi mancanti)
 *
 * OctoTable (octodemo – sandbox reale):
 *  - check_openings (giorno aperto/chiuso, orario in/fuori slot)
 *  - is_open_now
 *  - Validazione (manca day, manca phone, MAX_PEOPLE_EXCEEDED, manca booking_id)
 *  - CRUD completo: create → list → modify → cancel (su sandbox reale)
 *
 * Sheets/Calendar (roma – Google Sheets reale):
 *  - Enforcement server-side: giorno chiuso, fuori orario, cutoff
 *  - check_openings: max_people nella risposta, nearest_slots capacity-aware
 *  - CRUD completo: create → list → modify → cancel (su Sheets reale)
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';

// Colori per output leggibile
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function post(path, body) {
  const url = `${BASE_URL}${path}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return resp.json();
}

function assert(testName, condition, actual, expected) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ${GREEN}PASS${RESET}  ${testName}`);
  } else {
    failedTests++;
    const msg = `  ${RED}FAIL${RESET}  ${testName}  (got: ${JSON.stringify(actual)}, expected: ${JSON.stringify(expected)})`;
    console.log(msg);
    failures.push({ testName, actual, expected });
  }
}

// Helper per ottenere una data futura di un giorno specifico della settimana
// weekday: 1=Mon, 2=Tue, ... 6=Sat, 7=Sun
function getNextWeekday(weekday) {
  const now = new Date();
  const current = now.getDay() === 0 ? 7 : now.getDay(); // JS: 0=Sun -> 7
  let delta = (weekday - current + 7) % 7;
  if (delta === 0) delta = 7;
  const target = new Date(now);
  target.setDate(target.getDate() + delta);
  return target.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// ─────────────────────────────────────────────
// Test Suites
// ─────────────────────────────────────────────

async function testCheckOpenings() {
  console.log(`\n${CYAN}═══ check_openings ═══${RESET}`);

  // 1. Giorno aperto (martedì = weekday 2, modena01 è aperto)
  const openDay = getNextWeekday(2); // prossimo martedì
  const r1 = await post('/api/check_openings', {
    restaurant_id: 'modena01',
    day: openDay,
  });
  assert('Giorno aperto – ok:true', r1.ok === true, r1.ok, true);
  assert('Giorno aperto – closed:false', r1.closed === false, r1.closed, false);
  assert('Giorno aperto – ha slots', Array.isArray(r1.slots) && r1.slots.length > 0, r1.slots?.length, '>0');

  // 2. Giorno chiuso (lunedì = weekday 1, modena01 è chiuso)
  const closedDay = getNextWeekday(1); // prossimo lunedì
  const r2 = await post('/api/check_openings', {
    restaurant_id: 'modena01',
    day: closedDay,
  });
  assert('Giorno chiuso – ok:true', r2.ok === true, r2.ok, true);
  assert('Giorno chiuso – closed:true', r2.closed === true, r2.closed, true);

  // 3. Con orario valido in slot
  const r3 = await post('/api/check_openings', {
    restaurant_id: 'modena01',
    day: openDay,
    time: '20:00',
  });
  assert('Orario in slot – ok:true', r3.ok === true, r3.ok, true);
  assert('Orario in slot – available è boolean', typeof r3.available === 'boolean', typeof r3.available, 'boolean');

  // 4. Con orario fuori slot (es. 16:00 non è in nessuna fascia per martedì)
  const r4 = await post('/api/check_openings', {
    restaurant_id: 'modena01',
    day: openDay,
    time: '16:00',
  });
  assert('Orario fuori slot – available:false', r4.available === false, r4.available, false);
  assert('Orario fuori slot – reason:not_in_openings', r4.reason === 'not_in_openings', r4.reason, 'not_in_openings');

  // 5. Validazione: manca restaurant_id
  const r5 = await post('/api/check_openings', {
    day: openDay,
  });
  assert('Manca restaurant_id – ok:false', r5.ok === false, r5.ok, false);
  assert('Manca restaurant_id – VALIDATION_ERROR', r5.error_code === 'VALIDATION_ERROR', r5.error_code, 'VALIDATION_ERROR');

  // 6. Validazione: manca day
  const r6 = await post('/api/check_openings', {
    restaurant_id: 'modena01',
  });
  assert('Manca day – ok:false', r6.ok === false, r6.ok, false);
  assert('Manca day – VALIDATION_ERROR', r6.error_code === 'VALIDATION_ERROR', r6.error_code, 'VALIDATION_ERROR');

  // 7. Validazione: formato day sbagliato
  const r7 = await post('/api/check_openings', {
    restaurant_id: 'modena01',
    day: '10-02-2026',
  });
  assert('Day formato errato – ok:false', r7.ok === false, r7.ok, false);
  assert('Day formato errato – VALIDATION_ERROR', r7.error_code === 'VALIDATION_ERROR', r7.error_code, 'VALIDATION_ERROR');

  // 8. Validazione: time formato errato
  const r8 = await post('/api/check_openings', {
    restaurant_id: 'modena01',
    day: openDay,
    time: '25:99',
  });
  assert('Time formato errato – ok:false', r8.ok === false, r8.ok, false);
  assert('Time formato errato – VALIDATION_ERROR', r8.error_code === 'VALIDATION_ERROR', r8.error_code, 'VALIDATION_ERROR');

  // 9. Natale chiuso (override)
  const r9 = await post('/api/check_openings', {
    restaurant_id: 'modena01',
    day: '2026-12-25',
  });
  assert('Natale (override) – closed:true', r9.closed === true, r9.closed, true);
}

async function testResolveRelativeDay() {
  console.log(`\n${CYAN}═══ resolve_relative_day ═══${RESET}`);

  // 1. "domani"
  const r1 = await post('/api/resolve_relative_day', {
    restaurant_id: 'modena01',
    text: 'domani',
  });
  const expectedTomorrow = getTomorrow();
  assert('domani – ok:true', r1.ok === true, r1.ok, true);
  assert('domani – data corretta', r1.date === expectedTomorrow, r1.date, expectedTomorrow);

  // 2. "oggi"
  const r2 = await post('/api/resolve_relative_day', {
    restaurant_id: 'modena01',
    text: 'oggi',
  });
  assert('oggi – ok:true', r2.ok === true, r2.ok, true);
  assert('oggi – ha date', typeof r2.date === 'string' && r2.date.length === 10, r2.date, 'YYYY-MM-DD');

  // 3. "dopodomani"
  const r3 = await post('/api/resolve_relative_day', {
    restaurant_id: 'modena01',
    text: 'dopodomani',
  });
  assert('dopodomani – ok:true', r3.ok === true, r3.ok, true);

  // 4. Weekday "sabato"
  const r4 = await post('/api/resolve_relative_day', {
    restaurant_id: 'modena01',
    text: 'sabato',
  });
  assert('sabato – ok:true', r4.ok === true, r4.ok, true);
  assert('sabato – ha date', typeof r4.date === 'string' && r4.date.length === 10, r4.date, 'YYYY-MM-DD');

  // 5. "tra 3 giorni"
  const r5 = await post('/api/resolve_relative_day', {
    restaurant_id: 'modena01',
    text: 'tra 3 giorni',
  });
  assert('tra 3 giorni – ok:true', r5.ok === true, r5.ok, true);

  // 6. "stasera" → oggi (fix B2)
  const r6b = await post('/api/resolve_relative_day', {
    restaurant_id: 'modena01',
    text: 'stasera',
  });
  const todayISO = new Date().toISOString().split('T')[0];
  assert('stasera – ok:true', r6b.ok === true, r6b.ok, true);
  assert('stasera – data = oggi', r6b.date === todayISO, r6b.date, todayISO);

  // 7. Espressione non riconosciuta
  const r6 = await post('/api/resolve_relative_day', {
    restaurant_id: 'modena01',
    text: 'la settimana prossima forse',
  });
  assert('Non riconosciuto – ok:false', r6.ok === false, r6.ok, false);
  assert('Non riconosciuto – UNSUPPORTED_RELATIVE_DAY', r6.error_code === 'UNSUPPORTED_RELATIVE_DAY', r6.error_code, 'UNSUPPORTED_RELATIVE_DAY');

  // 7. Validazione: manca text
  const r7 = await post('/api/resolve_relative_day', {
    restaurant_id: 'modena01',
  });
  assert('Manca text – ok:false', r7.ok === false, r7.ok, false);
  assert('Manca text – VALIDATION_ERROR', r7.error_code === 'VALIDATION_ERROR', r7.error_code, 'VALIDATION_ERROR');
}

async function testResolveRelativeTime() {
  console.log(`\n${CYAN}═══ resolve_relative_time ═══${RESET}`);

  // 1. "tra mezz'ora"
  const r1 = await post('/api/resolve_relative_time', {
    restaurant_id: 'modena01',
    text: "tra mezz'ora",
  });
  assert("tra mezz'ora – ok:true", r1.ok === true, r1.ok, true);
  assert("tra mezz'ora – ha time HH:MM", /^\d{2}:\d{2}$/.test(r1.time), r1.time, 'HH:MM');

  // 2. "tra 2 ore"
  const r2 = await post('/api/resolve_relative_time', {
    restaurant_id: 'modena01',
    text: 'tra 2 ore',
  });
  assert('tra 2 ore – ok:true', r2.ok === true, r2.ok, true);
  assert('tra 2 ore – ha time', typeof r2.time === 'string', r2.time, 'string');
  assert('tra 2 ore – ha day_offset', typeof r2.day_offset === 'number', r2.day_offset, 'number');

  // 3. "tra 30 minuti"
  const r3 = await post('/api/resolve_relative_time', {
    restaurant_id: 'modena01',
    text: 'tra 30 minuti',
  });
  assert('tra 30 minuti – ok:true', r3.ok === true, r3.ok, true);

  // 4. Orario vago
  const r4 = await post('/api/resolve_relative_time', {
    restaurant_id: 'modena01',
    text: 'verso le otto più o meno',
  });
  assert('Orario vago – ok:false', r4.ok === false, r4.ok, false);
  assert('Orario vago – VAGUE_TIME', r4.error_code === 'VAGUE_TIME', r4.error_code, 'VAGUE_TIME');

  // 5. Non riconosciuto
  const r5 = await post('/api/resolve_relative_time', {
    restaurant_id: 'modena01',
    text: 'alle venti',
  });
  assert('Non relativo – ok:false', r5.ok === false, r5.ok, false);
  assert('Non relativo – UNSUPPORTED_RELATIVE_TIME', r5.error_code === 'UNSUPPORTED_RELATIVE_TIME', r5.error_code, 'UNSUPPORTED_RELATIVE_TIME');

  // 6. Validazione: manca text
  const r6 = await post('/api/resolve_relative_time', {
    restaurant_id: 'modena01',
  });
  assert('Manca text – ok:false', r6.ok === false, r6.ok, false);
  assert('Manca text – VALIDATION_ERROR', r6.error_code === 'VALIDATION_ERROR', r6.error_code, 'VALIDATION_ERROR');
}

async function testIsOpenNow() {
  console.log(`\n${CYAN}═══ is_open_now ═══${RESET}`);

  // 1. Ristorante valido
  const r1 = await post('/api/is_open_now', {
    restaurant_id: 'modena01',
  });
  assert('modena01 – ok:true', r1.ok === true, r1.ok, true);
  assert('modena01 – open_now è boolean', typeof r1.open_now === 'boolean', typeof r1.open_now, 'boolean');

  // 2. Ristorante roma
  const r2 = await post('/api/is_open_now', {
    restaurant_id: 'roma',
  });
  assert('roma – ok:true', r2.ok === true, r2.ok, true);
  assert('roma – open_now è boolean', typeof r2.open_now === 'boolean', typeof r2.open_now, 'boolean');

  // 3. Manca restaurant_id
  const r3 = await post('/api/is_open_now', {});
  assert('Manca restaurant_id – errore', r3.ok === false || r3.error_code != null, r3, 'errore');
}

async function testFaq() {
  console.log(`\n${CYAN}═══ faq ═══${RESET}`);

  // 1. Match esatto
  const r1 = await post('/api/faq', {
    restaurant_id: 'modena01',
    question: 'Avete parcheggio?',
  });
  assert('Match esatto – ok:true', r1.ok === true, r1.ok, true);
  assert('Match esatto – answer non null', r1.answer !== null && r1.answer !== undefined, r1.answer, 'non null');

  // 2. Match fuzzy (simile)
  const r2 = await post('/api/faq', {
    restaurant_id: 'modena01',
    question: 'Avete opzioni per celiaci senza glutine?',
  });
  assert('Match fuzzy – ok:true', r2.ok === true, r2.ok, true);
  assert('Match fuzzy – answer non null', r2.answer !== null, r2.answer, 'non null');

  // 3. Nessun match
  const r3 = await post('/api/faq', {
    restaurant_id: 'modena01',
    question: 'Qual è il PIL della Norvegia?',
  });
  assert('Nessun match – ok:true', r3.ok === true, r3.ok, true);
  assert('Nessun match – answer null', r3.answer === null, r3.answer, null);

  // 4. Validazione: manca question
  const r4 = await post('/api/faq', {
    restaurant_id: 'modena01',
  });
  assert('Manca question – ok:false', r4.ok === false, r4.ok, false);
  assert('Manca question – VALIDATION_ERROR', r4.error_code === 'VALIDATION_ERROR', r4.error_code, 'VALIDATION_ERROR');

  // 5. Validazione: manca restaurant_id
  const r5 = await post('/api/faq', {
    question: 'Avete parcheggio?',
  });
  assert('Manca restaurant_id – ok:false', r5.ok === false, r5.ok, false);
}

async function testCreateBookingValidation() {
  console.log(`\n${CYAN}═══ create_booking (solo validazione) ═══${RESET}`);

  // 1. Manca restaurant_id
  const r1 = await post('/api/create_booking', {
    day: '2026-03-10',
    time: '20:00',
    people: 2,
    name: 'Test',
    phone: '+393331234567',
  });
  assert('Manca restaurant_id – ok:false', r1.ok === false, r1.ok, false);

  // 2. Manca day
  const r2 = await post('/api/create_booking', {
    restaurant_id: 'modena01',
    time: '20:00',
    people: 2,
    name: 'Test',
    phone: '+393331234567',
  });
  assert('Manca day – ok:false', r2.ok === false, r2.ok, false);

  // 3. Manca phone
  const r3 = await post('/api/create_booking', {
    restaurant_id: 'modena01',
    day: '2026-03-10',
    time: '20:00',
    people: 2,
    name: 'Test',
  });
  assert('Manca phone – ok:false', r3.ok === false, r3.ok, false);

  // 4. MAX_PEOPLE_EXCEEDED (modena01 max=4)
  const r4 = await post('/api/create_booking', {
    restaurant_id: 'modena01',
    day: '2026-03-10',
    time: '20:00',
    people: 10,
    name: 'Test',
    phone: '+393331234567',
  });
  assert('Troppe persone – ok:false', r4.ok === false, r4.ok, false);
  assert('Troppe persone – MAX_PEOPLE_EXCEEDED', r4.error_code === 'MAX_PEOPLE_EXCEEDED', r4.error_code, 'MAX_PEOPLE_EXCEEDED');
}

async function testListBookingsValidation() {
  console.log(`\n${CYAN}═══ list_bookings (solo validazione) ═══${RESET}`);

  // 1. Manca restaurant_id
  const r1 = await post('/api/list_bookings', {
    phone: '+393331234567',
  });
  assert('Manca restaurant_id – ok:false', r1.ok === false, r1.ok, false);

  // 2. Manca phone
  const r2 = await post('/api/list_bookings', {
    restaurant_id: 'modena01',
  });
  assert('Manca phone – ok:false', r2.ok === false, r2.ok, false);
}

async function testModifyBookingValidation() {
  console.log(`\n${CYAN}═══ modify_booking (solo validazione) ═══${RESET}`);

  // 1. Manca restaurant_id
  const r1 = await post('/api/modify_booking', {
    booking_id: 'fake-id-123',
    new_people: 3,
  });
  assert('Manca restaurant_id – ok:false', r1.ok === false, r1.ok, false);

  // 2. Manca booking_id
  const r2 = await post('/api/modify_booking', {
    restaurant_id: 'modena01',
    new_people: 3,
  });
  assert('Manca booking_id – ok:false', r2.ok === false, r2.ok, false);
}

async function testCancelBookingValidation() {
  console.log(`\n${CYAN}═══ cancel_booking (solo validazione) ═══${RESET}`);

  // 1. Manca restaurant_id
  const r1 = await post('/api/cancel_booking', {
    booking_id: 'fake-id-123',
  });
  assert('Manca restaurant_id – ok:false', r1.ok === false, r1.ok, false);

  // 2. Manca booking_id
  const r2 = await post('/api/cancel_booking', {
    restaurant_id: 'modena01',
  });
  assert('Manca booking_id – ok:false', r2.ok === false, r2.ok, false);
}

async function testHealthcheck() {
  console.log(`\n${CYAN}═══ healthcheck ═══${RESET}`);

  const url = `${BASE_URL}/status`;
  const resp = await fetch(url);
  const data = await resp.json();
  assert('GET /status – ok:true', data.ok === true, data.ok, true);
}

async function testMultiTenantIsolation() {
  console.log(`\n${CYAN}═══ multi-tenant isolation ═══${RESET}`);

  const openDay = getNextWeekday(2); // martedì – aperto per modena01

  // 1. modena01 e roma restituiscono dati diversi
  const r1 = await post('/api/check_openings', { restaurant_id: 'modena01', day: openDay });
  const r2 = await post('/api/check_openings', { restaurant_id: 'roma', day: openDay });
  assert('modena01 e roma – entrambi ok:true', r1.ok === true && r2.ok === true, { m: r1.ok, r: r2.ok }, true);
  assert('modena01 e roma – restaurant_id diverso', r1.restaurant_id === 'modena01' && r2.restaurant_id === 'roma', { m: r1.restaurant_id, r: r2.restaurant_id }, 'diversi');

  // 2. restaurant_id inesistente → errore (no leak dati)
  const r3 = await post('/api/check_openings', { restaurant_id: 'ristorante_fake_xyz', day: openDay });
  assert('ID inesistente – errore', r3.ok === false || r3.error_code != null, r3, 'errore');

  // 3. FAQ: modena01 ha le sue FAQ, non quelle di roma
  const r4 = await post('/api/faq', { restaurant_id: 'modena01', question: 'Avete parcheggio?' });
  assert('FAQ modena01 – answer non null', r4.answer !== null, r4.answer, 'non null');

  // 4. is_open_now per restaurant diversi non si mischiano
  const r5 = await post('/api/is_open_now', { restaurant_id: 'modena01' });
  const r6 = await post('/api/is_open_now', { restaurant_id: 'roma' });
  assert('is_open_now – entrambi ok:true', r5.ok === true && r6.ok === true, { m: r5.ok, r: r6.ok }, true);
}

// ─────────────────────────────────────────────
// OctoTable Tests (octodemo — sandbox reale)
// ─────────────────────────────────────────────

async function testOctoTableCheckOpenings() {
  console.log(`\n${CYAN}═══ OctoTable: check_openings (octodemo) ═══${RESET}`);

  // octodemo: Lun-Sab aperto, Domenica chiuso
  // Lunch 12-15, Dinner 19-23

  // 1. Giorno aperto (mercoledì = weekday 3)
  const openDay = getNextWeekday(3);
  const r1 = await post('/api/check_openings', {
    restaurant_id: 'octodemo',
    day: openDay,
  });
  assert('octodemo giorno aperto – ok:true', r1.ok === true, r1.ok, true);
  assert('octodemo giorno aperto – closed:false', r1.closed === false, r1.closed, false);
  assert('octodemo giorno aperto – ha slots', Array.isArray(r1.slots) && r1.slots.length > 0, r1.slots?.length, '>0');

  // 2. Giorno chiuso (domenica = weekday 7)
  const closedDay = getNextWeekday(7);
  const r2 = await post('/api/check_openings', {
    restaurant_id: 'octodemo',
    day: closedDay,
  });
  assert('octodemo giorno chiuso – ok:true', r2.ok === true, r2.ok, true);
  assert('octodemo giorno chiuso – closed:true', r2.closed === true, r2.closed, true);

  // 3. Orario in slot (20:00 = cena)
  const r3 = await post('/api/check_openings', {
    restaurant_id: 'octodemo',
    day: openDay,
    time: '20:00',
  });
  assert('octodemo orario in slot – ok:true', r3.ok === true, r3.ok, true);
  assert('octodemo orario in slot – available è boolean', typeof r3.available === 'boolean', typeof r3.available, 'boolean');

  // 4. Orario fuori slot (16:00 = tra pranzo e cena)
  const r4 = await post('/api/check_openings', {
    restaurant_id: 'octodemo',
    day: openDay,
    time: '16:00',
  });
  assert('octodemo orario fuori slot – available:false', r4.available === false, r4.available, false);
  assert('octodemo orario fuori slot – reason:not_in_openings', r4.reason === 'not_in_openings', r4.reason, 'not_in_openings');

  // 5. restaurant_id corretto nella risposta
  assert('octodemo – restaurant_id nella risposta', r1.restaurant_id === 'octodemo', r1.restaurant_id, 'octodemo');
}

async function testOctoTableIsOpenNow() {
  console.log(`\n${CYAN}═══ OctoTable: is_open_now (octodemo) ═══${RESET}`);

  const r1 = await post('/api/is_open_now', {
    restaurant_id: 'octodemo',
  });
  assert('octodemo is_open_now – ok:true', r1.ok === true, r1.ok, true);
  assert('octodemo is_open_now – open_now è boolean', typeof r1.open_now === 'boolean', typeof r1.open_now, 'boolean');
}

async function testOctoTableValidation() {
  console.log(`\n${CYAN}═══ OctoTable: validazione (octodemo) ═══${RESET}`);

  // 1. create_booking – manca day
  const r1 = await post('/api/create_booking', {
    restaurant_id: 'octodemo',
    time: '20:00',
    people: 2,
    name: 'Test OctoTable',
    phone: '+393331234567',
  });
  assert('octodemo create – manca day – ok:false', r1.ok === false, r1.ok, false);

  // 2. create_booking – manca phone
  const r2 = await post('/api/create_booking', {
    restaurant_id: 'octodemo',
    day: '2026-03-15',
    time: '20:00',
    people: 2,
    name: 'Test OctoTable',
  });
  assert('octodemo create – manca phone – ok:false', r2.ok === false, r2.ok, false);

  // 3. create_booking – MAX_PEOPLE_EXCEEDED (octodemo max=4)
  const r3 = await post('/api/create_booking', {
    restaurant_id: 'octodemo',
    day: '2026-03-15',
    time: '20:00',
    people: 10,
    name: 'Test OctoTable',
    phone: '+393331234567',
  });
  assert('octodemo create – troppe persone – ok:false', r3.ok === false, r3.ok, false);
  assert('octodemo create – MAX_PEOPLE_EXCEEDED', r3.error_code === 'MAX_PEOPLE_EXCEEDED', r3.error_code, 'MAX_PEOPLE_EXCEEDED');

  // 4. list_bookings – manca phone
  const r4 = await post('/api/list_bookings', {
    restaurant_id: 'octodemo',
  });
  assert('octodemo list – manca phone – ok:false', r4.ok === false, r4.ok, false);

  // 5. modify_booking – manca booking_id
  const r5 = await post('/api/modify_booking', {
    restaurant_id: 'octodemo',
    new_people: 3,
  });
  assert('octodemo modify – manca booking_id – ok:false', r5.ok === false, r5.ok, false);

  // 6. cancel_booking – manca booking_id
  const r6 = await post('/api/cancel_booking', {
    restaurant_id: 'octodemo',
  });
  assert('octodemo cancel – manca booking_id – ok:false', r6.ok === false, r6.ok, false);
}

async function testOctoTableCRUD() {
  console.log(`\n${CYAN}═══ OctoTable: CRUD COMPLETO (octodemo → sandbox reale) ═══${RESET}`);

  // Usa un giorno futuro (prossimo mercoledì) per evitare conflitti
  const testDay = getNextWeekday(3); // mercoledì
  const testTime = '20:30';
  const testPhone = '+393339999001';
  const testName = 'Test CRUD Auto';

  // ─── STEP 1: check_openings ───
  console.log(`\n  ${YELLOW}Step 1: check_openings${RESET}`);
  const openCheck = await post('/api/check_openings', {
    restaurant_id: 'octodemo',
    day: testDay,
    time: testTime,
  });
  assert('CRUD 1 – check_openings ok:true', openCheck.ok === true, openCheck.ok, true);
  assert('CRUD 1 – available:true', openCheck.available === true, openCheck.available, true);

  if (!openCheck.available) {
    console.log(`  ${YELLOW}SKIP: orario non disponibile, CRUD non eseguibile${RESET}`);
    return;
  }

  // ─── STEP 2: create_booking ───
  console.log(`\n  ${YELLOW}Step 2: create_booking${RESET}`);
  const created = await post('/api/create_booking', {
    restaurant_id: 'octodemo',
    day: testDay,
    time: testTime,
    people: 2,
    name: testName,
    phone: testPhone,
  });
  assert('CRUD 2 – create ok:true', created.ok === true, created.ok, true);
  assert('CRUD 2 – ha booking_id', !!created.booking_id, created.booking_id, 'non null');

  if (!created.ok || !created.booking_id) {
    console.log(`  ${RED}STOP: create fallito, non posso continuare CRUD${RESET}`);
    console.log(`  Dettaglio: ${JSON.stringify(created)}`);
    return;
  }

  const bookingId = created.booking_id;
  console.log(`  Booking creato: ${bookingId}`);

  // ─── STEP 3: list_bookings ───
  console.log(`\n  ${YELLOW}Step 3: list_bookings${RESET}`);
  const listed = await post('/api/list_bookings', {
    restaurant_id: 'octodemo',
    phone: testPhone,
  });
  assert('CRUD 3 – list ok:true', listed.ok === true, listed.ok, true);
  const listResults = listed.results || [];
  assert('CRUD 3 – count >= 1', listResults.length >= 1, listResults.length, '>=1');

  // Verifica che il booking appena creato sia nella lista (campo: booking_id)
  const found = listResults.some(b => String(b.booking_id || b.id) === String(bookingId));
  assert('CRUD 3 – booking trovato in lista', found === true, found, true);

  // ─── STEP 4: modify_booking (cambia persone: 2 → 3) ───
  console.log(`\n  ${YELLOW}Step 4: modify_booking (people 2 → 3)${RESET}`);
  const modified = await post('/api/modify_booking', {
    restaurant_id: 'octodemo',
    booking_id: bookingId,
    new_people: 3,
  });
  assert('CRUD 4 – modify ok:true', modified.ok === true, modified.ok, true);

  // Verifica la modifica con una nuova list
  const listed2 = await post('/api/list_bookings', {
    restaurant_id: 'octodemo',
    phone: testPhone,
  });
  const list2Results = listed2.results || [];
  const modifiedBooking = list2Results.find(b => String(b.booking_id || b.id) === String(bookingId));
  if (modifiedBooking) {
    assert('CRUD 4 – people aggiornato a 3', modifiedBooking.people === 3 || modifiedBooking.pax === 3, modifiedBooking.people || modifiedBooking.pax, 3);
  }

  // ─── STEP 5: cancel_booking ───
  console.log(`\n  ${YELLOW}Step 5: cancel_booking${RESET}`);
  const cancelled = await post('/api/cancel_booking', {
    restaurant_id: 'octodemo',
    booking_id: bookingId,
  });
  assert('CRUD 5 – cancel ok:true', cancelled.ok === true, cancelled.ok, true);

  // Verifica che non compaia più nella lista
  const listed3 = await post('/api/list_bookings', {
    restaurant_id: 'octodemo',
    phone: testPhone,
  });
  const list3Results = listed3.results || [];
  const stillThere = list3Results.some(b => String(b.booking_id || b.id) === String(bookingId));
  assert('CRUD 5 – booking rimosso dalla lista', stillThere === false, stillThere, false);

  console.log(`\n  ${GREEN}✓ Ciclo CRUD OctoTable completo!${RESET}`);
}

// ─────────────────────────────────────────────
// Sheets/Calendar Tests (roma — Google Sheets reale)
// ─────────────────────────────────────────────

async function testSheetsCheckOpenings() {
  console.log(`\n${CYAN}═══ Sheets: check_openings (roma) ═══${RESET}`);

  // roma: Lun-Sab aperto (cena 19:00-22:30), Domenica chiuso
  // max_concurrent_bookings: 3, avg_stay_minutes: 60, booking_cutoff_minutes: 45

  // 1. Giorno aperto (venerdì = weekday 5, ha pranzo + cena)
  const openDay = getNextWeekday(5);
  const r1 = await post('/api/check_openings', {
    restaurant_id: 'roma',
    day: openDay,
  });
  assert('roma giorno aperto – ok:true', r1.ok === true, r1.ok, true);
  assert('roma giorno aperto – closed:false', r1.closed === false, r1.closed, false);
  assert('roma giorno aperto – ha slots', Array.isArray(r1.slots) && r1.slots.length > 0, r1.slots?.length, '>0');

  // 2. Giorno chiuso (domenica)
  const closedDay = getNextWeekday(7);
  const r2 = await post('/api/check_openings', {
    restaurant_id: 'roma',
    day: closedDay,
  });
  assert('roma giorno chiuso – ok:true', r2.ok === true, r2.ok, true);
  assert('roma giorno chiuso – closed:true', r2.closed === true, r2.closed, true);

  // 3. Orario in slot (20:00 = cena) con available + max_people
  const r3 = await post('/api/check_openings', {
    restaurant_id: 'roma',
    day: openDay,
    time: '20:00',
  });
  assert('roma orario in slot – ok:true', r3.ok === true, r3.ok, true);
  assert('roma orario in slot – available è boolean', typeof r3.available === 'boolean', typeof r3.available, 'boolean');
  assert('roma orario in slot – max_people presente', r3.max_people != null && r3.max_people > 0, r3.max_people, '>0');

  // 4. Orario fuori slot (16:00)
  const r4 = await post('/api/check_openings', {
    restaurant_id: 'roma',
    day: openDay,
    time: '16:00',
  });
  assert('roma orario fuori slot – available:false', r4.available === false, r4.available, false);
  assert('roma orario fuori slot – reason:not_in_openings', r4.reason === 'not_in_openings', r4.reason, 'not_in_openings');
  assert('roma orario fuori slot – ha nearest_slots', Array.isArray(r4.nearest_slots) && r4.nearest_slots.length > 0, r4.nearest_slots?.length, '>0');
}

async function testSheetsEnforcement() {
  console.log(`\n${CYAN}═══ Sheets: enforcement server-side (roma) ═══${RESET}`);

  // roma: Domenica chiuso, cena 19:00-22:30, cutoff 45 min
  const closedDay = getNextWeekday(7); // domenica
  const openDay = getNextWeekday(5);   // venerdì

  // 1. create_booking su giorno chiuso → OUTSIDE_HOURS
  const r1 = await post('/api/create_booking', {
    restaurant_id: 'roma',
    day: closedDay,
    time: '20:00',
    people: 2,
    name: 'Test Chiuso',
    phone: '+393339999801',
  });
  assert('Giorno chiuso – ok:false', r1.ok === false, r1.ok, false);
  assert('Giorno chiuso – OUTSIDE_HOURS', r1.error_code === 'OUTSIDE_HOURS', r1.error_code, 'OUTSIDE_HOURS');

  // 2. create_booking fuori orario (16:00 di venerdì) → OUTSIDE_HOURS
  const r2 = await post('/api/create_booking', {
    restaurant_id: 'roma',
    day: openDay,
    time: '16:00',
    people: 2,
    name: 'Test Fuori Orario',
    phone: '+393339999802',
  });
  assert('Fuori orario – ok:false', r2.ok === false, r2.ok, false);
  assert('Fuori orario – OUTSIDE_HOURS', r2.error_code === 'OUTSIDE_HOURS', r2.error_code, 'OUTSIDE_HOURS');
  assert('Fuori orario – ha nearest_slots', Array.isArray(r2.nearest_slots) && r2.nearest_slots.length > 0, r2.nearest_slots?.length, '>0');

  // 3. MAX_PEOPLE_EXCEEDED (roma max=8)
  const r3 = await post('/api/create_booking', {
    restaurant_id: 'roma',
    day: openDay,
    time: '20:00',
    people: 15,
    name: 'Test Troppe Persone',
    phone: '+393339999803',
  });
  assert('Troppe persone – ok:false', r3.ok === false, r3.ok, false);
  assert('Troppe persone – MAX_PEOPLE_EXCEEDED', r3.error_code === 'MAX_PEOPLE_EXCEEDED', r3.error_code, 'MAX_PEOPLE_EXCEEDED');
}

async function testSheetsCRUD() {
  console.log(`\n${CYAN}═══ Sheets: CRUD COMPLETO (roma → Google Sheets reale) ═══${RESET}`);

  // Usa un giorno futuro (prossimo giovedì) per evitare conflitti
  const testDay = getNextWeekday(4); // giovedì
  const testTime = '20:00';
  const testPhone = '+393339999901';
  const testName = 'Test CRUD Sheets';

  // ─── STEP 1: check_openings ───
  console.log(`\n  ${YELLOW}Step 1: check_openings${RESET}`);
  const openCheck = await post('/api/check_openings', {
    restaurant_id: 'roma',
    day: testDay,
    time: testTime,
  });
  assert('CRUD-S 1 – check_openings ok:true', openCheck.ok === true, openCheck.ok, true);
  assert('CRUD-S 1 – available:true', openCheck.available === true, openCheck.available, true);

  if (!openCheck.available) {
    console.log(`  ${YELLOW}SKIP: orario non disponibile, CRUD non eseguibile${RESET}`);
    return;
  }

  // ─── STEP 2: create_booking ───
  console.log(`\n  ${YELLOW}Step 2: create_booking${RESET}`);
  const created = await post('/api/create_booking', {
    restaurant_id: 'roma',
    day: testDay,
    time: testTime,
    people: 2,
    name: testName,
    phone: testPhone,
  });
  assert('CRUD-S 2 – create ok:true', created.ok === true, created.ok, true);
  assert('CRUD-S 2 – ha booking_id', !!created.booking_id, created.booking_id, 'non null');

  if (!created.ok || !created.booking_id) {
    console.log(`  ${RED}STOP: create fallito, non posso continuare CRUD${RESET}`);
    console.log(`  Dettaglio: ${JSON.stringify(created)}`);
    return;
  }

  const bookingId = created.booking_id;
  console.log(`  Booking creato: ${bookingId}`);

  // ─── STEP 3: list_bookings ───
  console.log(`\n  ${YELLOW}Step 3: list_bookings${RESET}`);
  const listed = await post('/api/list_bookings', {
    restaurant_id: 'roma',
    phone: testPhone,
  });
  assert('CRUD-S 3 – list ok:true', listed.ok === true, listed.ok, true);
  const listResults = listed.results || [];
  assert('CRUD-S 3 – count >= 1', listResults.length >= 1, listResults.length, '>=1');

  const found = listResults.some(b => String(b.booking_id || b.id) === String(bookingId));
  assert('CRUD-S 3 – booking trovato in lista', found === true, found, true);

  // ─── STEP 4: modify_booking (cambia persone: 2 → 4) ───
  console.log(`\n  ${YELLOW}Step 4: modify_booking (people 2 → 4)${RESET}`);
  const modified = await post('/api/modify_booking', {
    restaurant_id: 'roma',
    booking_id: bookingId,
    new_people: 4,
  });
  assert('CRUD-S 4 – modify ok:true', modified.ok === true, modified.ok, true);

  // Verifica la modifica con una nuova list
  const listed2 = await post('/api/list_bookings', {
    restaurant_id: 'roma',
    phone: testPhone,
  });
  const list2Results = listed2.results || [];
  const modifiedBooking = list2Results.find(b => String(b.booking_id || b.id) === String(bookingId));
  if (modifiedBooking) {
    assert('CRUD-S 4 – people aggiornato a 4', Number(modifiedBooking.people) === 4, modifiedBooking.people, 4);
  }

  // ─── STEP 5: cancel_booking ───
  console.log(`\n  ${YELLOW}Step 5: cancel_booking${RESET}`);
  const cancelled = await post('/api/cancel_booking', {
    restaurant_id: 'roma',
    booking_id: bookingId,
  });
  assert('CRUD-S 5 – cancel ok:true', cancelled.ok === true, cancelled.ok, true);

  // Verifica che non compaia più nella lista
  const listed3 = await post('/api/list_bookings', {
    restaurant_id: 'roma',
    phone: testPhone,
  });
  const list3Results = listed3.results || [];
  const stillThere = list3Results.some(b => String(b.booking_id || b.id) === String(bookingId));
  assert('CRUD-S 5 – booking rimosso dalla lista', stillThere === false, stillThere, false);

  console.log(`\n  ${GREEN}✓ Ciclo CRUD Sheets completo!${RESET}`);
}

// ─────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────

async function run() {
  console.log(`\n${YELLOW}╔══════════════════════════════════════════╗${RESET}`);
  console.log(`${YELLOW}║   AI Receptionist – Regression Tests     ║${RESET}`);
  console.log(`${YELLOW}╚══════════════════════════════════════════╝${RESET}`);
  console.log(`\nServer: ${BASE_URL}\n`);

  try {
    await testHealthcheck();
    await testCheckOpenings();
    await testResolveRelativeDay();
    await testResolveRelativeTime();
    await testIsOpenNow();
    await testFaq();
    await testCreateBookingValidation();
    await testListBookingsValidation();
    await testModifyBookingValidation();
    await testCancelBookingValidation();
    await testMultiTenantIsolation();

    // OctoTable (octodemo – sandbox reale)
    console.log(`\n${YELLOW}──── OctoTable Integration Tests ────${RESET}`);
    await testOctoTableCheckOpenings();
    await testOctoTableIsOpenNow();
    await testOctoTableValidation();
    await testOctoTableCRUD();

    // Sheets/Calendar (roma – Google Sheets reale)
    console.log(`\n${YELLOW}──── Sheets/Calendar Integration Tests ────${RESET}`);
    await testSheetsCheckOpenings();
    await testSheetsEnforcement();
    await testSheetsCRUD();
  } catch (err) {
    console.log(`\n${RED}ERRORE FATALE: ${err.message}${RESET}`);
    console.log(`Verifica che il server sia avviato su ${BASE_URL}`);
    process.exit(1);
  }

  // Report finale
  console.log(`\n${YELLOW}══════════════════════════════════════════${RESET}`);
  console.log(`  Totale:  ${totalTests}`);
  console.log(`  ${GREEN}Passati: ${passedTests}${RESET}`);
  console.log(`  ${failedTests > 0 ? RED : GREEN}Falliti: ${failedTests}${RESET}`);
  console.log(`${YELLOW}══════════════════════════════════════════${RESET}\n`);

  if (failures.length > 0) {
    console.log(`${RED}Test falliti:${RESET}`);
    for (const f of failures) {
      console.log(`  - ${f.testName}`);
    }
    console.log('');
  }

  process.exit(failedTests > 0 ? 1 : 0);
}

run();
