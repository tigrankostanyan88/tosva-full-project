const timecode = require('../services/timecode.service');

async function tick() {
  try {
    await timecode.ensureActiveCodes();
    await timecode.cleanupExpired();
  } catch (e) {}
}

function start() {
  const intervalMs = Number(process.env.ADMIN_CODE_SCHEDULER_INTERVAL_MS || 60000);
  setInterval(tick, intervalMs);
}

module.exports = { start, tick };
