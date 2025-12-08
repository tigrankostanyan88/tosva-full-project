const bonus = require('../services/bonus.service');
const DB = require('../models');

let lastSlot = null;
let cacheSlots = [];
let cacheAt = 0;

async function loadSlots() {
  if (Date.now() - cacheAt > 300000) {
    const rows = await DB.models.BonusSlot.findAll({ attributes: ['time_string'], order: [['time_string','ASC']], raw: true });
    cacheSlots = rows.map(r => r.time_string);
    cacheAt = Date.now();
  }
  return cacheSlots;
}

function nowUTC() {
  const d = new Date();
  const h = String(d.getUTCHours()).padStart(2,'0');
  const m = String(d.getUTCMinutes()).padStart(2,'0');
  return `${h}:${m}`;
}

async function tick() {
  try {
    const slots = await loadSlots();
    if (!slots || !slots.length) return;
    const hhmm = nowUTC();
    if (lastSlot === hhmm) return;
    if (!slots.includes(hhmm)) return;
    const current = await bonus.getCurrentCode();
    const active = current && current.active && current.expires_at && new Date() < new Date(current.expires_at);
    if (active) { lastSlot = hhmm; return; }
    const rand = Math.random().toString(36).slice(2,8).toUpperCase();
    const code = `AUTO-${new Date().toISOString().slice(0,10)}-${hhmm}-${rand}`;
    const exp = Number(process.env.ADMIN_CODE_EXPIRE_MIN || 10);
    await bonus.setCurrentCode(code, exp);
    lastSlot = hhmm;
  } catch (e) {}
}

function start() {
  const interval = Number(process.env.BONUS_SCHEDULER_INTERVAL_MS || 30000);
  setInterval(tick, interval);
}

module.exports = { start, tick };
