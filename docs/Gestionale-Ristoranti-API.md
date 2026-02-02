# Gestionale per ristoranti via API – Valutazione e possibili soluzioni

## Idea: usare un gestionale per ristoranti invece di Google Sheets/Calendar

**Obiettivo:** collegare il backend (AI Receptionist) a un **gestionale per ristoranti** via API.  
Stesso flusso di oggi: l’AI crea/modifica/cancella prenotazioni e controlla la disponibilità; il personale usa il gestionale (app/sito) per vedere e gestire le stesse prenotazioni. **Una sola fonte di verità.**

---

## Cosa ne penso (in breve)

- **Sì, ha senso** e rende il sistema più professionale e coerente con il mercato.
- **Pro:** gestionale pensato per ristoranti (tavoli, orari, capacità, no-show, ecc.), UI per lo staff già pronta, spesso “Prenota con Google” e widget sito inclusi.
- **Contro:** dipendi dalle API del fornitore; va scelto un gestionale con **API pubbliche e documentate** (crea/lista/modifica/cancella prenotazioni + disponibilità).
- **Architettura:** il tuo backend resta invariato; aggiungi un **adapter** che al posto di Sheets/Calendar chiama le API del gestionale. Le tue API (`create_booking`, `list_bookings`, `check_openings`, ecc.) non cambiano.

---

## Cosa deve fare il gestionale (contratto minimo per il backend)

Il backend oggi si aspetta queste operazioni. Il gestionale deve permettere (via API) almeno:

| Operazione | Input | Output / Comportamento |
|------------|--------|-------------------------|
| **Crea prenotazione** | day, time, people, name, phone, notes | booking_id (o id prenotazione) |
| **Lista prenotazioni per telefono** | restaurant_id, phone (normalizzato) | lista prenotazioni future con id, day, time, people, name |
| **Lista prenotazioni per giorno** | restaurant_id, day (YYYY-MM-DD) | lista prenotazioni del giorno (per calcolare disponibilità in check_openings) |
| **Modifica prenotazione** | booking_id, new_day, new_time, new_people (opz.) | ok / errore |
| **Cancella prenotazione** | booking_id | ok / errore |

Opzionale ma utile:
- **Disponibilità / slot** (se il gestionale espone “slot disponibili per giorno/ora”) per semplificare `check_openings`; altrimenti la calcoli tu come oggi (openings da KB + prenotazioni del giorno).

---

## Possibili soluzioni (gestionali con API o integrazioni)

### 1. **OctoTable** (octotable.com)
- **Pro:** italiano, zero commissioni, Prenota con Google, menù digitale, citano “API aperte” e integrazioni (Zapier, sincronizzazione con gestionale).
- **Da verificare:** documentazione API pubblica (endpoint REST per crea/lista/modifica/cancella prenotazioni e, se esiste, disponibilità). Senza doc API non puoi fare l’adapter in modo pulito.
- **Azione:** contattare OctoTable (o community “Octorate”) e chiedere: documentazione API REST, endpoint per prenotazioni e (se disponibile) disponibilità/slot.

### 2. **Tableo** (tableo.com)
- **Pro:** gestionale cloud per ristoranti, prenotazioni multi-canale, widget sito, Reserve with Google, gestione tavoli, report.
- **Da verificare:** se espongono API REST per sviluppatori (crea/lista/modifica/cancella prenotazioni). Sul sito non risulta doc API pubblica; spesso questi prodotti hanno API per partner o su richiesta.
- **Azione:** chiedere a Tableo se hanno API per integrazioni esterne (es. “voi gestite le chiamate AI, noi il calendario”) e documentazione tecnica.

### 3. **resOS** (resos.com)
- **Pro:** API REST documentata (Postman), crea prenotazioni da telefono/altri canali, lista prenotazioni, modifica/cancella, vista calendario. Pensato per integrazioni.
- **Contro:** prodotto nordico; pricing e supporto in italiano da verificare.
- **Azione:** valutare pricing e supporto; se ok, è un candidato forte per un adapter “pulito”.

### 4. **SevenRooms** (sevenrooms.com)
- **Pro:** API per reservation management, client data, multi-venue; integrazioni con Google, TheFork, ecc. Doc su api-docs.sevenrooms.com (per account).
- **Contro:** orientato a operatori grandi/premium; costo probabilmente più alto per ristoranti medi.
- **Azione:** utile se punti a clienti più grandi o catene; verificare pricing e se hanno offerte per singoli ristoranti.

