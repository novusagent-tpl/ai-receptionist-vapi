# OctoTable Postman – Cosa inviarmi

Hai aperto la collection Postman e vedi cartelle (Account, Authorization, Rooms, Reservations, Bookings, ecc.). Per capire se possiamo usare OctoTable nel nostro backend ci servono **solo** alcune di queste.

---

## Cosa fare (in ordine)

### 1. Cartella **Authorization**
- Cerca la richiesta che serve per **ottenere il token** (es. "Create Token", "Get Token", "OAuth").
- Per quella richiesta inviami:
  - **Metodo** (es. POST)
  - **URL** (es. `https://api.octotable.com/oauth/token` o simile)
  - **Body** (se c’è): cosa va messo (es. `client_id`, `client_secret`, `grant_type`).
- Così capiamo come il backend dovrà autenticarsi.

### 2. Cartella **Reservations**
- Apri la cartella **Reservations**.
- Per **ogni** richiesta dentro (es. "Get reservations", "Create reservation", "Update reservation", "Delete reservation") inviami:
  - **Nome** della richiesta (es. "Get all reservations")
  - **Metodo** (GET, POST, PUT, DELETE)
  - **URL** (o solo il path, es. `/reservations` o `/properties/{id}/reservations`)
  - **Query params** (solo per le GET): se ci sono parametri in URL tipo `?date=...&phone=...&from=...&to=...` — scrivimi i nomi e una breve descrizione (es. "date", "phone", "property_id")
  - **Body** (solo per POST/PUT): copia il **Body raw (JSON)** che vedi (anche se è un esempio). Esempio:
    ```json
    {
      "property_id": "...",
      "date": "2026-01-15",
      "time": "20:00",
      "guests": 4,
      "customer_name": "Mario Rossi",
      "customer_phone": "+393331234567",
      "notes": "..."
    }
    ```
- Non serve inviare gli "Example Response" per ora, solo request (URL, params, body).

### 3. Cartella **Bookings** (se c’è ed è diversa da Reservations)
- Se oltre a "Reservations" c’è una cartella **Bookings**, apri anche quella.
- Se le richieste sono molto simili a Reservations (es. "Get bookings", "Create booking"), inviami la stessa cosa: per ogni richiesta, metodo, URL, query params (per GET), body (per POST/PUT).
- Se non è chiaro se Bookings e Reservations sono la stessa cosa, inviami l’elenco dei nomi delle richieste in entrambe le cartelle (es. "Reservations: Get list, Create, Update, Delete. Bookings: Get list, Create.").

### 4. (Opzionale) Cartella **Account**
- Solo la richiesta **"Create Client"** (o simile): metodo, URL e body (es. nome, email, username, password, redirect_uri). Così sappiamo come si crea il client per ottenere Client ID e Client Secret.

---

## Cosa NON serve (per ora)

- Rooms, Tables, Services, Orders, Properties, Webhooks: **non** inviare nulla, a meno che non ti serva per un altro motivo.
- Example Response: non serve inviarmeli per questa verifica.

---

## In che formato inviarmi le cose

Puoi scrivere in messaggio tipo:

```
--- AUTHORIZATION ---
- Create Token: POST https://...
  Body: { "client_id": "...", "client_secret": "...", "grant_type": "client_credentials" }

--- RESERVATIONS ---
- Get list: GET https://.../reservations
  Params: property_id, date (o from_date, to_date), phone (se c’è)
- Create: POST https://.../reservations
  Body: { "property_id": "...", "date": "...", "time": "...", "guests": 4, "customer_name": "...", "customer_phone": "...", "notes": "..." }
- Update: PUT https://.../reservations/{id}
  Body: { ... }
- Delete: DELETE https://.../reservations/{id}

--- BOOKINGS (se diverso) ---
...
```

Oppure, per ogni richiesta, una foto/schermata (Request + Body) va bene lo stesso: descrivi solo "questa è la Get list", "questa è la Create", ecc.

---

## Perché ci serve

- **Authorization:** per far sì che il nostro backend ottenga il Bearer token e lo usi nelle chiamate.
- **Reservations (e/o Bookings):** per mappare le nostre operazioni (crea prenotazione, lista per telefono, lista per giorno, modifica, cancella) agli endpoint OctoTable. Con metodo, URL, parametri e body capiamo se c’è tutto e come costruire l’adapter `reservations-octotable.js`.

Quando hai raccolto queste cose, incollale nel prossimo messaggio (o invia le schermate) e ti dico esattamente se possiamo usare OctoTable e come.
