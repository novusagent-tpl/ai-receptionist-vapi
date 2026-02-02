# OctoTable – Cosa abbiamo e in che ordine fare i passi

---

## 1. Documentazione OctoTable che hai trovato

La pagina **"OctoTable's API documentation"** (Create Clients with Postman, Create Token, Create your restaurant, Create your rooms, Manage your reservations, Orders, Error Manual, Zapier, Webhooks) **non è nel repo** – è la doc ufficiale sul sito OctoTable.

- **A cosa serve:** è la **guida di setup**. Spiega come:
  - **Create Client** → ottenere Client ID e Client Secret
  - **Create Token** → ottenere il Bearer token (OAuth)
  - **Create your restaurant** → ottenere l’ID ristorante (`restaurant_id`) da usare nelle API
  - **Create your rooms** → eventualmente le sale/tavoli
  - **Manage your reservations** → è quello che il nostro adapter fa (List/Create/Modify/Cancel)

- **Nel nostro progetto abbiamo:**
  - **`docs/OctoTable/OctoTable-API-Endpoints.md`** – riassunto degli endpoint Reservations e mappatura al nostro contratto (ricavato dallo screenshot Postman che ci hai mandato).
  - **`src/reservations-octotable.js`** – adapter che chiama l’API OctoTable (token + List/Create/Modify/Cancel).

Quindi: la **doc ufficiale OctoTable** la segui tu per fare lo **setup** (client, token, restaurant, rooms). La **nostra doc** e l’**adapter** sono già pronti per usare quegli endpoint.

---

## 2. Il file `OctoTable-Postman-Cosa-Inviare.md`

Quel file era una **richiesta** che ti avevamo fatto: “apri Postman, estrai e inviaci metodo/URL/parametri/body per Authorization e Reservations”.

Tu ci hai già inviato le informazioni (con lo **screenshot** della pagina Postman), e da lì abbiamo scritto:
- `docs/OctoTable/OctoTable-API-Endpoints.md`
- `src/reservations-octotable.js`

Quindi **non devi più fare** i passi descritti in `OctoTable-Postman-Cosa-Inviare.md`: erano per raccogliere i dati, e li abbiamo già.

---

## 3. Ordine dei passi da fare **ora**

### Passo 1 – Setup OctoTable (doc ufficiale OctoTable)

Segui la **documentazione ufficiale OctoTable** (la pagina che hai trovato):

1. **Create Client** (con Postman o da pannello) → ottieni **Client ID** e **Client Secret**.
2. **Create Token** → ottieni l’**Access Token** (il nostro adapter lo rinnova da solo con Client ID/Secret).
3. **Create your restaurant** → ottieni l’**ID ristorante** (es. `restaurant_id`) da usare nelle chiamate.
4. (Opzionale) **Create your rooms** se ti servono sale/tavoli.

Serve almeno il piano **DIGIMENU** (API incluse). Poi in `.env` metti:

- `OCTOTABLE_CLIENT_ID=...`
- `OCTOTABLE_CLIENT_SECRET=...`
- (opzionale) `OCTOTABLE_BASE_URL=https://api.octotable.com/v1`

E in `src/config/ristoranti.json` per il ristorante che usa OctoTable aggiungi (se l’ID OctoTable è diverso dal nostro `restaurantId`):

- `"octotable_restaurant_id": "..."`  (l’ID che ottieni da “Create your restaurant”).

---

### Passo 2 – (A) Integrare lo switch in `reservations.js`

Quando hai credenziali e `restaurant_id` (e opzionalmente `octotable_restaurant_id` in config), il passo successivo è **integrare lo switch** nel backend:

- In `reservations.js` (o in un punto unico da cui si scelgono le prenotazioni): se `RESERVATIONS_BACKEND=octotable` (e credenziali presenti), usare **`reservations-octotable.js`**; altrimenti usare il codice attuale (Google Sheets/Calendar).
- I route e i tool **non** cambiano: continuano a chiamare lo stesso modulo “reservations”; è il modulo che internamente delega a OctoTable o a Sheets.

Questo è il passo **(A)** che ti avevo proposto.

---

### Passo 3 – (B) Tool Vapi (create/list/modify/cancel)

I **tool** che usi già (create_booking, list_bookings, modify_booking, cancel_booking) **chiamano già** le funzioni di `reservations.js` (createReservation, listReservationsByPhone, …).  

Quindi **non serve definire nuovi tool**: una volta fatto lo switch al passo 2, gli stessi tool useranno OctoTable quando `RESERVATIONS_BACKEND=octotable`.

**(B)** “definire i nuovi tool e come si agganciano” ha senso solo se:
- vuoi **aggiungere** nuovi tool Vapi (es. “lista prenotazioni per giorno” come tool separato), oppure
- vuoi **cambiare** nome/parametri dei tool esistenti.

Per il flusso base (crea/lista/modifica/cancella prenotazione) **non è obbligatorio**: basta (A).

---

## 4. Riepilogo

| Cosa | Dove / azione |
|------|----------------|
| Doc ufficiale OctoTable (Create Client, Token, Restaurant, Rooms, Manage reservations, ecc.) | **Non** nel repo; la segui sul sito OctoTable per lo **setup**. |
| `OctoTable-Postman-Cosa-Inviare.md` | Era per **chiederti** di inviarci i dettagli; ormai **non serve più** (abbiamo usato lo screenshot). |
| **Passo 1** | Seguire la doc OctoTable → Create Client, Token, Restaurant (e rooms se serve) → mettere credenziali in `.env` e `octotable_restaurant_id` in config. |
| **Passo 2 (A)** | Integrare lo switch in `reservations.js` con `RESERVATIONS_BACKEND=octotable`. |
| **Passo 3 (B)** | Opzionale: nuovi tool solo se ne aggiungi; i tool attuali si agganciano da soli dopo (A). |

Ordine consigliato: **1 → 2 (A)**. Poi, se serve, **3 (B)**.
