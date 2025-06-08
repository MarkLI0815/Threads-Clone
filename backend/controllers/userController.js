// backend/controllers/userController.js - 增強版包含強制刷新統計
const { User, Post, Follow, Like, Comment } = require('../src/models');
const { Op } = require('sequelize');

// 獲取用戶詳細檔案
const getUserProfile = async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const currentUserId = req.user.id;

        console.log(`👤 獲取用戶檔案: ${targetUserId}, 當前用戶: ${currentUserId}`);

        // 獲取用戶基本資訊
        const user = await User.findByPk(targetUserId, {
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

        // 檢查當前用戶是否追蹤目標用戶
        let isFollowing = false;
        if (currentUserId !== targetUserId) {
            const followRecord = await Follow.findOne({
                where: {
                    followerId: currentUserId,
                    followingId: targetUserId
                }
            });
            isFollowing = !!followRecord;
        }

        // 🔥 強制重新計算統計資訊（確保準確性）
        const stats = await forceRecalculateUserStats(targetUserId);

        // 獲取用戶最近的貼文 (前6篇) 包含正確的互動數據
        const recentPosts = await Post.findAll({
            where: { userId: targetUserId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'displayName', 'avatarUrl', 'userRole', 'verified']
                },
                {
                    model: Like,
                    as: 'likes',
                    attributes: ['id', 'userId']
                },
                {
                    model: Comment,
                    as: 'comments',
                    attributes: ['id', 'userId', 'content', 'createdAt'],
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'username', 'displayName', 'avatarUrl', 'userRole', 'verified'],
                            required: false // 🔥 允許評論沒有用戶（防止資料不一致）
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 6
        });

        const userProfile = {
            ...user.toJSON(),
            isFollowing,
            stats,
            recentPosts: recentPosts.map(post => ({
                ...post.toJSON(),
                likes: post.likes ? post.likes.length : 0,
                commentsCount: post.comments ? post.comments.length : 0,
                isLikedByUser: post.likes ? post.likes.some(like => like.userId === currentUserId) : false,
                comments: post.comments ? post.comments.slice(0, 3) : []
            }))
        };

        console.log(`✅ 成功獲取用戶檔案: ${user.username}`, {
            stats: userProfile.stats,
            postsCount: recentPosts.length
        });

        res.json({
            success: true,
            data: userProfile
        });

    } catch (error) {
        console.error('❌ 獲取用戶檔案錯誤:', error);
        res.status(500).json({
            success: false,
            error: '獲取用戶檔案失敗'
        });
    }
};

// 🔥 強制重新計算用戶統計（最準確的方法）
const forceRecalculateUserStats = async (userId) => {
    try {
        console.log(`🔄 強制重新計算用戶 ${userId} 的統計...`);

        // 1. 獲取所有貼文並更新其統計
        const posts = await Post.findAll({
            where: { userId },
            attributes: ['id']
        });

        let totalLikesReceived = 0;
        let totalCommentsReceived = 0;

        // 2. 為每個貼文重新計算並更新統計
        for (const post of posts) {
            const actualLikes = await Like.count({ where: { postId: post.id } });
            const actualComments = await Comment.count({ where: { postId: post.id } });

            // 更新貼文的統計欄位
            await Post.update({
                likeCount: actualLikes,
                commentCount: actualComments
            }, {
                where: { id: post.id }
            });

            totalLikesReceived += actualLikes;
            totalCommentsReceived += actualComments;

            console.log(`   📝 貼文 ${post.id}: ${actualLikes} 讚, ${actualComments} 評論`);
        }

        // 3. 計算社交關係統計
        const postsCount = posts.length;
        const followersCount = await Follow.count({ where: { followingId: userId } });
        const followingCount = await Follow.count({ where: { followerId: userId } });

        // 4. 計算影響力分數
        const influenceScore = Math.round(
            postsCount * 1 + 
            followersCount * 2 + 
            totalLikesReceived * 0.5 + 
            totalCommentsReceived * 1
        );

        const stats = {
            postsCount,
            followersCount,
            followingCount,
            totalLikesReceived,
            totalCommentsReceived,
            influenceScore
        };

        console.log(`✅ 重新計算完成:`, stats);
        return stats;

    } catch (error) {
        console.error('❌ 強制重新計算統計錯誤:', error);
        return {
            postsCount: 0,
            followersCount: 0,
            followingCount: 0,
            totalLikesReceived: 0,
            totalCommentsReceived: 0,
            influenceScore: 0
        };
    }
};

