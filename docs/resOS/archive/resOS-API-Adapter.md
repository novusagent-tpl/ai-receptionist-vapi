# resOS API – Adapter prenotazioni (OBSOLETO – API vecchia)

Adapter per collegare la nostra receptionist telefonica / chatbot AI al gestionale **resOS** (resos.com) via API.

**Documentazione ufficiale:** [resOS API (Postman)](https://documenter.getpostman.com/view/3308304/SzzehLGp?version=latest)  
**Supporto:** hi@resos.com

---

## 1. Cosa sappiamo (da documentazione pubblica)

- **Autenticazione:** chiave API privata, da generare in **Menu → Settings → Integrations → API** (Activate → Generate new key). La chiave va **codificata in base64** e inviata nell'header **Authorization** in ogni richiesta.
- **Base URL:** da verificare nella Postman collection; spesso è `https://api.resos.com` o `https://resos.com/api` (con eventuale versione `/v1`). Nell'adapter usiamo di default `https://api.resos.com` (override con `RESOS_BASE_URL`).
- **Operazioni:** crea prenotazioni, visualizza prenotazioni (lista/calendario), modifica/aggiorna prenotazioni. Endpoint esatti (path, query, body) vanno **verificati nella Postman collection**.
- **Piano:** API è add-on a pagamento per Basic/Plus/Unlimited; **gratuita** con il piano Free.

---

## 2. Configurazione nel nostro progetto

- **Env:** `RESOS_EMAIL e RESOS_PASSWORD` = chiave API resOS (quella che generi dal pannello; l'adapter la codifica in base64 per le richieste). Opzionale: `RESOS_BASE_URL` (es. `https://api.resos.com/v1` se diverso dal default).
- **Config ristorante:** in `src/config/ristoranti.json` si può aggiungere `resos_venue_id` o `resos_restaurant_id` (ID locale/ristorante su resOS). Se assente, l'adapter usa `restaurantId` come fallback.

---

*[File archiviato – API attuale: Basic Auth, /v1/bookings. Vedi docs/resOS/resOS-API-Reale.md]*
