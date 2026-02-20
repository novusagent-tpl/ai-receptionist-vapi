# Checklist Onboarding Nuovo Ristorante – AI Receptionist VAPI

> Per la guida completa passo-passo vedi: `onboarding/ONBOARDING-RESTAURANT.md`

## 1. Dati ristorante
- [ ] Nome, indirizzo, telefono
- [ ] Orari apertura (pranzo/cena per ogni giorno)
- [ ] Giorni chiusura + chiusure straordinarie
- [ ] Max persone per prenotazione
- [ ] Capacità contemporanea + durata media permanenza + cutoff
- [ ] FAQ confermate con il ristorante
- [ ] Backend scelto (resOS / OctoTable / Sheets)
- [ ] Credenziali API (se gestionale)

## 2. Backend
- [ ] Creato `kb/<restaurant_id>.json` (da template)
- [ ] Creato `kb/<restaurant_id>-faq-vapi.md`
- [ ] Aggiornato `src/config/ristoranti.json`
- [ ] Se Sheets: creato Sheet + Calendar + condiviso con Service Account
- [ ] Se resOS: aggiunto `resos_api_key_env` + chiave in `.env` + Render Env Vars
- [ ] Se OctoTable: aggiunto `octotable_client_id_env` e `octotable_client_secret_env` + credenziali in `.env` + Render Env Vars
- [ ] JSON valido (no errori syntax)

## 3. Environment Variables
- [ ] Tutte le variabili `.env` presenti anche su Render → Environment Variables

## 4. Prompt
- [ ] Creato `prompts/System-Prompt-Receptionist_<restaurant_id>.md` (copia da esistente)
- [ ] Cambiato `restaurant_id` nel prompt
- [ ] Cambiato nome receptionist (es. "Alice" → "Giulia")
- [ ] Cambiato `transfer_call_tool_<restaurant_id>` nel prompt
- [ ] Cambiato `is_open_now(restaurant_id="<id>")` nel prompt
- [ ] Versione prompt corretta nel titolo

## 5. Deploy
- [ ] Commit + push
- [ ] Render build OK
- [ ] `GET /status` → `{ ok: true }`
- [ ] `node scripts/regression-tests.js <URL>` → tutto PASS

## 6. Vapi Assistant
- [ ] Creato/clonato Assistant
- [ ] System Prompt incollato
- [ ] File FAQ caricato in Knowledge Base
- [ ] 9 Tool HTTP configurati (check_openings, create/list/modify/cancel_booking, resolve_relative_day/time, is_open_now, send_sms)
- [ ] Tool nativo `end_call` configurato (tipo: End Call)
- [ ] Tool nativo `transfer_call_tool_<restaurant_id>` configurato (tipo: Transfer Call, numero = telefono reale ristorante)
- [ ] Tool `faq` NON configurato (usa Knowledge Base)
- [ ] `expected_weekday` aggiunto nei parameters di check_openings
- [ ] Transcriber: lingua italiana, "Use Numerals" attivato
- [ ] Voice: voce italiana selezionata

## 7. Telefono
- [ ] Numero Twilio assegnato all'Assistant
- [ ] Test chiamata vocale OK

## 8. Test finale (minimo 6 test)
- [ ] Prenotazione completa → compare nel gestionale/Sheet
- [ ] Modifica → aggiornata
- [ ] Cancellazione → rimossa
- [ ] Orari ("siete aperti domani?") → risponde correttamente
- [ ] Giorno chiuso → dice chiuso + propone alternativa
- [ ] Handover ("vorrei parlare con qualcuno") → trasferisce chiamata
- [ ] `/metrics` → nessun errore anomalo
- [ ] Ristorante LIVE
