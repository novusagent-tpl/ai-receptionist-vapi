# Messaggio per nuova chat — Copia tutto qui sotto

---
Ciao, questa è al nuova chat di continuo del progetto visto che la vecchia chat e diventata troppo lunga e perdevi il context e alcuni dettagli sulla struttura del progetto.

Leggi attentamente questi file per allinearti al 100% al progetto:

1. `docs/CONTEXT.txt` — la bibbia del progetto, leggilo TUTTO
2. `docs/TOOLS-CONTRACT.md` — contratti API di ogni tool
3. `docs/ROADMAP-SAAS.md` — roadmap completa
4. `prompts/System-Prompt-ReceptionistV2.md` — prompt attivo Roma v2.1
5. `prompts/System-Prompt-Receptionist_modena01.md` — prompt attivo Modena01 v2.1
6. `prompts/System-Prompt-Receptionist_octodemo.md` — prompt attivo OctoDemo v2.1
7. `prompts/SYSTEM-PROMPT-base-18_02.md` — prompt base (NON TOCCARE MAI)
8. `kb/roma.json` — Knowledge Base Roma
9. `kb/modena01.json` — Knowledge Base Modena01
10. `src/config/ristoranti.json` — configurazione ristoranti
11. `docs/Test_Attivazione/test_vapi_roma_sheets_v2.md` — tutti i test Vapi Roma con esiti (scorri fino alla sezione "TEST V2.0" e alla tabella "Riepilogo Test V2.0")
12. `src/api/list_bookings.js` — appena fixato con formatTimeHuman

## Regole del progetto (IMPORTANTI)

- **NON usiamo git per il deploy**. Tutto è in locale. Quando è pronto facciamo upload manuale su Render e aggiorniamo i prompt manualmente su Vapi.
- **NON toccare MAI il file base** `prompts/SYSTEM-PROMPT-base-18_02.md`
- I prompt attivi sono SOLO nella cartella `prompts/` (NON in `docs/`)
- Il file `docs/System-Prompt-Receptionist.md` è il vecchio prompt v1 — NON toccarlo, non è più usato
- I prompt su Vapi si aggiornano manualmente copiando il contenuto dei file dalla cartella `prompts/`
- Il backend si deploya facendo upload manuale su Render
- Il backend è la FONTE DI VERITÀ. L'AI non decide nulla, il backend decide tutto.
- Ogni modifica ai prompt deve essere applicata a TUTTI E 3 i ristoranti (roma, modena01, octodemo) — mai solo uno

## Cosa abbiamo appena fatto (sessione corrente)

### Test Vapi V2.0 completati (15 test su Roma)
Abbiamo eseguito 15 test vocali Vapi con il prompt v2.0 e backend v2.1 (230 regression test). Risultati:
- **12 PASS** (puliti o con difetti minori)
- **2 PASS con difetti importanti** (Test 4 RG2 e Test 13 RH3)
- **1 PARZIALE** (Test 5 RH2 — disrupted da DUPLICATE_BOOKING)

### Problemi identificati dai test e fix applicati (v2.1)

**Problema 1 — list_bookings message usava HH:MM con i due punti**
- Test 9 (RC1): TTS diceva "ventuno:trenta" invece di "ventuno e trenta"
- Fix: `src/api/list_bookings.js` — aggiunto `formatTimeHuman`, il campo `message` ora usa formato parlato ("21 e 30"), ogni booking include `time_human`

**Problema 2 — endCall non si attivava dopo saluto del cliente**
- Test 2 (RB5) e Test 12 (RE1): dopo che l'AI salutava e il cliente diceva "Ciao", l'AI rispondeva "Come posso aiutarla?" invece di chiamare endCall
- Fix: tutti e 3 i prompt v2.1 — regola endCall rinforzata con caso "doppio ciao"

**Problema 3 — Persone perse durante negoziazione slot**
- Test 13 (RH3): il cliente aveva detto "per 2 persone" ma la prenotazione è stata creata per 1
- Fix: tutti e 3 i prompt v2.1 — regola CONSERVAZIONE DATI

**Problema 4 — AI riformulava gli orari dal message**
- Test 4 (RG2): backend mandava "12 e 30" nel message, AI diceva "12.30"
- Test 13 (RH3): backend mandava nearest_slots_human ["14","13 e 30"], AI diceva "13:30" → TTS "1000 point tre-zero"
- Fix: tutti e 3 i prompt v2.1 — regole REGOLA MESSAGE e REGOLA TIME_HUMAN rinforzate

