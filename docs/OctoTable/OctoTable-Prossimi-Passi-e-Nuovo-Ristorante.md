# OctoTable – Prossimi passi e nuovo ristorante

---

## 1. Cosa manca per “finire” OctoTable

**Nel codice non manca nulla.** Abbiamo già:

- Adapter OctoTable (`reservations-octotable.js`)
- Switch in `reservations.js` (Sheets vs OctoTable in base a `RESERVATIONS_BACKEND`)
- Documentazione endpoint e configurazione

Per **usare** OctoTable in produzione o per **testare** end-to-end ti servono solo:

1. **Piano con API** (almeno DigiMenu) su OctoTable
2. **Setup** seguendo la doc OctoTable: Create Client → Client ID/Secret, Create restaurant → `restaurant_id`
3. **Configurazione** nel nostro progetto: `.env` (credenziali) e, se serve, `octotable_restaurant_id` in `ristoranti.json`

Quindi “finire” = quando vuoi, attivi il piano, fai lo setup su OctoTable e compili `.env` + config.

---

## 2. Acquistare DigiMenu e creare account: ora o dopo?

**Non è obbligatorio farlo subito.**

- **Se vuoi testare OctoTable** (chiamate API, prenotazioni che compaiono su OctoTable): allora sì, serve il piano DigiMenu (o superiore) e l’account, così ottieni Client ID/Secret e crei il ristorante su OctoTable.
- **Se per ora resti solo su Google Sheets/Calendar:** non fare nulla. Non imposti `RESERVATIONS_BACKEND=octotable` e non metti credenziali OctoTable; il sistema continua a usare solo Sheets/Calendar come prima.

In sintesi: **acquisti e crei l’account OctoTable quando decidi di provare o usare OctoTable**; fino ad allora puoi ignorare OctoTable e usare solo Sheets.

---

## 3. Aggiungere un nuovo ristorante: cosa cambia rispetto a prima?

Oggi il backend prenotazioni è **unico per tutta l’app**: o tutti i ristoranti usano **Google Sheets/Calendar**, oppure tutti usano **OctoTable** (in base a `RESERVATIONS_BACKEND` e credenziali).

### Caso A – Nuovo ristorante con **Google Sheets/Calendar** (come prima)

**Non cambia nulla** rispetto a quando avevi solo Sheets/Calendar:

1. Crea il foglio Google (tab “Bookings”) e il calendario Google per quel ristorante.
2. In `src/config/ristoranti.json` aggiungi una nuova chiave (es. `"milano"`) con:
   - `name`, `kb_path`, `sheet_id`, `calendar_id`, `timezone`, `sms_number`, `max_people` (e altri campi che usi già).

Nessun uso di OctoTable, nessuna variabile OctoTable in `.env` per questo.

---

### Caso B – Nuovo ristorante con **OctoTable**

Prima devi avere:

- Piano DigiMenu (o superiore) attivo
- `RESERVATIONS_BACKEND=octotable` e `OCTOTABLE_CLIENT_ID` / `OCTOTABLE_CLIENT_SECRET` in `.env`

Poi:

1. **Su OctoTable** (doc ufficiale): crea il ristorante (e se serve le room) e prendi l’**ID ristorante** (es. `restaurant_id`).
2. In `src/config/ristoranti.json` aggiungi la nuova voce (es. `"modena02"`) con:
   - `name`, `kb_path`, `timezone`, `sms_number`, `max_people`, ecc.
   - **`octotable_restaurant_id`** = ID del ristorante su OctoTable (quello ottenuto al punto 1).
   - **Non servono** `sheet_id` e `calendar_id` per le prenotazioni (se quel ristorante usa solo OctoTable). Puoi ometterli o lasciarli vuoti se il codice non li usa per altro.

Esempio:

```json
"modena02": {
  "name": "Trattoria Octo",
  "kb_path": "kb/modena02.json",
  "octotable_restaurant_id": "abc123-id-ristorante-octotable",
  "timezone": "Europe/Rome",
  "sms_number": "+39...",
  "max_people": 6
}
```

Se l’ID OctoTable coincide con la chiave che usi nel nostro sistema (es. `"modena02"`), puoi anche omettere `octotable_restaurant_id`: l’adapter userà la chiave (`modena02`) come `restaurant_id` nelle chiamate API.

---

## 4. Riepilogo

| Domanda | Risposta |
|--------|-----------|
| Cosa manca per finire OctoTable? | Nulla nel codice. Per usare/testare: piano DigiMenu + setup OctoTable + `.env` e config. |
| Devo acquistare DigiMenu e creare account ora? | Solo quando vuoi testare o usare OctoTable; altrimenti resti su Sheets e non serve. |
| Aggiungere un nuovo ristorante cambia qualcosa? | **Con Sheets:** no, come prima (sheet_id, calendar_id, ecc.). **Con OctoTable:** sì: aggiungi `octotable_restaurant_id` (e niente sheet/calendar per le prenotazioni); prima devi aver attivato OctoTable per l’app (`RESERVATIONS_BACKEND=octotable` + credenziali). |
