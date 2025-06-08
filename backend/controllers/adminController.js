// backend/controllers/adminController.js - 管理員專用控制器
const { User, Post, Follow, Like, Comment, Notification } = require('../src/models');
const { Op } = require('sequelize');

// 🔥 管理員權限檢查
const checkAdminPermission = (req, res, next) => {
    if (req.user.userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            error: '需要管理員權限'
        });
    }
    next();
};

// 📊 獲取系統統計
const getSystemStats = async (req, res) => {
    try {
        console.log(`📊 管理員 ${req.user.username} 查看系統統計`);

        // 並行查詢提高效率
        const [
            totalUsers,
            totalPosts,
            totalLikes,
            totalComments,
            totalNotifications,
            recentUsers,
            activeUsers,
            usersByRole
        ] = await Promise.all([
            User.count(),
            Post.count(),
            Like.count(),
            Comment.count(),
            Notification.count(),
            User.count({
                where: {
                    createdAt: {
                        [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7天內
                    }
                }
            }),
            User.count({
                where: {
                    createdAt: {
                        [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小時內活躍
                    }
                }
            }),
            User.findAll({
                attributes: [
                    'userRole',
                    [require('sequelize').fn('COUNT', '*'), 'count']
                ],
                group: ['userRole'],
                raw: true
            })
        ]);

        // 計算成長率
        const lastWeekUsers = await User.count({
            where: {
                createdAt: {
                    [Op.between]: [
                        new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ]
                }
            }
        });

        const userGrowthRate = lastWeekUsers > 0 
            ? ((recentUsers - lastWeekUsers) / lastWeekUsers * 100).toFixed(1)
            : 100;

        // 組織統計數據
        const stats = {
            overview: {
                totalUsers,
                totalPosts,
                totalLikes,
                totalComments,
                totalNotifications
            },
            growth: {
                newUsersThisWeek: recentUsers,
                activeUsersToday: activeUsers,
                userGrowthRate: `${userGrowthRate}%`
            },
            userDistribution: usersByRole.reduce((acc, role) => {
                acc[role.userRole] = parseInt(role.count);
                return acc;
            }, {}),
            engagement: {
                avgPostsPerUser: totalUsers > 0 ? (totalPosts / totalUsers).toFixed(2) : 0,
                avgLikesPerPost: totalPosts > 0 ? (totalLikes / totalPosts).toFixed(2) : 0,
                avgCommentsPerPost: totalPosts > 0 ? (totalComments / totalPosts).toFixed(2) : 0
            }
        };

        console.log(`✅ 系統統計查詢完成`);

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ 獲取系統統計錯誤:', error);
        res.status(500).json({
            success: false,
            error: '獲取統計數據失敗'
        });
    }
};

// 👥 獲取用戶列表
const getAllUsers = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            role = '', 
            search = '', 
            sortBy = 'createdAt',
            sortOrder = 'DESC' 
        } = req.query;

        console.log(`👥 管理員查看用戶列表 - 頁面:${page}, 搜尋:${search}, 角色:${role}`);

        // 構建查詢條件
        const whereClause = {};
        
        if (role && role !== '') {
            whereClause.userRole = role;
        }

        if (search && search.trim() !== '') {
            whereClause[Op.or] = [
                { username: { [Op.like]: `%${search}%` } },
                { displayName: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        // 計算分頁
        const offset = (page - 1) * limit;

        // 查詢用戶
        const { count, rows: users } = await User.findAndCountAll({
            where: whereClause,
            attributes: [
                'id', 'username', 'displayName', 'email', 'avatarUrl',
                'userRole', 'verified', 'createdAt', 'updatedAt'
            ],
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
            offset,
            limit: parseInt(limit),
            order: [[sortBy, sortOrder]],
            distinct: true
        });

        // 格式化用戶數據
        const formattedUsers = users.map(user => ({
            ...user.toJSON(),
            postsCount: user.posts ? user.posts.length : 0,
            followersCount: user.followers ? user.followers.length : 0,
            posts: undefined, // 移除詳細貼文數據
            followers: undefined
        }));

        res.json({
            success: true,
            data: {
                users: formattedUsers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            }
        });

    } catch (error) {
        console.error('❌ 獲取用戶列表錯誤:', error);
        res.status(500).json({
            success: false,
            error: '獲取用戶列表失敗'
        });
    }
};

// ⚡ 變更用戶角色
const changeUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newRole } = req.body;

        console.log(`⚡ 管理員 ${req.user.username} 變更用戶 ${userId} 角色為 ${newRole}`);

        // 驗證新角色
        const validRoles = ['regular', 'verified', 'admin'];
        if (!validRoles.includes(newRole)) {
            return res.status(400).json({
                success: false,
                error: '無效的用戶角色'
            });
        }

        // 不能變更自己的角色
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                error: '不能變更自己的角色'
            });
        }

        // 查找目標用戶
        const targetUser = await User.findByPk(userId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                error: '用戶不存在'
            });
        }

        const oldRole = targetUser.userRole;

        // 更新用戶角色
        await User.update(
            { 
                userRole: newRole,
                verified: newRole === 'verified' || newRole === 'admin'
            },
            { where: { id: userId } }
        );

        // 發送通知給用戶
        await require('./notificationController').createNotification({
            userId: userId,
            fromUserId: req.user.id,
            type: 'role_change',
            title: `您的帳戶角色已更新`,
            content: `您的角色已從 ${oldRole} 更新為 ${newRole}`,
            relatedId: null
        });

        console.log(`✅ 用戶角色更新成功: ${targetUser.username} ${oldRole} → ${newRole}`);

        res.json({
            success: true,
            data: {
                userId,
                username: targetUser.username,
                oldRole,
                newRole,
                message: '用戶角色更新成功'
            }
        });

    } catch (error) {
        console.error('❌ 變更用戶角色錯誤:', error);
        res.status(500).json({
            success: false,
            error: '變更用戶角色失敗'
        });
    }
};

