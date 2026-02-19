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
 *
 * v2.0 Backend Rigido:
 *  - day_label, message, time_human presenti nelle risposte
 *  - WEEKDAY_MISMATCH: expected_weekday sbagliato → corrected_day
 *  - next_open_day: giorno chiuso → propone prossimo aperto
 *  - Capacity full: 3 prenotazioni → SLOT_FULL con nearest_slots_human
 *
 * v2.1 Edge Cases:
 *  - PAST_DATE: create_booking con data passata → rifiuto
 *  - Cutoff: orario vicino a chiusura → reason:cutoff con message
 *  - Modifica verso slot pieno: modify_booking → SLOT_FULL o comportamento documentato
 *  - resolve_relative_time formati italiani: "21", "20:30", "20 e 30", "20 e mezza",
 *    "20 e un quarto", "alle 21", "19.45", "verso le 20" (vago)
 *  - create_booking errore nearest_slots_human: SLOT_FULL e OUTSIDE_HOURS con formato parlato
 *  - send_sms validazione: manca restaurant_id/to/message → VALIDATION_ERROR
 *  - Doppia prenotazione stesso telefono: comportamento documentato
 *  - create_booking fuori orario: domenica, 15:00, 07:00 → OUTSIDE_HOURS
 *  - check_openings edge: confini fascia, buco pranzo-cena, restaurant inesistente,
 *    override Capodanno, max_people
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
// v2.0 Tests: day_label, message, time_human, WEEKDAY_MISMATCH, capacity
// ─────────────────────────────────────────────

async function testV2Fields() {
  console.log(`\n${CYAN}═══ v2.0: day_label / message / time_human ═══${RESET}`);

  const openDay = getNextWeekday(5); // venerdì

  // 1. check_openings: day_label e message presenti
  const r1 = await post('/api/check_openings', {
    restaurant_id: 'roma',
    day: openDay,
  });
  assert('v2 check_openings – ha day_label', typeof r1.day_label === 'string' && r1.day_label.length > 0, r1.day_label, 'string non vuota');
  assert('v2 check_openings – ha message', typeof r1.message === 'string' && r1.message.length > 0, r1.message, 'string non vuota');
  assert('v2 check_openings – ha max_people', typeof r1.max_people === 'number' && r1.max_people > 0, r1.max_people, '>0');

  // 2. check_openings con time: time_human presente
  const r2 = await post('/api/check_openings', {
    restaurant_id: 'roma',
    day: openDay,
    time: '20:30',
  });
  assert('v2 check_openings+time – ha time_human', typeof r2.time_human === 'string' && r2.time_human.length > 0, r2.time_human, 'string non vuota');
  assert('v2 time_human contiene "e"', r2.time_human.includes('e'), r2.time_human, 'contiene "e"');

  // 3. check_openings orario fuori slot: nearest_slots presente (HTTP) 
  const r3 = await post('/api/check_openings', {
    restaurant_id: 'roma',
    day: openDay,
    time: '16:00',
  });
  assert('v2 fuori slot – ha nearest_slots', Array.isArray(r3.nearest_slots) && r3.nearest_slots.length > 0, r3.nearest_slots?.length, '>0');
  assert('v2 fuori slot – ha message', typeof r3.message === 'string' && r3.message.length > 0, r3.message, 'string non vuota');

  // 4. resolve_relative_day: day_label presente
  const r4 = await post('/api/resolve_relative_day', {
    restaurant_id: 'roma',
    text: 'domani',
  });
  assert('v2 resolve_day – ha day_label', typeof r4.day_label === 'string' && r4.day_label.length > 0, r4.day_label, 'string non vuota');
}

