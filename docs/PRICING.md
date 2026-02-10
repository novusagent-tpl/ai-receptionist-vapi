# Pricing & Pacchetti — AI Receptionist

Bozza architettura pricing. Da aggiornare con prezzi finali prima del lancio.

---

## 1. Costi operativi per chiamata

Ogni chiamata ha un costo variabile composto da:

| Componente | Costo stimato | Note |
|------------|--------------|-------|
| Vapi (piattaforma) | ~$0.07/min | Include orchestrazione, STT, TTS |
| Modello AI (GPT-4o) | ~$0.01-0.05/min | Dipende da lunghezza conversazione |
| Twilio (numero + minuti) | ~$0.02/min + $1/mese per numero | Costo voce Italia |
| **Totale per minuto** | **~$0.11-0.15/min** | Stimato, verificare con uso reale |

Durata media chiamata stimata: 2-3 minuti → **~$0.20-0.36 per chiamata**

**IMPORTANTE:** Questi costi sono stime. Dopo le prime settimane di uso reale, aggiornare con dati reali dal dashboard Vapi e Twilio.

---

## 2. Piani proposti

| Piano | Backend | Cosa include | Target |
|-------|---------|-------------|--------|
| **Base** | Google Sheets/Calendar | Receptionist AI, prenotazioni, FAQ, numero dedicato | Piccoli ristoranti, pizzerie, trattorie |
| **Pro** | resOS / OctoTable | Tutto Base + gestionale professionale integrato | Ristoranti medi, strutturati |
| **Custom** | Qualsiasi | Tutto Pro + personalizzazioni, SLA, supporto prioritario | Catene, gruppi ristoranti |

---

## 3. Cosa includere in ogni piano

### Base
- 1 numero telefonico dedicato
- Receptionist AI attiva 24/7
- Prenotazioni, modifiche, cancellazioni
- FAQ personalizzate
- Google Sheets + Calendar come backend
- Setup incluso (~60 min)

### Pro
- Tutto Base
- Integrazione con gestionale professionale (resOS, OctoTable, altri)
- Handover a operatore umano
- Accesso metriche (/metrics)
- Supporto via email

### Custom
- Tutto Pro
- Personalizzazioni prompt/flusso
- Multi-sede
- SLA uptime
- Supporto dedicato

---

## 4. Modello di pricing — opzioni

### Opzione A: Fisso mensile
| Piano | Prezzo/mese |
|-------|-------------|
| Base | €___/mese |
| Pro | €___/mese |
| Custom | Su preventivo |

Pro: semplice, prevedibile per il ristorante.
Contro: se un ristorante riceve molte chiamate, i costi Vapi/Twilio possono superare il fisso.

### Opzione B: Fisso + variabile
| Piano | Fisso/mese | Chiamate incluse | Extra per chiamata |
|-------|-----------|-------------------|-------------------|
| Base | €___/mese | ___ chiamate | €___/chiamata |
| Pro | €___/mese | ___ chiamate | €___/chiamata |

Pro: sostenibile, margine protetto.
Contro: più complesso da spiegare al ristorante.

### Opzione C: Pay-per-use puro
| Costo | Dettaglio |
|-------|-----------|
| Setup una tantum | €___ |
| Per chiamata | €___/chiamata |

Pro: nessun rischio per il ristorante ("paghi solo se usi").
Contro: entrate meno prevedibili.

---

## 5. Calcolo margine (da compilare)

| Voce | Valore |
|------|--------|
| Costo medio per chiamata | ~€0.25-0.35 |
| Chiamate medie al mese per ristorante | ___  (stimare dopo test reali) |
| Costo operativo mensile per ristorante | ___ |
| Prezzo piano Base | ___ |
| Prezzo piano Pro | ___ |
| Margine lordo Base | ___ |
| Margine lordo Pro | ___ |
| Costo Twilio numero/mese | ~€1 |
| Costo Vapi fisso/mese | Verificare piano Vapi |

---

## 6. Cosa decidere prima del lancio

- [ ] Scegliere modello pricing (A, B, o C)
- [ ] Definire prezzi per piano Base e Pro
- [ ] Stimare chiamate medie per ristorante (dopo test reali)
- [ ] Verificare costi reali Vapi e Twilio dopo le prime settimane
- [ ] Decidere se offrire periodo prova gratuito (es. 7-14 giorni)
- [ ] Decidere se setup è incluso o a pagamento

---

## 7. Confronto competitivo

Prima di fissare i prezzi, verificare cosa offrono e a quanto i concorrenti in Italia:
- [ ] Ricerca competitor AI receptionist ristoranti
- [ ] Fascia prezzo mercato
- [ ] Differenziatori nostri (multi-gestionale, FAQ personalizzate, setup veloce)
