module.exports = (con, DataTypes) => {
    const Withdrawal = con.define('withdrawals', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
        to_address: { type: DataTypes.STRING(100), allowNull: false },
        tx_hash: { type: DataTypes.STRING(120) },
        date: { type: DataTypes.DATE, defaultValue: con.literal('CURRENT_TIMESTAMP'), allowNull: false }
    }, {
        indexes: [
            { fields: ['user_id'] }
        ]
    });
    return Withdrawal;
}
