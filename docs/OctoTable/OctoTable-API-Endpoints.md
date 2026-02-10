# OctoTable API – Endpoint e mappatura (v4 — CRUD testato su sandbox reale)

**Riferimento:** GitBook OctoTable API + Postman collection + test diretti sugli endpoint.

---

## 1. Sottoscrizione necessaria

Per usare l'API OctoTable in produzione serve un piano che includa **"Collegamenti esterni (API)"**:

| Piano   | Prezzo (IVA esclusa) | API |
|---------|------------------------|-----|
| FREE    | € 0 / mese            | ❌ No |
| **DIGIMENU** | € 15,20 / mese      | ✅ Sì |
| PREMIUM | € 23,20 / mese        | ✅ Sì |
| EVO     | € 39,20 / mese        | ✅ Sì |

**Sandbox gratuita:** Il passo "Create Client" crea automaticamente una fake property per testing (sandbox: true). Disponibile per un periodo limitato.

---

## 2. Base URL e autenticazione (VERIFICATI)

**ATTENZIONE:** `api.octocrate.com` NON ESISTE (DNS ENOTFOUND). I soli domini validi sono:

| Servizio | Base URL | Stato |
|----------|----------|-------|
| Account (Create Client) | `https://api.octotable.com/octotable-pms/api/v2` | Testato: 201 Created OK |
| Auth (Token) | `https://api.octotable.com/octotable-auth/api/v2` | Testato: 200 OK con creds reali |
| PMS (Reservations, Properties) | `https://api.octotable.com/octotable-pms/api/v2` | Testato: CRUD completo OK |

### Step 1: Create Client (una tantum, senza autenticazione)
`POST https://api.octotable.com/octotable-pms/api/v2/api-account/oauth2/client`

Body JSON (**formato array**, campo `redirect_uri` obbligatorio al root + `sandbox_property` annidato):
```json
[{
  "redirect_uri": "http://localhost:8183/main-page",
  "sandbox_property": {
    "name": "Nome Ristorante",
    "username": "unique.username.123",
    "password": "StrongPass123!",
    "description": "Descrizione ristorante",
    "email": "email@example.com",
    "website": "https://example.com"
  }
}]
```

Risposta (201 Created): `client_id`, `client_secret`, `id`, property con `sandbox: true`

**Testato con successo il 2026-02-10.** La sandbox crea automaticamente: 2 servizi (Lunch/Dinner), 0 rooms (da creare).

### Step 2: Create Token (OAuth 2.0 Client Credentials)
`POST https://api.octotable.com/octotable-auth/api/v2/oauth2/token`

**IMPORTANTE:** Il token endpoint NON accetta JSON (restituisce 415). Usa `x-www-form-urlencoded`:

Headers: `Content-Type: application/x-www-form-urlencoded`, `Accept: application/json`

Body (form-urlencoded):
- `grant_type=client_credentials`
- `client_id=<your_client_id>`
- `client_secret=<your_client_secret>`

Risposta: `{ "access_token": "...", "expires_in": 1440, "type": "Bearer" }`

L'adapter cache il token e lo rinnova automaticamente.

---

## 3. Properties (Ristoranti)

Base: `https://api.octotable.com/octotable-pms/api/v2`
Header obbligatorio: `Property: <property_id>`

| Operazione | Metodo | Endpoint | Note |
|------------|--------|----------|------|
| Find all | GET | `/properties` | Tutti i ristoranti |
| Find one | GET | `/properties/{id}` | Per ID |
| Create | POST | `/properties` | Body: name, city, cap, address, latitude, longitude, phone, description |
| Update | PUT | `/properties/{id}` | Stessi campi di Create |
| Delete | DELETE | `/properties/{id}` | Elimina |

---

## 4. Endpoint Reservations

Base: `https://api.octotable.com/octotable-pms/api/v2`
Header obbligatorio: `Property: <property_id>`, `Authorization: Bearer <token>`

| Operazione | Metodo | Endpoint | Note |
|------------|--------|----------|------|
| List | GET | `/reservations` | Query: `start_date`, `end_date`, `text_search`, `incoming` |
| Create | POST | `/reservations` | Body JSON (vedi sotto) |
| Update | PUT | `/reservations/{id}` | Campi modificabili |
| Delete | DELETE | `/reservations/{id}` | Nessun body |

### Create (POST /reservations)

Body JSON — **tutti obbligatori** (verificato: senza service_id o room_id restituisce errore):
- `start_date` (string, YYYY-MM-DD)
- `start_hour` (string, HH:mm:ss)
- `pax` (number)
- `service_id` (number) — **OBBLIGATORIO** (Lunch/Dinner, da GET /services)
- `room_id` (number) — **OBBLIGATORIO** (da GET /rooms, deve avere tavoli)
- `channel` (string) — `"OCTOTABLE_ADMIN"`
- `customer` (object):
  - `first_name` (string)
  - `last_name` (string)
  - `phone` (string)
