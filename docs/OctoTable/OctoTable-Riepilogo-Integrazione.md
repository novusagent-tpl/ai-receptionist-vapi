# OctoTable — Riepilogo Integrazione Completo

## Cosa abbiamo fatto

### Il nostro sistema
Abbiamo un servizio SaaS che fornisce una **receptionist telefonica AI** ai ristoranti. Quando un cliente chiama il ristorante, risponde la nostra AI che può:
- Creare, modificare, cancellare prenotazioni
- Dare informazioni sugli orari di apertura
- Rispondere a domande frequenti (parcheggio, allergeni, ecc.)
- Trasferire la chiamata al ristorante se il cliente lo chiede

**Stack tecnico:**
- **Vapi** — piattaforma per assistenti vocali AI (gestisce la voce, la comprensione, la sintesi vocale)
- **Il nostro backend Node.js** — gestisce la logica delle prenotazioni, gli orari, le FAQ
- **Hosting su Render** — il backend è in cloud
- **Gestionali supportati** — Google Sheets, resOS, OctoTable

### Cosa abbiamo fatto per OctoTable

1. **Creato un adapter completo** (`src/reservations-octotable.js`) che comunica con le API OctoTable:
   - Autenticazione OAuth 2.0 (client_id + client_secret → access_token)
   - **Create** prenotazione (con auto-discovery di service_id e room_id)
   - **List** prenotazioni per telefono o per giorno
   - **Modify** prenotazione (body completo con customer.id)
   - **Cancel** prenotazione
   - Error handling con codici leggibili per l'AI (PROVIDER_UNAVAILABLE, NO_TABLE_AVAILABLE, ecc.)

2. **Testato sulla sandbox OctoTable** — ciclo CRUD completo funzionante:
   - Creato un client sandbox con property, sala (Sala Principale) e 3 tavoli
   - Servizi configurati: Lunch (12-15), Dinner (19-23)
   - 102 test automatici tutti passati (inclusi 20+ specifici per OctoTable)

3. **Configurazione multi-tenant** — ogni ristorante OctoTable ha le sue credenziali separate, nessun dato condiviso tra ristoranti

4. **Fatto un test vocale reale** — chiamata su Vapi → AI capisce "voglio prenotare" → backend crea prenotazione su OctoTable → confermata con tavolo assegnato

---

## Cosa ci serve dal consulente OctoTable

### Domande fondamentali

| # | Domanda | Perché ci serve |
|---|---------|----------------|
| 1 | **Come si ottengono le credenziali API (client_id + client_secret) per un ristorante reale?** | In sandbox le abbiamo create noi. In produzione chi le genera? Il ristorante dal suo pannello? OctoTable ce le dà? |
| 2 | **Serve un contratto o un piano specifico per usare le API?** | Vogliamo capire se ci sono costi, limiti, o approvazioni necessarie |
| 3 | **Ci sono limiti (rate limit, quote giornaliere) sulle API di produzione?** | Per dimensionare il nostro sistema e non superare i limiti |
| 4 | **Il property_id del ristorante si trova nel pannello OctoTable?** | Ci serve per configurare ogni ristorante nel nostro sistema |
| 5 | **I servizi (Lunch, Dinner) e le sale sono già configurate per i ristoranti esistenti?** | Il nostro adapter le scopre automaticamente via API, ma vorremmo conferma |
| 6 | **Possiamo usare il canale "OCTOTABLE_ADMIN" per le prenotazioni create via API?** | Lo usiamo ora nella sandbox, vogliamo conferma che vada bene in produzione |
| 7 | **C'è un webhook o notifica quando una prenotazione viene modificata dal ristorante?** | Per eventuale sincronizzazione futura (non bloccante ora) |

### Domande secondarie (nice to have)

| # | Domanda |
|---|---------|
| 8 | C'è documentazione aggiornata delle API oltre al GitBook? |
| 9 | Esiste un ambiente di staging separato dalla sandbox? |
| 10 | È possibile una partnership/integrazione ufficiale? |

---

