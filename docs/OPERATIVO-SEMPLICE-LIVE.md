# Operativo Semplice Live (Render + Vapi)

Guida pratica, non tecnica, da seguire ogni volta che fai modifiche.

Usa questa guida per evitare di rompere i ristoranti gia live.

---

## Scelta attuale (semplice)

Per ora usiamo questo modello:

1. `backend-prod` -> ristoranti live
2. `backend-staging` -> test interni (solo tu)
3. `backend-canary` -> opzionale, da creare solo quando vuoi fare canary reale su 1-2 ristoranti live

Quindi non serve tenere sempre 3 servizi accesi.
Di base bastano `prod` + `staging`.

---

## Regola base (sempre)

Mai aggiornare tutti i ristoranti insieme.

Prima aggiorni e testi 1 solo ristorante (canary), poi gli altri.

---

## A) Se cambi il BACKEND

### Cosa fare

1. Salva una copia della versione stabile attuale (snapshot):
   - cartella backend stabile (zip o copia locale)
   - data nel nome, es: `backend-stabile-2026-02-19`
2. Fai le modifiche in locale.
3. Test rapido locale:
   - regression tests
   - 1 create, 1 list, 1 modify/cancel
4. Upload manuale su Render.
5. Test Vapi su 1 solo ristorante canary:
   - prenotazione
   - modifica/cancellazione
   - handover
6. Monitora 24-72 ore.
7. Se tutto ok, estendi agli altri ristoranti.

### Se va male

1. Re-upload su Render della cartella stabile precedente.
2. Testa 2 chiamate (prenotazione + handover).
3. Solo dopo riapri il rollout.

---

## B) Se cambi solo il PROMPT

### Cosa fare

1. Salva copia del prompt stabile (file locale).
2. Aggiorna i file nella cartella `prompts/`.
3. Incolla su Vapi solo nel ristorante canary.
4. Fai 3 chiamate test:
   - FAQ semplice
   - prenotazione
   - handover
5. Monitora 24-72 ore.
6. Se ok, copia lo stesso aggiornamento negli altri assistant.

### Se va male

1. Re-incolla il prompt vecchio stabile su Vapi.
2. Testa 2 chiamate.

---

## C) Se aggiungi un NUOVO RISTORANTE

Usa `onboarding/CHECKLIST.md`.

### Passi minimi

1. Crea KB del ristorante.
2. Aggiungi config in `src/config/ristoranti.json`.
3. Prepara prompt del ristorante.
4. Configura assistant Vapi (tools + transfer).
5. Fai test create/list/modify/cancel + handover.
6. Vai live solo su quel ristorante.

---

## D) Come testare Vapi con nuove modifiche (senza confusione)

Per ogni release fai sempre questi 3 test in chiamata:

1. Prenotazione completa (deve comparire nel gestionale/calendar).
2. Modifica o cancellazione (deve aggiornarsi davvero).
3. Handover (deve trasferire correttamente).

Se uno dei 3 fallisce: non estendere la release.

---

## E) Cosa vuol dire “Canary” (semplice)

Canary = 1 ristorante “pilota” che riceve per primo l’aggiornamento.

Esempio:
- Hai Roma, Modena, Octo.
- Aggiorni prima solo Roma.
- Se Roma e stabile 24-72 ore, aggiorni Modena e Octo.

### Canary pratico per ora (consigliato)

Canary per ora si fa cosi:
- 1-2 assistant Vapi puntano a `backend-canary`
- tutti gli altri assistant live restano su `backend-prod`

Se canary va bene, sposti anche gli altri assistant su `backend-canary` (o deploy della stessa versione su prod).
Se canary va male, rimetti gli URL dei tool al `backend-prod`.

### `release_channel` (opzionale, futuro)

Nel file `src/config/ristoranti.json` ogni tenant ha:
- `release_channel: "stable"` (default)
- `release_channel: "canary"` (solo durante rollout controllato)

Regola pratica:
1. Nuova release: metti 1 tenant su `canary`, gli altri restano `stable`.
2. Monitora 24-72h.
3. Se ok, promuovi anche gli altri tenant a `canary` (o riporti tutti a `stable` quando la feature diventa standard).
4. Se problemi, rimetti subito il tenant canary a `stable`.

Nota importante:
- oggi `release_channel` non cambia il comportamento da solo
- diventa utile quando una feature viene esplicitamente collegata a quel flag nel codice
- quindi per ora e solo infrastruttura pronta, non il metodo operativo principale

---

## F) Come fare rollback su Render (manual upload)

Dato che non usi git deploy:

1. Tieni sempre una copia della versione stabile prima di ogni release.
2. Se release nuova crea problemi, fai upload su Render della copia stabile.
3. Render riparte con codice precedente.
4. Fai 2 chiamate di verifica.

Senza snapshot stabile non esiste rollback veloce.

### Se usi il bottone Rollback di Render

Se in Render vedi il bottone rollback negli events, puoi usarlo:
- e il modo piu veloce per tornare alla release precedente del singolo service
- dopo rollback fai sempre 2 smoke call (prenotazione + handover)

---

## F-bis) Deploy su un solo service

Se vuoi aggiornare solo `staging` o solo `canary`, fai deploy solo su quel service.

Con upload manuale:
- apri il service specifico
- fai upload/deploy solo li
- gli altri service non cambiano

Con services extra non usati:
- puoi sospendere `staging` e `canary` quando non ti servono
- tieni sempre attivo solo `backend-prod` per il live

---

## G) Checklist giornaliera (5-10 minuti)

1. `GET /status` = ok:true
2. 1 test handover rapido
3. 1 test prenotazione reale (o su tenant test)
4. Controllo errori ultimi log
5. Controllo che prompt live sia quello corretto

Se trovi anomalia critica:
- passa temporaneamente a modalita FAQ + transfer
- fai rollback
- poi analizzi con calma

---

## H) Regola d’oro decisionale

- Se non sei sicuro: non rilasciare a tutti.
- Rilascia a 1 tenant, osserva, poi estendi.
- Ogni release deve essere reversibile in meno di 10 minuti.

