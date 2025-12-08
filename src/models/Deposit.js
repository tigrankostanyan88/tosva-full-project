module.exports = (con, DataTypes) => {
    const Deposit = con.define('deposits', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'User ID'
        },
        amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            comment: 'Deposit amount'
        },
        type: {
            type: DataTypes.ENUM,
            values: ['crypto','fiat'],
            allowNull: false,
            defaultValue: 'crypto'
        },
        provider: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: 'onchain'
        },
        currency: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'USDT',
            comment: 'Currency code'
        },
        status: {
            type: DataTypes.ENUM,
            values: ['pending', 'success', 'failed'],
            allowNull: false,
            defaultValue: 'pending',
            comment: 'Deposit status'
        },
        reference_code: { type: DataTypes.STRING(30), unique: true },
        forwarder_id: { type: DataTypes.INTEGER, allowNull: true },
        txid: { type: DataTypes.STRING(100) },
        chain: { type: DataTypes.STRING(20), defaultValue: 'TRON' },
        provider_payment_id: { type: DataTypes.STRING(100) },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Provider metadata'
        },
        date: {
            type: DataTypes.DATE,
            defaultValue: con.literal('CURRENT_TIMESTAMP'),
            allowNull: false,
            comment: 'Creation date'
        }
    }, {
        indexes: [
            { fields: ['user_id'] },
            { fields: ['status'] },
            { unique: true, fields: ['reference_code'] }
        ]
    });

    return Deposit;
}
