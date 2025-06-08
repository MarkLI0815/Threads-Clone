// backend/controllers/recommendationController.js - 修復關聯和格式版本
const { Post, User, Like, Comment, Follow } = require('../src/models');
const { Op } = require('sequelize');

/**
 * 智慧推薦算法 - 修復關聯和回應格式
 * 權重分配：追蹤用戶貼文(70%) + 熱門內容(20%) + 最新內容(10%)
 */
const getRecommendedPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        console.log(`🎯 為用戶 ${userId} 生成推薦內容 (頁面: ${page})`);

        // 1. 獲取用戶追蹤的用戶ID列表
        let followingIds = [];
        try {
            const followingUsers = await Follow.findAll({
                where: { followerId: userId },
                attributes: ['followingId']
            });
            followingIds = followingUsers.map(f => f.followingId);
            console.log(`📋 追蹤用戶數量: ${followingIds.length}`, followingIds);
        } catch (followError) {
            console.log('⚠️ Follow 查詢錯誤，使用空陣列:', followError.message);
        }

        // 2. 計算時間權重 (7天內的內容有時間加分)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // 3. 🔥 修復：使用正確的關聯查詢
        const posts = await Post.findAll({
            where: {
                userId: { [Op.ne]: userId } // 排除當前用戶的貼文
            },
            include: [
                {
                    model: User,
                    as: 'user', // 🔥 確保使用正確的別名
                    attributes: ['id', 'username', 'displayName', 'avatarUrl', 'userRole', 'verified'],
                    required: true
                },
                {
                    model: Like,
                    as: 'likes',
                    attributes: ['id', 'userId'],
                    required: false
                },
                {
                    model: Comment,
                    as: 'comments',
                    attributes: ['id', 'userId', 'content', 'createdAt'],  // 🔥 添加 createdAt
                    include: [{  // 🔥 添加評論作者信息
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'displayName', 'avatarUrl', 'userRole', 'verified']
                    }],
                    required: false,
                    order: [['createdAt', 'ASC']],  // 🔥 評論按時間排序
                    limit: 10  // 🔥 限制評論數量避免數據過大
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: Math.min(limit * 3, 100),
        });

        console.log(`📄 獲取到 ${posts.length} 篇貼文用於推薦計算`);

        if (posts.length === 0) {
            return res.json({
                success: true,
                posts: [],
                pagination: { page, limit, hasMore: false },
                algorithm: { version: '2.3-fixed-relations', note: '沒有找到貼文' },
                debug: { stats: { totalScored: 0, followingPosts: 0, verifiedPosts: 0, avgScore: 0 } }
            });
        }

        // 4. 為每篇貼文計算推薦分數
        const postsWithScores = posts.map(post => {
            const postData = post.toJSON();

            // 🔥 修復：確保 likes 和 comments 數據正確處理
            const likesCount = Array.isArray(postData.likes) ? postData.likes.length : 0;
            const commentsCount = Array.isArray(postData.comments) ? postData.comments.length : 0;
            const isLiked = Array.isArray(postData.likes) ?
                postData.likes.some(like => like.userId === userId) : false;

            // 🔥 計算推薦分數 - 基礎分數為 0
            let score = 0;
            let scoreDetails = {
                following: 0,
                popularity: 0,
                recency: 0,
                roleBonus: 0,
                total: 0
            };

            // 🔥 權重 1: 追蹤用戶貼文 (70分基礎分數)
            const isFollowingUser = followingIds.includes(postData.userId);
            if (isFollowingUser) {
                scoreDetails.following = 70;
                score += 70;
                console.log(`👥 追蹤用戶貼文: ${postData.id} by ${postData.user?.username} (+70分)`);
            }

            // 🔥 權重 2: 熱門內容 (最高20分)
            const popularityScore = Math.min(20, (likesCount * 3 + commentsCount * 5));
            scoreDetails.popularity = popularityScore;
            score += popularityScore;

            // 🔥 權重 3: 時間新鮮度 (最高10分)
            const isRecent = new Date(postData.createdAt) > sevenDaysAgo;
            if (isRecent) {
                const hoursSincePost = (Date.now() - new Date(postData.createdAt)) / (1000 * 60 * 60);
                const recencyScore = Math.max(0, Math.min(10, 10 - hoursSincePost / 24));
                scoreDetails.recency = recencyScore;
                score += recencyScore;
            }

            // 🔥 特殊加分：認證用戶和管理員
            const author = postData.user;
            if (author && (author.verified || author.userRole === 'verified')) {
                scoreDetails.roleBonus += 5;
                score += 5;
            }

            if (author && author.userRole === 'admin') {
                scoreDetails.roleBonus += 3;
                score += 3;
            }

            scoreDetails.total = score;

            // 🔥 確保最低分數（避免0分貼文）
            if (score === 0) {
                score = Math.random() * 5; // 1-5分的隨機基礎分數
                scoreDetails.total = score;
            }

            console.log(`📊 ${postData.user?.username || '未知用戶'} 的貼文分數: ${score.toFixed(1)}`);

            return {
                id: postData.id,
                content: postData.content,
                imageUrl: postData.imageUrl,
                createdAt: postData.createdAt,
                updatedAt: postData.updatedAt,
                userId: postData.userId,
                user: {
                    id: author?.id,
                    username: author?.username,
                    displayName: author?.displayName,
                    avatarUrl: author?.avatarUrl,
                    userRole: author?.userRole || 'regular',
                    verified: author?.verified || false
                },
                // 🔥 統一愛心數據格式
                isLikedByUser: isLiked,
                likes: likesCount,           // 🔥 前端期望的格式
                likeCount: likesCount,       // 🔥 備用格式
                likesCount: likesCount,      // 🔥 原本格式

                // 🔥 統一評論數據格式
                comments: postData.comments || [],      // 🔥 完整評論數據（包含作者信息）
                commentsCount: commentsCount,
                commentCount: commentsCount,            // 🔥 備用格式

                recommendationScore: score,
                debugScore: score,
                scoreDetails
            };
        });

        // 5. 🔥 按推薦分數排序並分頁
        const sortedPosts = postsWithScores
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(offset, offset + limit);

        // 🔥 調試：顯示排序後的前5名
        console.log(`🏆 推薦排序前5名:`);
        sortedPosts.slice(0, 5).forEach((post, index) => {
            console.log(`${index + 1}. ${post.user?.username}: ${post.recommendationScore.toFixed(1)}分`);
        });

        // 6. 記錄推薦統計
        const stats = {
            totalScored: postsWithScores.length,
            followingPosts: sortedPosts.filter(p => followingIds.includes(p.userId)).length,
            verifiedPosts: sortedPosts.filter(p => p.user && (p.user.verified || p.user.userRole === 'verified')).length,
            adminPosts: sortedPosts.filter(p => p.user && p.user.userRole === 'admin').length,
            avgScore: sortedPosts.length > 0 ? sortedPosts.reduce((sum, p) => sum + p.recommendationScore, 0) / sortedPosts.length : 0
        };

        console.log(`📊 推薦統計:`, stats);

        // 🔥 修復：確保回應格式正確
        res.json({
            success: true,
            posts: sortedPosts, // 🔥 直接返回 posts 陣列
            pagination: {
                page,
                limit,
                hasMore: offset + limit < postsWithScores.length
            },
            algorithm: {
                version: '2.3-fixed-relations',
                weights: {
                    following: '70分 (基礎)',
                    popularity: '最高20分',
                    recency: '最高10分',
                    roleBonus: '認證+5分, 管理員+3分'
                }
            },
            debug: {
                stats,
                followingIds,
                topScores: sortedPosts.slice(0, 5).map(p => ({
                    id: p.id,
                    username: p.user?.username,
                    score: p.recommendationScore,
                    isFollowing: followingIds.includes(p.userId),
                    details: p.scoreDetails
                }))
            }
        });

    } catch (error) {
        console.error('❌ 推薦算法錯誤:', error);
        console.error('錯誤堆疊:', error.stack);
        res.status(500).json({
            success: false,
            error: '推薦系統暫時無法使用',
            debug: error.message,
            posts: [] // 🔥 確保總是返回 posts 陣列
        });
    }
};

