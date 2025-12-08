const DB = require('../utils/db');
const Sequelize = DB.Sequelize;
const connect = DB.con;

DB.models = {
  User: require('./User')(connect, Sequelize.DataTypes),
  File: require('./File')(connect, Sequelize.DataTypes),
  Deposit: require('./Deposit')(connect, Sequelize.DataTypes),
  Wallet: require('./Wallet')(connect, Sequelize.DataTypes),
  WalletTransaction: require('./WalletTransaction')(connect, Sequelize.DataTypes),
  WithdrawRequest: require('./WithdrawRequest')(connect, Sequelize.DataTypes),
  Withdrawal: require('./Withdrawal')(connect, Sequelize.DataTypes),
  StripeAccount: require('./StripeAccount')(connect, Sequelize.DataTypes),
  WithdrawConfig: require('./WithdrawConfig')(connect, Sequelize.DataTypes),
  BonusCode: require('./BonusCode')(connect, Sequelize.DataTypes),
  BonusClaim: require('./BonusClaim')(connect, Sequelize.DataTypes),
  BonusSlot: require('./BonusSlot')(connect, Sequelize.DataTypes),
};

// Associations

DB.models.User.hasMany(DB.models.WithdrawRequest, { foreignKey: 'user_id', as: 'withdrawRequests', constraints: false });
DB.models.WithdrawRequest.belongsTo(DB.models.User, { foreignKey: 'user_id', as: 'user', constraints: false });
DB.models.User.hasMany(DB.models.Withdrawal, { foreignKey: 'user_id', as: 'withdrawals', constraints: false });
DB.models.Withdrawal.belongsTo(DB.models.User, { foreignKey: 'user_id', as: 'user', constraints: false });
DB.models.StripeAccount.belongsTo(DB.models.User, { foreignKey: 'user_id', as: 'user', constraints: false });

DB.models.BonusCode.hasMany(DB.models.BonusClaim, { foreignKey: 'code_id', as: 'claims', constraints: false });
DB.models.BonusClaim.belongsTo(DB.models.BonusCode, { foreignKey: 'code_id', as: 'code', constraints: false });
DB.models.User.hasMany(DB.models.BonusClaim, { foreignKey: 'user_id', as: 'bonusClaims', constraints: false });
DB.models.BonusClaim.belongsTo(DB.models.User, { foreignKey: 'user_id', as: 'user', constraints: false });

connect.sync();

module.exports = DB;
