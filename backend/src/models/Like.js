// backend/src/models/Like.js - 正確的 UUID 版本
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Like = sequelize.define('Like', {
        id: {
            type: DataTypes.STRING(36), // 🔧 改為 STRING(36) 匹配 varchar(36)
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4, // 🔧 使用 UUID 生成策略
            field: 'id'
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'user_id'
        },
        postId: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'post_id'
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
        tableName: 'likes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'post_id']
            }
        ]
    });

    return Like;
};