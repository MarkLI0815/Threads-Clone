const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Comment = sequelize.define('Comment', {
        id: {
            type: DataTypes.STRING(36), // 🔧 如果是 UUID，改為 STRING(36)
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
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'content'
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
        tableName: 'comments',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Comment;
};