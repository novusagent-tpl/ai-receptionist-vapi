# ✅ **FILE 2 — `docs/checklist_onboarding_ristorante.md` (AGGIORNATO)**

```md
# Checklist Onboarding Nuovo Ristorante – AI Receptionist VAPI

## 1. Google Workspace
- [ ] Creato Google Sheet con struttura:
      booking_id | day | time | people | name | phone | notes | created_at | event_id
- [ ] Recuperato `sheet_id`
- [ ] Creato Google Calendar dedicato alle prenotazioni
- [ ] Condiviso il Calendario con Service Account (permesso modifica)
- [ ] Recuperato `calendar_id`

## 2. Backend
- [ ] Creato KB: `kb/<restaurant_id>.json` copiando `docs/template_kb_ristorante.json`
- [ ] Configurati correttamente le aperture/orari (`openings`) e FAQ
- [ ] Aggiornato `src/config/ristoranti.json`
- [ ] Controllato JSON valido
- [ ] Aggiornato `.env` con `TWILIO_PHONE_NUMBER`
- [ ] Deploy su Render
- [ ] `/status` OK

## 3. Vapi Assistant
- [ ] Clonato assistant base
- [ ] Aggiornato Prompt con (nome + restaurant_id)
- [ ] Tools API collegati al backend Render e Configurati TUTTI i 7 Tools:
      check_openings, create_booking, list_bookings,
      modify_booking, cancel_booking, faq, send_sms
- [ ] Test in chat superati

## 4. Twilio
- [ ] Numero configurato - Assegnato numero al ristorante
- [ ] Voice URL → Assistant Vapi
- [ ] Test chiamata reale effettuato

## 5. Test Finali
- [ ] Prenota → OK
- [ ] Modifica → OK
- [ ] Cancella → OK
- [ ] FAQ → OK
- [ ] Ristorante è LIVE
