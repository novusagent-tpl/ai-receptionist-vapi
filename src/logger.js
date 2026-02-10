// logger.js — Production-grade structured logging (GDPR-aware)

const crypto = require('crypto');

/**
 * Genera un request_id univoco (8 caratteri hex).
 */
function generateRequestId() {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * Estrae call_id e conversation_id dal payload Vapi (se presente).
 * Vapi invia questi campi in body.message.call o body.message.
 */
function extractVapiCallInfo(body) {
  if (!body || !body.message) return {};

  const msg = body.message;
  const call = msg.call || {};

  return {
    call_id: call.id || msg.callId || null,
    conversation_id: call.assistantId || msg.assistantId || null,
  };
}

/**
 * Maschera un numero di telefono per GDPR.
 * "+393331234567" → "+39XXX...567"
 * Mostra solo prefisso internazionale + ultime 3 cifre.
 */
function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return phone;
  const cleaned = phone.trim();
  if (cleaned.length <= 6) return '***';
  // Mantieni prefisso (+39 o simile) + ultime 3 cifre
  const prefix = cleaned.startsWith('+') ? cleaned.slice(0, 3) : '';
  const last3 = cleaned.slice(-3);
  return `${prefix}XXX...${last3}`;
}

/**
 * Maschera un nome per GDPR.
 * "Mario Rossi" → "M***"
 */
function maskName(name) {
  if (!name || typeof name !== 'string') return name;
  const trimmed = name.trim();
  if (trimmed.length === 0) return name;
  return trimmed[0] + '***';
}

/**
 * Sanitizza un oggetto extra prima di loggarlo.
 * Maschera automaticamente campi sensibili (phone, name).
 */
function sanitize(extra) {
  if (!extra || typeof extra !== 'object') return extra;
  const sanitized = { ...extra };
  if (sanitized.phone) sanitized.phone = maskPhone(sanitized.phone);
  if (sanitized.name) sanitized.name = maskName(sanitized.name);
  return sanitized;
}

function baseFields(extra = {}) {
  const ts = new Date().toISOString();
  return { ts, ...extra };
}

function info(event, extra = {}) {
  console.log(
    JSON.stringify(
      baseFields({
        level: 'info',
        event,
        ...sanitize(extra),
      })
    )
  );
}

function warn(event, extra = {}) {
  console.warn(
    JSON.stringify(
      baseFields({
        level: 'warn',
        event,
        ...sanitize(extra),
      })
    )
  );
}

function error(event, extra = {}) {
  console.error(
    JSON.stringify(
      baseFields({
        level: 'error',
        event,
        ...sanitize(extra),
      })
    )
  );
}

module.exports = {
  info,
  warn,
  error,
  generateRequestId,
  extractVapiCallInfo,
  maskPhone,
  maskName,
};
