module.exports = (con, DataTypes) => {
  const BonusClaim = con.define('bonus_claims', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    code_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(20, 8), allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false, defaultValue: con.literal('CURRENT_TIMESTAMP') }
  }, {
    indexes: [ { fields: ['user_id'] }, { fields: ['code_id'] } ]
  });
  return BonusClaim;
}
