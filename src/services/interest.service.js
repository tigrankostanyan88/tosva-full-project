const DB = require('../models');

function floorDays(ms) {
    return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

async function daysSinceFirstDeposit(userId) {
    const dep = await DB.models.Deposit.findOne({
        where: { user_id: userId, status: 'success' },
        order: [['date','ASC']],
        attributes: ['date']
    });
    if (!dep || !dep.date) return 0;
    const diff = Date.now() - new Date(dep.date).getTime();
    return floorDays(diff);
}

function calcInterest(principal, days, rate = 0.008) {
    const p = Number(principal) || 0;
    const d = Number(days) || 0;
    return p * rate * d;
}

module.exports = { daysSinceFirstDeposit, calcInterest };
