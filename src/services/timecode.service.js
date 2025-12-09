const DB = require('../models');
const { Op } = DB.Sequelize;
const AdminCode = DB.models.AdminCode;
const AdminCodeSlot = DB.models.AdminCodeSlot;
const AdminCodeUsage = DB.models.AdminCodeUsage;
const VALID_WINDOW_MINUTES = 10;

function randomCode() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const len = Math.floor(Math.random() * (10 - 6 + 1)) + 6; // 6..10
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  return out;
}

function parseTimeUTC(hhmm) {
  const [hh, mm] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCHours(hh, mm, 0, 0);
  return d;
}

async function generateForSlot(hhmm) {
  const slotTime = parseTimeUTC(hhmm);
  const todayStart = new Date(slotTime); todayStart.setUTCHours(0,0,0,0);
  const todayEnd = new Date(slotTime); todayEnd.setUTCHours(23,59,59,999);

  const nextMinute = new Date(slotTime.getTime() + 60 * 1000);
  const existing = await AdminCode.findOne({ where: { generated_at: { [Op.between]: [slotTime, nextMinute] } } });
  if (existing) return existing;

  let code;
  for (let i = 0; i < 5; i++) {
    code = randomCode();
    const dup = await AdminCode.findOne({ where: { code, generated_at: { [Op.between]: [todayStart, todayEnd] } } });
    if (!dup) break;
  }
  const expiresAt = new Date(slotTime.getTime() + VALID_WINDOW_MINUTES * 60 * 1000);
  return await AdminCode.create({ code, generated_at: slotTime, expires_at: expiresAt });
}

async function cleanupExpired() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - VALID_WINDOW_MINUTES * 60 * 1000);
  await AdminCode.destroy({ where: { [Op.or]: [
    { expires_at: { [Op.lte]: now } },
    { generated_at: { [Op.lte]: cutoff } }
  ] } });
}

async function getCurrentActiveCode() {
  const now = new Date();
  const winner = await AdminCode.findOne({ where: { generated_at: { [Op.lte]: now }, expires_at: { [Op.gt]: now } }, order: [['generated_at', 'DESC']] });
  return winner;
}

async function submitCode(userId, submitted) {
  const codeStr = String(submitted || '').trim().toUpperCase();
  if (!codeStr) return { status: 'error', message: 'Неверный код' };

  const now = new Date();
  const current = await getCurrentActiveCode();
  const record = await AdminCode.findOne({ where: { code: codeStr } });

  if (!record) return { status: 'error', message: 'Неверный код' };
  if (record.expires_at <= now) return { status: 'error', message: 'Код просрочен' };

  if (!current || current.code !== record.code) {
    return { status: 'error', message: 'Пауза — система обновлена, дождитесь следующего временного окна' };
  }

  const already = await AdminCodeUsage.findOne({ where: { admin_code_id: record.id, user_id: userId } });
  if (already) {
    return { status: 'error', message: 'Пауза — вы уже активировали это временное окно' };
  }
  try {
    await AdminCodeUsage.create({ admin_code_id: record.id, user_id: userId });
  } catch (e) {
    return { status: 'error', message: 'Пауза — вы уже активировали это временное окно' };
  }
  return { status: 'success' };
}

async function getSlots() {
  const rows = await AdminCodeSlot.findAll({ attributes: ['time_string'] });
  const list = rows.map(r => r.time_string);
  return list.length ? list : ['12:00','13:00','14:00'];
}

async function ensureActiveCodes() {
  const now = new Date();
  const slots = await getSlots();
  for (const hhmm of slots) {
    const slotTime = parseTimeUTC(hhmm);
    const windowEnd = new Date(slotTime.getTime() + VALID_WINDOW_MINUTES * 60 * 1000);
    if (now >= slotTime && now < windowEnd) {
      await generateForSlot(hhmm);
    }
  }
}

module.exports = { VALID_WINDOW_MINUTES, generateForSlot, cleanupExpired, getCurrentActiveCode, submitCode, getSlots, ensureActiveCodes };
