// backend/src/models/Notification.js - 修復版
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notification = sequelize.define('Notification', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.STRING(36),
            allowNull: false,
            comment: '接收通知的用戶ID'
        },
        fromUserId: {
            type: DataTypes.STRING(36),
            allowNull: true,
            comment: '觸發通知的用戶ID'
        },
        type: {
            type: DataTypes.ENUM('follow', 'like', 'comment', 'system'),
            allowNull: false,
            comment: '通知類型'
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
            comment: '通知標題'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '通知內容'
        },
        relatedId: {
            type: DataTypes.STRING(36),
            allowNull: true,
            comment: '相關內容ID（貼文ID等）'
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '是否已讀'
        },
        readAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '已讀時間'
        }
    }, {
        tableName: 'notifications',
        indexes: [
            { fields: ['userId'] },
            { fields: ['type'] },
            { fields: ['isRead'] },
            { fields: ['createdAt'] }
        ]
    });

    return Notification;
};