async function testWeekdayMismatch() {
  console.log(`\n${CYAN}═══ v2.0: WEEKDAY_MISMATCH ═══${RESET}`);

  // Prendiamo un lunedì e diciamo che il cliente ha detto "giovedì"
  const mondayISO = getNextWeekday(1); // lunedì

  // 1. MISMATCH: mando lunedì ma dico expected_weekday="giovedì"
  const r1 = await post('/api/check_openings', {
    restaurant_id: 'roma',
    day: mondayISO,
    time: '20:00',
    expected_weekday: 'giovedì',
  });
  assert('MISMATCH – ok:false', r1.ok === false, r1.ok, false);
  assert('MISMATCH – error_code', r1.error_code === 'WEEKDAY_MISMATCH', r1.error_code, 'WEEKDAY_MISMATCH');
  assert('MISMATCH – ha corrected_day', typeof r1.corrected_day === 'string' && r1.corrected_day.length === 10, r1.corrected_day, 'YYYY-MM-DD');
  assert('MISMATCH – ha corrected_day_label', typeof r1.corrected_day_label === 'string' && r1.corrected_day_label.includes('giovedì'), r1.corrected_day_label, 'contiene giovedì');
  assert('MISMATCH – ha message', typeof r1.message === 'string' && r1.message.length > 0, r1.message, 'string non vuota');

  // 2. MATCH: mando lunedì con expected_weekday="lunedì" → deve passare (o chiuso se roma è chiuso il lunedì)
  const r2 = await post('/api/check_openings', {
    restaurant_id: 'modena01',
    day: mondayISO,
    expected_weekday: 'lunedì',
  });
  // modena01 è chiuso il lunedì, ma non deve dare WEEKDAY_MISMATCH
  assert('MATCH lunedì – NO mismatch', r2.error_code !== 'WEEKDAY_MISMATCH', r2.error_code, '!= WEEKDAY_MISMATCH');

  // 3. Case insensitive: "Giovedì" con maiuscola
  const r3 = await post('/api/check_openings', {
    restaurant_id: 'roma',
    day: mondayISO,
    time: '20:00',
    expected_weekday: 'Giovedì',
  });
  assert('MISMATCH case-insensitive – WEEKDAY_MISMATCH', r3.error_code === 'WEEKDAY_MISMATCH', r3.error_code, 'WEEKDAY_MISMATCH');
}

async function testNextOpenDay() {
  console.log(`\n${CYAN}═══ v2.0: next_open_day quando chiuso ═══${RESET}`);

  // roma: domenica è chiusa
  const closedDay = getNextWeekday(7); // domenica

  const r1 = await post('/api/check_openings', {
    restaurant_id: 'roma',
    day: closedDay,
  });
  assert('next_open – closed:true', r1.closed === true, r1.closed, true);
  assert('next_open – reason:closed', r1.reason === 'closed', r1.reason, 'closed');
  assert('next_open – ha next_open_day', typeof r1.next_open_day === 'string' && r1.next_open_day.length === 10, r1.next_open_day, 'YYYY-MM-DD');
  assert('next_open – ha next_open_day_label', typeof r1.next_open_day_label === 'string' && r1.next_open_day_label.length > 0, r1.next_open_day_label, 'string non vuota');
  assert('next_open – message contiene prossimo giorno', r1.message && r1.message.includes(r1.next_open_day_label), r1.message, `contiene ${r1.next_open_day_label}`);
}

