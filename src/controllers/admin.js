const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const depositService = require('../services/deposit.service');
const DB = require('../models');

module.exports = {
  confirmDeposit: catchAsync(async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return next(new AppError('Invalid deposit id', 400));

    const dep = await DB.models.Deposit.findByPk(id);
    if (!dep) return next(new AppError('Deposit not found', 404));
    if (dep.status !== 'pending') return next(new AppError('Deposit not pending', 400));

    const updated = await depositService.markSuccess(id);
    const wallet = await DB.models.Wallet.findOne({ where: { user_id: updated.user_id, currency: updated.currency } });

    res.status(200).json({
      status: 'success',
      deposit: updated,
      balance: wallet ? Number(wallet.balance) : 0,
      time: (Date.now() - req.time) + ' ms'
    });
  })
  ,
  currentCode: catchAsync(async (req, res, next) => {
    const timecode = require('../services/timecode.service');
    const current = await timecode.getCurrentActiveCode();
    const payload = current ? { code: current.code, generated_at: current.generated_at, expires_at: current.expires_at, used_by_user_id: current.used_by_user_id } : null;
    res.status(200).json({ status: 'success', current_code: payload, time: (Date.now() - req.time) + ' ms' });
  })
  ,
  exodusSummary: catchAsync(async (req, res, next) => {
    const depSvc = require('../services/deposit.service');
    const tronSvc = require('../services/tron.service');
    const summary = await depSvc.getTotalDepositedGlobal();
    const address = process.env.EXODUS_USDT_TRON_ADDRESS || null;
    let onchain = null;
    if (address) {
      onchain = await tronSvc.getUSDTBalance(address);
    }
    res.status(200).json({ status: 'success', exodus: { address, onchain_balance: onchain }, totals: summary, time: (Date.now() - req.time) + ' ms' });
  })
  ,
  exodusReaudit: catchAsync(async (req, res, next) => {
    const depSvc = require('../services/deposit.service');
    const result = await depSvc.reauditSuccessWithoutTxid();
    res.status(200).json({ status: 'success', reaudit: result, time: (Date.now() - req.time) + ' ms' });
  })
  ,
  getCodeSlots: catchAsync(async (req, res, next) => {
    const timecode = require('../services/timecode.service');
    const slots = await timecode.getSlots();
    res.status(200).json({ status: 'success', slots, time: (Date.now() - req.time) + ' ms' });
  })
  ,
  setCodeSlots: catchAsync(async (req, res, next) => {
    const { slots, tzOffsetMinutes } = req.body || {};
    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Укажите список слотов' });
    }
    const norm = slots.map(s => String(s).trim());
    const valid = norm.every(s => /^\d{2}:\d{2}$/.test(s) && Number(s.slice(0,2)) < 24 && Number(s.slice(3,5)) < 60);
    if (!valid) return res.status(400).json({ status: 'error', message: 'Неверный формат времени (HH:MM)' });
    let uniq = Array.from(new Set(norm));

    // Optional local->UTC conversion when tzOffsetMinutes provided (accept numeric strings too)
    const parsedOffset = Number(tzOffsetMinutes);
    if (Number.isFinite(parsedOffset)) {
      const offset = Math.trunc(parsedOffset);
      const toUTC = (hhmm) => {
        const hh = Number(hhmm.slice(0,2));
        const mm = Number(hhmm.slice(3,5));
        const total = hh * 60 + mm;
        let utcTotal = (total - offset) % 1440;
        if (utcTotal < 0) utcTotal += 1440;
        const uh = String(Math.floor(utcTotal / 60)).padStart(2, '0');
        const um = String(utcTotal % 60).padStart(2, '0');
        return `${uh}:${um}`;
      };
      uniq = Array.from(new Set(uniq.map(toUTC)));
    }
    const DB = require('../models');
    await DB.models.AdminCodeSlot.destroy({ where: {} });
    await DB.models.AdminCodeSlot.bulkCreate(uniq.map(t => ({ time_string: t })));
    try {
      const scheduler = require('../jobs/timecodes.scheduler');
      if (scheduler && typeof scheduler.tick === 'function') await scheduler.tick();
    } catch (e) {}
    res.status(200).json({ status: 'success', slots: uniq, time: (Date.now() - req.time) + ' ms' });
  })
  ,
  referralsStats: catchAsync(async (req, res, next) => {
    const referralService = require('../services/referral.service');
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) return next(new AppError('Invalid user id', 400));
    const count = await referralService.getInvitesCount(userId);
    const rate = referralService.calcReferrerRate(0.20, count);
    const invites = await referralService.getInvites(userId, Number(req.query.limit || 50), Number(req.query.offset || 0));
    res.status(200).json({ status: 'success', user_id: userId, referral_count: count, interest_rate_for_referrer: rate, invites, time: (Date.now() - req.time) + ' ms' });
  })
  ,
  referralsExportCsv: catchAsync(async (req, res, next) => {
    const referralService = require('../services/referral.service');
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) return next(new AppError('Invalid user id', 400));
    const invites = await referralService.getInvites(userId, 10000, 0);
    const header = 'id,email,unique_tag,date';
    const rows = invites.map(u => `${u.id},${u.email},${u.unique_tag},${new Date(u.date).toISOString()}`);
    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(csv);
  })
  ,
  getWithdrawSettings: catchAsync(async (req, res, next) => {
    const DB = require('../models');
    const rec = await DB.models.WithdrawConfig.findOne({ where: { key: 'min_days' } });
    const min_days = rec ? Number(rec.value_int) : 30;
    res.status(200).json({ status: 'success', settings: { min_days }, time: (Date.now() - req.time) + ' ms' });
  })
  ,
  setWithdrawSettings: catchAsync(async (req, res, next) => {
    const DB = require('../models');
    const val = Number(req.body.min_days);
    if (!Number.isFinite(val) || val < 0 || val > 365) return next(new AppError('Invalid min_days', 400));
    let rec = await DB.models.WithdrawConfig.findOne({ where: { key: 'min_days' } });
    if (!rec) {
      rec = await DB.models.WithdrawConfig.create({ key: 'min_days', value_int: Math.trunc(val) });
    } else {
      rec.value_int = Math.trunc(val);
      await rec.save();
    }
    res.status(200).json({ status: 'success', settings: { min_days: rec.value_int }, time: (Date.now() - req.time) + ' ms' });
  })
  ,
  forwarders: catchAsync(async (req, res, next) => {
    const svc = require('../services/forwarder');
    const list = await svc.getAll();
    res.status(200).json({ status: 'success', forwarders: list, time: (Date.now() - req.time) + ' ms' });
  })
  ,
  forwarder: catchAsync(async (req, res, next) => {
    const svc = require('../services/forwarder');
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return next(new AppError('Invalid forwarder id', 400));
    const item = await svc.getById(id);
    res.status(200).json({ status: 'success', forwarder: item, time: (Date.now() - req.time) + ' ms' });
  })
  ,
  sweepsFailed: catchAsync(async (req, res, next) => {
    const svc = require('../services/sweep');
    const list = await svc.getFailedSweeps();
    res.status(200).json({ status: 'success', sweeps: list, time: (Date.now() - req.time) + ' ms' });
  })
  ,
  sweepsPending: catchAsync(async (req, res, next) => {
    const svc = require('../services/sweep');
    const list = await svc.getPendingSweeps();
    res.status(200).json({ status: 'success', sweeps: list, time: (Date.now() - req.time) + ' ms' });
  })
  ,
  sweepsRetry: catchAsync(async (req, res, next) => {
    const svc = require('../services/sweep');
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return next(new AppError('Invalid sweep id', 400));
    const DB = require('../models');
    const rec = await DB.models.SweepTx.findByPk(id);
    if (!rec) return next(new AppError('Sweep record not found', 404));
    const result = await svc.retrySweepTx(rec);
    res.status(200).json({ status: result.ok ? 'success' : 'error', result, time: (Date.now() - req.time) + ' ms' });
  })
};
