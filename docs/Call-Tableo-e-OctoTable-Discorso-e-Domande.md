# Call con Tableo e OctoTable – Discorso e domande

File da usare durante gli appuntamenti online con Tableo e OctoTable: presentazione del progetto, cosa ci serve e domande per avere chiaro come funziona il loro gestionale, se ha tutto quello che serve e se si può collegare alla nostra Receptionist telefonica (anche per ristoranti italiani).

---

## 1. Presentazione breve (discorso introduttivo)

Puoi dire qualcosa del genere:

*«Buongiorno, grazie per il tempo. Vi contatto perché sto sviluppando un sistema di **receptionist telefonica con intelligenza artificiale** per ristoranti: quando un cliente chiama il ristorante, risponde un’AI che può prendere prenotazioni, dare informazioni (orari, menu, policy) e gestire modifiche o cancellazioni.*

*Il nostro backend oggi può usare Google Sheets e Calendario per le prenotazioni, ma vorremmo **collegarci a un gestionale per ristoranti via API**, così il ristoratore ha tutto in un solo posto (il vostro pannello o app) e l’AI scrive le prenotazioni direttamente nel vostro sistema.*

*Vorrei capire **come funziona il vostro gestionale**, se **avete API documentate** per creare, listare, modificare e cancellare prenotazioni, e se **è adatto a ristoranti italiani** e si può integrare con il nostro sistema.»*

---

## 2. Cosa ci serve (contratto minimo)

Per collegare la nostra receptionist telefonica al vostro gestionale ci servono, **via API**, almeno queste operazioni:

| Operazione | Cosa ci serve |
|------------|----------------|
| **Crea prenotazione** | Inviare: data, ora, numero persone, nome, telefono, note. Ricevere: ID prenotazione. |
| **Lista prenotazioni per telefono** | Dato il numero di telefono del cliente, ottenere le sue prenotazioni future (per modifica/cancellazione). |
| **Lista prenotazioni per giorno** | Dato il ristorante e la data, ottenere le prenotazioni del giorno (per calcolare la disponibilità). |
| **Modifica prenotazione** | Dato l’ID prenotazione, aggiornare data, ora e/o numero persone. |
| **Cancella prenotazione** | Dato l’ID prenotazione, cancellarla. |

Opzionale ma utile: un endpoint **“slot disponibili”** per data/ora per semplificare il controllo disponibilità; altrimenti lo calcoliamo noi dalla lista prenotazioni del giorno.

---

## 3. Domande generiche (per entrambi: Tableo e OctoTable)

Usa queste domande per avere chiaro come funziona il gestionale e se possiamo collegarlo al nostro sistema.

### Come funziona il gestionale

1. In sintesi, come funziona il flusso prenotazioni nel vostro sistema? (il cliente prenota da dove? il ristoratore vede le prenotazioni dove?)
2. Un ristorante può avere più “sale” o “tavoli”? Come si gestiscono nelle prenotazioni?
3. Supportate **Prenota con Google** / Reserve with Google? E widget per il sito?

### API e integrazioni

4. **Avete API pubbliche** per sviluppatori (REST o simili) per gestire le prenotazioni?
5. Se sì: **dove si trova la documentazione** (link, Postman, altro)? È accessibile dopo la sottoscrizione o anche in prova?
6. **Come funziona l’autenticazione** (API key, OAuth, Client ID/Secret)? Ci sono ambienti **sandbox/test** per provare le API prima di andare in produzione?
7. Le API permettono di **creare** una prenotazione, **listare** prenotazioni (per telefono cliente e per giorno), **modificare** e **cancellare**? Con quali endpoint o metodi?
8. C’è un **limite di chiamate** (rate limit) o di prenotazioni al mese in base al piano? Quale piano include l’accesso API?

### Mercato italiano e ristoranti italiani