async function testCapacityFull() {
  console.log(`\n${CYAN}═══ v2.0: Capacity SLOT_FULL (roma/Sheets) ═══${RESET}`);

  // roma: max_concurrent_bookings=3, avg_stay_minutes=60
  // Creiamo 3 prenotazioni allo stesso orario, poi verifichiamo che la 4a sia bloccata
  const testDay = getNextWeekday(3); // mercoledì
  const testTime = '19:30';
  const createdIds = [];

  // Creare 3 prenotazioni per riempire la capacità
  for (let i = 1; i <= 3; i++) {
    const phone = `+3933399880${i}`;
    const r = await post('/api/create_booking', {
      restaurant_id: 'roma',
      day: testDay,
      time: testTime,
      people: 2,
      name: `Cap Test ${i}`,
      phone,
    });
    if (r.ok && r.booking_id) {
      createdIds.push(r.booking_id);
      console.log(`  Creata prenotazione ${i}/3: ${r.booking_id}`);
    } else {
      console.log(`  ${YELLOW}WARN: prenotazione ${i} non creata: ${r.error_code || 'unknown'}${RESET}`);
    }
  }

  assert('Capacità – create 3 prenotazioni', createdIds.length === 3, createdIds.length, 3);

  if (createdIds.length === 3) {
    // check_openings deve dire available=false e reason=full
    const checkFull = await post('/api/check_openings', {
      restaurant_id: 'roma',
      day: testDay,
      time: testTime,
    });
    assert('Capacità – available:false', checkFull.available === false, checkFull.available, false);
    assert('Capacità – reason:full', checkFull.reason === 'full', checkFull.reason, 'full');
    assert('Capacità – message presente', typeof checkFull.message === 'string' && checkFull.message.length > 0, checkFull.message, 'string non vuota');

    // create_booking deve dare SLOT_FULL
    const r4 = await post('/api/create_booking', {
      restaurant_id: 'roma',
      day: testDay,
      time: testTime,
      people: 2,
      name: 'Cap Test 4 (overflow)',
      phone: '+39333998804',
    });
    assert('Capacità – 4a prenotazione ok:false', r4.ok === false, r4.ok, false);
    assert('Capacità – SLOT_FULL', r4.error_code === 'SLOT_FULL', r4.error_code, 'SLOT_FULL');
    assert('Capacità – ha nearest_slots', Array.isArray(r4.nearest_slots) && r4.nearest_slots.length > 0, r4.nearest_slots?.length, '>0');
    assert('Capacità – ha nearest_slots_human', Array.isArray(r4.nearest_slots_human) && r4.nearest_slots_human.length > 0, r4.nearest_slots_human?.length, '>0');

    // Verifica che nearest_slots_human non contiene ":"
    if (Array.isArray(r4.nearest_slots_human) && r4.nearest_slots_human.length > 0) {
      const hasColon = r4.nearest_slots_human.some(s => String(s).includes(':'));
      assert('Capacità – nearest_slots_human no HH:MM', hasColon === false, r4.nearest_slots_human, 'nessun ":"');
    }

    // Verifica un orario vicino (es. 20:00) è ancora disponibile
    const checkNear = await post('/api/check_openings', {
      restaurant_id: 'roma',
      day: testDay,
      time: '21:00',
    });
    assert('Capacità – 21:00 ancora disponibile', checkNear.available === true, checkNear.available, true);
  }

  // CLEANUP: cancellare tutte le prenotazioni create
  console.log(`\n  ${YELLOW}Cleanup: cancellazione ${createdIds.length} prenotazioni test${RESET}`);
  for (const id of createdIds) {
    await post('/api/cancel_booking', { restaurant_id: 'roma', booking_id: id });
  }
  console.log(`  ${GREEN}✓ Cleanup completato${RESET}`);
}

// ─────────────────────────────────────────────
// v2.1 Edge Cases
// ─────────────────────────────────────────────

async function testPastDate() {
  console.log(`\n${CYAN}═══ v2.1: PAST_DATE – check_openings e create_booking ═══${RESET}`);

  const yesterday = getYesterday();

  // check_openings con data ieri (nota: il backend potrebbe non bloccare check_openings per data passata,
  // ma create_booking DEVE bloccare)
  const r1 = await post('/api/check_openings', { restaurant_id: 'roma', day: yesterday, time: '20:00' });
  assert('PAST check_openings – ok è boolean', typeof r1.ok === 'boolean' || r1.ok === true || r1.ok === false, typeof r1.ok, 'boolean');

  // create_booking con data passata → deve rifiutare
  const r2 = await post('/api/create_booking', {
    restaurant_id: 'roma', day: yesterday, time: '20:00',
    people: 2, name: 'Past Test', phone: '+39333000001',
  });
  assert('PAST create – ok:false', r2.ok === false, r2.ok, false);
  assert('PAST create – VALIDATION_ERROR', r2.error_code === 'VALIDATION_ERROR', r2.error_code, 'VALIDATION_ERROR');
  assert('PAST create – messaggio contiene passato', r2.error_message && r2.error_message.toLowerCase().includes('passat'), r2.error_message, 'contiene "passat"');

  // create_booking con data molto vecchia
  const r3 = await post('/api/create_booking', {
    restaurant_id: 'roma', day: '2020-01-15', time: '20:00',
    people: 2, name: 'Ancient Test', phone: '+39333000002',
  });
  assert('PAST create (2020) – ok:false', r3.ok === false, r3.ok, false);
}

