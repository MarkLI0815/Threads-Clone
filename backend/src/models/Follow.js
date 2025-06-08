const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Follow = sequelize.define('Follow', {
        id: {
            type: DataTypes.STRING(36), // 🔧 如果是 UUID，改為 STRING(36)
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4, // 🔧 使用 UUID 生成策略
            field: 'id'
        },
        followerId: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'follower_id'
        },
        followingId: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'following_id'
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
        tableName: 'follows',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['follower_id', 'following_id']
            }
        ]
    });

    return Follow;
};