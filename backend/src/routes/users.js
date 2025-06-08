// backend/src/routes/users.js - 增強版包含統計刷新功能
const express = require('express');
const router = express.Router();
const { User, Follow } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { 
    getUserProfile, 
    updateUserProfile, 
    testUserStats,
    forceRefreshStats,      // 🔥 新增
    syncAllUserStats       // 🔥 新增
} = require('../../controllers/userController');
const { createNotification } = require('../../controllers/notificationController');

// 搜尋用戶
router.get('/search', authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.json({ users: [] });
        }

        const users = await User.findAll({
            where: {
                [require('sequelize').Op.or]: [
                    { username: { [require('sequelize').Op.like]: `%${q}%` } },
                    { displayName: { [require('sequelize').Op.like]: `%${q}%` } }
                ]
            },
            attributes: ['id', 'username', 'displayName', 'avatarUrl', 'userRole', 'verified'],
            limit: 10
        });

        // 檢查當前用戶對每個搜尋結果用戶的追蹤狀態
        const usersWithFollowStatus = await Promise.all(users.map(async (user) => {
            const userJson = user.toJSON();
            
            // 檢查是否已追蹤
            const followRecord = await Follow.findOne({
                where: {
                    followerId: req.user.id,
                    followingId: user.id
                }
            });
            
            userJson.isFollowing = !!followRecord;
            userJson.isOwnProfile = user.id === req.user.id;
            
            return userJson;
        }));

        res.json({ users: usersWithFollowStatus });
    } catch (error) {
        console.error('搜尋用戶錯誤:', error);
        res.status(500).json({ error: '搜尋用戶失敗' });
    }
});

// 追蹤/取消追蹤用戶
router.post('/:userId/follow', authenticateToken, async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const currentUserId = req.user.id;

        if (targetUserId === currentUserId) {
            return res.status(400).json({ error: '無法追蹤自己' });
        }

        // 檢查目標用戶是否存在
        const targetUser = await User.findByPk(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ error: '用戶不存在' });
        }

        // 檢查是否已經追蹤
        const existingFollow = await Follow.findOne({
            where: {
                followerId: currentUserId,
                followingId: targetUserId
            }
        });

        let isFollowing;
        
        if (existingFollow) {
            // 取消追蹤
            await existingFollow.destroy();
            isFollowing = false;
            console.log(`✅ 用戶 ${currentUserId} 取消追蹤 ${targetUserId}`);
        } else {
            // 開始追蹤
            await Follow.create({
                followerId: currentUserId,
                followingId: targetUserId
            });
            isFollowing = true;
            console.log(`✅ 用戶 ${currentUserId} 開始追蹤 ${targetUserId}`);

            // 🔔 發送追蹤通知
            await createNotification({
                userId: targetUserId,
                fromUserId: currentUserId,
                type: 'follow',
                title: `${req.user.username} 開始追蹤您`,
                content: `恭喜！您獲得了一位新的追蹤者`,
                relatedId: null
            });

            console.log(`🔔 已發送追蹤通知給用戶 ${targetUserId}`);
        }

        res.json({
            message: isFollowing ? '追蹤成功' : '取消追蹤成功',
            isFollowing
        });

    } catch (error) {
        console.error('❌ 追蹤操作錯誤:', error);
        res.status(500).json({ error: '追蹤操作失敗' });
    }
});

// 獲取粉絲列表
router.get('/:userId/followers', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const followers = await Follow.findAll({
            where: { followingId: userId },
            include: [{
                model: User,
                as: 'follower',
                attributes: ['id', 'username', 'displayName', 'avatarUrl', 'userRole', 'verified']
            }]
        });

        const followerUsers = followers.map(follow => follow.follower);

        res.json({ followers: followerUsers });
    } catch (error) {
        console.error('獲取粉絲列表錯誤:', error);
        res.status(500).json({ error: '獲取粉絲列表失敗' });
    }
});

// 獲取追蹤列表
router.get('/:userId/following', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const following = await Follow.findAll({
            where: { followerId: userId },
            include: [{
                model: User,
                as: 'following',
                attributes: ['id', 'username', 'displayName', 'avatarUrl', 'userRole', 'verified']
            }]
        });

        const followingUsers = following.map(follow => follow.following);

        res.json({ following: followingUsers });
    } catch (error) {
        console.error('獲取追蹤列表錯誤:', error);
        res.status(500).json({ error: '獲取追蹤列表失敗' });
    }
});

// 🔥 獲取用戶檔案 - 包含統計資訊
router.get('/:userId/profile', authenticateToken, getUserProfile);

// 🔥 更新用戶檔案
router.put('/profile', authenticateToken, updateUserProfile);

// 🔥 強制刷新指定用戶的統計
router.post('/:userId/stats/refresh', authenticateToken, forceRefreshStats);

// 🔥 強制刷新當前用戶的統計
router.post('/stats/refresh', authenticateToken, forceRefreshStats);

// 🔥 同步所有用戶統計（管理員專用）
router.post('/stats/sync-all', authenticateToken, syncAllUserStats);

// 🔥 測試用戶統計計算
router.get('/:userId/stats/test', authenticateToken, testUserStats);

// 🔥 獲取當前用戶資訊
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: [
                'id', 'username', 'displayName', 'email', 'avatarUrl',
                'userRole', 'verified', 'createdAt', 'updatedAt'
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: '用戶不存在'
            });
        }

        res.json({
            success: true,
            data: user.toJSON()
        });
    } catch (error) {
        console.error('❌ 獲取用戶資訊錯誤:', error);
        res.status(500).json({
            success: false,
            error: '獲取用戶資訊失敗'
        });
    }
});

module.exports = router;