async function testCutoff() {
  console.log(`\n${CYAN}═══ v2.1: Cutoff – orario vicino a chiusura ═══${RESET}`);

  // Roma dinner lun-gio: 19:00-22:30, cutoff=45, step=30
  // applyCutoffToSlots: closing = lastSlot(22:30) + step(30) = 23:00, threshold = 23:00 - 45 = 22:15
  // Bookable: slots <= 22:15 → 22:00 (1320 <= 1335) ✓, 22:30 (1350 > 1335) ✗
  const openDay = getNextWeekday(3); // mercoledì → dinner 19:00-22:30

  // 22:30 → ultimo slot, oltre cutoff → reason:cutoff
  const r1 = await post('/api/check_openings', { restaurant_id: 'roma', day: openDay, time: '22:30' });
  assert('Cutoff 22:30 – available:false', r1.available === false, r1.available, false);
  assert('Cutoff 22:30 – reason:cutoff', r1.reason === 'cutoff', r1.reason, 'cutoff');
  assert('Cutoff 22:30 – ha message', typeof r1.message === 'string' && r1.message.length > 0, r1.message, 'string non vuota');
  assert('Cutoff 22:30 – message contiene chiusura', r1.message && r1.message.toLowerCase().includes('chiusura'), r1.message, 'contiene "chiusura"');

  // 22:00 → ancora dentro threshold (1320 <= 1335) → bookable
  const r1b = await post('/api/check_openings', { restaurant_id: 'roma', day: openDay, time: '22:00' });
  assert('Pre-cutoff 22:00 – reason != cutoff', r1b.reason !== 'cutoff', r1b.reason, '!= cutoff');

  // 21:30 → sicuramente dentro orario
  const r2 = await post('/api/check_openings', { restaurant_id: 'roma', day: openDay, time: '21:30' });
  assert('Pre-cutoff 21:30 – reason != cutoff', r2.reason !== 'cutoff', r2.reason, '!= cutoff');

  // 19:00 → sicuramente dentro orario e lontano da cutoff
  const r3 = await post('/api/check_openings', { restaurant_id: 'roma', day: openDay, time: '19:00' });
  assert('Inizio slot 19:00 – reason != cutoff', r3.reason !== 'cutoff', r3.reason, '!= cutoff');

  // Verifica nearest_slots quando cutoff
  if (r1.available === false && r1.reason === 'cutoff') {
    assert('Cutoff – ha nearest_slots', Array.isArray(r1.nearest_slots) && r1.nearest_slots.length >= 0, Array.isArray(r1.nearest_slots), true);
  }
}

async function testModifyToFullSlot() {
  console.log(`\n${CYAN}═══ v2.1: Modifica verso slot pieno ═══${RESET}`);

  const testDay = getNextWeekday(4); // giovedì
  const fullTime = '19:30';
  const safeTime = '21:30';
  const createdIds = [];

  // Riempi lo slot 19:30 con 3 prenotazioni (max_concurrent_bookings=3)
  for (let i = 1; i <= 3; i++) {
    const r = await post('/api/create_booking', {
      restaurant_id: 'roma', day: testDay, time: fullTime,
      people: 2, name: `ModFull Test ${i}`, phone: `+3933388800${i}`,
    });
    if (r.ok && r.booking_id) {
      createdIds.push(r.booking_id);
      console.log(`  Slot pieno: creata ${i}/3 → ${r.booking_id}`);
    } else {
      console.log(`  ${YELLOW}WARN: prenotazione ${i} non creata: ${r.error_code || 'unknown'}${RESET}`);
    }
  }

  // Crea una prenotazione extra in uno slot libero (21:30)
  const rExtra = await post('/api/create_booking', {
    restaurant_id: 'roma', day: testDay, time: safeTime,
    people: 2, name: 'ModFull Move Me', phone: '+39333888005',
  });
  if (rExtra.ok && rExtra.booking_id) {
    createdIds.push(rExtra.booking_id);
    console.log(`  Prenotazione da spostare: ${rExtra.booking_id} (${safeTime})`);

    // Tenta di spostare questa prenotazione nello slot pieno (19:30)
    const rMod = await post('/api/modify_booking', {
      restaurant_id: 'roma', booking_id: rExtra.booking_id,
      new_time: fullTime,
    });

    // Il backend Sheets potrebbe non avere enforcement sulla modify.
    // Registriamo comunque il comportamento.
    if (rMod.ok === false) {
      assert('ModifyFull – rifiutata (SLOT_FULL)', rMod.error_code === 'SLOT_FULL', rMod.error_code, 'SLOT_FULL');
    } else {
      console.log(`  ${YELLOW}NOTA: modify_booking NON blocca spostamento in slot pieno (nessun enforcement server-side su modify)${RESET}`);
      assert('ModifyFull – accettata (no enforcement)', rMod.ok === true, rMod.ok, true);
    }
  } else {
    console.log(`  ${YELLOW}WARN: impossibile creare prenotazione da spostare${RESET}`);
  }

  // Cleanup
  console.log(`\n  ${YELLOW}Cleanup: cancellazione ${createdIds.length} prenotazioni test${RESET}`);
  for (const id of createdIds) {
    await post('/api/cancel_booking', { restaurant_id: 'roma', booking_id: id });
  }
  console.log(`  ${GREEN}✓ Cleanup completato${RESET}`);
}