### 5. **Quandoo for Restaurants** (restaurants.quandoo.com)
- **Pro:** integrazioni con gestionali (SevenRooms, ResDiary, ecc.), grande rete prenotazioni.
- **Contro:** modello a rete/commissioni; l’integrazione tipica è “gestionale ↔ Quandoo”, non necessariamente “tuo backend ↔ Quandoo” con API dirette.
- **Azione:** capire se Quandoo espone API per creare/leggere prenotazioni da sistemi esterni (es. la tua AI) o se l’accesso è solo tramite loro partner.

### 6. **OpenTable** (opentable.it)
- **Pro:** API per partner, gestione prenotazioni, grande visibilità.
- **Contro:** modello a commissioni e a rete; spesso più adatto a chi vuole entrare nella loro rete che a “solo backend + AI”.
- **Azione:** valido se il ristorante vuole anche essere su OpenTable; verificare se l’API permette di creare/gestire prenotazioni “solo telefono/solo AI” senza obbligo di canale OpenTable.

---

## Come scegliere (checklist)

Quando approfondisci OctoTable, Tableo o altri, verifica:

1. **API pubbliche**
   - Documentazione REST (o GraphQL) accessibile.
   - Endpoint per: crea prenotazione, lista prenotazioni (per telefono e per giorno), modifica, cancella.
   - Autenticazione chiara (es. API key, OAuth).

2. **Modello dati**
   - Identificativo univoco prenotazione (id).
   - Campi: data, ora, numero persone, nome, telefono, note.
   - Possibilità di filtrare per telefono e per giorno.

3. **Disponibilità**
   - Se c’è un endpoint “slot disponibili per giorno/ora” → puoi semplificare `check_openings`.
   - Altrimenti: endpoint “prenotazioni per giorno” e calcoli la disponibilità nel backend come oggi (openings da KB + prenotazioni).

4. **Pricing**
   - Costo per ristorante/mese.
   - Costi per chiamate API o limiti di richieste.
   - Eventuali costi di setup o di integrazione.

5. **Supporto e contratto**
   - Supporto tecnico per integrazioni.
   - SLA e stabilità API.
   - Possibilità di export dati (per non restare bloccati).

6. **Mercato italiano**
   - Lingua, supporto, contatti in Italia.
   - Se il ristorante usa già “Prenota con Google” o widget sul sito, il gestionale dovrebbe essere compatibile.

---

## Architettura con il gestionale

```
┌─────────────────────────────────────────────────────────────┐
│  Vapi (AI Receptionist)                                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Tuo backend (Node.js)                                       │
│  - create_booking, list_bookings, modify_booking,             │
│    cancel_booking, check_openings (stesse API di oggi)        │
│  - Adapter: reservations-gestionale.js                        │
│    (chiama API del gestionale invece di Sheets/Calendar)      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Gestionale per ristoranti (OctoTable / Tableo / resOS …)   │
│  - Database prenotazioni                                     │
│  - App / portale per lo staff                                │
│  - (Opz.) Widget sito, Prenota con Google                    │
└─────────────────────────────────────────────────────────────┘
```

- **Personale:** usa l’app o il portale del gestionale (stesse prenotazioni che crea l’AI).
- **AI:** usa il tuo backend, che parla solo con l’adapter; l’adapter traduce le tue operazioni in chiamate al gestionale.

---

## Prossimi passi pratici

1. **OctoTable:** chiedere documentazione API (endpoint prenotazioni + disponibilità) e condizioni per integrazioni “backend esterno”.
2. **Tableo:** chiedere se hanno API per sviluppatori e doc tecnica per prenotazioni.
3. **resOS:** scaricare la doc API (Postman), verificare che gli endpoint coprano il contratto sopra; poi pricing e supporto Italia.
4. **Adapter:** quando hai scelto un gestionale con API adeguate, creare `src/reservations-gestionale.js` (es. `reservations-octotable.js`) che implementa le stesse funzioni di `reservations.js` ma chiamando le API del gestionale. Config per ristorante: `provider: "octotable"` (o altro) + credenziali/endpoint.

Se vuoi, il passo successivo può essere uno **schema dell’adapter** (funzioni da implementare e mappatura request/response per un gestionale tipo OctoTable o resOS) o una **tabella comparativa** OctoTable vs Tableo vs resOS una volta che hai le risposte dai fornitori.
