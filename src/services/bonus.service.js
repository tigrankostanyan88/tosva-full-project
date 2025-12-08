const DB = require('../models');
const AppError = require('../utils/AppError');
const balanceService = require('./balance.service');
const walletService = require('./wallet.service');

async function setCurrentCode(code, expiresInMinutes = 10) {
  const now = new Date();
  const exp = new Date(now.getTime() + Math.max(1, Number(expiresInMinutes)) * 60 * 1000);
  await DB.models.BonusCode.update({ active: false }, { where: { active: true } });
  const rec = await DB.models.BonusCode.create({ code, generated_at: now, expires_at: exp, active: true });
  return rec;
}

async function getCurrentCode() {
  const rec = await DB.models.BonusCode.findOne({ where: { active: true }, order: [['id','DESC']] });
  return rec;
}

function isToday(date) {
  const d = new Date(date);
  const s = new Date(); s.setHours(0,0,0,0);
  const e = new Date(); e.setHours(23,59,59,999);
  return d >= s && d <= e;
}

async function claim(userId, submittedCode) {
  const current = await getCurrentCode();
  if (!current || !current.active) throw new AppError('Код не активен. Обратитесь к администратору.', 400);
  const now = new Date();
  if (current.expires_at && now > new Date(current.expires_at)) throw new AppError('Срок действия кода истек', 400);
  if (String(current.code).trim() !== String(submittedCode).trim()) throw new AppError('Неверный код', 400);

  const lastClaim = await DB.models.BonusClaim.findOne({ where: { user_id: userId }, order: [['id','DESC']] });
  if (lastClaim && isToday(lastClaim.date)) throw new AppError('Бонус уже был получен сегодня', 400);

  const principal = await balanceService.getPrincipal(userId);
  const rate = Number(process.env.ADMIN_CODE_RATE || 0.008); // 0.8%
  const amount = Number(principal) * rate;
  if (!Number.isFinite(amount) || amount <= 0) throw new AppError('Недостаточно депозита для начисления бонуса', 400);

  const codeId = current.id;
  await walletService.credit(userId, amount, 'USDT', { source: 'admin_code', code_id: codeId }, codeId, 'bonus');
  const claim = await DB.models.BonusClaim.create({ user_id: userId, code_id: codeId, amount });
  return { amount, claim, code: { code: current.code, expires_at: current.expires_at } };
}

module.exports = { setCurrentCode, getCurrentCode, claim };

async function generateNow(expiresInMinutes = 10) {
  const d = new Date();
  const hh = String(d.getUTCHours()).padStart(2,'0');
  const mm = String(d.getUTCMinutes()).padStart(2,'0');
  const rand = Math.random().toString(36).slice(2,8).toUpperCase();
  const code = `AUTO-${d.toISOString().slice(0,10)}-${hh}:${mm}-${rand}`;
  const rec = await setCurrentCode(code, expiresInMinutes);
  return rec;
}

async function listCodes(limit = 50, offset = 0) {
  return await DB.models.BonusCode.findAll({ order: [['id','DESC']], limit, offset });
}

module.exports.generateNow = generateNow;
module.exports.listCodes = listCodes;