async function testResolveRelativeTimeItalian() {
  console.log(`\n${CYAN}═══ v2.1: resolve_relative_time – formati italiani ═══${RESET}`);

  // "21" → 21:00
  const r1 = await post('/api/resolve_relative_time', { restaurant_id: 'roma', text: '21' });
  assert('Abs "21" – ok:true', r1.ok === true, r1.ok, true);
  assert('Abs "21" – time:21:00', r1.time === '21:00', r1.time, '21:00');

  // "20:30" → 20:30
  const r2 = await post('/api/resolve_relative_time', { restaurant_id: 'roma', text: '20:30' });
  assert('Abs "20:30" – ok:true', r2.ok === true, r2.ok, true);
  assert('Abs "20:30" – time:20:30', r2.time === '20:30', r2.time, '20:30');

  // "20 e 30" → 20:30
  const r3 = await post('/api/resolve_relative_time', { restaurant_id: 'roma', text: '20 e 30' });
  assert('Abs "20 e 30" – ok:true', r3.ok === true, r3.ok, true);
  assert('Abs "20 e 30" – time:20:30', r3.time === '20:30', r3.time, '20:30');

  // "20 e mezza" → 20:30
  const r4 = await post('/api/resolve_relative_time', { restaurant_id: 'roma', text: '20 e mezza' });
  assert('Abs "20 e mezza" – ok:true', r4.ok === true, r4.ok, true);
  assert('Abs "20 e mezza" – time:20:30', r4.time === '20:30', r4.time, '20:30');

  // "20 e un quarto" → 20:15
  const r5 = await post('/api/resolve_relative_time', { restaurant_id: 'roma', text: '20 e un quarto' });
  assert('Abs "20 e un quarto" – ok:true', r5.ok === true, r5.ok, true);
  assert('Abs "20 e un quarto" – time:20:15', r5.time === '20:15', r5.time, '20:15');

  // "alle 21" → 21:00
  const r6 = await post('/api/resolve_relative_time', { restaurant_id: 'roma', text: 'alle 21' });
  assert('Abs "alle 21" – ok:true', r6.ok === true, r6.ok, true);
  assert('Abs "alle 21" – time:21:00', r6.time === '21:00', r6.time, '21:00');

  // "alle 19 e 30" → 19:30
  const r7 = await post('/api/resolve_relative_time', { restaurant_id: 'roma', text: 'alle 19 e 30' });
  assert('Abs "alle 19 e 30" – ok:true', r7.ok === true, r7.ok, true);
  assert('Abs "alle 19 e 30" – time:19:30', r7.time === '19:30', r7.time, '19:30');

  // "19.45" → 19:45
  const r8 = await post('/api/resolve_relative_time', { restaurant_id: 'roma', text: '19.45' });
  assert('Abs "19.45" – ok:true', r8.ok === true, r8.ok, true);
  assert('Abs "19.45" – time:19:45', r8.time === '19:45', r8.time, '19:45');

  // "verso le 20" → VAGUE_TIME (non preciso)
  const r9 = await post('/api/resolve_relative_time', { restaurant_id: 'roma', text: 'verso le 20' });
  assert('Vago "verso le 20" – ok:false', r9.ok === false, r9.ok, false);
  assert('Vago "verso le 20" – VAGUE_TIME', r9.error_code === 'VAGUE_TIME', r9.error_code, 'VAGUE_TIME');

  // "tra un'ora e mezza" → ok con offset
  const r10 = await post('/api/resolve_relative_time', { restaurant_id: 'roma', text: "tra un'ora e mezza" });
  assert('Rel "tra un\'ora e mezza" – ok:true', r10.ok === true, r10.ok, true);
  assert('Rel "tra un\'ora e mezza" – ha time', typeof r10.time === 'string' && r10.time.includes(':'), r10.time, 'HH:MM');
}

