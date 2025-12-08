const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { createWithdrawSchema } = require('../validations/withdraw.validation');
const balanceService = require('../services/balance.service');
const withdrawService = require('../services/withdraw.service');

module.exports = {
  withdraw: catchAsync(async (req, res, next) => {
    const { error, value } = createWithdrawSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 400));
    const { request, balance } = await withdrawService.createRequest(req.user.id, value.amount, value.to_address);
    const avail = await balanceService.getAvailable(req.user.id);
    res.status(201).json({ status: 'success', message: 'Заявка на вывод создана. Ожидайте подтверждения администратора.', request, balance: avail, time: (Date.now() - req.time) + ' ms' });
  }),
  withdraws: catchAsync(async (req, res, next) => {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const list = await withdrawService.listUserWithdraws(req.user.id, limit, offset);
    const balance = await balanceService.getAvailable(req.user.id);
    res.status(200).json({ status: 'success', withdraws: list, balance, time: (Date.now() - req.time) + ' ms' });
  })
};
