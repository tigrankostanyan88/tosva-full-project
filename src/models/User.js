const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = (con, DataTypes) => {
    const User = con.define('users', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        unique_tag: {
            type: DataTypes.STRING,
            unique: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING
        },
        provider: {
            type: DataTypes.STRING,
            defaultValue: 'Other'
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: {
                    msg: 'Email is incorrect!'
                }
            }
        },
        password: {
            type: DataTypes.TEXT,
            allowNull: false,
            // set(value) {
            //     // Storing passwords in plaintext in the database is terrible.
            //     // Hashing the value with an appropriate cryptographic hash function is better.
            //     bcrypt.hash(value, 12)
            //         .then(hash => this.setDataValue('password', hash))
            //         .catch(console.log);
            // }
        },
        passwordChangedAt: DataTypes.DATE,
        passwordResetToken: DataTypes.STRING,
        passwordResetExpires: DataTypes.DATE,
        date: {
            type: DataTypes.DATE,
            defaultValue: con.literal("CURRENT_TIMESTAMP"),
            allowNull: false
        },
        deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        role: {
            type: DataTypes.ENUM,
            values: ['user', 'admin'],
            defaultValue: 'user'
        },
        referrer_id: { type: DataTypes.INTEGER }
        ,failedLoginAttempts: { type: DataTypes.INTEGER, defaultValue: 0 }
        ,lockUntil: { type: DataTypes.DATE }
    }, {
        indexes: [{ unique: true, fields: ['email'] }, { unique: true, fields: ['unique_tag'] }],
        hooks: {
            beforeCreate: async (user, options) => {
                // Hash the password with cost of 10
                // const salt = await bcrypt.genSalt();
                const hashedPassword = await bcrypt.hash(user.password, 10);
                user.password = hashedPassword;

                // Delete passwordConfirm field
                // user.passwordConfirm = null;
            },
            beforeUpdate: async (user, options) => {
                if (user.changed('unique_tag')) {
                    throw new Error('unique_tag cannot be changed');
                }
                if (user.changed('password')) {
                    // Hash the password with cost of 10
                    // const salt = await bcrypt.genSalt();
                    const hashedPassword = await bcrypt.hash(user.password, 10);
                    user.password = hashedPassword;
                    user.passwordChangedAt = Date.now() - 1000;

                    // Delete passwordConfirm field
                    // user.passwordConfirm = null;

                    // Reset token
                    if (user.passwordResetToken) {
                        user.passwordResetToken = null;
                        user.passwordResetExpires = null;
                    }
                }
            },
            beforeFind: async (query) => {
                if (query) {
                    if (query.where === undefined) {
                        query.where = {}
                    }
                    // if not defined
                    if (query.where.deleted === undefined) {
                        // only not deleted users
                        query.where.deleted = false;
                    }
                }
            },
        }
    });

    // User.beforeCreate(hashPasswordHook);
    // User.beforeUpdate(hashPasswordHook);

    User.prototype.changedPasswordAfter = function(JWTTimestamp) {
        if (this.passwordChangedAt) {
            const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);

            // console.log(changedTimestamp, JWTTimestamp);
            return JWTTimestamp < changedTimestamp;
        }

        return false;
    }

    User.prototype.correctPassword = async function(candidatePassword, userPassword) {
        return await bcrypt.compare(candidatePassword, userPassword);
    }

	User.prototype.createPasswordResetToken = function() {
		// const resetToken = crypto.randomBytes(32).toString('hex'); // not working
		const resetToken = crypto.randomBytes(20).toString('hex');

		this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

		console.log({ resetToken }, this.passwordResetToken);

		this.passwordResetExpires = Date.now() + (10 * 60 * 1000); // 10 minutes
	  
		return resetToken;
	  };

    return User;
}