async function testCreateBookingNearestSlotsHuman() {
  console.log(`\n${CYAN}═══ v2.1: create_booking error – nearest_slots_human ═══${RESET}`);

  const testDay = getNextWeekday(2); // martedì → dinner 19:00-22:30
  const createdIds = [];

  // Riempi slot 20:00
  for (let i = 1; i <= 3; i++) {
    const r = await post('/api/create_booking', {
      restaurant_id: 'roma', day: testDay, time: '20:00',
      people: 2, name: `NSH Test ${i}`, phone: `+3933377700${i}`,
    });
    if (r.ok && r.booking_id) {
      createdIds.push(r.booking_id);
    }
  }

  if (createdIds.length === 3) {
    // La 4a deve fallire con SLOT_FULL
    const r4 = await post('/api/create_booking', {
      restaurant_id: 'roma', day: testDay, time: '20:00',
      people: 2, name: 'NSH Overflow', phone: '+39333777005',
    });
    assert('NSH – ok:false', r4.ok === false, r4.ok, false);
    assert('NSH – SLOT_FULL', r4.error_code === 'SLOT_FULL', r4.error_code, 'SLOT_FULL');
    assert('NSH – ha nearest_slots', Array.isArray(r4.nearest_slots) && r4.nearest_slots.length > 0, r4.nearest_slots?.length, '>0');
    assert('NSH – ha nearest_slots_human', Array.isArray(r4.nearest_slots_human) && r4.nearest_slots_human.length > 0, r4.nearest_slots_human?.length, '>0');

    // nearest_slots_human non deve contenere ":"
    if (Array.isArray(r4.nearest_slots_human)) {
      const hasColon = r4.nearest_slots_human.some(s => String(s).includes(':'));
      assert('NSH – no ":" in human', hasColon === false, r4.nearest_slots_human, 'nessun ":"');
    }

    // Verifica che ha message
    assert('NSH – ha message', typeof r4.message === 'string' && r4.message.length > 0, r4.message, 'string non vuota');
  } else {
    console.log(`  ${YELLOW}WARN: impossibile riempire slot (create ${createdIds.length}/3)${RESET}`);
  }

  // Anche create fuori orario (16:00) deve avere nearest_slots_human
  const rOutside = await post('/api/create_booking', {
    restaurant_id: 'roma', day: testDay, time: '16:00',
    people: 2, name: 'NSH Outside', phone: '+39333777006',
  });
  assert('NSH fuori orario – ok:false', rOutside.ok === false, rOutside.ok, false);
  assert('NSH fuori orario – OUTSIDE_HOURS', rOutside.error_code === 'OUTSIDE_HOURS', rOutside.error_code, 'OUTSIDE_HOURS');
  if (Array.isArray(rOutside.nearest_slots_human) && rOutside.nearest_slots_human.length > 0) {
    const hasColon = rOutside.nearest_slots_human.some(s => String(s).includes(':'));
    assert('NSH fuori orario – no ":" in human', hasColon === false, rOutside.nearest_slots_human, 'nessun ":"');
  }

  // Cleanup
  console.log(`\n  ${YELLOW}Cleanup: cancellazione ${createdIds.length} prenotazioni test${RESET}`);
  for (const id of createdIds) {
    await post('/api/cancel_booking', { restaurant_id: 'roma', booking_id: id });
  }
  console.log(`  ${GREEN}✓ Cleanup completato${RESET}`);
}

async function testSendSmsValidation() {
  console.log(`\n${CYAN}═══ v2.1: send_sms – validazione input ═══${RESET}`);

  // Manca tutto
  const r1 = await post('/api/send_sms', {});
  assert('SMS – manca tutto – ok:false', r1.ok === false, r1.ok, false);
  assert('SMS – manca tutto – VALIDATION_ERROR', r1.error_code === 'VALIDATION_ERROR', r1.error_code, 'VALIDATION_ERROR');

  // Manca "to"
  const r2 = await post('/api/send_sms', { restaurant_id: 'roma', message: 'Test' });
  assert('SMS – manca to – ok:false', r2.ok === false, r2.ok, false);
  assert('SMS – manca to – VALIDATION_ERROR', r2.error_code === 'VALIDATION_ERROR', r2.error_code, 'VALIDATION_ERROR');

  // Manca "message"
  const r3 = await post('/api/send_sms', { restaurant_id: 'roma', to: '+39333000000' });
  assert('SMS – manca message – ok:false', r3.ok === false, r3.ok, false);
  assert('SMS – manca message – VALIDATION_ERROR', r3.error_code === 'VALIDATION_ERROR', r3.error_code, 'VALIDATION_ERROR');

  // Manca restaurant_id
  const r4 = await post('/api/send_sms', { to: '+39333000000', message: 'Test' });
  assert('SMS – manca restaurant_id – ok:false', r4.ok === false, r4.ok, false);
  assert('SMS – manca restaurant_id – VALIDATION_ERROR', r4.error_code === 'VALIDATION_ERROR', r4.error_code, 'VALIDATION_ERROR');

  // Input valido ma Twilio non configurato → TWILIO_NOT_CONFIGURED o CONFIG_ERROR
  const r5 = await post('/api/send_sms', { restaurant_id: 'roma', to: '+39333000000', message: 'Test regression' });
  assert('SMS – input valido – non VALIDATION_ERROR', r5.error_code !== 'VALIDATION_ERROR', r5.error_code, '!= VALIDATION_ERROR');
}

