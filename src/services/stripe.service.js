const DB = require('../models');
const AppError = require('../utils/AppError');

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new AppError('Stripe не настроен: отсутствует STRIPE_SECRET_KEY', 500);
  // eslint-disable-next-line global-require
  const Stripe = require('stripe');
  return Stripe(key);
}

async function ensureAccount(userId) {
  const stripe = getStripe();
  let rec = await DB.models.StripeAccount.findOne({ where: { user_id: userId } });
  if (rec) return rec;
  const acct = await stripe.accounts.create({ type: 'express' });
  rec = await DB.models.StripeAccount.create({ user_id: userId, account_id: acct.id });
  return rec;
}

async function attachCard(userId, token) {
  const stripe = getStripe();
  const acct = await ensureAccount(userId);
  const ext = await stripe.accounts.createExternalAccount(acct.account_id, { external_account: token });
  acct.external_id = ext && ext.id;
  await acct.save();
  return { account_id: acct.account_id, external_id: acct.external_id, brand: ext.brand, last4: ext.last4 };
}

async function payout(userId, amount, currency = (process.env.STRIPE_PAYOUT_CURRENCY || 'usd')) {
  const stripe = getStripe();
  const acct = await DB.models.StripeAccount.findOne({ where: { user_id: userId } });
  if (!acct || !acct.account_id || !acct.external_id) throw new AppError('Для пользователя не привязана карта для выплат', 400);
  const value = Math.round(Number(amount) * 100);
  if (value <= 0) throw new AppError('Сумма должна быть положительным числом', 400);
  const transfer = await stripe.transfers.create({ amount: value, currency, destination: acct.account_id });
  const payoutRes = await stripe.payouts.create({ amount: value, currency }, { stripeAccount: acct.account_id });
  return { transfer_id: transfer.id, payout_id: payoutRes.id };
}

module.exports = { ensureAccount, attachCard, payout };
async function accountOnboardingLink(userId, refreshUrl, returnUrl) {
  const stripe = getStripe();
  const acct = await ensureAccount(userId);
  const link = await stripe.accountLinks.create({
    account: acct.account_id,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding'
  });
  return { url: link.url, expires_at: link.created + link.expires_at || null };
}

module.exports.accountOnboardingLink = accountOnboardingLink;
