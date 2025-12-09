const DB = require('../utils/db');
const Sequelize = DB.Sequelize;
const connect = DB.con;

DB.models = {
  User: require('./User')(connect, Sequelize.DataTypes),
  File: require('./File')(connect, Sequelize.DataTypes),
  Deposit: require('./Deposit')(connect, Sequelize.DataTypes),
  Wallet: require('./Wallet')(connect, Sequelize.DataTypes),
  WalletTransaction: require('./WalletTransaction')(connect, Sequelize.DataTypes),
  AdminCodeSlot: require('./AdminCodeSlot')(connect, Sequelize.DataTypes),
  AdminCode: require('./AdminCode')(connect, Sequelize.DataTypes),
  AdminCodeUsage: require('./AdminCodeUsage')(connect, Sequelize.DataTypes),
  WithdrawRequest: require('./WithdrawRequest')(connect, Sequelize.DataTypes),
  Withdrawal: require('./Withdrawal')(connect, Sequelize.DataTypes),
  StripeAccount: require('./StripeAccount')(connect, Sequelize.DataTypes),
  WithdrawConfig: require('./WithdrawConfig')(connect, Sequelize.DataTypes),
};

// Associations
DB.models.User.hasMany(DB.models.AdminCodeUsage, { foreignKey: 'user_id', as: 'codeUsages', constraints: false });
DB.models.AdminCodeUsage.belongsTo(DB.models.User, { foreignKey: 'user_id', as: 'user', constraints: false });

DB.models.User.hasMany(DB.models.WithdrawRequest, { foreignKey: 'user_id', as: 'withdrawRequests', constraints: false });
DB.models.WithdrawRequest.belongsTo(DB.models.User, { foreignKey: 'user_id', as: 'user', constraints: false });
DB.models.User.hasMany(DB.models.Withdrawal, { foreignKey: 'user_id', as: 'withdrawals', constraints: false });
DB.models.Withdrawal.belongsTo(DB.models.User, { foreignKey: 'user_id', as: 'user', constraints: false });
DB.models.StripeAccount.belongsTo(DB.models.User, { foreignKey: 'user_id', as: 'user', constraints: false });

module.exports = DB;