9. Il gestionale è **utilizzabile per ristoranti in Italia**? (lingua, valuta, supporto, conformità)
10. Avete **clienti o partner in Italia**? Supporto in italiano (documentazione, assistenza)?
11. **Fatturazione**: si può fatturare in Italia (P.IVA, SDI, ecc.)? Ci sono costi di setup o solo abbonamento mensile?

### Collegamento alla nostra receptionist

12. Avete già **integrazioni con sistemi di prenotazione telefonica o AI**? Se sì, come funzionano (webhook, API, altro)?
13. Per collegare il nostro backend (che chiama le vostre API quando l’AI prende una prenotazione al telefono): **c’è qualcosa che non possiamo fare** o che richiede un accordo particolare (partner, whitelist IP, ecc.)?
14. Le prenotazioni create via API **appaiono come le altre** nel pannello del ristorante (stessa vista, stessi filtri)? Il ristoratore può modificarle/cancellarle dal pannello come le altre?

---

## 4. Domande specifiche per **OctoTable**

(Per OctoTable abbiamo già preparato l’integrazione nel nostro backend; ci servono soprattutto credenziali e conferme.)

1. Dopo l’attivazione del piano **DigiMenu** (o superiore con API): **dove si trovano Client ID e Client Secret**? (pannello, email, documentazione?)
2. **Dove si trova o come si ottiene l’ID ristorante** (`restaurant_id`) da usare nelle chiamate API? (Create your restaurant, pannello, altro?)
3. Esiste un **ambiente sandbox o di test** per le API (senza impattare prenotazioni reali)? C’è una **prova gratuita** per sviluppatori?
4. Potete indicarmi il **link ufficiale alla documentazione API** (Create Client, Create Token, Create restaurant, Manage reservations) e, se c’è, una **collection Postman**?
5. Con il piano DigiMenu ci sono **limiti** sulle chiamate API (rate limit) o sul numero di prenotazioni gestibili?
6. Le API sono in **PREVIEW**: avete una roadmap o una data indicativa per la versione stabile? Ci sono breaking change previsti che dobbiamo tenere in conto?

---

## 5. Domande specifiche per **Tableo**

(Con Tableo stiamo valutando se le API ci sono e se coprono tutto il nostro contratto.)

1. **Avete API REST** (o simili) per integrazioni esterne? Se sì, **dove si trova la documentazione** e come si ottiene l’accesso (piano, richiesta partner, ecc.)?
2. Le API permettono di **creare** una prenotazione con data, ora, persone, nome, telefono, note? E di **listare** le prenotazioni **per telefono cliente** e **per giorno**?
3. È possibile **modificare** (cambio data/ora/persone) e **cancellare** una prenotazione via API?
4. **Autenticazione**: come funziona (API key, OAuth, altro)? C’è un ambiente di **test/sandbox**?
5. Il gestionale è **adatto a ristoranti italiani**? (lingua, supporto, fatturazione Italia)
6. Avete già **integrazioni con receptionist telefonica o AI**? Se no, ci sono vincoli tecnici o commerciali per collegare un sistema come il nostro?

---

## 6. Dopo la call – cosa annotare

Per ogni call, ti conviene annotare (anche in breve):

- **Sì/No** su: API disponibili, documentazione accessibile, crea/lista/modifica/cancella prenotazioni, lista per telefono, lista per giorno.
- **Dove** trovare: documentazione, credenziali (Client ID/Secret o API key), ID ristorante.
- **Piano** che include le API e costo (mensile, eventuali costi di setup).
- **Sandbox/test**: se c’è e come attivarlo.
- **Mercato italiano**: supporto, fatturazione, eventuali limiti.
- **Contatti** utili (supporto tecnico, account manager) per i passi successivi.

Puoi usare questo file come promemoria durante le call e aggiornare il riepilogo del progetto (`docs/RIEPILOGO-PROGETTO-FAQ-e-OctoTable.md`) con le risposte ricevute.
