const DB = require('../models');
const AppError = require('../utils/AppError');
const balanceService = require('./balance.service');
const tronService = require('./tron.service');
const interestService = require('./interest.service');
const walletService = require('./wallet.service');
const { Op } = DB.Sequelize;

async function getMinWithdrawDays() {
    const rec = await DB.models.WithdrawConfig.findOne({ where: { key: 'min_days' } });
    const val = rec ? Number(rec.value_int) : 30;
    return Number.isFinite(val) && val >= 0 ? val : 30;
}

async function createRequest(userId, amount, toAddress) {
    const bal = await balanceService.getAvailable(userId);
    if (!Number.isFinite(amount) || amount <= 0) throw new AppError('Сумма должна быть положительным числом', 400);
    if (!toAddress) throw new AppError('Неверный адрес назначения', 400);
    if (!tronService.isValidTronAddress(toAddress)) throw new AppError('Укажите корректный адрес Tron (TRC20 USDT)', 400);
    const exists = await tronService.addressExists(toAddress);
    if (!exists) throw new AppError('Указанный адрес Tron не найден. Убедитесь, что это ваш Binance USDT (TRC20) адрес', 400);

    const days = await interestService.daysSinceFirstDeposit(userId);
    const minDays = await getMinWithdrawDays();
    if (days < minDays) throw new AppError(`Вывод средств доступен только через ${minDays} дней после первого депозита`, 400);

    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);
    const todayCompleted = await DB.models.WithdrawRequest.findOne({ where: { user_id: userId, status: 'completed', date: { [Op.between]: [todayStart, todayEnd] } } });
    if (todayCompleted) throw new AppError('Сегодня уже был успешный вывод средств', 400);
    const todayActive = await DB.models.WithdrawRequest.findOne({ where: { user_id: userId, status: { [Op.in]: ['pending','processing'] }, date: { [Op.between]: [todayStart, todayEnd] } } });
    if (todayActive) throw new AppError('У вас уже есть активный запрос на вывод сегодня', 400);
    const failedCount = await DB.models.WithdrawRequest.count({ where: { user_id: userId, status: 'failed', fail_reason: { [Op.notLike]: 'admin%' }, date: { [Op.between]: [todayStart, todayEnd] } } });
    if (failedCount >= 3) throw new AppError('Превышено число неудачных попыток вывода за сегодня (3)', 400);

    if (amount > bal.available) throw new AppError('Недостаточно средств', 400);
    const req = await DB.models.WithdrawRequest.create({ user_id: userId, amount, to_address: toAddress, status: 'pending' });
    return { request: req, balance: bal };
}

async function listUserWithdraws(userId, limit = 50, offset = 0) {
    const items = await DB.models.Withdrawal.findAll({ where: { user_id: userId }, order: [['id','DESC']], limit, offset });
    return items;
}

async function adminList(status, limit = 50, offset = 0) {
    const where = status ? { status } : {};
    const items = await DB.models.WithdrawRequest.findAll({ where, order: [['id','DESC']], limit, offset });
    return items;
}

async function approveManual(id, txHash) {
    const req = await DB.models.WithdrawRequest.findByPk(id);
    if (!req) throw new AppError('Withdraw request not found', 404);
    if (!['pending','processing'].includes(req.status)) throw new AppError('Invalid request status', 400);
    const key = process.env.HOT_WALLET_PRIVATE_KEY;
    const contract = process.env.USDT_CONTRACT;
    if (!key || !contract) throw new AppError('Missing HOT_WALLET_PRIVATE_KEY or USDT_CONTRACT', 500);
    req.status = 'processing';
    await req.save();
    try {
        const tx = await tronService.sendUSDT(key, req.to_address, Number(req.amount), contract);
        req.tx_hash = typeof tx === 'string' ? tx : (tx && tx.txID) || txHash || null;
        req.status = 'completed';
        await req.save();
        const withdrawal = await DB.models.Withdrawal.create({ user_id: req.user_id, amount: req.amount, to_address: req.to_address, tx_hash: req.tx_hash });
        try { await walletService.debit(req.user_id, Number(req.amount), 'USDT', { source: 'withdraw_manual' }, withdrawal.id); } catch (e) {}
        return req;
    } catch (e) {
        req.status = 'failed';
        req.fail_reason = e && e.message ? e.message : 'send error';
        await req.save();
        throw new AppError(req.fail_reason, 400);
    }
}

async function reject(id, reason) {
    const req = await DB.models.WithdrawRequest.findByPk(id);
    if (!req) throw new AppError('Withdraw request not found', 404);
    if (!['pending','processing'].includes(req.status)) throw new AppError('Invalid request status', 400);
    req.status = 'failed';
    req.fail_reason = reason || 'admin_reject';
    await req.save();
    return req;
}

async function autoProcessPending() {
    if (String(process.env.WITHDRAW_MODE || 'manual') !== 'auto') return { ok: true, processed: 0 };
    const key = process.env.HOT_WALLET_PRIVATE_KEY;
    const contract = process.env.USDT_CONTRACT;
    if (!key || !contract) return { ok: false, error: 'Missing HOT_WALLET_PRIVATE_KEY or USDT_CONTRACT' };
    const pending = await DB.models.WithdrawRequest.findOne({ where: { status: 'pending' }, order: [['id','ASC']] });
    if (!pending) return { ok: true, processed: 0 };
    pending.status = 'processing';
    await pending.save();
    try {
        const tx = await tronService.sendUSDT(key, pending.to_address, Number(pending.amount), contract);
        pending.tx_hash = typeof tx === 'string' ? tx : (tx && tx.txID) || null;
        pending.status = 'completed';
        await pending.save();
        const withdrawal = await DB.models.Withdrawal.create({ user_id: pending.user_id, amount: pending.amount, to_address: pending.to_address, tx_hash: pending.tx_hash });
        try { await walletService.debit(pending.user_id, Number(pending.amount), 'USDT', { source: 'withdraw_auto' }, withdrawal.id); } catch (e) {}
        return { ok: true, processed: 1 };
    } catch (e) {
        pending.status = 'failed';
        pending.fail_reason = e && e.message ? e.message : 'send error';
        await pending.save();
        return { ok: false, error: pending.fail_reason };
    }
}

module.exports = { createRequest, listUserWithdraws, adminList, approveManual, reject, autoProcessPending };
