module.exports = (con, DataTypes) => {
  const WithdrawConfig = con.define('withdraw_config', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    key: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    value_int: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
    date: { type: DataTypes.DATE, defaultValue: con.literal('CURRENT_TIMESTAMP'), allowNull: false }
  }, {
    indexes: [ { unique: true, fields: ['key'] } ]
  });
  return WithdrawConfig;
}
