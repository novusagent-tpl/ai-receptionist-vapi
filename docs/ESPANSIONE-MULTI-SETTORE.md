# Espansione Multi-Settore — Analisi e Piano Dettagliato

Il nostro sistema nasce per ristoranti, ma l'architettura (Vapi + backend Node.js + KB + prompt) si adatta facilmente ad altri settori. Questo documento analizza due scenari di espansione e il piano per implementarli.

---

## Scenario 1: Solo informazioni + handover (senza prenotazioni)

### Concetto

L'assistente AI risponde al telefono, dà informazioni (orari, indirizzo, FAQ), e se il cliente ha bisogno di qualcosa di complesso (acquisto, preventivo, prenotazione), trasferisce la chiamata al personale.

### Attivita adatte

| Settore | Domande ripetitive tipiche | Perche serve |
|---------|---------------------------|-------------|
| **Fiorai** | Fate consegne? Quanto costa un bouquet? Orari? | Occupati con composizioni, non rispondono |
| **Ferramenta** | Avete X prodotto? Siete aperti sabato? Dove siete? | In magazzino, non sentono il telefono |
| **Lavanderie** | Quanto costa un vestito? Fate tende? Quando e pronto? | Al bancone con clienti |
| **Agenzie onoranze funebri** | Orari apertura, servizi offerti, come procedere | Chiamate delicate, spesso fuori sede |
| **Veterinari** | Orari visite, urgenze, vaccini, prezzi base | In visita, non possono rispondere |
| **Studi legali/commercialisti** | Orari ricevimento, documenti da portare, aree di competenza | In consulenza, segretaria occupata |
| **Officine auto** | Fate tagliandi? Quanto costa? Siete aperti sabato? | Sotto le macchine, mani sporche |
| **Idraulici/elettricisti** | Zone coperte, orari, urgenze, tariffe base | Fuori in cantiere tutto il giorno |
| **Farmacie** | Orari apertura, turni notte, avete X farmaco? | Coda al bancone |
| **Negozi elettronica** | Avete X modello? Fate riparazioni? Garanzia? | Occupati con clienti in negozio |
| **Agenzie viaggi** | Orari, servizi offerti, documenti necessari | In consulenza con clienti |
| **Agenzie immobiliari** | Orari, zone coperte, come funziona, documenti | Fuori per visite |
| **Scuole guida** | Orari, prezzi patente, documenti, iscrizione | Lezioni in corso |
| **Dentisti (solo info)** | Orari, urgenze, prima visita, assicurazioni accettate | In studio con pazienti |
| **Palestre** | Orari, prezzi abbonamenti, corsi disponibili, prova gratuita | Occupati con lezioni |
| **Centri copisteria/stampa** | Orari, servizi, formati, prezzi, tempi | Al bancone con clienti |

### Cosa serve dal sistema attuale

| Tool | Serve? | Note |
|------|--------|------|
| `check_openings` | Si | Orari apertura/chiusura |
| `is_open_now` | Si | Per decidere se fare handover |
| `faq` | Si | FAQ personalizzate per l'attivita |
| `resolve_relative_day` | Si | "Siete aperti domani?" |
| `resolve_relative_time` | Si | "Siete aperti tra un'ora?" |
| `transfer_call` | Si | Handover al personale |
| `send_sms` | Opzionale | Mandare info via SMS (indirizzo, link) |
| `create_booking` | No | |
| `modify_booking` | No | |
| `cancel_booking` | No | |
| `list_bookings` | No | |

### Cosa cambia rispetto al sistema ristoranti

| Componente | Cambiamento | Effort |
|-----------|-------------|--------|
| **System prompt** | Versione semplificata: rimuovere i flow prenotazione/modifica/cancellazione. Tenere solo FAQ + Orari + Handover | 30 min per template |
| **KB (JSON)** | FAQ diverse per tipo di attivita | 30-60 min per attivita |
| **FAQ Vapi (MD)** | Stesso formato, contenuto diverso | 30 min per attivita |
| **ristoranti.json** | Nuova entry senza `reservations_backend` | 5 min |
| **Backend** | Zero modifiche | 0 |
| **Codice** | Zero modifiche | 0 |

