// logger.js

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
  error,
};
