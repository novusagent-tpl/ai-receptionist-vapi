// Quick check Jaccard for test cases (run: node scripts/faq-jaccard-check.js)
function normalize(str) {
  if (typeof str !== 'string') return '';
  let s = str.trim().toLowerCase().replace(/[\p{P}\p{S}]/gu, ' ').replace(/\s+/g, ' ').trim();
  const accented = 'àáâãäåèéêëìíîïòóôõöùúûüçñ';
  const plain = 'aaaaaaeeeeiiiiooooouuuucn';
  for (let i = 0; i < accented.length; i++) s = s.replace(new RegExp(accented[i], 'g'), plain[i]);
  return s;
}
function tokenize(str) {
  const n = normalize(str);
  return n ? n.split(/\s+/).filter(Boolean) : [];
}
function jaccard(a, b) {
  const at = tokenize(a), bt = tokenize(b);
  if (!at.length && !bt.length) return 0;
  const setB = new Set(bt);
  const inter = at.filter(t => setB.has(t)).length;
  const union = new Set([...at, ...bt]).size;
  return union === 0 ? 0 : inter / union;
}
const THRESHOLD = 0.6;
const cases = [
  ['Avete parcheggio?', 'Avete parcheggio?'],
  ['Si accettano animali?', 'I Animali sono amessi?'],
  ['Avete opzioni senza glutine?', 'Avete opzioni senza glutine?'],
  ["C'è qualcosa senza glutine?", 'Avete opzioni senza glutine?'],
  ['Avete torte?', '(nessuna)']
];
cases.forEach(([q, eq], i) => {
  const j = eq === '(nessuna)' ? 0 : jaccard(q, eq);
  const ok = eq === '(nessuna)' ? j < THRESHOLD : j >= THRESHOLD || q.trim().toLowerCase() === eq.trim().toLowerCase();
  console.log(`TC${i + 1} "${q}" vs "${eq}" → Jaccard=${j.toFixed(3)} ${ok ? 'ok' : '?'}`);
});
