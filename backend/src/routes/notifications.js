// backend/src/routes/notifications.js
const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require('../../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// 獲取通知列表
router.get('/', authenticateToken, getNotifications);

// 標記通知為已讀
router.patch('/read', authenticateToken, markAsRead);

// 標記所有通知為已讀
router.patch('/read-all', authenticateToken, markAllAsRead);

// 獲取未讀通知數量
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { Notification } = require('../models');
        
        const count = await Notification.count({
            where: { userId, isRead: false }
        });

        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('❌ 獲取未讀通知數量錯誤:', error);
        res.status(500).json({
            success: false,
            error: '獲取未讀通知數量失敗'
        });
    }
});

module.exports = router;