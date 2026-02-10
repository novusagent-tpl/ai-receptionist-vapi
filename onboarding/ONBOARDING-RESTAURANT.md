# Onboarding Nuovo Ristorante – AI Receptionist VAPI

Guida operativa passo-per-passo per attivare un nuovo ristorante nel sistema.

---

## 1. Prerequisiti

- Accesso al repository `ai-receptionist-vapi`
- Accesso a Render (deploy backend)
- Accesso a Vapi (Assistant + Knowledge Base)
- Accesso Twilio (numero telefonico)
- Se backend Sheets: accesso Google Sheets + Calendar + Service Account
- Se backend resOS/OctoTable: credenziali API del gestionale

---

## 2. Definizione restaurant_id

Scegli un codice univoco per il ristorante. Esempi: `roma`, `milano_centro`, `napoli_vomero`.

Questo ID deve essere identico in:
1. `kb/<restaurant_id>.json`
2. `src/config/ristoranti.json`
3. System Prompt dell'Assistant Vapi
4. Tutte le chiamate tool API

Regole: solo minuscole, niente spazi, niente caratteri speciali.

---

## 3. Dati da raccogliere dal ristorante

Prima di tutto, chiedi al ristorante:

| Dato | Esempio | Obbligatorio |
|------|---------|:---:|
| Nome ristorante | "Da Michele" | Si |
| Indirizzo | "Via Roma 10, Milano" | Si |
| Telefono | "+390212345678" | Si |
| Orari apertura (pranzo/cena per ogni giorno) | Lun chiuso, Mar 12:30-14:30 / 19:00-22:30 | Si |
| Giorni di chiusura fissi | Lunedì, Domenica | Si |
| Chiusure straordinarie | Natale, Capodanno | Si |
| Max persone per prenotazione | 6 | Si |
| Capacità contemporanea (max prenotazioni attive nello stesso slot) | 3 | Si |
| Durata media permanenza | 60 min | Si |
| Cutoff prenotazione (minuti prima della chiusura) | 30 | Si |
| FAQ: parcheggio, allergeni, animali, tavoli all'aperto, menu, eventi | Testo libero | Si |
| Backend scelto | resOS / OctoTable / Google Sheets | Si |
| Credenziali API (se resOS/OctoTable) | API key / restaurant ID | Se gestionale |
| Numero di telefono da usare | Twilio nuovo o esistente | Si |

---

## 4. Scegliere il backend prenotazioni

| Backend | Quando usarlo | Cosa serve |
|---------|---------------|------------|
| **resOS** | Ristorante usa già resOS o vuole gestionale professionale | API key + restaurant ID resOS |
| **OctoTable** | Ristorante usa già OctoTable | Credenziali API OctoTable |
| **Google Sheets** | Ristorante piccolo, nessun gestionale, budget base | Google Sheet + Calendar + Service Account |

---

## 5. Setup tecnico

### 5.1 Creare la KB del ristorante

Copia `docs/template_kb_ristorante.json` → `kb/<restaurant_id>.json`

Compila:
- `id` → il restaurant_id scelto
- `name`, `address`, `phone`
- `timezone` → "Europe/Rome" (o altro)
- `max_people` → max persone per prenotazione
- `max_concurrent_bookings` → capacità contemporanea
- `avg_stay_minutes` → durata media permanenza
- `booking_cutoff_minutes` → cutoff prenotazione
- `openings` → orari per ogni giorno (formato `"HH:MM"`)
- `openings.overrides` → chiusure straordinarie
- `faq` → array di domande/risposte

### 5.2 Creare il file FAQ per Vapi Knowledge Base

Crea `kb/<restaurant_id>-faq-vapi.md` con le FAQ in formato markdown:
- Titolo con `#`
- Ogni domanda con `**D:**` e risposta con `**R:**`
- Sezioni raggruppate (menu, policy, servizi, ecc.)

Questo file va caricato su Vapi nella Knowledge Base dell'assistente.

### 5.3 Aggiornare ristoranti.json

In `src/config/ristoranti.json` aggiungi:

```json
"<restaurant_id>": {
  "name": "Nome Ristorante",
  "kb_path": "kb/<restaurant_id>.json",
  "timezone": "Europe/Rome",
  "sms_number": "+39XXXXXXXXXX",
  "max_people": 6,
  "reservations_backend": "resos",
  "prompt_version": "v1.0"
}
```

Aggiungi anche i campi specifici del backend:
- **Sheets:** `"sheet_id"`, `"calendar_id"`
- **resOS:** `"resos_restaurant_id"`, `"resos_api_key_env": "RESOS_API_KEY_<ID>"` (nome var .env con la chiave API)
- **OctoTable:** `"octotable_restaurant_id"`, `"octotable_client_id_env": "OCTOTABLE_CLIENT_ID_<ID>"`, `"octotable_client_secret_env": "OCTOTABLE_CLIENT_SECRET_<ID>"`

In `.env` aggiungi la chiave reale con il nome scelto (es. `RESOS_API_KEY_MODENA01=chiave_reale`).

### 5.4 Creare il System Prompt

Copia un prompt esistente da `prompts/` e adatta:
- `restaurant_id` → il nuovo ID
- Nome ristorante
- `is_open_now(restaurant_id="<nuovo_id>")`
- `transfer_call_tool_<restaurant_id>` (se serve handover)
- Versione `(v1.0)` nel titolo
- Riga nel changelog

