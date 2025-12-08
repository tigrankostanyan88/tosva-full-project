const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const stripeService = require('../services/stripe.service');

module.exports = {
  connect: catchAsync(async (req, res, next) => {
    const rec = await stripeService.ensureAccount(req.user.id);
    res.status(200).json({ status: 'success', account_id: rec.account_id });
  }),
  accountLink: catchAsync(async (req, res, next) => {
    const host = `${req.protocol}://${req.get('host')}`;
    const hostRoot = `${host}/`;
    const normalize = (u) => {
      const s = String(u || '').trim();
      if (!s) return hostRoot;
      if (/^https?:\/\//i.test(s)) return s;
      if (s.startsWith('/')) return host + s;
      return hostRoot + s;
    };
    const refresh = normalize(req.body.refresh_url);
    const ret = normalize(req.body.return_url);
    const link = await stripeService.accountOnboardingLink(req.user.id, refresh, ret);
    res.status(200).json({ status: 'success', link });
  }),
  attachCard: catchAsync(async (req, res, next) => {
    const token = String(req.body.token || '').trim();
    if (!token) return next(new AppError('Передайте токен карты Stripe', 400));
    const result = await stripeService.attachCard(req.user.id, token);
    res.status(200).json({ status: 'success', card: result });
  }),
  payoutTest: catchAsync(async (req, res, next) => {
    const amount = Number(req.body.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) return next(new AppError('Сумма должна быть положительным числом', 400));
    const result = await stripeService.payout(req.user.id, amount);
    res.status(200).json({ status: 'success', payout: result });
  })
};