**Problema 5 — WEEKDAY_MISMATCH frequente (non critico)**
- Test 2 e 8: l'AI mandava date sbagliate (es. lunedì invece di giovedì) ma il backend correggeva automaticamente
- Nessun fix necessario, il backend gestisce già

### Stato dei file modificati (da uploadare)
- `src/api/list_bookings.js` — **DA UPLOADARE SU RENDER**
- `prompts/System-Prompt-ReceptionistV2.md` — **DA COPIARE SU VAPI** (roma)
- `prompts/System-Prompt-Receptionist_modena01.md` — **DA COPIARE SU VAPI** (modena01)
- `prompts/System-Prompt-Receptionist_octodemo.md` — **DA COPIARE SU VAPI** (octodemo)
- `docs/Test_Attivazione/test_vapi_roma_sheets_v2.md` — tabella esiti compilata (solo locale)

### Cose da fare (prossimi passi)
1. **Upload `list_bookings.js` su Render** e aggiornare i 3 prompt su Vapi con v2.1
2. **Ri-testare i test critici** (4, 5, 9, 12, 13) dopo i fix v2.1
3. **Aggiornare `docs/CONTEXT.txt`** con lo stato v2.1 e i risultati dei test
4. **Test rapidi Modena01** (resOS) — 5-6 test chiave
5. **Test rapidi OctoDemo** (OctoTable) — 5-6 test chiave
6. **App gestionale staff** — descrizione per Lovable già preparata (app web multi-ristorante per gestire prenotazioni su Google Sheets)

### Nota sulla voce 11Labs
L'utente usa una voce multilingua su 11Labs (non solo italiana). Questo causa a volte che orari come "20.30" vengano letti in inglese ("twenty point three zero"). Il fix backend (time_human "20 e 30") mitiga questo ma non lo elimina al 100% — dipende anche dalla voce. L'utente potrebbe dover cambiare voce su 11Labs a una solo italiana.

## PRIMA DI TUTTO — Verifica fix della sessione precedente

Prima di procedere con qualsiasi cosa, devi verificare che i fix applicati nella sessione precedente siano corretti. Controlla questi file uno per uno:

1. **`src/api/list_bookings.js`** — Verifica che:
   - La funzione `formatTimeHuman` sia presente e corretta (converte "21:30" → "21 e 30", "20:00" → "20")
   - Ogni booking nel risultato abbia `time_human` popolato
   - Il campo `message` usi `formatTimeHuman` (es. "alle 21 e 30") e NON il formato raw "21:30"
   - Il codice sia coerente con gli altri file che usano `formatTimeHuman` (controlla `src/api/create_booking.js` e `src/api/check_openings.js` per confronto)

2. **`prompts/System-Prompt-ReceptionistV2.md`** (roma v2.1) — Verifica che:
   - Nella sezione "Chiusura conversazione" ci sia la regola rinforzata su endCall con il caso "doppio ciao" (il cliente dice ciao DOPO che l'AI ha già salutato → NON rispondere "Come posso aiutarla?" → endCall immediato)
   - Nella sezione "Divieti assoluti" ci sia la regola CONSERVAZIONE DATI (non perdere persone/nome durante negoziazione slot)
   - Nella sezione "Date e orari in voce" ci siano le regole REGOLA MESSAGE e REGOLA TIME_HUMAN (usare il testo del message così com'è, usare time_human per gli orari)
   - Il changelog includa v2.1 con data 2026-02-19
   - Le regole siano posizionate nel punto giusto e non rompano la struttura del prompt

3. **`prompts/System-Prompt-Receptionist_modena01.md`** e **`prompts/System-Prompt-Receptionist_octodemo.md`** — Verifica che abbiano le STESSE IDENTICHE regole aggiunte al prompt roma, nelle stesse posizioni. L'unica differenza tra i 3 prompt deve essere: restaurant_id, nome receptionist, transfer tool, is_open_now restaurant_id.

4. **`docs/Test_Attivazione/test_vapi_roma_sheets_v2.md`** — Verifica che la tabella "Riepilogo Test V2.0" sia compilata con gli esiti corretti e che i "Fix applicati dopo V2.0" elencati corrispondano a quello che è stato effettivamente fatto nei file.

5. **`docs/System-Prompt-Receptionist.md`** — Verifica che questo file NON sia stato modificato (deve essere identico allo stato originale, nessun fix v2.1 qui dentro — i fix vanno solo nella cartella `prompts/`).

Se trovi errori o incongruenze in uno qualsiasi di questi file, correggili PRIMA di procedere con upload e test. Poi dimmi cosa hai trovato.

---