### Template System Prompt (solo info + handover)

```
SYSTEM PROMPT – AI Receptionist [NOME ATTIVITA] (v1.0)

Ruolo: receptionist virtuale telefonica. business_id: "[ID]".
Oggi: {{ "now" | date: "%Y-%m-%d", "Europe/Rome" }}.
Ora: {{ "now" | date: "%H:%M", "Europe/Rome" }}.

REGOLE:
- business_id: SEMPRE "[ID]". Mai chiederlo.
- Mai inventare informazioni. Consultare SEMPRE la Knowledge Base.
- Se il cliente chiede qualcosa che non e nella KB: "Non ho questa informazione.
  Vuole che la metta in contatto con [l'attivita]?"

FLOW INFORMAZIONI:
1. Cliente chiede info (orari, servizi, prezzi, indirizzo) → consultare KB
2. Se la risposta e nella KB → rispondere
3. Se non c'e → "Non ho questa informazione disponibile."
   Se is_open_now=true → "Vuole che la metta in contatto?"
   Se is_open_now=false → "Puo contattarci quando siamo aperti."

FLOW ORARI:
1. Cliente chiede orari → resolve_relative_day se necessario → check_openings
2. Comunicare orari. Non avviare nessun altro flow.

FLOW HANDOVER:
1. Cliente chiede di parlare con qualcuno / ha bisogno complesso / vuole prenotare
2. is_open_now → se aperto → transfer. Se chiuso → dire orari riapertura.

FLOW PRENOTAZIONE (redirect):
- Se il cliente chiede di prenotare: "Per le prenotazioni la metto in contatto
  con il personale." → is_open_now → transfer se aperto.
- Mai gestire prenotazioni direttamente.

TONO: semplice, professionale, breve. Una domanda per volta.
```

### Template KB (solo info)

```json
{
  "id": "fioraio01",
  "name": "Fiori di Maria",
  "timezone": "Europe/Rome",
  "address": "Via Roma 10, Milano",
  "phone": "+390212345678",

  "openings": {
    "monday":    { "closed": false, "morning": ["08:30", "12:30"], "afternoon": ["15:00", "19:00"] },
    "tuesday":   { "closed": false, "morning": ["08:30", "12:30"], "afternoon": ["15:00", "19:00"] },
    "wednesday": { "closed": false, "morning": ["08:30", "12:30"], "afternoon": ["15:00", "19:00"] },
    "thursday":  { "closed": false, "morning": ["08:30", "12:30"], "afternoon": ["15:00", "19:00"] },
    "friday":    { "closed": false, "morning": ["08:30", "12:30"], "afternoon": ["15:00", "19:00"] },
    "saturday":  { "closed": false, "morning": ["08:30", "12:30"], "afternoon": null },
    "sunday":    { "closed": true,  "morning": null, "afternoon": null }
  },

  "faq": [
    { "q": "Fate consegne a domicilio?", "a": "Si, consegniamo in tutta Milano e hinterland. Per consegne fuori zona contattateci.", "keywords": ["consegna", "domicilio", "spedizione"] },
    { "q": "Quanto costa un bouquet?", "a": "I bouquet partono da 25 euro. Per composizioni personalizzate contattateci.", "keywords": ["bouquet", "prezzo", "costo", "quanto"] },
    { "q": "Fate composizioni per matrimoni?", "a": "Si, realizziamo composizioni per matrimoni, battesimi e cerimonie. Contattateci per un preventivo.", "keywords": ["matrimonio", "cerimonia", "evento"] },
    { "q": "Avete piante da appartamento?", "a": "Si, abbiamo una vasta selezione di piante da interno.", "keywords": ["piante", "appartamento", "interno"] },
    { "q": "Dove siete?", "a": "Siamo in Via Roma 10, Milano, zona Duomo.", "keywords": ["indirizzo", "dove", "posizione"] },
    { "q": "Accettate carte?", "a": "Si, accettiamo carte di credito, bancomat e contanti.", "keywords": ["carta", "pagamento", "contanti", "bancomat"] }
  ]
}
```