// 🗑️ 刪除用戶貼文（管理員）
const deleteUserPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { reason } = req.body;

        console.log(`🗑️ 管理員 ${req.user.username} 刪除貼文 ${postId}, 原因: ${reason}`);

        // 查找貼文
        const post = await Post.findByPk(postId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username']
                }
            ]
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                error: '貼文不存在'
            });
        }

        const postAuthor = post.user;

        // 刪除相關數據
        await Promise.all([
            Like.destroy({ where: { postId } }),
            Comment.destroy({ where: { postId } }),
            Post.destroy({ where: { id: postId } })
        ]);

        // 發送通知給貼文作者
        if (postAuthor && postAuthor.id !== req.user.id) {
            await require('./notificationController').createNotification({
                userId: postAuthor.id,
                fromUserId: req.user.id,
                type: 'content_removed',
                title: `您的貼文已被移除`,
                content: `原因: ${reason || '違反社群規範'}`,
                relatedId: postId
            });
        }

        console.log(`✅ 貼文刪除成功: ${postId}`);

        res.json({
            success: true,
            data: {
                postId,
                authorUsername: postAuthor?.username,
                reason: reason || '違反社群規範',
                message: '貼文已刪除'
            }
        });

    } catch (error) {
        console.error('❌ 刪除貼文錯誤:', error);
        res.status(500).json({
            success: false,
            error: '刪除貼文失敗'
        });
    }
};

// 📱 獲取所有貼文（管理員視圖）
const getAllPosts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            userId = '', 
            search = '', 
            sortBy = 'createdAt',
            sortOrder = 'DESC' 
        } = req.query;

        console.log(`📱 管理員查看貼文列表 - 頁面:${page}, 用戶:${userId}, 搜尋:${search}`);

        // 構建查詢條件
        const whereClause = {};
        
        if (userId && userId !== '') {
            whereClause.userId = userId;
        }

        if (search && search.trim() !== '') {
            whereClause.content = { [Op.like]: `%${search}%` };
        }

        // 計算分頁
        const offset = (page - 1) * limit;

        // 查詢貼文
        const { count, rows: posts } = await Post.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'displayName', 'avatarUrl', 'userRole', 'verified']
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
                    attributes: ['id', 'userId', 'content'],
                    required: false,
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['username'],
                            required: false
                        }
                    ]
                }
            ],
            offset,
            limit: parseInt(limit),
            order: [[sortBy, sortOrder]]
        });

        // 格式化貼文數據
        const formattedPosts = posts.map(post => ({
            ...post.toJSON(),
            likesCount: post.likes ? post.likes.length : 0,
            commentsCount: post.comments ? post.comments.length : 0,
            recentComments: post.comments ? post.comments.slice(0, 3) : []
        }));

        res.json({
            success: true,
            data: {
                posts: formattedPosts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            }
        });

    } catch (error) {
        console.error('❌ 獲取貼文列表錯誤:', error);
        res.status(500).json({
            success: false,
            error: '獲取貼文列表失敗'
        });
    }
};

// 🔄 強制刷新所有統計
const forceRefreshAllStats = async (req, res) => {
    try {
        console.log(`🔄 管理員 ${req.user.username} 觸發全系統統計刷新...`);

        const { forceRecalculateUserStats } = require('./userController');
        
        // 獲取所有用戶
        const users = await User.findAll({
            attributes: ['id', 'username']
        });

        console.log(`🔄 開始刷新 ${users.length} 個用戶的統計...`);

        // 並行處理，每批10個用戶
        const batchSize = 10;
        const results = [];
        
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async user => {
                try {
                    const stats = await forceRecalculateUserStats(user.id);
                    return {
                        userId: user.id,
                        username: user.username,
                        success: true,
                        stats
                    };
                } catch (error) {
                    console.error(`❌ 刷新用戶 ${user.username} 統計失敗:`, error);
                    return {
                        userId: user.id,
                        username: user.username,
                        success: false,
                        error: error.message
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            console.log(`✅ 完成批次 ${Math.ceil((i + batchSize) / batchSize)}/${Math.ceil(users.length / batchSize)}`);
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        console.log(`✅ 統計刷新完成: ${successCount} 成功, ${failCount} 失敗`);

        res.json({
            success: true,
            data: {
                message: `統計刷新完成`,
                processed: users.length,
                successful: successCount,
                failed: failCount,
                details: results.slice(0, 10) // 只返回前10個結果
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

module.exports = {
    checkAdminPermission,
    getSystemStats,
    getAllUsers,
    changeUserRole,
    deleteUserPost,
    getAllPosts,
    forceRefreshAllStats
};