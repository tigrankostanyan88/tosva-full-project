module.exports = (con, DataTypes) => {
  const BonusCode = con.define('bonus_codes', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false },
    generated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: con.literal('CURRENT_TIMESTAMP') },
    expires_at: { type: DataTypes.DATE, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  }, {
    indexes: [ { fields: ['active'] }, { unique: true, fields: ['code'] } ]
  });
  return BonusCode;
}
