# OctoTable vs Google Sheets/Calendar – Cosa cambia e come funziona

---

## 1. Come funziona oggi (solo Google Sheets/Calendar)

```
Vapi (AI) o altro client
        │
        │  "Crea prenotazione per 4 persone, domani alle 20, Mario Rossi, 333..."
        │  → chiama il tool create_booking con { restaurant_id, day, time, people, name, phone, notes }
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend (il nostro server)                                      │
│                                                                  │
│  create_booking.js  →  reservations.createReservation(...)       │
│  list_bookings.js   →  reservations.listReservationsByPhone(...) │
│  modify_booking.js  →  reservations.updateReservation(...)       │
│  cancel_booking.js  →  reservations.deleteReservation(...)       │
│                                                                  │
│  Tutti chiamano le funzioni del modulo "reservations"            │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  reservations.js (implementazione attuale)                       │
│  → Scrive una riga nel foglio Google "Bookings"                   │
│  → Crea/aggiorna/cancella evento su Google Calendar              │
│  I dati stanno in: Google Sheets + Google Calendar               │
└─────────────────────────────────────────────────────────────────┘
```

- **Tool** = cosa espone il backend a Vapi (es. `create_booking`, `list_bookings`, …). Restano **gli stessi**.
- **Implementazione** = dove e come salviamo le prenotazioni. Oggi = **solo** Google Sheets + Google Calendar.

---

## 2. Cosa faremo con lo switch (passo A)

Non aggiungiamo nuovi tool e non cambiamo i nomi o i parametri dei tool. Cambiamo **solo** chi esegue il lavoro dietro le stesse funzioni.

```
Vapi (AI) o altro client
        │
        │  Stessa cosa: "Crea prenotazione..." → create_booking con { restaurant_id, day, time, ... }
        │  Stessa cosa: "Lista le mie prenotazioni" → list_bookings con { restaurant_id, phone }
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend (stesso di prima)                                       │
│                                                                  │
│  create_booking.js  →  reservations.createReservation(...)       │
│  list_bookings.js   →  reservations.listReservationsByPhone(...) │
│  modify_booking.js  →  reservations.updateReservation(...)      │
│  cancel_booking.js  →  reservations.deleteReservation(...)       │
│                                                                  │
│  Stessi file, stesse chiamate. Niente cambia qui.                 │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  reservations.js (diventa un "dispatcher")                       │
│                                                                  │
│  Se RESERVATIONS_BACKEND=octotable (e credenziali OctoTable ok)   │
│     → usa le funzioni di reservations-octotable.js                │
│     → i dati vanno su OctoTable (API OctoTable)                   │
│                                                                  │
│  Altrimenti (default)                                            │
│     → usa il codice attuale (Sheets + Calendar)                  │
│     → i dati restano su Google Sheets + Google Calendar          │
└─────────────────────────────────────────────────────────────────┘
```

Quindi:
- **Cosa facciamo ora:** in `reservations.js` decidiamo, in base a una variabile (es. `RESERVATIONS_BACKEND`), se chiamare il codice **Sheets/Calendar** o il codice **OctoTable**. Stessi nomi di funzioni, stesso contratto (parametri e ritorno).
- **A cosa serve:** poter usare OctoTable per le prenotazioni senza riscrivere create_booking, list_bookings, ecc. Basta configurare backend e credenziali.

---

## 3. Differenza tra Google Sheets/Calendar e OctoTable

| Aspetto | Google Sheets/Calendar | OctoTable |
|--------|-------------------------|-----------|
| **Dove stanno i dati** | Foglio "Bookings" + eventi in Google Calendar | Nel gestionale OctoTable (loro server) |
| **Chi fa il lavoro** | Il nostro codice (reservations.js) che scrive su Sheet e chiama Calendar API | Il nostro codice (reservations-octotable.js) che chiama l’API OctoTable |
| **Cosa vede Vapi / i tool** | Niente di diverso: stessi tool, stessi parametri, stessa risposta (ok, booking_id, …) | Identico: stessi tool, stessi parametri, stessa risposta |
| **Cosa vede il ristoratore** | Apre il foglio Google e/o il calendario Google | Apre il pannello OctoTable / app OctoTable per vedere e gestire le prenotazioni |

In sintesi:
- **Per l’AI e per il nostro backend (create_booking, list_bookings, …):** non cambia nulla a livello di “cosa chiamo e cosa mi torna”.
- **Cambia solo dove vengono salvate e gestite le prenotazioni:** Sheet+Calendar oppure OctoTable. Decidi tu con la config (es. `RESERVATIONS_BACKEND` e credenziali).

---

## 4. Perché il punto B (nuovi tool) non è obbligatorio

- **Non** abbiamo “tool per Sheets” e “tool per OctoTable”. Abbiamo **un solo set di tool**: create_booking, list_bookings, modify_booking, cancel_booking. Sono gli stessi sia con Sheets sia con OctoTable.
- Questi tool chiamano sempre `reservations.createReservation`, `reservations.listReservationsByPhone`, ecc. Chi implementa queste funzioni (Sheets o OctoTable) lo decide **solo** il modulo reservations in base a `RESERVATIONS_BACKEND` (e credenziali). Quindi **per usare OctoTable non dobbiamo creare nuovi tool**.
- Il **punto B** (“definire i nuovi tool”) serve solo se in futuro vuoi:
  - **aggiungere** un nuovo tool (es. “lista prenotazioni per giorno” esposto anche a Vapi), oppure
  - **cambiare** nome/parametri dei tool esistenti.  
  Per “provare e usare OctoTable” non è necessario: basta lo switch (passo A).

---

## 5. Riepilogo

- **Ora (passo A):** modifichiamo `reservations.js` in modo che, se è configurato OctoTable, deleghi a `reservations-octotable.js`, altrimenti continui a usare Sheets/Calendar. Stessi tool, stesse route, stessa esperienza per Vapi; cambia solo dove vengono scritte le prenotazioni.
- **Differenza pratica:** con Sheets = dati in Google; con OctoTable = dati nel gestionale OctoTable. Il resto (flusso AI → backend → risposta) resta uguale.
- **Punto B:** non è obbligatorio per OctoTable; lo fai solo se vuoi aggiungere o modificare tool in futuro.