- `notes` (string) — opzionale

### Update (PUT /reservations/{id})

Body JSON — **richiede corpo COMPLETO** (verificato: body parziale causa errore 500):
- `start_date` (string, YYYY-MM-DD) — **NOTA:** usa `start_date` (NON `start_day`!)
- `start_hour` (string, HH:mm:ss)
- `pax` (number)
- `service_id` (number)
- `room_id` (number)
- `channel` (string)
- `customer` (object con `id` obbligatorio dalla prenotazione originale):
  - `id` (number) — **OBBLIGATORIO per update**
  - `first_name` (string)
  - `last_name` (string)
  - `phone` (string)

### List (GET /reservations)

Query params:
- `start_date` (YYYY-MM-DD)
- `end_date` (YYYY-MM-DD)
- `text_search` (string) — per cercare per telefono
- `incoming` (`"true"`) — solo future

### Risposta

Tutte le liste sono wrappate in: `{ "data": [...] }`

Stati da filtrare (non mostrare): `CANCELLED`, `REJECTED`, `EXPIRED`

---

## 5. Booking Engine (Slots / Disponibilità)

| Operazione | Metodo | Endpoint | Note |
|------------|--------|----------|------|
| Available slots | GET | `/booking/slots` | Query: `start_date`, `pax`, `service_id`, `slot_id_room` |
| Available rooms | GET | `/booking/rooms` | Query: `start_date`, `start_time`, `pax`, `service_id` |
| Booking link | GET | `/booking/link` | Link iframe booking engine |

---

## 6. Contratto nostro → OctoTable (mappatura)

| Noi (reservations.js / tool) | OctoTable |
|------------------------------|-----------|
| `restaurantId` | `property_id` (header `Property`) |
| `day` | `start_date` (create) / `start_day` (update) |
| `time` | `start_hour` (formato HH:mm:ss) |
| `people` | `pax` |
| `name` | `customer.first_name` + `customer.last_name` |
| `phone` | `customer.phone` |
| `booking_id` | `id` (reservation ID) |

---

## 7. Configurazione in ristoranti.json

Per ogni ristorante che usa OctoTable:

```json
{
  "nome_ristorante": {
    "enabled": true,
    "reservations_backend": "octotable",
    "octotable_property_id": "99841",
    "octotable_client_id_env": "OCTOTABLE_CLIENT_ID_NOMERISTORANTE",
    "octotable_client_secret_env": "OCTOTABLE_CLIENT_SECRET_NOMERISTORANTE"
  }
}
```

In `.env` e Render:
```
OCTOTABLE_CLIENT_ID_NOMERISTORANTE=public_xxxxx
OCTOTABLE_CLIENT_SECRET_NOMERISTORANTE=xxxxx-xxxx-xxxx
```

---

## 8. Variabili d'ambiente

| Variabile | Default | Note |
|-----------|---------|------|
| `OCTOTABLE_PMS_URL` | `https://api.octotable.com/octotable-pms/api/v2` | Base URL PMS (verificato) |
| `OCTOTABLE_AUTH_URL` | `https://api.octotable.com/octotable-auth/api/v2` | Base URL Auth (verificato) |
| `OCTOTABLE_CLIENT_ID` | - | Fallback globale |
| `OCTOTABLE_CLIENT_SECRET` | - | Fallback globale |

---

## 9. Verifica domini (test 2026-02-10)

| Dominio | DNS | Ruolo |
|---------|-----|-------|
| `api.octotable.com` | 5.249.134.120 | PMS + Auth + Account (TUTTO) |
| `api.octorate.com` | 5.249.134.120 | Auth (alternativo, stesso IP) |
| `api.octocrate.com` | **ENOTFOUND** | NON USARE |

## 10. Setup sandbox (testato 2026-02-10)

Sequenza per creare una sandbox funzionante:

1. **Create Client** → ottieni `client_id`, `client_secret`, `property_id`
2. **Create Token** → ottieni `access_token`
3. **Crea almeno 1 Room** (POST /rooms) → ottieni `room_id`
4. **Crea almeno 1 Table** in ogni room (POST /room/{room_id}/table) → necessario per disponibilità
5. La sandbox già include 2 servizi pre-configurati (Lunch: 12-15, Dinner: 19-23)
6. Ora puoi creare prenotazioni con: `service_id`, `room_id`, `start_date`, `start_hour`, `pax`, `channel`, `customer`

### Sandbox di test attiva:
- **property_id:** 1001842
- **client_id:** public_18074905614da2f1b2-2a23-4c41-bcc1-6c1781ab9
- **room_id:** 26157 (Sala Principale, 3 tavoli da 4 posti)
- **services:** Lunch (39492), Dinner (39491)