### Nota sugli orari: "morning/afternoon" vs "lunch/dinner"

Per le attivita non-ristorazione, le fasce orarie sono "mattina/pomeriggio" invece di "pranzo/cena". Il sistema `check_openings` attualmente usa `lunch` e `dinner` come chiavi. Due opzioni:

1. **Opzione semplice (zero codice):** usare `lunch` e `dinner` come chiavi interne anche per le altre attivita — nel prompt si dice "Siamo aperti la mattina dalle X alle Y e il pomeriggio dalle A alle B" invece di "a pranzo/a cena". Funziona subito.

2. **Opzione pulita (piccola modifica):** aggiungere supporto per chiavi generiche (`slot_1`, `slot_2` oppure `morning`, `afternoon`) in `check_openings`. Effort: ~1 ora.

Consiglio: partire con opzione 1 (zero codice), migrare a opzione 2 quando si hanno 5+ attivita non-ristorazione.

### Effort totale per una nuova attivita solo-info

| Step | Cosa | Tempo |
|------|------|-------|
| 1 | Raccogliere info dall'attivita (orari, FAQ, indirizzo) | 15 min |
| 2 | Creare KB JSON | 30 min |
| 3 | Creare FAQ Vapi (MD) | 20 min |
| 4 | Adattare system prompt dal template | 15 min |
| 5 | Aggiungere in `ristoranti.json` | 5 min |
| 6 | Configurare su Vapi (assistant + KB + tools) | 15 min |
| 7 | Test veloce (chiama e verifica) | 10 min |
| **Totale** | | **~2 ore** |

---

## Scenario 2: Con prenotazioni (barbieri, centri estetici, ecc.)

### Concetto

Come i ristoranti, ma la prenotazione ha campi diversi: servizio specifico (taglio, colore, manicure) invece di "numero persone", durata variabile, e spesso un operatore preferito.

### Attivita adatte

| Settore | Tipo prenotazione |
|---------|-------------------|
| **Barbieri** | Servizio (taglio, barba, taglio+barba) + operatore |
| **Centri estetici** | Servizio (manicure, ceretta, massaggio) + operatore |
| **Parrucchieri** | Servizio (taglio, colore, piega) + operatore |
| **Fisioterapisti** | Tipo trattamento + terapista |
| **Dentisti** | Tipo visita (controllo, pulizia, urgenza) |
| **Personal trainer** | Tipo sessione + trainer |
| **Studi medici** | Tipo visita + medico |
| **Consulenti/coach** | Tipo sessione (prima consulenza, follow-up) |

### Differenze rispetto ai ristoranti

| Aspetto | Ristorante | Barbiere/centro estetico |
|---------|-----------|-------------------------|
| **Cosa si prenota** | Tavolo (generico) | Servizio specifico |
| **Campo principale** | `people` (quante persone) | `service` (quale servizio) |
| **Durata** | Uguale per tutti (~1-2h, gestita dal gestionale) | Varia per servizio (30min, 1h, 2h) |
| **Operatore** | Non rilevante | Spesso specifico ("con Marco") |
| **Persone** | 1-8+ | Quasi sempre 1 |
| **Gestionale** | OctoTable, resOS | Treatwell, Fresha, Booksy, Google Calendar |

### Cosa cambia nel sistema

| Componente | Cambiamento necessario | Effort |
|-----------|----------------------|--------|
| **System prompt** | Flow prenotazione diverso: chiedere SERVIZIO e opzionalmente OPERATORE invece di PERSONE | 1-2 ore |
| **KB** | Lista servizi con durate e prezzi (nel JSON e nel FAQ Vapi) | 30-60 min per attivita |
| **check_openings** | Piccola modifica: considerare durata servizio per verificare se lo slot e abbastanza lungo | 2-3 ore |
| **create_booking** | Passare `service` e `operator` invece di (o in aggiunta a) `people` | 1-2 ore |
| **Backend adapter** | Se Google Calendar: gia supportato (con piccole modifiche). Se Treatwell/Fresha: nuovo adapter | 1 giorno (GCal) / 3-5 giorni (nuovo adapter) |

