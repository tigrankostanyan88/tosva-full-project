const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const bonusService = require('../services/bonus.service');

module.exports = {
  claim: catchAsync(async (req, res, next) => {
    const code = String(req.body.code || '').trim();
    if (!code) return next(new AppError('Укажите код', 400));
    const result = await bonusService.claim(req.user.id, code);
    res.status(200).json({ status: 'success', message: 'Бонус начислен', bonus_amount: result.amount, claim: result.claim, code: result.code, time: (Date.now() - req.time) + ' ms' });
  })
};
