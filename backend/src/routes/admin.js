// backend/src/routes/admin.js - 管理員專用路由
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    checkAdminPermission,
    getSystemStats,
    getAllUsers,
    changeUserRole,
    deleteUserPost,
    getAllPosts,
    forceRefreshAllStats
} = require('../../controllers/adminController');

// 🛡️ 所有管理員路由都需要認證和管理員權限
router.use(authenticateToken);
router.use(checkAdminPermission);

/**
 * @route GET /api/v1/admin/stats
 * @desc 獲取系統統計數據
 * @access Admin only
 */
router.get('/stats', getSystemStats);

/**
 * @route GET /api/v1/admin/users
 * @desc 獲取用戶列表（支援分頁、搜尋、篩選）
 * @access Admin only
 * @params page, limit, role, search, sortBy, sortOrder
 */
router.get('/users', getAllUsers);

/**
 * @route PUT /api/v1/admin/users/:userId/role
 * @desc 變更用戶角色
 * @access Admin only
 * @body { newRole: 'regular'|'verified'|'admin' }
 */
router.put('/users/:userId/role', changeUserRole);

/**
 * @route GET /api/v1/admin/posts
 * @desc 獲取所有貼文（管理員視圖）
 * @access Admin only
 * @params page, limit, userId, search, sortBy, sortOrder
 */
router.get('/posts', getAllPosts);

/**
 * @route DELETE /api/v1/admin/posts/:postId
 * @desc 刪除貼文（管理員）
 * @access Admin only
 * @body { reason?: string }
 */
router.delete('/posts/:postId', deleteUserPost);

/**
 * @route POST /api/v1/admin/stats/refresh
 * @desc 強制刷新所有用戶統計
 * @access Admin only
 */
router.post('/stats/refresh', forceRefreshAllStats);

/**
 * @route GET /api/v1/admin/dashboard
 * @desc 管理員儀表板數據（整合）
 * @access Admin only
 */
router.get('/dashboard', async (req, res) => {
    try {
        const { User, Post, Follow, Like, Comment } = require('../models');
        const { Op } = require('sequelize');

        console.log(`📊 管理員 ${req.user.username} 查看儀表板`);

        // 並行獲取儀表板數據
        const [
            // 基礎統計
            totalUsers,
            totalPosts,
            totalLikes,
            totalComments,
            
            // 今日統計
            todayUsers,
            todayPosts,
            todayLikes,
            todayComments,
            
            // 用戶角色分布
            userRoles,
            
            // 最近活動
            recentUsers,
            recentPosts,
            topUsers
        ] = await Promise.all([
            // 基礎統計
            User.count(),
            Post.count(),
            Like.count(),
            Comment.count(),
            
            // 今日統計
            User.count({
                where: {
                    createdAt: {
                        [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            }),
            Post.count({
                where: {
                    createdAt: {
                        [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            }),
            Like.count({
                where: {
                    createdAt: {
                        [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            }),
            Comment.count({
                where: {
                    createdAt: {
                        [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            }),
            
            // 用戶角色分布
            User.findAll({
                attributes: [
                    'userRole',
                    [require('sequelize').fn('COUNT', '*'), 'count']
                ],
                group: ['userRole'],
                raw: true
            }),
            
            // 最近用戶（7天內）
            User.findAll({
                where: {
                    createdAt: {
                        [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                },
                attributes: ['id', 'username', 'displayName', 'userRole', 'createdAt'],
                order: [['createdAt', 'DESC']],
                limit: 10
            }),
            
            // 最近貼文
            Post.findAll({
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['username', 'displayName', 'userRole']
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: 10
            }),
            
            // 最活躍用戶
            User.findAll({
                include: [
                    {
                        model: Post,
                        as: 'posts',
                        attributes: ['id'],
                        required: false
                    },
                    {
                        model: Follow,
                        as: 'followers',
                        attributes: ['id'],
                        required: false
                    }
                ],
                limit: 10
            })
        ]);

        // 格式化數據
        const dashboard = {
            overview: {
                totalUsers,
                totalPosts,
                totalLikes,
                totalComments
            },
            today: {
                newUsers: todayUsers,
                newPosts: todayPosts,
                newLikes: todayLikes,
                newComments: todayComments
            },
            userDistribution: userRoles.reduce((acc, role) => {
                acc[role.userRole] = parseInt(role.count);
                return acc;
            }, {}),
            engagement: {
                avgPostsPerUser: totalUsers > 0 ? (totalPosts / totalUsers).toFixed(2) : 0,
                avgLikesPerPost: totalPosts > 0 ? (totalLikes / totalPosts).toFixed(2) : 0,
                avgCommentsPerPost: totalPosts > 0 ? (totalComments / totalPosts).toFixed(2) : 0
            },
            recentActivity: {
                recentUsers: recentUsers.map(user => ({
                    ...user.toJSON(),
                    joinedAgo: Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
                })),
                recentPosts: recentPosts.map(post => ({
                    id: post.id,
                    content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
                    author: post.user,
                    createdAt: post.createdAt
                }))
            },
            topUsers: topUsers.map(user => ({
                ...user.toJSON(),
                postsCount: user.posts ? user.posts.length : 0,
                followersCount: user.followers ? user.followers.length : 0,
                posts: undefined,
                followers: undefined
            })).sort((a, b) => (b.postsCount + b.followersCount) - (a.postsCount + a.followersCount)).slice(0, 5)
        };

        res.json({
            success: true,
            data: dashboard,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ 管理員儀表板錯誤:', error);
        res.status(500).json({
            success: false,
            error: '載入儀表板失敗'
        });
    }
});

/**
 * @route GET /api/v1/admin/health
 * @desc 系統健康檢查
 * @access Admin only
 */
router.get('/health', async (req, res) => {
    try {
        const { User } = require('../models');
        
        // 簡單的資料庫連接測試
        const dbTest = await User.count();
        
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                userCount: dbTest
            },
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                node_version: process.version
            }
        };

        res.json({
            success: true,
            data: health
        });

    } catch (error) {
        console.error('❌ 健康檢查錯誤:', error);
        res.status(500).json({
            success: false,
            error: '系統健康檢查失敗',
            data: {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message
            }
        });
    }
});

module.exports = router;