// 🔥 新增：強制刷新統計API
const forceRefreshStats = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        
        console.log(`🔄 強制刷新用戶 ${userId} 的統計...`);

        // 只允許刷新自己的統計，或者管理員刷新任何人的統計
        if (userId !== req.user.id && req.user.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: '無權限刷新此用戶的統計'
            });
        }

        const stats = await forceRecalculateUserStats(userId);

        console.log(`✅ 用戶 ${userId} 統計刷新完成`);

        res.json({
            success: true,
            data: {
                userId,
                stats,
                message: '統計已刷新'
            }
        });

    } catch (error) {
        console.error('❌ 強制刷新統計錯誤:', error);
        res.status(500).json({
            success: false,
            error: '刷新統計失敗'
        });
    }
};

// 更新用戶檔案
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { displayName, email, avatarUrl } = req.body;

        console.log(`✏️ 更新用戶檔案: ${userId}`, { displayName, email });

        // 只允許用戶更新自己的檔案
        const updateData = {};
        if (displayName !== undefined) updateData.displayName = displayName;
        if (email !== undefined) updateData.email = email;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

        const [updateCount] = await User.update(updateData, {
            where: { id: userId }
        });

        if (updateCount === 0) {
            return res.status(404).json({
                success: false,
                error: '用戶不存在'
            });
        }

        // 獲取更新後的用戶資訊
        const updatedUser = await User.findByPk(userId, {
            attributes: [
                'id', 'username', 'displayName', 'email', 'avatarUrl', 
                'userRole', 'verified', 'createdAt', 'updatedAt'
            ]
        });

        console.log(`✅ 用戶檔案更新成功: ${updatedUser.username}`);

        res.json({
            success: true,
            data: updatedUser.toJSON(),
            message: '檔案更新成功'
        });

    } catch (error) {
        console.error('❌ 更新用戶檔案錯誤:', error);
        res.status(500).json({
            success: false,
            error: '更新檔案失敗'
        });
    }
};

// 🔥 新增：同步所有用戶統計（管理員專用）
const syncAllUserStats = async (req, res) => {
    try {
        // 只有管理員可以執行
        if (req.user.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: '只有管理員可以執行此操作'
            });
        }

        console.log(`🔄 管理員 ${req.user.username} 觸發全用戶統計同步...`);

        const users = await User.findAll({
            attributes: ['id', 'username']
        });

        const results = [];
        
        for (const user of users) {
            const stats = await forceRecalculateUserStats(user.id);
            results.push({
                userId: user.id,
                username: user.username,
                stats
            });
        }

        console.log(`✅ 所有用戶統計同步完成，處理了 ${results.length} 個用戶`);

        res.json({
            success: true,
            data: {
                message: `成功同步 ${results.length} 個用戶的統計`,
                results: results.slice(0, 5) // 只返回前5個結果，避免回應過大
            }
        });

    } catch (error) {
        console.error('❌ 同步所有用戶統計錯誤:', error);
        res.status(500).json({
            success: false,
            error: '同步統計失敗'
        });
    }
};

// 保持向後兼容
const getUserStats = forceRecalculateUserStats;
const getUserStatsFixed = forceRecalculateUserStats;

// 測試統計計算
const testUserStats = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        console.log(`🧪 測試用戶 ${userId} 的統計計算...`);
        
        const stats = await forceRecalculateUserStats(userId);
        
        res.json({
            success: true,
            data: {
                userId,
                stats,
                message: '統計計算測試完成'
            }
        });
    } catch (error) {
        console.error('❌ 測試統計計算錯誤:', error);
        res.status(500).json({
            success: false,
            error: '測試統計計算失敗'
        });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    getUserStats,
    getUserStatsFixed,
    testUserStats,
    forceRefreshStats,      // 🔥 新增
    syncAllUserStats,       // 🔥 新增
    forceRecalculateUserStats // 🔥 新增
};