const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const withdrawService = require('../services/withdraw.service');

module.exports = {
  list: catchAsync(async (req, res, next) => {
    const status = req.query.status ? String(req.query.status).toLowerCase() : null;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const items = await withdrawService.adminList(status, limit, offset);
    res.status(200).json({ status: 'success', withdraw_requests: items, time: (Date.now() - req.time) + ' ms' });
  }),
  approve: catchAsync(async (req, res, next) => {
    const id = Number(req.params.id);
    const txHash = String(req.body.tx_hash || '').trim();
    if (!Number.isInteger(id) || id <= 0) return next(new AppError('Invalid withdraw id', 400));
    const item = await withdrawService.approveManual(id, txHash);
    res.status(200).json({ status: 'success', request: item, time: (Date.now() - req.time) + ' ms' });
  }),
  reject: catchAsync(async (req, res, next) => {
    const id = Number(req.params.id);
    const reason = String(req.body.reason || '').trim();
    if (!Number.isInteger(id) || id <= 0) return next(new AppError('Invalid withdraw id', 400));
    const item = await withdrawService.reject(id, reason);
    res.status(200).json({ status: 'success', request: item, time: (Date.now() - req.time) + ' ms' });
  })
};
