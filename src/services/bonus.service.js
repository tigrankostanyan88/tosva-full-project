const fs = require('fs');
const path = require('path');
const DB = require('../models');
const walletService = require('./wallet.service');

function loadConfig() {
  const p = path.join(__dirname, '..', 'config', 'referral.bonus.tiers.json');
  const raw = fs.readFileSync(p, 'utf-8');
  return JSON.parse(raw);
}

function findTier(amount, tiers) {
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    const min = Number(t.min);
    const max = t.max === null ? null : Number(t.max);
    if (amount >= min && (max === null ? true : amount < max)) {
      return { index: i + 1, tier: t };
    }
  }
  return null;
}

async function applyBonusesForDeposit(deposit) {
  const cfg = loadConfig();
  const amount = Number(deposit.amount);
  if (!Number.isFinite(amount) || amount < cfg.minimum_deposit) return { applied: false, reason: 'below_minimum' };

  const ft = findTier(amount, cfg.tiers);
  if (!ft) return { applied: false, reason: 'no_tier' };

  const bBonus = Number(ft.tier.bonus_b_user);
  const xBonus = Number(ft.tier.bonus_x_user);

  const meta = {
    source: 'referral_bonus',
    tier_index: ft.index,
    tier_min: ft.tier.min,
    tier_max: ft.tier.max,
    bonus_b_user: bBonus,
    bonus_x_user: xBonus
  };

  await walletService.credit(deposit.user_id, bBonus, deposit.currency || 'USDT', meta, deposit.id, 'bonus');

  const user = await DB.models.User.findByPk(deposit.user_id);
  if (user && user.referrer_id) {
    await walletService.credit(user.referrer_id, xBonus, deposit.currency || 'USDT', meta, deposit.id, 'bonus');
  }

  return { applied: true, tier: ft.index };
}

module.exports = { applyBonusesForDeposit, findTier, loadConfig };