Salva come `prompts/System-Prompt-Receptionist_<restaurant_id>.md`

### 5.5 Se backend Google Sheets

1. Crea Google Sheet con struttura esatta: `booking_id | day | time | people | name | phone | notes | created_at | event_id`
2. Recupera `sheet_id` dall'URL
3. Crea Google Calendar dedicato
4. Condividi il calendario con il Service Account (permesso modifica)
5. Recupera `calendar_id`

### 5.6 Se backend resOS

1. Ottieni API key dal ristorante (pannello resOS)
2. Ottieni il restaurant_id resOS
3. In `ristoranti.json`: aggiungi `"resos_api_key_env": "RESOS_API_KEY_<ID>"`
4. In `.env` locale: aggiungi `RESOS_API_KEY_<ID>=chiave_reale`
5. Su **Render → Environment Variables**: aggiungi la stessa variabile `RESOS_API_KEY_<ID>=chiave_reale`

### 5.7 Se backend OctoTable

1. Ottieni client_id e client_secret dal ristorante (pannello OctoTable)
2. Ottieni il restaurant_id OctoTable
3. In `ristoranti.json`: aggiungi `"octotable_client_id_env": "OCTOTABLE_CLIENT_ID_<ID>"` e `"octotable_client_secret_env": "OCTOTABLE_CLIENT_SECRET_<ID>"`
4. In `.env` locale: aggiungi `OCTOTABLE_CLIENT_ID_<ID>=id_reale` e `OCTOTABLE_CLIENT_SECRET_<ID>=secret_reale`
5. Su **Render → Environment Variables**: aggiungi le stesse variabili

### 5.8 Regola generale .env / Render

**IMPORTANTE:** Ogni variabile presente in `.env` locale DEVE essere presente anche su Render in Environment Variables. `.env` serve per lo sviluppo locale, Render per la produzione. Se manca una variabile su Render, il server online non funziona.

---

## 6. Deploy

1. Commit + Push:
```
git add .
git commit -m "Add <restaurant_id>"
git push
```

2. Verifica deploy su Render → build OK

3. Testa: `GET /status` → `{ ok: true }`

4. Esegui regression test: `node scripts/regression-tests.js https://tuo-deploy.onrender.com`

---

## 7. Configurazione Vapi

### 7.1 Crea nuovo Assistant
- Duplica un assistente esistente (es. modena01)

### 7.2 System Prompt
- Incolla il prompt creato al punto 5.4

### 7.3 Knowledge Base
- Carica il file `kb/<restaurant_id>-faq-vapi.md` nella sezione Files di Vapi
- Assegna il file all'assistente nella sezione Knowledge Base

### 7.4 Tools HTTP
Configura TUTTI i tool puntando al backend Render:
- `https://<render-app>.onrender.com/api/check_openings`
- `https://<render-app>.onrender.com/api/create_booking`
- `https://<render-app>.onrender.com/api/list_bookings`
- `https://<render-app>.onrender.com/api/modify_booking`
- `https://<render-app>.onrender.com/api/cancel_booking`
- `https://<render-app>.onrender.com/api/resolve_relative_day`
- `https://<render-app>.onrender.com/api/resolve_relative_time`
- `https://<render-app>.onrender.com/api/is_open_now`
- `https://<render-app>.onrender.com/api/send_sms`

NON configurare il tool `faq` — le FAQ passano dalla Knowledge Base di Vapi.

### 7.5 Test in chat Vapi
- Prenotazione
- Modifica
- Cancellazione
- Orari
- FAQ

---

## 8. Numero telefonico (Twilio)

1. Collega account Twilio a Vapi
2. Importa/crea numero in Vapi → Phone Numbers
3. Assegna il numero all'Assistant del ristorante
4. Test chiamata reale

---

## 9. Test finale end-to-end

Simula una chiamata vocale e verifica:

1. Prenotazione → compare nel gestionale/Sheet
2. Modifica → aggiornata nel gestionale/Sheet
3. Cancellazione → rimossa nel gestionale/Sheet
4. FAQ → risponde correttamente
5. Orari → risponde correttamente
6. Handover → trasferisce se aperto, avvisa se chiuso

Controlla `/metrics` per confermare che non ci sono errori.

Se tutto OK → ristorante operativo.

---

## 10. Cosa dire al ristorante

- L'AI gestisce prenotazioni, modifiche, cancellazioni, orari e FAQ
- Non gestisce richieste complesse fuori scope (ordini, reclami, ecc.)
- In caso di errore o richiesta complessa, l'AI trasferisce a un operatore
- Il ristorante DEVE tenere aggiornati orari e capacità (comunicare ogni cambio)
- Le prenotazioni hanno stato "accettato" automaticamente (resOS: status approved)
- L'AI non può garantire 100% accuratezza — è un assistente, non un sostituto umano

---

## Tempo stimato setup

| Fase | Tempo |
|------|-------|
| Raccolta dati dal ristorante | 15-30 min |
| Setup tecnico (KB, config, prompt) | 20-30 min |
| Setup Vapi (assistant, KB, tools) | 15-20 min |
| Test e deploy | 10-15 min |
| **Totale** | **60-90 min** |