/**
 * 用戶興趣分析 - 修復關聯
 */
const getUserInterests = async (req, res) => {
    try {
        const userId = req.user.id;

        console.log(`🧠 分析用戶 ${userId} 的興趣...`);

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const recentLikes = await Like.findAll({
            where: {
                userId,
                createdAt: {
                    [Op.gte]: thirtyDaysAgo
                }
            },
            include: [{
                model: Post,
                as: 'post', // 🔥 確保使用正確的別名
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'userRole', 'verified']
                }]
            }],
            limit: 50
        });

        const interests = {
            followedAuthors: 0,
            verifiedContent: 0,
            adminContent: 0,
            totalInteractions: recentLikes.length
        };

        const authorInteractions = {};

        recentLikes.forEach(like => {
            if (like.post && like.post.user) {
                const authorId = like.post.userId;
                const authorRole = like.post.user.userRole;

                authorInteractions[authorId] = (authorInteractions[authorId] || 0) + 1;

                if (authorRole === 'verified') interests.verifiedContent++;
                if (authorRole === 'admin') interests.adminContent++;
            }
        });

        const topAuthors = Object.entries(authorInteractions)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([authorId, count]) => ({ authorId, interactions: count }));

        console.log(`📊 用戶興趣統計:`, interests);

        res.json({
            success: true,
            data: {
                interests,
                topAuthors,
                analysisDate: new Date()
            }
        });

    } catch (error) {
        console.error('❌ 興趣分析錯誤:', error);
        res.status(500).json({
            success: false,
            error: '興趣分析暫時無法使用'
        });
    }
};

module.exports = {
    getRecommendedPosts,
    getUserInterests
};