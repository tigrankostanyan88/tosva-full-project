const DB = require('../models');
const interestService = require('./interest.service');

async function getPrincipal(userId) {
    const res = await DB.models.Deposit.findAll({
        where: { user_id: userId, status: 'success' },
        attributes: [[DB.con.fn('SUM', DB.con.col('amount')), 'sum']],
        raw: true
    });
    const sum = res && res[0] && res[0].sum ? Number(res[0].sum) : 0;
    return sum;
}

async function getWithdrawn(userId) {
    const res = await DB.models.Withdrawal.findAll({
        where: { user_id: userId },
        attributes: [[DB.con.fn('SUM', DB.con.col('amount')), 'sum']],
        raw: true
    });
    const sum = res && res[0] && res[0].sum ? Number(res[0].sum) : 0;
    return sum;
}

async function getLocked(userId) {
    const res = await DB.models.WithdrawRequest.findAll({
        where: { user_id: userId, status: ['pending','processing'] },
        attributes: [[DB.con.fn('SUM', DB.con.col('amount')), 'sum']],
        raw: true
    });
    const sum = res && res[0] && res[0].sum ? Number(res[0].sum) : 0;
    return sum;
}

async function getBalance(userId) {
    const principal = await getPrincipal(userId);
    const days = await interestService.daysSinceFirstDeposit(userId);
    const interest = interestService.calcInterest(principal, days);
    const withdrawn = await getWithdrawn(userId);
    const balance = principal + interest - withdrawn;
    return { principal, interest, withdrawn, balance };
}

async function getAvailable(userId) {
    const b = await getBalance(userId);
    const locked = await getLocked(userId);
    return { ...b, locked, available: b.balance - locked };
}

module.exports = { getPrincipal, getWithdrawn, getLocked, getBalance, getAvailable };