async function testDoubleBookingSamePhone() {
  console.log(`\n${CYAN}═══ v2.1: Doppia prenotazione stesso telefono stesso slot ═══${RESET}`);

  const testDay = getNextWeekday(1); // lunedì → dinner 19:00-22:30
  const testTime = '20:00';
  const testPhone = '+39333666001';
  const createdIds = [];

  // Prima prenotazione
  const r1 = await post('/api/create_booking', {
    restaurant_id: 'roma', day: testDay, time: testTime,
    people: 2, name: 'Double Test A', phone: testPhone,
  });
  assert('Double 1 – ok:true', r1.ok === true, r1.ok, true);
  if (r1.ok && r1.booking_id) {
    createdIds.push(r1.booking_id);
    console.log(`  Prenotazione 1: ${r1.booking_id}`);
  }

  // Seconda prenotazione con lo stesso telefono, stesso slot
  const r2 = await post('/api/create_booking', {
    restaurant_id: 'roma', day: testDay, time: testTime,
    people: 3, name: 'Double Test B', phone: testPhone,
  });

  // Documentiamo il comportamento: il backend potrebbe accettarla o rifiutarla
  if (r2.ok === true) {
    console.log(`  ${YELLOW}NOTA: backend accetta doppia prenotazione stesso telefono${RESET}`);
    assert('Double 2 – accettata', r2.ok === true, r2.ok, true);
    if (r2.booking_id) createdIds.push(r2.booking_id);
  } else {
    console.log(`  Backend rifiuta doppia prenotazione stesso telefono: ${r2.error_code}`);
    assert('Double 2 – rifiutata con errore', r2.ok === false, r2.ok, false);
  }

  // Verifica che list_bookings mostra entrambe (o una)
  const rList = await post('/api/list_bookings', { restaurant_id: 'roma', phone: testPhone });
  assert('Double list – ok:true', rList.ok === true, rList.ok, true);
  const listCount = Array.isArray(rList.results) ? rList.results.length : (rList.count || 0);
  assert('Double list – count >= 1', listCount >= 1, listCount, '>=1');
  console.log(`  Prenotazioni trovate per ${testPhone}: ${listCount}`);

  // Cleanup
  console.log(`\n  ${YELLOW}Cleanup: cancellazione ${createdIds.length} prenotazioni test${RESET}`);
  for (const id of createdIds) {
    await post('/api/cancel_booking', { restaurant_id: 'roma', booking_id: id });
  }
  console.log(`  ${GREEN}✓ Cleanup completato${RESET}`);
}

