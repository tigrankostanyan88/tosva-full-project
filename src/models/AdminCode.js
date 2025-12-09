module.exports = (con, DataTypes) => {
    const AdminCode = con.define('admin_codes', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        code: { type: DataTypes.STRING(32), allowNull: false },
        generated_at: { type: DataTypes.DATE, defaultValue: con.literal('CURRENT_TIMESTAMP'), allowNull: false },
        expires_at: { type: DataTypes.DATE, allowNull: false },
        used_by_user_id: { type: DataTypes.INTEGER, allowNull: true }
    });
    return AdminCode;
}
