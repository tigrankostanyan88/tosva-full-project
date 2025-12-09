module.exports = (con, DataTypes) => {
    const AdminCodeSlot = con.define('admin_code_slots', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        time_string: { type: DataTypes.STRING(5), allowNull: false, unique: true }
    });
    return AdminCodeSlot;
}