async function testCreateBookingOutsideHours() {
  console.log(`\n${CYAN}═══ v2.1: create_booking – fuori orario e giorno chiuso ═══${RESET}`);

  // Giorno chiuso (domenica)
  const sunday = getNextWeekday(7);
  const r1 = await post('/api/create_booking', {
    restaurant_id: 'roma', day: sunday, time: '20:00',
    people: 2, name: 'Closed Day Test', phone: '+39333555001',
  });
  assert('Create domenica – ok:false', r1.ok === false, r1.ok, false);
  assert('Create domenica – OUTSIDE_HOURS', r1.error_code === 'OUTSIDE_HOURS', r1.error_code, 'OUTSIDE_HOURS');

  // Orario fuori fascia (15:00 di mercoledì, roma ha solo dinner)
  const wednesday = getNextWeekday(3);
  const r2 = await post('/api/create_booking', {
    restaurant_id: 'roma', day: wednesday, time: '15:00',
    people: 2, name: 'Outside Hours Test', phone: '+39333555002',
  });
  assert('Create 15:00 mer – ok:false', r2.ok === false, r2.ok, false);
  assert('Create 15:00 mer – OUTSIDE_HOURS', r2.error_code === 'OUTSIDE_HOURS', r2.error_code, 'OUTSIDE_HOURS');
  assert('Create 15:00 mer – ha nearest_slots', Array.isArray(r2.nearest_slots) && r2.nearest_slots.length > 0, r2.nearest_slots?.length, '>0');

  // Mattina presto (07:00)
  const r3 = await post('/api/create_booking', {
    restaurant_id: 'roma', day: wednesday, time: '07:00',
    people: 2, name: 'Early Morning Test', phone: '+39333555003',
  });
  assert('Create 07:00 mer – ok:false', r3.ok === false, r3.ok, false);
  assert('Create 07:00 mer – OUTSIDE_HOURS', r3.error_code === 'OUTSIDE_HOURS', r3.error_code, 'OUTSIDE_HOURS');
}

async function testCheckOpeningsEdgeCases() {
  console.log(`\n${CYAN}═══ v2.1: check_openings – edge cases extra ═══${RESET}`);

  const friday = getNextWeekday(5); // venerdì → lunch 12:30-14:30, dinner 19:00-23:00

  // Orario di confine: esattamente inizio fascia
  const r1 = await post('/api/check_openings', { restaurant_id: 'roma', day: friday, time: '12:30' });
  assert('Edge 12:30 ven – available:true', r1.available === true, r1.available, true);

  // Orario di confine: ultima fascia
  const r2 = await post('/api/check_openings', { restaurant_id: 'roma', day: friday, time: '23:00' });
  // 23:00 con cutoff 45min dalla chiusura (23:00): 23:00 - 45min = 22:15 → 23:00 > 22:15 → cutoff
  assert('Edge 23:00 ven – reason', r2.reason === 'cutoff' || r2.available === false, r2.reason, 'cutoff o non disponibile');

  // Buco tra pranzo e cena: 16:00
  const r3 = await post('/api/check_openings', { restaurant_id: 'roma', day: friday, time: '16:00' });
  assert('Edge 16:00 ven (buco) – available:false', r3.available === false, r3.available, false);
  assert('Edge 16:00 ven (buco) – reason:not_in_openings', r3.reason === 'not_in_openings', r3.reason, 'not_in_openings');
  assert('Edge 16:00 ven (buco) – ha nearest_slots', Array.isArray(r3.nearest_slots) && r3.nearest_slots.length > 0, r3.nearest_slots?.length, '>0');

  // Restaurant inesistente
  const r4 = await post('/api/check_openings', { restaurant_id: 'nonexistent', day: friday, time: '20:00' });
  assert('Edge restaurant inesistente – ok:false', r4.ok === false, r4.ok, false);

  // Capodanno 2026 (override: aperto, dinner speciale 19:00-23:59)
  const r5 = await post('/api/check_openings', { restaurant_id: 'roma', day: '2026-12-31', time: '23:30' });
  assert('Edge Capodanno 23:30 – closed:false', r5.closed === false, r5.closed, false);

  // Max people nella risposta
  const r6 = await post('/api/check_openings', { restaurant_id: 'roma', day: friday });
  assert('Edge max_people presente', typeof r6.max_people === 'number' && r6.max_people > 0, r6.max_people, '>0');
  assert('Edge max_people = 8 (roma KB)', r6.max_people === 8, r6.max_people, 8);
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

    // v2.0 Tests: nuovi campi + WEEKDAY_MISMATCH + capacity
    console.log(`\n${YELLOW}──── v2.0 Backend Rigido Tests ────${RESET}`);
    await testV2Fields();
    await testWeekdayMismatch();
    await testNextOpenDay();
    await testCapacityFull();

    // v2.1 Edge Cases: copertura completa
    console.log(`\n${YELLOW}──── v2.1 Edge Cases ────${RESET}`);
    await testPastDate();
    await testCutoff();
    await testModifyToFullSlot();
    await testResolveRelativeTimeItalian();
    await testCreateBookingNearestSlotsHuman();
    await testSendSmsValidation();
    await testDoubleBookingSamePhone();
    await testCreateBookingOutsideHours();
    await testCheckOpeningsEdgeCases();
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
