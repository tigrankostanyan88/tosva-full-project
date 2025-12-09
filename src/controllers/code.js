const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const timecode = require('../services/timecode.service');
const depositService = require('../services/deposit.service');
const walletService = require('../services/wallet.service');

module.exports = {
  submit: catchAsync(async (req, res, next) => {
    const { code } = req.body || {};
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Неверный код' });
    }
    const totalDeposited = await depositService.getTotalDeposited(req.user.id);
    if (!Number(totalDeposited) || Number(totalDeposited) <= 0) {
      return res.status(400).json({ status: 'error', message: 'У вас нет подтверждённого депозита' });
    }
    const result = await timecode.submitCode(req.user.id, code);
    if (result.status !== 'success') {
      return res.status(400).json(result);
    }

    const base = await depositService.getTotalDeposited(req.user.id);
    const ratePct = Number(process.env.CODE_RATE_PCT || 0.8);
    const bonus = Number(((Number(base) * ratePct) / 100).toFixed(8));
    const currency = (process.env.CODE_DEPOSIT_CURRENCY || 'USDT').toUpperCase();
    const balance = await walletService.credit(req.user.id, bonus, currency, { source: 'code_interest', ratePct, base, code }, null, 'bonus');

    return res.status(200).json({ status: 'success', bonus, balance });
  })
};
