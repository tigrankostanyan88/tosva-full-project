const DB = require('../models');
const Wallet = DB.models.Wallet;
const WalletTransaction = DB.models.WalletTransaction;

async function getOrCreateWallet(userId, currency = 'USDT') {
    let w = await Wallet.findOne({ where: { user_id: userId, currency } });
    if (!w) w = await Wallet.create({ user_id: userId, currency, balance: 0 });
    return w;
}

async function credit(userId, amount, currency = 'USDT', metadata = {}, referenceId = null, type = 'deposit') {
    return await DB.con.transaction(async (t) => {
        const w = await getOrCreateWallet(userId, currency);
        const newBalance = Number(w.balance) + Number(amount);
        w.balance = newBalance;
        await w.save({ transaction: t });
        await WalletTransaction.create({
            user_id: userId,
            amount,
            currency,
            type,
            reference_id: referenceId,
            metadata
        }, { transaction: t });
        return newBalance;
    });
}

async function debit(userId, amount, currency = 'USDT', metadata = {}, referenceId = null) {
    return await DB.con.transaction(async (t) => {
        const w = await getOrCreateWallet(userId, currency);
        const newBalance = Number(w.balance) - Number(amount);
        if (newBalance < 0) throw new Error('Недостаточно средств на кошельке');
        w.balance = newBalance;
        await w.save({ transaction: t });
        await WalletTransaction.create({
            user_id: userId,
            amount: Number(amount) * -1,
            currency,
            type: 'withdrawal',
            reference_id: referenceId,
            metadata
        }, { transaction: t });
        return newBalance;
    });
}

module.exports = { getOrCreateWallet, credit, debit };
