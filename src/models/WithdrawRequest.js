module.exports = (con, DataTypes) => {
    const WithdrawRequest = con.define('withdraw_requests', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
        to_address: { type: DataTypes.STRING(100), allowNull: false },
        status: { type: DataTypes.ENUM, values: ['pending','processing','failed','completed'], allowNull: false, defaultValue: 'pending' },
        tx_hash: { type: DataTypes.STRING(120) },
        fail_reason: { type: DataTypes.TEXT },
        date: { type: DataTypes.DATE, defaultValue: con.literal('CURRENT_TIMESTAMP'), allowNull: false },
        updated_at: { type: DataTypes.DATE }
    }, {
        indexes: [
            { fields: ['user_id'] },
            { fields: ['status'] }
        ]
    });
    return WithdrawRequest;
}