## Cosa il consulente potrebbe chiedere a noi

### Sul nostro sistema

| Domanda probabile | Risposta |
|---|---|
| **Cos'è il vostro prodotto?** | Un servizio di receptionist telefonica AI per ristoranti. Quando un cliente chiama, la nostra AI risponde, prende prenotazioni, e gestisce domande frequenti. |
| **Come funziona tecnicamente?** | Il cliente chiama un numero → Vapi gestisce la voce → l'AI capisce cosa vuole → chiama il nostro backend → il backend comunica con il gestionale del ristorante (OctoTable) via API. |
| **Quanti ristoranti avete?** | Siamo in fase iniziale con alcuni ristoranti pilota. Stiamo integrando diversi gestionali (resOS, OctoTable, Google Sheets). |
| **Come usate le API OctoTable?** | OAuth 2.0 Client Credentials per autenticazione. Poi chiamate REST per creare/leggere/modificare/cancellare prenotazioni. Tutto server-to-server, nessun accesso al pannello del ristorante. |
| **Quante chiamate API fate?** | Per ogni telefonata: 2-5 chiamate API (check orari, crea/modifica/cancella prenotazione). Stimiamo 50-200 chiamate al giorno per ristorante attivo. |
| **Salvate dati dei clienti?** | Passiamo i dati (nome, telefono) direttamente a OctoTable via API. Non salviamo prenotazioni nel nostro database — OctoTable è la fonte di verità. |
| **Siete GDPR compliant?** | Sì, i dati dei clienti transitano nel nostro sistema solo per la durata della chiamata e vengono passati a OctoTable. Non facciamo retention. |

### Sull'integrazione tecnica

| Domanda probabile | Risposta |
|---|---|
| **Quali endpoint usate?** | `POST /oauth2/token`, `GET /services`, `GET /rooms`, `GET /reservations`, `POST /reservations`, `PUT /reservations/{id}`, `DELETE /reservations/{id}` |
| **Quale base URL usate?** | `api.octotable.com` — PMS su `/octotable-pms/api/v2`, Auth su `/octotable-auth/api/v2` |
| **Come gestite gli errori?** | Mappiamo tutti gli errori HTTP (400, 401, 403, 404, 409, 429, 500, 503) a codici interni con messaggi in italiano che l'AI usa per rispondere al cliente. |
| **Come gestite il token?** | Cache in memoria con refresh automatico prima della scadenza. Un token per coppia client_id/client_secret. |

---

## Schema di come funziona il flusso

```
Cliente chiama il ristorante
        ↓
   Vapi (voce AI)
        ↓
   "Voglio prenotare sabato alle 20 per 2"
        ↓
   Nostro Backend (Render)
        ↓
   1. resolve_relative_day("sabato") → 2026-02-14
   2. check_openings("octodemo", "2026-02-14", "20:00") → available: true
   3. Chiede nome al cliente → "Marco"
   4. create_booking → POST /reservations su OctoTable
        ↓
   OctoTable conferma (CONFIRMED, Tavolo 1)
        ↓
   AI dice: "Perfetto, prenotazione confermata per sabato 14 febbraio
             alle 20 per 2 persone a nome Marco."
```

---

## Dati della sandbox attuale (test)

| Dato | Valore |
|------|--------|
| Property ID | 1001842 |
| Room ID | 26157 (Sala Principale, 3 tavoli da 4 posti) |
| Service Lunch | 39492 (12:00-15:00) |
| Service Dinner | 39491 (19:00-23:00) |
| Client ID | `OCTOTABLE_CLIENT_ID` (in env vars) |
| Client Secret | `OCTOTABLE_CLIENT_SECRET` (in env vars) |

---

## Prossimi passi

1. **Parlare con consulente OctoTable** → ottenere risposte alle domande sopra
2. **Ottenere credenziali di produzione** per il primo ristorante reale
3. **Configurare il ristorante** nel nostro sistema (20 min di setup)
4. **Test vocale** con dati reali
5. **Go live**

---

*Ultimo aggiornamento: 2026-02-11*
