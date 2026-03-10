# Go-Live Runbook (Pilot + Safe Releases)

Runbook operativo per andare live senza rompere i ristoranti gia attivi.

---

## 1) Strategia consigliata

- Vai live con **1 solo ristorante pilota**.
- Non aspettare il completamento di tutti i 7 controlli operativi.
- Prima del pilota completa solo baseline minima:
  - S1: conferme solo da risultato tool (`ok:true`, `booking_id`)
  - S6: handover sempre funzionante
  - checklist giornaliera operativa
- Subito dopo la prima settimana pilota implementa S3/S4 (riconciliazione + alert).

---

## 2) Baseline pre-pilota (obbligatoria)

1. `GET /status` risponde `ok:true`.
2. Transfer call testato in chiamata reale.
3. Flusso create/list/modify/cancel testato su tenant pilota.
4. Prompt corretto caricato su Vapi per il tenant pilota.
5. Numero telefono del ristorante verificato nel transfer tool.
6. Piano escalation pronto: se problema critico -> modalita FAQ + transfer.

Se uno di questi punti fallisce, il pilota non parte.

---

## 3) Processo release sicuro (ogni modifica)

1. Test in staging (`demo01` + regression tests).
2. 3 smoke test vocali:
   - prenotazione semplice
   - modifica o cancellazione
   - handover a operatore
3. Deploy in produzione.
4. Attiva comportamento nuovo solo su tenant canary.
5. Monitora 24-72h:
   - error rate
   - create_booking rejected/error
   - mismatch sospetti (conferme non presenti nel gestionale)
6. Solo se stabile, estendi agli altri tenant live.

---

## 4) Rollback rapido (entro 10 minuti)

Trigger rollback immediato:
- prenotazioni confermate ma mancanti nel gestionale
- picco errori backend non attesi
- handover non funzionante

Procedura:
1. Ripristina ultimo backend stabile su Render.
2. Ripristina ultimo prompt stabile su Vapi (tenant impattato).
3. Esegui 2 smoke call:
   - una prenotazione
   - un handover
4. Conferma al ristorante che il servizio e tornato stabile.

---

## 5) Checklist giornaliera (10 minuti, non tecnica)

1. `/status` ok
2. transfer test rapido ok
3. 1 prenotazione test -> compare nel gestionale
4. 1 modifica o cancellazione test -> aggiornata correttamente
5. controlla log errori ultime 24h
6. controlla metriche essenziali (`/metrics`)
7. verifica prompt corretto per tenant live
8. verifica numero transfer corretto per tenant live
9. verifica eventuali alert ricevuti (email/telegram)
10. se dubbio operativo: passa temporaneamente a FAQ + transfer

---

## 6) Modalita emergenza (FAQ + transfer)

Quando attivarla:
- problemi prenotazioni
- problemi provider esterni
- bug prompt critici

Cosa fa:
- AI risponde a FAQ e trasferisce allo staff
- no conferme automatiche di prenotazione fino a fix completato

---

## 7) Cosa implementare dopo la prima settimana pilota

Priorita alta:
- S3: riconciliazione automatica (tool success vs record reale)
- S4: alert automatici su anomalie

Priorita media:
- S5: dashboard operativa semplice (KPI giornalieri)

