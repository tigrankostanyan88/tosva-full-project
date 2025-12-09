module.exports = (con, DataTypes) => {
    const AdminCodeUsage = con.define('admin_code_usages', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        admin_code_id: { type: DataTypes.INTEGER, allowNull: false },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        used_at: { type: DataTypes.DATE, defaultValue: con.literal('CURRENT_TIMESTAMP'), allowNull: false }
    }, {
        indexes: [
            { fields: ['admin_code_id'] },
            { fields: ['user_id'] },
            { unique: true, fields: ['admin_code_id', 'user_id'] }
        ]
    });
    return AdminCodeUsage;
}
