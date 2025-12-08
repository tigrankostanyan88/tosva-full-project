module.exports = (con, DataTypes) => {
  const StripeAccount = con.define('stripe_accounts', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    provider: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'stripe' },
    account_id: { type: DataTypes.STRING(100), allowNull: false },
    external_id: { type: DataTypes.STRING(100) },
    date: { type: DataTypes.DATE, defaultValue: con.literal('CURRENT_TIMESTAMP'), allowNull: false }
  }, {
    indexes: [ { fields: ['user_id'] }, { unique: true, fields: ['account_id'] } ]
  });
  return StripeAccount;
}
