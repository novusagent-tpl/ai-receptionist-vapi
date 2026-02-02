# OctoTable API – Verifica (Postman Public API)

**Link Postman:** [Octotable APIs (Public API)](https://documenter.getpostman.com/view/50380496/2sB3dK1YWg)  
**Link GitBook:** [OctoTable API](https://octotable-1.gitbook.io/octotable-api)

## Cosa offre l'API (da documentazione e ricerca)

- **Autenticazione:** OAuth 2.0 Client Credentials. Flusso: "Create client" (nome, email, username, password, redirect_uri) → Client ID e Client Secret → "Create Token" (client_id, client_secret, grant_type=client_credentials) → Bearer token nell'header `Authorization`.
- **Entità:** Client → Token → **Restaurant** (Find all, Find by id, Create, Update, Delete) → **Rooms** (sale/tavoli) → **Reservations**.
- **Prenotazioni:** **List**, **Create**, **Modify**, **Cancel** reservations. Dettagli completi (endpoint, body, query params) nella collection Postman.
- **Ambiente test:** alla creazione del client OctoTable crea una proprietà di test per provare l'API prima del live.
- **Stato:** API in **PREVIEW** (OctoTable si riserva di modificarla in futuro).

## Contratto nostro vs OctoTable (da verificare in Postman)

| Noi serviamo | OctoTable |
|--------------|------------|
| Crea prenotazione (day, time, people, name, phone, notes) | Create reservation – verificare campi e formato (date, time, people, name, phone, notes, room_id?, restaurant_id?). |
| Lista per telefono | List reservations – verificare se c'è filtro per telefono (query param) o se si filtra lato client sulla lista. |
| Lista per giorno | List reservations – verificare se c'è filtro per data (from_date, to_date, date). |
| Modifica (booking_id, new_day, new_time, new_people) | Modify reservation – verificare payload (id + campi modificabili). |
| Cancella (booking_id) | Cancel reservation – verificare endpoint (DELETE o PATCH con status=cancelled). |

## Cosa fare adesso

1. **Importare la collection Postman** al link sopra (Run in Postman / Import).
2. **Eseguire in ordine:** Create client → Create Token. Salvare Client ID, Client Secret, Access Token (o variabili d'ambiente Postman).
3. **Restaurant e Rooms:** creare o usare un restaurant e le rooms (sale) necessarie; la doc indica che le prenotazioni si gestiscono nel contesto restaurant/rooms.
4. **Endpoint Reservations:** aprire ogni richiesta della sezione Reservations e verificare:
   - **List:** URL e query params (restaurant_id, date, phone, from_date, to_date). Se non c'è filtro per telefono o data, valutare se la lista è paginata e filtrare lato nostro.
   - **Create:** body (date, time, people, name, phone, notes, room_id?, restaurant_id?). Mappare day/time nel formato richiesto (es. ISO, timezone).
   - **Update/Modify:** id prenotazione + campi modificabili.
   - **Cancel/Delete:** id prenotazione.
5. **Disponibilità:** se esiste un endpoint "availability" o "slots" per giorno/ora, usarlo per `check_openings`; altrimenti usare List reservations per giorno e calcolare la disponibilità nel backend come oggi (openings da KB + prenotazioni del giorno).

Se gli endpoint e i filtri ci sono (lista per data, lista per telefono o lista completa filtrabile, create/modify/cancel), **si può usare OctoTable** e implementare l'adapter `reservations-octotable.js` che chiama queste API al posto di Google Sheets/Calendar.
