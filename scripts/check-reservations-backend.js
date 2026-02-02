/**
 * Verifica quale backend prenotazioni viene usato per ogni ristorante.
 * Esegui dalla root del progetto: node scripts/check-reservations-backend.js
 *
 * 1. Stampa il backend scelto per ogni ristorante (resos | octotable | sheets).
 * 2. Chiama listReservationsByDay per ogni ristorante con una data di test:
 *    - modena01 → resOS (potrebbe dare errore API se credenziali/venue non ok)
 *    - roma → Google Sheets (potrebbe dare errore Google se credenziali non ok)
 * Così si vede che il dispatcher instrada davvero a backend diversi.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const ristoranti = require('../src/config/ristoranti.json');
const reservations = require('../src/reservations');

const dayTest = '2025-01-30';

console.log('--- Backend prenotazioni per ristorante (da config + .env) ---\n');

for (const restaurantId of Object.keys(ristoranti)) {
  const backend = reservations.getReservationsBackend(restaurantId);
  const name = ristoranti[restaurantId].name || restaurantId;
  console.log(`  ${restaurantId} (${name}) → ${backend}`);
}

console.log('\n--- Chiamata listReservationsByDay(restaurantId, "' + dayTest + '") ---\n');

(async () => {
  for (const restaurantId of Object.keys(ristoranti)) {
    const backend = reservations.getReservationsBackend(restaurantId);
    const name = ristoranti[restaurantId].name || restaurantId;
    process.stdout.write(`  ${restaurantId} (${backend}): `);
    try {
      const result = await reservations.listReservationsByDay(restaurantId, dayTest);
      if (result.ok) {
        console.log(`ok, ${result.results.length} prenotazioni`);
      } else {
        console.log(`errore: ${result.error_code} - ${result.error_message}`);
      }
    } catch (err) {
      console.log(`eccezione: ${err.message}`);
    }
  }
  console.log('\nFine.');
})();
