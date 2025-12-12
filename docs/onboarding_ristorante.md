# Onboarding Nuovo Ristorante – AI Receptionist VAPI
Guida operativa passo-per-passo per attivare un nuovo ristorante nel sistema VAPI + Backend + Twilio.

---

# 1. Prerequisiti

Per completare l’onboarding servono:

- Accesso Google Sheets (creazione foglio prenotazioni)
- Accesso Google Calendar (creazione calendario prenotazioni)
- Accesso al repository del progetto `ai-receptionist-vapi`
- Accesso a Render (deploy backend)
- Accesso a Vapi (Assistant)
- Accesso Twilio (numero telefonico)

---

# 2. Definizione restaurant_id

Scegli il codice ristorante che userai ovunque.  
Esempi validi: `roma`, `milano_centro`, `napoli_vomero`.

Questo ID deve essere identico in:

1. `kb/<restaurant_id>.json`
2. `src/config/ristoranti.json`
3. System Prompt dell’Assistant Vapi
4. Tool API Calls verso il backend

Regole di naming:

- solo minuscole  
- niente spazi  
- niente caratteri speciali  

---

# 3. Creazione Google Sheet Prenotazioni

### 3.1 Crea un nuovo foglio Google
1. Google Drive → **Nuovo → Foglio Google**  
2. Nome consigliato:  
   **Booking_<restaurant_id>**

---

### 3.2 Imposta la struttura ESATTA del foglio  
Questa è la struttura ufficiale del PROJECT: booking_id | day | time | people | name | phone | notes | created_at | event_id


**IMPORTANTISSIMO:**  
- i nomi devono essere identici  
- l’ordine deve essere identico  
- nessuna colonna extra  

Queste colonne sono richieste dai files:

- `create_booking.js`  
- `modify_booking.js`  
- `cancel_booking.js`  
- `list_bookings.js`  
- `reservations.js`

Se non usi questa struttura → **le prenotazioni non funzionano**.

---

### 3.3 Recupera il Sheet ID
1. Apri il foglio  
2. Copia la parte dentro l’URL: 
https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit


---

# 4. Creazione Google Calendar Prenotazioni

### 4.1 Crea un calendario
Nome consigliato:  
**Prenotazioni <restaurant_id>**

### 4.2 Condividi con il Service Account
Include il Service Account con permesso:
**“Apportare modifiche agli eventi”**

### 4.3 Recupera il Calendar ID
Lo trovi nelle impostazioni del calendario, sezione “Integrazione calendario”.

Formato tipico: <calendar_id>@group.calendar.google.com


---

# 5. Creazione KB del ristorante

### 5.1 Crea il file KB
Copiando: docs/template_kb_ristorante.json
 
Crealo come: kb/<restaurant_id>.json


### 5.2 Compila i campi obbligatori
- `id`
- `name`
- `address`
- `phone`
- `max_people`
- `openings` (formato rigoroso `"HH:MM"`)
- `faq`

### 5.3 Errori da evitare
- JSON non valido  
- orari non nel formato corretto  
- FAQ non confermate con il ristorante  

---

# 6. Aggiornare `src/config/ristoranti.json`

Aggiungi una nuova entry usando il template:

```json
"<restaurant_id>": {
  "name": "Ristorante NOME",
  "kb_path": "kb/<restaurant_id>.json",
  "sheet_id": "GOOGLE_SHEET_ID",
  "calendar_id": "GOOGLE_CALENDAR_ID",
  "timezone": "Europe/Rome",
  "sms_number": "+39NUMERO",
  "max_people": 6
}

**IMPORTANTE:**
`kb_path`, `sheet_id`, `calendar_id` devono puntare correttamente ai file creati.

---

# 7. Deploy su Render

### 7.1 Commit + Push

```
git add .
git commit -m "Add <restaurant_id>"
git push
```

### 7.2 Render

* Verifica build OK
* Test `/status` → deve rispondere `{ ok: true }`

---

# 8. Configurazione Assistant Vapi

### 8.1 Duplica l’assistente base (G13)

### 8.2 Aggiorna System Prompt

Imposta:

* `restaurant_id`
* Nome del ristorante

### 8.3 Configura Tools HTTP

Per l’assistant del ristorante configura TUTTI i 7 tools HTTP puntando al backend su Render:
Devono puntare al backend Render:

```
https://<render-app>.onrender.com/api/create_booking
https://<render-app>.onrender.com/api/modify_booking
https://<render-app>.onrender.com/api/cancel_booking
https://<render-app>.onrender.com/api/check_openings
https://<render-app>.onrender.com/api/list_bookings
https://<render-app>.onrender.com/api/faq
https://<render-app>.onrender.com/api/send_sms
```

### 8.4 Test chat:

* prenota
* modifica
* cancella
* orari
* FAQ

---

## 9. Configurazione numero telefonico

### Opzione Numero Twilio esistente (importato)

1.Collega l’account Twilio a Vapi
2.Importa il numero in Vapi → Phone Numbers
3.Scegli un numero esistente oppure importa un numero Twilio.
4.Collega il numero all’Assistant del ristorante

---

# 10. Test finale end-to-end

Simula una chiamata:

1. Prenotazione
2. Modifica
3. Cancellazione
4. FAQ

Poi verifica:

* Google Sheet
* Google Calendar

Se tutto è corretto → ristorante operativo.

---



