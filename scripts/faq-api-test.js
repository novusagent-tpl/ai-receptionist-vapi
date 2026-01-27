/**
 * Test FAQ API (POST /api/faq).
 * Prerequisito: server avviato (es. node src/server-vapi.js).
 * Uso: node scripts/faq-api-test.js [baseUrl]
 * Default baseUrl: http://localhost:3000
 */

const BASE = process.argv[2] || 'http://localhost:3000';
const RESTAURANT_ID = 'modena01';

const CASES = [
  { question: 'Avete parcheggio?', expectMatch: 'Avete parcheggio?' },
  { question: 'Avete opzioni senza glutine?', expectMatch: 'Avete opzioni senza glutine?' },
  { question: 'Avete piatti senza glutine?', expectMatch: 'Avete opzioni senza glutine?' },
  { question: 'Avete un parcheggio?', expectMatch: 'Avete parcheggio?' },
  { question: 'Avete torte?', expectMatch: null }
];

async function run() {
  console.log('FAQ API test – base:', BASE, 'restaurant_id:', RESTAURANT_ID);
  console.log('---');
  let ok = 0;
  let fail = 0;
  for (const tc of CASES) {
    const res = await fetch(`${BASE}/api/faq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurant_id: RESTAURANT_ID, question: tc.question })
    });
    const data = await res.json().catch(() => ({}));
    const answer = data.answer ?? null;
    const hasAnswer = !!answer;
    const pass = tc.expectMatch === null ? !hasAnswer : (hasAnswer && data.source === 'kb');
    if (pass) {
      ok++;
      console.log(`OK  "${tc.question}" → answer=${hasAnswer ? '…' : 'null'}`);
    } else {
      fail++;
      console.log(`FAIL "${tc.question}" → expected match "${tc.expectMatch}", got answer=${hasAnswer ? '…' : 'null'}`);
    }
  }
  console.log('---');
  console.log(`Risultato: ${ok}/${CASES.length} passati${fail ? `, ${fail} falliti` : ''}`);
  process.exit(fail ? 1 : 0);
}

run().catch((e) => {
  console.error('Errore:', e.message);
  if (e.code === 'ECONNREFUSED') {
    console.error('Avvia prima il server: node src/server-vapi.js');
  }
  process.exit(1);
});
