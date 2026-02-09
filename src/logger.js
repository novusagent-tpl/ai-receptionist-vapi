// logger.js — Production-grade structured logging

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
        ...extra,
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
        ...extra,
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
        ...extra,
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
};
