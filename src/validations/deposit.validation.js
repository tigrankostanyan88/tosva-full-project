const createDepositSchema = {
    validate(body) {
        const errors = [];

        const value = {
            amount: body && body.amount,
            currency: (body && body.currency) ? String(body.currency).toUpperCase() : 'USDT',
            type: body && body.type ? String(body.type).toLowerCase() : 'crypto',
            provider: body && body.provider ? String(body.provider).toLowerCase() : 'onchain',
            chain: body && body.chain ? String(body.chain).toUpperCase() : null,
            metadata: body && body.metadata ? body.metadata : null
        };

        const num = Number(value.amount);
        if (!Number.isFinite(num) || num <= 0) {
            errors.push({ message: 'amount must be a positive number' });
        } else {
            value.amount = num;
        }

        const cfgEnv = process.env.REFERRAL_BONUS_JSON;
        let minimum = 500;
        if (cfgEnv) {
            try {
                const parsed = JSON.parse(cfgEnv);
                if (parsed && Number.isFinite(parsed.minimum_deposit)) minimum = Number(parsed.minimum_deposit);
            } catch (e) {}
        }
        if (Number.isFinite(value.amount) && value.amount < minimum) {
            errors.push({ message: `minimum deposit is ${minimum} USD` });
        }

        if (typeof value.currency !== 'string' || value.currency.length < 3 || value.currency.length > 10) {
            errors.push({ message: 'currency must be a valid code' });
        }

        if (!['crypto','fiat'].includes(value.type)) {
            errors.push({ message: 'type must be crypto or fiat' });
        }
        if (value.type === 'crypto' && !['onchain','nowpayments','coinpayments'].includes(value.provider)) {
            errors.push({ message: 'provider must be onchain|nowpayments|coinpayments for crypto' });
        }
        if (value.type === 'fiat' && !['stripe'].includes(value.provider)) {
            errors.push({ message: 'provider must be stripe for fiat' });
        }

        return {
            error: errors.length ? { details: errors } : null,
            value
        };
    }
};

module.exports = { createDepositSchema };