### Gestionali per barbieri/centri estetici

| Gestionale | API disponibili? | Effort adapter | Note |
|-----------|-----------------|----------------|------|
| **Google Calendar** | Si (gia integrato) | 1 giorno | Funziona per attivita piccole (1-2 operatori). Ogni operatore = 1 calendario |
| **Treatwell** | Si (partner API) | 3-5 giorni | Popolare in Italia per centri estetici. Serve contatto per API access |
| **Fresha** | Si (API pubblica) | 3-5 giorni | Molto diffuso tra barbieri. API ben documentata |
| **Booksy** | Si (API partner) | 3-5 giorni | Popolare per barbieri. Serve partnership |
| **SimplyBook.me** | Si (API REST) | 2-3 giorni | Generico, buona API |

### Approccio consigliato: Google Calendar (per iniziare)

Per barbieri/centri piccoli, Google Calendar funziona bene:

```
Operatore "Marco"  →  Google Calendar "marco@barbiere.com"
Operatore "Luca"   →  Google Calendar "luca@barbiere.com"

Prenotazione:
  - Controlla se lo slot e libero nel calendario dell'operatore
  - Crea evento con durata del servizio
  - Titolo evento: "Taglio + barba - Mario Rossi (+39333...)"
```

Vantaggi: gia integrato, gratuito, nessun adapter nuovo.
Limiti: non gestisce servizi/prezzi automaticamente (sono nel KB), non scala a 5+ operatori.

### Come cambierebbe il flow prenotazione

**Ristorante (attuale):**
```
1. Raccogliere giorno → resolve_relative_day
2. Raccogliere orario → check_openings(day, time)
3. Raccogliere persone
4. Raccogliere nome
5. phone = numero chiamante
6. create_booking(day, time, people, name, phone)
```

**Barbiere/centro estetico (nuovo):**
```
1. Raccogliere servizio → "Che servizio desidera? Taglio, barba, o taglio e barba?"
   (lista servizi dal KB)
2. Raccogliere giorno → resolve_relative_day
3. Raccogliere orario → check_openings(day, time, duration=servizio.durata)
4. Raccogliere operatore (opzionale) → "Ha una preferenza per l'operatore?"
5. Raccogliere nome
6. phone = numero chiamante
7. create_booking(day, time, service, operator, name, phone)
```

### Template System Prompt (con prenotazioni servizio)

La differenza principale e nella sezione "Flow PRENOTAZIONE":

```
Flow PRENOTAZIONE (servizio)

1. Chiedere quale servizio desidera. Elencare i servizi disponibili dal KB
   (es. "Offriamo taglio, barba, taglio e barba, e trattamento capelli.
   Quale preferisce?").
2. Raccogliere day (resolve_relative_day se relativo).
3. Raccogliere time. check_openings(day, time). Verificare che la durata
   del servizio rientri nello slot disponibile.
4. Chiedere se ha una preferenza per l'operatore (opzionale).
   Se si: verificare disponibilita operatore.
   Se no: qualsiasi operatore disponibile.
5. Raccogliere nome; phone = numero_attivo.
6. Riepilogo: "Quindi [servizio] [giorno] alle [ora] con [operatore/chiunque],
   a nome [nome]. Confermo?"
7. create_booking con service, day, time, operator (opzionale), name, phone.
```

### Template KB (barbiere)

