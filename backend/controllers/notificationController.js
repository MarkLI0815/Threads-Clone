// backend/controllers/notificationController.js
const { Notification, User } = require('../src/models');
const { Op } = require('sequelize');

// 獲取用戶通知列表
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const unreadOnly = req.query.unreadOnly === 'true';

        console.log(`🔔 獲取用戶 ${userId} 的通知 (頁面: ${page}, 只顯示未讀: ${unreadOnly})`);

        const whereCondition = { userId };
        if (unreadOnly) {
            whereCondition.isRead = false;
        }

        const { count, rows: notifications } = await Notification.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    as: 'fromUser',
                    attributes: ['id', 'username', 'displayName', 'avatarUrl', 'userRole', 'verified'],
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        const totalPages = Math.ceil(count / limit);
        const unreadCount = await Notification.count({
            where: { userId, isRead: false }
        });

        console.log(`✅ 獲取到 ${notifications.length} 個通知，未讀 ${unreadCount} 個`);

        res.json({
            success: true,
            data: {
                notifications: notifications.map(n => n.toJSON()),
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages,
                    hasMore: page < totalPages
                },
                unreadCount
            }
        });

    } catch (error) {
        console.error('❌ 獲取通知錯誤:', error);
        res.status(500).json({
            success: false,
            error: '獲取通知失敗'
        });
    }
};

// 標記通知為已讀
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationIds } = req.body; // 陣列或單個ID

        const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

        const updateCount = await Notification.update(
            { 
                isRead: true, 
                readAt: new Date() 
            },
            { 
                where: { 
                    id: { [Op.in]: ids },
                    userId // 確保只能標記自己的通知
                } 
            }
        );

        console.log(`✅ 標記 ${updateCount[0]} 個通知為已讀`);

        res.json({
            success: true,
            data: { updatedCount: updateCount[0] }
        });

    } catch (error) {
        console.error('❌ 標記通知已讀錯誤:', error);
        res.status(500).json({
            success: false,
            error: '標記通知已讀失敗'
        });
    }
};

// 標記所有通知為已讀
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const updateCount = await Notification.update(
            { 
                isRead: true, 
                readAt: new Date() 
            },
            { 
                where: { 
                    userId,
                    isRead: false
                } 
            }
        );

        console.log(`✅ 標記所有通知為已讀: ${updateCount[0]} 個`);

        res.json({
            success: true,
            data: { updatedCount: updateCount[0] }
        });

    } catch (error) {
        console.error('❌ 標記所有通知已讀錯誤:', error);
        res.status(500).json({
            success: false,
            error: '標記所有通知已讀失敗'
        });
    }
};

// 創建通知（內部使用）
const createNotification = async (data) => {
    try {
        const { userId, fromUserId, type, title, content, relatedId } = data;

        // 不要給自己發通知
        if (userId === fromUserId) {
            return null;
        }

        const notification = await Notification.create({
            userId,
            fromUserId,
            type,
            title,
            content,
            relatedId
        });

        console.log(`🔔 創建通知: ${type} -> ${userId} from ${fromUserId}`);
        return notification;

    } catch (error) {
        console.error('❌ 創建通知錯誤:', error);
        return null;
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createNotification
};