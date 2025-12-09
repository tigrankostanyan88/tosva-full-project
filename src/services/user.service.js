const crypto = require('crypto');
const DB = require('../models');
const User = DB.models.User;

async function generateUniqueTag() {
  for (let i = 0; i < 5; i++) {
    const hex = crypto.randomBytes(6).toString('hex').toUpperCase();
    const tag = `USR-${hex}`;
    const exists = await User.findOne({ where: { unique_tag: tag } });
    if (!exists) return tag;
  }
  const hex = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `USR-${hex}`;
}

async function registerUser(payload) {
  const tag = await generateUniqueTag();
  const data = { ...payload, unique_tag: tag };
  const candidate = payload && (payload.invite_code || payload.referral_code || payload.referrer_id);
  if (candidate) {
    const raw = String(candidate).trim();
    let ref = null;
    if (/^\d+$/.test(raw)) {
      ref = await User.findByPk(Number(raw));
    } else {
      ref = await User.findOne({ where: { unique_tag: raw } });
    }
    if (ref) data.referrer_id = ref.id;
  }
  const user = await User.create(data);
  return user;
}

module.exports = { registerUser };