```json
{
  "id": "barbiere01",
  "name": "Barbershop Da Marco",
  "timezone": "Europe/Rome",
  "address": "Via Verdi 5, Roma",
  "phone": "+390612345678",

  "openings": {
    "monday":    { "closed": true },
    "tuesday":   { "closed": false, "lunch": ["09:00", "13:00"], "dinner": ["14:30", "19:00"] },
    "wednesday": { "closed": false, "lunch": ["09:00", "13:00"], "dinner": ["14:30", "19:00"] },
    "thursday":  { "closed": false, "lunch": ["09:00", "13:00"], "dinner": ["14:30", "19:00"] },
    "friday":    { "closed": false, "lunch": ["09:00", "13:00"], "dinner": ["14:30", "19:00"] },
    "saturday":  { "closed": false, "lunch": ["09:00", "13:00"], "dinner": null },
    "sunday":    { "closed": true }
  },

  "services": [
    { "name": "Taglio", "duration_minutes": 30, "price": "15 euro" },
    { "name": "Barba", "duration_minutes": 20, "price": "10 euro" },
    { "name": "Taglio + barba", "duration_minutes": 45, "price": "22 euro" },
    { "name": "Trattamento capelli", "duration_minutes": 60, "price": "30 euro" }
  ],

  "operators": [
    { "name": "Marco", "calendar_id": "marco@barbiere.com" },
    { "name": "Luca", "calendar_id": "luca@barbiere.com" }
  ],

  "faq": [
    { "q": "Quanto costa un taglio?", "a": "Il taglio costa 15 euro. Taglio e barba insieme 22 euro.", "keywords": ["prezzo", "costo", "quanto", "taglio"] },
    { "q": "Accettate solo su appuntamento?", "a": "Accettiamo sia su appuntamento che senza, ma con appuntamento avete la priorita.", "keywords": ["appuntamento", "prenotazione", "senza appuntamento"] },
    { "q": "Avete parcheggio?", "a": "Non abbiamo parcheggio privato, ma ci sono posti auto nelle vie vicine.", "keywords": ["parcheggio", "macchina"] },
    { "q": "Fate anche bambini?", "a": "Si, facciamo tagli per bambini al prezzo di 10 euro.", "keywords": ["bambini", "bambino", "ragazzi"] }
  ]
}
```

---

## Confronto effort per scenario

| Scenario | Codice nuovo | Effort una tantum | Effort per attivita | Priorita |
|----------|-------------|-------------------|---------------------|----------|
| **Solo info + handover** | Nessuno | Template prompt (1h) | ~2 ore | ALTA — si puo fare subito |
| **Prenotazioni + Google Calendar** | Piccole modifiche a check_openings e create_booking | 1-2 giorni | ~2 ore | MEDIA — dopo test ristoranti |
| **Prenotazioni + Treatwell/Fresha** | Nuovo adapter completo | 3-5 giorni per adapter | ~2 ore | BASSA — solo quando c'e domanda |

---

## Roadmap consigliata

### Fase 1 — Subito (zero codice)
- [ ] Creare template prompt "solo info + handover"
- [ ] Creare template KB per attivita generiche
- [ ] Testare con una attivita pilota (es. fioraio o ferramenta fittizio)
- [ ] Validare che i tool esistenti funzionano senza prenotazioni

### Fase 2 — Dopo test ristoranti (1-2 giorni di sviluppo)
- [ ] Aggiungere campo `services` al KB per barbieri/centri
- [ ] Modificare `check_openings` per considerare durata servizio
- [ ] Modificare `create_booking` per accettare `service` e `operator`
- [ ] Creare template prompt "prenotazione servizio"
- [ ] Testare con barbiere fittizio su Google Calendar

### Fase 3 — Quando c'e domanda (3-5 giorni per adapter)
- [ ] Contattare Treatwell/Fresha/Booksy per API access
- [ ] Sviluppare adapter (stesso pattern di OctoTable)
- [ ] Test su sandbox del gestionale
- [ ] Primo barbiere/centro reale

---

## Vantaggi competitivi dell'espansione

1. **Per attivita solo-info:** nessun competitor offre questo a basso costo. La maggior parte delle soluzioni AI sono per aziende grandi. Un fioraio o una ferramenta non ha alternative.

2. **Per barbieri/centri:** i gestionali (Treatwell, Fresha) offrono booking online ma NON gestiscono le chiamate. Il nostro sistema risolve il problema delle chiamate perse.

3. **Scalabilita:** lo stesso backend serve ristoranti, attivita solo-info, e barbieri. Nessun codice duplicato.

4. **Pricing differenziato:** attivita solo-info possono avere un piano piu economico (meno tool usati = meno costi Vapi).

---

*Ultimo aggiornamento: 2026-02-11*
