const DB = require('../models');
const Deposit = DB.models.Deposit;
const walletService = require('./wallet.service');

module.exports = {
    async createDeposit(userId, payload) {
        let code;
        for (let i = 0; i < 5; i++) {
            code = 'DEP-' + Math.random().toString(36).slice(2, 8).toUpperCase();
            const exists = await Deposit.findOne({ where: { reference_code: code } });
            if (!exists) break;
        }
        return await Deposit.create({
            user_id: userId,
            amount: payload.amount,
            currency: payload.currency || 'USDT',
            type: payload.type || 'crypto',
            provider: payload.provider || 'onchain',
            chain: payload.chain || 'TRON',
            status: 'pending',
            reference_code: code,
            forwarder_id: payload.forwarder_id || null,
            metadata: payload.metadata || null
        });
    },

    async markSuccess(depositId) {
        const dep = await Deposit.findByPk(depositId);
        if (!dep) return null;
        if (dep.status === 'success') return dep;
        dep.status = 'success';
        await dep.save();
        await walletService.credit(dep.user_id, Number(dep.amount), dep.currency, { source: dep.provider }, dep.id);
        try {
            const bonusService = require('./bonus.service');
            await bonusService.applyBonusesForDeposit(dep);
        } catch (e) {}
        return dep;
    },

    async getTotalDeposited(userId) {
        const total = await Deposit.sum('amount', {
            where: { user_id: userId, status: 'success' }
        });
        return Number(total || 0);
    },

    async getTotalDepositedGlobal() {
        const total = await Deposit.sum('amount', {
            where: { status: 'success' }
        });
        const pending = await Deposit.count({ where: { status: 'pending' } });
        const failed = await Deposit.count({ where: { status: 'failed' } });
        return { total: Number(total || 0), pending, failed };
    },

    async reauditSuccessWithoutTxid() {
        const list = await Deposit.findAll({ where: { status: 'success', txid: null } });
        let changed = 0;
        for (const dep of list) {
            dep.status = 'pending';
            await dep.save();
            changed++;
        }
        return { changed, totalChecked: list.length };
    },

    async getUserDeposits(userId, limit = 50, offset = 0) {
        return await Deposit.findAll({
            where: { user_id: userId },
            order: [['id', 'DESC']],
            limit,
            offset
        });
    }
};
