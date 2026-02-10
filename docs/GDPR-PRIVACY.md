# GDPR & Privacy — AI Receptionist

Documento interno che definisce come gestiamo i dati personali. Obbligatorio prima di vendere il servizio in EU.

---

## 1. Quali dati personali trattiamo

| Dato | Dove viene usato | Dove viene salvato |
|------|-----------------|-------------------|
| Numero di telefono | Identificare prenotazioni, SMS conferma | Gestionale (resOS/Sheets), log mascherato |
| Nome cliente | Associare alla prenotazione | Gestionale (resOS/Sheets), log mascherato |
| Giorno/ora prenotazione | Creare/modificare prenotazione | Gestionale (resOS/Sheets) |
| Numero persone | Prenotazione | Gestionale (resOS/Sheets) |
| Audio chiamata | Trascription AI (Vapi) | Vapi (verificare retention Vapi) |

**NON raccogliamo:** email, indirizzo cliente, dati di pagamento, dati di salute.

---

## 2. Mascheramento nei log (implementato)

Il logger (`src/logger.js`) maschera automaticamente i dati sensibili prima di scriverli nei log:

- **Telefono:** `+393331234567` → `+39XXX...567`
- **Nome:** `Mario Rossi` → `M***`

Nei log di Render/produzione non appare MAI un numero di telefono o nome completo.

---

## 3. Dove risiedono i dati

| Sistema | Dati | Controllo |
|---------|------|-----------|
| **Google Sheets** (backend roma) | Prenotazioni (nome, telefono, giorno, ora) | Noi (Service Account) |
| **Google Calendar** (backend roma) | Eventi prenotazione | Noi (Service Account) |
| **resOS** (backend modena01) | Prenotazioni | resOS (loro cloud EU) |
| **Vapi** | Audio/trascrizioni chiamate | Vapi (verificare DPA Vapi) |
| **Twilio** | Log chiamate, numero | Twilio (verificare DPA Twilio) |
| **Render** | Log applicazione (mascherati) | Noi |

---

## 4. Data retention (quanto conserviamo i dati)

| Dato | Retention | Note |
|------|-----------|------|
| Prenotazioni su Sheets | Finché il ristorante le mantiene | Il ristorante è responsabile |
| Prenotazioni su resOS | Secondo policy resOS | resOS è responsabile |
| Log su Render | 30 giorni (default Render) | Non contengono dati in chiaro |
| Audio su Vapi | Verificare policy Vapi | TODO: controllare retention Vapi |
| Log Twilio | Verificare policy Twilio | TODO: controllare retention Twilio |

---

## 5. Diritti dell'utente (cliente del ristorante)

Secondo GDPR, il cliente ha diritto a:

### Diritto di accesso
- Il cliente chiede "quali dati avete su di me?"
- Risposta: le prenotazioni associate al suo numero di telefono
- Procedura: il ristorante esporta dal gestionale/Sheets

### Diritto di cancellazione (diritto all'oblio)
- Il cliente chiede "cancellate i miei dati"
- Procedura:
  1. Cancellare prenotazioni dal gestionale/Sheets
  2. I log su Render non contengono dati in chiaro (mascherati)
  3. Verificare cancellazione su Vapi e Twilio

### Diritto di rettifica
- Il cliente chiede "correggete il mio nome/numero"
- Procedura: modifica nel gestionale/Sheets

---

## 6. Ruoli GDPR

| Ruolo | Chi è | Responsabilità |
|-------|-------|---------------|
| **Titolare del trattamento** | Il ristorante | Decide perché e come trattare i dati dei clienti |
| **Responsabile del trattamento** | Noi (fornitore AI Receptionist) | Trattiamo i dati per conto del ristorante |
| **Sub-responsabili** | Vapi, Twilio, Google, resOS, Render | Elaborano dati sotto nostra responsabilità |

---

## 7. Documenti da preparare prima del lancio

- [ ] **Privacy Policy** per il sito web (informativa pubblica)
- [ ] **DPA (Data Processing Agreement)** base da far firmare al ristorante
- [ ] **Elenco sub-responsabili** (Vapi, Twilio, Google, resOS, Render) con link alle loro DPA
- [ ] **Verificare retention policy** di Vapi e Twilio
- [ ] **Registro dei trattamenti** (documento interno obbligatorio per GDPR)

---

## 8. Piano rotazione chiavi API (Security)

Le chiavi API devono essere ruotate periodicamente per sicurezza. Ecco come fare per ogni servizio:

| Servizio | Come ruotare | Frequenza consigliata |
|----------|-------------|----------------------|
| **resOS** | Generare nuova API key dal pannello resOS → aggiornare `.env` e Render env vars | Ogni 6 mesi o se compromessa |
| **OctoTable** | Generare nuovo client_id/secret dal pannello OctoTable → aggiornare `.env` e Render | Ogni 6 mesi o se compromessa |
| **Google (Sheets/Calendar)** | Rigenerare chiave JSON del Service Account da Google Cloud Console → aggiornare env vars | Ogni 12 mesi o se compromessa |
| **Twilio** | Rigenerare Auth Token dal pannello Twilio → aggiornare env vars | Ogni 6 mesi o se compromessa |
| **Vapi** | Rigenerare API key dal pannello Vapi (se usata) | Ogni 6 mesi o se compromessa |

**Procedura:**
1. Genera la nuova chiave nel pannello del servizio
2. Aggiorna il valore in `.env` (locale) e in Render Environment Variables (produzione)
3. Fai un nuovo deploy su Render
4. Verifica che tutto funzioni con `npm test`
5. Revoca la vecchia chiave nel pannello del servizio

---

## 9. Checklist tecnica (implementata)

- [x] Telefono e nome mascherati automaticamente nei log
- [x] Nessun dato personale in chiaro nei log di produzione
- [x] Chiavi API mai nei log (solo in .env / Render env vars)
- [x] Dati prenotazione salvati solo nel gestionale del ristorante (non nel nostro backend)
- [ ] Verificare che Vapi non conservi audio oltre il necessario
- [ ] Verificare DPA Twilio e Google
