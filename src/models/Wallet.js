module.exports = (con, DataTypes) => {
    const Wallet = con.define('wallets', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        balance: { type: DataTypes.DECIMAL(20, 8), allowNull: false, defaultValue: 0 },
        currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'USDT' },
        last_accrual: { type: DataTypes.DATE },
        date: { type: DataTypes.DATE, defaultValue: con.literal('CURRENT_TIMESTAMP'), allowNull: false }
    });
    return Wallet;
}
