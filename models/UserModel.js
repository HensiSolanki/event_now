const { DataTypes } = require('sequelize');
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sequelize = require("../config/database");

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    passwordResetToken: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeSave: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 12);
            }
        }
    }
});

/**
 * Instance method to create password reset token
 */
User.prototype.createPasswordResetToken = function () {
    let resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = resetToken;
    resetToken = resetToken + "|" + this.id;
    this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    let bufferObj = Buffer.from(resetToken, "utf8");
    resetToken = bufferObj.toString("base64");
    return resetToken;
};

module.exports = User;
