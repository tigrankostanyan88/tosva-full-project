module.exports = (con, DataTypes) => {
  const BonusSlot = con.define('bonus_slots', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    time_string: { type: DataTypes.STRING(5), allowNull: false }
  }, {
    indexes: [ { unique: true, fields: ['time_string'] } ]
  });
  return BonusSlot;
}
