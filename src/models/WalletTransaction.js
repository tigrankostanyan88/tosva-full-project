module.exports = (con, DataTypes) => {
    const WalletTransaction = con.define('wallet_transactions', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        amount: { type: DataTypes.DECIMAL(20, 8), allowNull: false },
        currency: { type: DataTypes.STRING(10), allowNull: false },
        type: { type: DataTypes.ENUM, values: ['deposit','bonus','withdrawal'], allowNull: false },
        reference_id: { type: DataTypes.INTEGER },
        metadata: { type: DataTypes.JSON },
        date: { type: DataTypes.DATE, defaultValue: con.literal('CURRENT_TIMESTAMP'), allowNull: false }
    });
    return WalletTransaction;
}
