// backend/src/routes/recommendations.js - 修復版添加用戶推薦
const express = require('express');
const router = express.Router();
const { getRecommendedPosts, getUserInterests } = require('../../controllers/recommendationController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route GET /api/v1/recommendations/posts
 * @desc 獲取個人化推薦貼文
 * @access Private
 * @params page, limit
 */
router.get('/posts', authenticateToken, getRecommendedPosts);

/**
 * @route GET /api/v1/recommendations/users
 * @desc 獲取推薦追蹤的用戶 🔥 新增
 * @access Private
 * @params limit
 */
router.get('/users', authenticateToken, async (req, res) => {
    try {
        const { User, Follow, Post, Like } = require('../models');
        const { Op } = require('sequelize');
        const currentUserId = req.user.id;
        const limit = parseInt(req.query.limit) || 8;

        console.log(`🔍 生成用戶推薦 for ${currentUserId}, limit: ${limit}`);

        // 1. 獲取當前用戶已追蹤的用戶ID
        const followingUsers = await Follow.findAll({
            where: { followerId: currentUserId },
            attributes: ['followingId']
        });
        
        const followingIds = followingUsers.map(f => f.followingId);
        followingIds.push(currentUserId); // 排除自己

        // 2. 推薦算法：結合多個因素
        const users = await User.findAll({
            where: {
                id: { [Op.notIn]: followingIds }
            },
            attributes: [
                'id', 'username', 'displayName', 'avatarUrl', 
                'userRole', 'verified', 'createdAt'
            ],
            include: [
                {
                    model: Post,
                    as: 'posts',
                    attributes: ['id', 'createdAt'],
                    required: false,
                    limit: 5
                },
                {
                    model: Follow,
                    as: 'followers',
                    attributes: ['id'],
                    required: false
                }
            ],
            limit: limit * 3 // 先獲取更多候選用戶
        });

        // 3. 計算推薦分數
        const scoredUsers = users.map(user => {
            const userData = user.toJSON();
            let score = 0;

            // 基礎分數
            score += 10;

            // 認證用戶加分
            if (userData.userRole === 'verified') score += 20;
            if (userData.userRole === 'admin') score += 30;

            // 活躍度加分（根據貼文數量）
            const postsCount = userData.posts ? userData.posts.length : 0;
            score += Math.min(postsCount * 5, 50); // 最多50分

            // 受歡迎程度加分（根據粉絲數）
            const followersCount = userData.followers ? userData.followers.length : 0;
            score += Math.min(followersCount * 2, 40); // 最多40分

            // 新用戶扶持（註冊30天內）
            const daysSinceJoined = (Date.now() - new Date(userData.createdAt)) / (1000 * 60 * 60 * 24);
            if (daysSinceJoined <= 30) score += 15;

            // 隨機因子（增加多樣性）
            score += Math.random() * 10;

            return {
                ...userData,
                recommendationScore: Math.round(score),
                postsCount,
                followersCount: followersCount,
                followingCount: 0, // 暫時設為0，避免額外查詢
                isFollowing: false,
                isOwnProfile: false
            };
        });

        // 4. 排序並返回頂部用戶
        const recommendedUsers = scoredUsers
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, limit);

        console.log(`✅ 推薦用戶生成完成，返回 ${recommendedUsers.length} 個用戶`);

        res.json({
            success: true,
            data: {
                recommendedUsers,
                algorithm: {
                    factors: ['認證狀態', '活躍度', '受歡迎程度', '新用戶扶持', '隨機性'],
                    description: '多因子推薦算法'
                }
            },
            meta: {
                total: recommendedUsers.length,
                limit: limit
            }
        });

    } catch (error) {
        console.error('❌ 用戶推薦錯誤:', error);
        res.status(500).json({
            success: false,
            error: '推薦用戶暫時無法使用',
            data: {
                recommendedUsers: []
            }
        });
    }
});

/**
 * @route GET /api/v1/recommendations/interests  
 * @desc 獲取用戶興趣分析
 * @access Private
 */
router.get('/interests', authenticateToken, getUserInterests);

/**
 * @route GET /api/v1/recommendations/trending
 * @desc 獲取熱門話題
 * @access Private
 */
router.get('/trending', authenticateToken, async (req, res) => {
    try {
        const { Post, User, Like, Comment } = require('../models');
        const { Op } = require('sequelize');

        // 獲取過去24小時的熱門貼文
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const trendingPosts = await Post.findAll({
            where: {
                createdAt: {
                    [Op.gte]: last24Hours
                }
            },
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'username', 'displayName', 'avatarUrl', 'userRole', 'verified']
                },
                {
                    model: Like,
                    as: 'likes',
                    attributes: ['id'],
                    required: false
                },
                {
                    model: Comment,
                    as: 'comments',
                    attributes: ['id'],
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        // 計算熱門度分數
        const trending = trendingPosts.map(post => {
            const postData = post.toJSON();
            const likesCount = postData.likes ? postData.likes.length : 0;
            const commentsCount = postData.comments ? postData.comments.length : 0;
            
            // 熱門度 = 按讚數 * 2 + 評論數 * 3 + 時間衰減
            const hoursAgo = (Date.now() - new Date(post.createdAt)) / (1000 * 60 * 60);
            const timeDecay = Math.max(0.1, 1 - hoursAgo / 24); // 24小時後衰減到0.1
            
            const trendingScore = (likesCount * 2 + commentsCount * 3) * timeDecay;
            
            return {
                ...postData,
                trendingScore,
                likesCount,
                commentsCount
            };
        });

        // 排序並取前20個
        const topTrending = trending
            .sort((a, b) => b.trendingScore - a.trendingScore)
            .slice(0, 20);

        res.json({
            success: true,
            data: topTrending,
            meta: {
                timeWindow: '24小時',
                algorithm: '按讚數×2 + 評論數×3 + 時間衰減'
            }
        });

    } catch (error) {
        console.error('❌ 熱門話題錯誤:', error);
        res.status(500).json({
            success: false,
            error: '熱門話題暫時無法使用'
        });
    }
});

module.exports = router;