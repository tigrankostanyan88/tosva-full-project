const DB = require('../models');
const Deposit = DB.models.Deposit;
const walletService = require('./wallet.service');
const User = DB.models.User;

function getReferralConfig() {
    const def = {
        minimum_deposit: 500,
        tiers: [
            { min: 500, max: 1000, bonus_b_user: 40, bonus_x_user: 90 },
            { min: 1000, max: 3000, bonus_b_user: 90, bonus_x_user: 180 },
            { min: 3000, max: 5000, bonus_b_user: 290, bonus_x_user: 145 },
            { min: 5000, max: 15000, bonus_b_user: 250, bonus_x_user: 500 },
            { min: 15000, max: null, bonus_b_user: 570, bonus_x_user: 1500 }
        ]
    };
    try {
        const raw = process.env.REFERRAL_BONUS_JSON;
        if (!raw) return def;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.tiers)) return def;
        return {
            minimum_deposit: Number.isFinite(parsed.minimum_deposit) ? Number(parsed.minimum_deposit) : def.minimum_deposit,
            tiers: parsed.tiers.map(t => ({
                min: Number(t.min),
                max: (t.max === null || t.max === undefined) ? null : Number(t.max),
                bonus_b_user: Number(t.bonus_b_user),
                bonus_x_user: Number(t.bonus_x_user)
            }))
        };
    } catch (e) { return def; }
}

function pickTier(amount, cfg) {
    for (const t of cfg.tiers) {
        const minOk = amount >= t.min;
        const maxOk = t.max === null ? true : amount < t.max;
        if (minOk && maxOk) return t;
    }
    return null;
}

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

        // Referral bonus logic
        const cfg = getReferralConfig();
        const amount = Number(dep.amount);
        if (Number.isFinite(amount) && amount >= cfg.minimum_deposit) {
            const tier = pickTier(amount, cfg);
            if (tier) {
                const bBonus = Number(tier.bonus_b_user || 0);
                const xBonus = Number(tier.bonus_x_user || 0);
                // B-user bonus
                if (bBonus > 0) {
                    try { await walletService.credit(dep.user_id, bBonus, dep.currency, { source: 'referral_bonus_b', deposit_id: dep.id, tier }, dep.id, 'bonus'); } catch (e) {}
                }
                // X-user bonus
                const user = await User.findByPk(dep.user_id);
                if (user && user.referrer_id && xBonus > 0) {
                    try { await walletService.credit(user.referrer_id, xBonus, dep.currency, { source: 'referral_bonus_x', from_user_id: dep.user_id, deposit_id: dep.id, tier }, dep.id, 'bonus'); } catch (e) {}
                }
            }
        }
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
