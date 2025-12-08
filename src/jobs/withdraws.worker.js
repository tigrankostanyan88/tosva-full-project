const withdrawService = require('../services/withdraw.service');

function start() {
  if (String(process.env.WITHDRAW_MODE || 'manual') !== 'auto') return;
  const interval = Number(process.env.WITHDRAW_WORKER_INTERVAL_MS || 30000);
  setInterval(async () => {
    try { await withdrawService.autoProcessPending(); } catch (e) {}
  }, interval);
}

module.exports = { start };
