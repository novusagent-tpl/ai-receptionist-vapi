\# Visione \& Confini – AI Receptionist VAPI (MVP)


## Visione

L'MVP AI Receptionist VAPI è un sistema di risposta telefonica per ristoranti,
basato su un singolo Agent Vapi multi-ristorante controllato da tools backend deterministici.
L'obiettivo è gestire in modo affidabile:
- prenotazioni semplici,
- modifiche e cancellazioni base,
- informazioni su orari e FAQ,
- invio di SMS di conferma,
per 2–10 ristoranti reali, senza errori critici.


## Cosa fa l'MVP

- Gestisce nuove prenotazioni con raccolta dati minima (giorno, ora, persone, nome, telefono).
- Controlla gli orari e le aperture tramite dati strutturati di KB e time-utils.
- Modifica una prenotazione esistente (semplice, senza logiche avanzate).
- Cancella una prenotazione esistente.
- Risponde a domande frequenti tramite KB/tool FAQ.
- Invia SMS di conferma prenotazione dal backend (Twilio).
- Supporta più ristoranti tramite config/ristoranti.json e restaurant_id.
- Salva sempre le prenotazioni su Google Sheets e le sincronizza su Google Calendar.


## Cosa NON fa l'MVP

- Non gestisce logiche di tavoli, seating, turni, no-show.
- Non fa disambiguazione avanzata stile G19 (solo selezione 0/1/2–3 prenotazioni).
- Non usa state machine complesse né flussi a 20+ step.
- Non inventa menu, prezzi, ingredienti o politiche non presenti in KB/tool.
- Non usa modelli esterni aggiuntivi oltre a Vapi (niente OpenAI extra per rewriter).
- Non fa analitiche avanzate o dashboard SaaS (post-MVP).


## Architettura Generale
Flusso principale:

Cliente → Numero Twilio → Agent Vapi → Tools Backend (Express) → 
Google Sheets + Google Calendar → SMS dal backend → Cliente

- Un solo Agent Vapi per tutti i ristoranti.
- Ogni numero di telefono Twilio è collegato allo stesso Agent con metadata restaurant_id.
- Il backend espone tools HTTP JSON che Vapi chiama per:
  - controllare aperture,
  - creare/modificare/cancellare prenotazioni,
  - leggere prenotazioni per telefono,
  - rispondere a FAQ,
  - inviare SMS di conferma.
- Il backend è la fonte di verità: nessun dato critico è deciso dall'Agent.


## Lista Tools API (MVP)

- `check_openings`: controlla gli orari e gli slot disponibili per un giorno.
- `create_booking`: crea una nuova prenotazione.
- `list_bookings`: elenca le prenotazioni associate a un numero di telefono.
- `modify_booking`: modifica una prenotazione esistente.
- `cancel_booking`: cancella una prenotazione esistente.
- `faq`: restituisce una risposta strutturata a una domanda frequente.
- `send_sms` (opzionale): invia SMS di conferma/nota al cliente tramite Twilio.


## Hosting Backend
Scelta principale: Render.

Motivazioni:

* servizio pensato per applicazioni web Node.js sempre attive,
* gestione semplice delle variabili ambiente (.env),
* deploy automatico collegando la repo Git,
* log accessibili dal pannello,
* healthcheck facile per endpoint /status.

Requisiti per il backend:

* applicazione Node.js con server Express (file server-vapi.js),
* variabili ambiente per credenziali (Google, Twilio, Vapi) gestite solo su Render, non committate,
* endpoint /status per healthcheck,
* porta letta da process.env.PORT,
* build e start comandati da npm (es. npm install, npm start).

Railway può essere usato solo come alternativa di emergenza, ma la scelta ufficiale per l’MVP è Render.

Richieste:
- sempre attivo,
- supporto per variabili d'ambiente (.env),
- deploy automatico da repo Git.