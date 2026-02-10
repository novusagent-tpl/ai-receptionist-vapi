# Checklist Onboarding Nuovo Ristorante

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
- [ ] Creato `kb/<restaurant_id>.json`
- [ ] Creato `kb/<restaurant_id>-faq-vapi.md`
- [ ] Aggiornato `src/config/ristoranti.json` (con `prompt_version: "v1.0"`)
- [ ] Se Sheets: creato Sheet + Calendar + condiviso con Service Account
- [ ] Se resOS: aggiunto `resos_api_key_env` in `ristoranti.json` + chiave API in `.env` locale + Render Environment Variables
- [ ] Se OctoTable: aggiunto `octotable_client_id_env` e `octotable_client_secret_env` in `ristoranti.json` + credenziali in `.env` locale + Render Environment Variables
- [ ] JSON valido (no errori syntax)

## 2b. Environment Variables (IMPORTANTE)
Ogni variabile in `.env` locale deve esistere anche su **Render → Environment Variables**.
- [ ] Verificato che TUTTE le variabili `.env` siano presenti su Render
- [ ] Se aggiunto nuovo ristorante resOS/OctoTable: aggiunta la nuova API key anche su Render

## 3. Prompt
- [ ] Creato `prompts/System-Prompt-Receptionist_<restaurant_id>.md`
- [ ] restaurant_id corretto nel prompt
- [ ] Versione `(v1.0)` nel titolo
- [ ] Changelog inizializzato

## 4. Deploy
- [ ] Commit + push
- [ ] Render build OK
- [ ] `GET /status` → `{ ok: true }`
- [ ] `npm test` oppure `node scripts/regression-tests.js <URL>` → tutto PASS

## 5. Vapi
- [ ] Creato/clonato Assistant
- [ ] System Prompt incollato
- [ ] File FAQ caricato in Knowledge Base
- [ ] TUTTI i tool HTTP configurati (9 tool)
- [ ] Tool `faq` NON configurato (usa Knowledge Base)
- [ ] Test in chat superati (prenota, modifica, cancella, orari, FAQ)

## 6. Telefono
- [ ] Numero Twilio assegnato all'Assistant
- [ ] Test chiamata vocale OK

## 7. Test finale
- [ ] Prenotazione → compare nel gestionale/Sheet
- [ ] Modifica → aggiornata
- [ ] Cancellazione → rimossa
- [ ] FAQ → risponde correttamente
- [ ] `/metrics` → nessun errore anomalo
- [ ] Ristorante LIVE
