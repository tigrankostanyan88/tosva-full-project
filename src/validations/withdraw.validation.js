const createWithdrawSchema = {
    validate(body) {
        const errors = [];
        const value = {
            amount: body && body.amount,
            to_address: body && body.to_address ? String(body.to_address).trim() : null
        };
        const num = Number(value.amount);
        if (!Number.isFinite(num) || num <= 0) {
            errors.push({ message: 'Сумма должна быть положительным числом' });
        } else {
            value.amount = num;
        }
        if (!value.to_address || value.to_address.length < 26 || value.to_address.length > 100 || !/^T/.test(value.to_address)) {
            errors.push({ message: 'Укажите корректный адрес Tron (TRC20 USDT) — адрес должен начинаться на T' });
        }

        return {
            error: errors.length ? { details: errors } : null,
            value
        };
    }
};

module.exports = { createWithdrawSchema };
