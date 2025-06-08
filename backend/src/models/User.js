// backend/src/models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: () => 'user-' + Date.now()
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            field: 'username'
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            field: 'email'
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'password'
        },
        displayName: {
            type: DataTypes.STRING(100),
            field: 'display_name'
        },
        avatarUrl: {
            type: DataTypes.STRING(500),
            field: 'avatar_url'
        },
        userRole: {
            type: DataTypes.ENUM('regular', 'verified', 'admin'),
            defaultValue: 'regular',
            field: 'user_role'
        },
        verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'verified'
        },
        postsCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'posts_count'
        },
        followersCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'followers_count'
        },
        followingCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'following_count'
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at'
        }
    }, {
        tableName: 'users', // 🔧 改為小寫！
        timestamps: true,
        underscored: false,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    // 密碼加密
    User.beforeCreate(async (user) => {
        if (user.password) {
            user.password = await bcrypt.hash(user.password, 12);
        }
    });

    // 密碼驗證方法
    User.prototype.comparePassword = async function(password) {
        return bcrypt.compare(password, this.password);
    };

    return User;
};