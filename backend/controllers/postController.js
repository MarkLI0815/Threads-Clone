// backend/controllers/postController.js - 包含通知功能版本

const { User, Post, Like, Comment, Follow } = require('../src/models');
const { createNotification } = require('./notificationController');
const { Op } = require('sequelize');

// 獲取貼文列表（支援個人化時間線 + 追蹤狀態）
const getPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const userId = req.query.userId; // 特定用戶的貼文
        const feedType = req.query.feedType || 'all'; // 'all' | 'following'
        const offset = (page - 1) * limit;

        console.log(`📊 獲取貼文列表 - 頁面: ${page}, 限制: ${limit}, 用戶: ${userId}, 類型: ${feedType}`);

        let whereCondition = {};
        let includeFollowing = false;

        // 處理不同的時間線類型
        if (feedType === 'following' && req.user) {
            // 🔥 個人化時間線：只顯示追蹤用戶的貼文
            const followingUsers = await Follow.findAll({
                where: { followerId: req.user.id },
                attributes: ['followingId']
            });
            
            const followingIds = followingUsers.map(f => f.followingId);
            
            if (followingIds.length > 0) {
                whereCondition.userId = {
                    [Op.in]: followingIds
                };
            } else {
                // 如果沒有追蹤任何人，返回空結果
                return res.json({
                    posts: [],
                    pagination: {
                        page,
                        limit,
                        total: 0,
                        totalPages: 0
                    },
                    message: '您還沒有追蹤任何用戶，去探索一些有趣的人吧！'
                });
            }
            
            includeFollowing = true;
            console.log(`👥 個人化時間線 - 追蹤用戶數: ${followingIds.length}`);
        } else if (userId) {
            // 特定用戶的貼文
            whereCondition.userId = userId;
            console.log(`👤 獲取用戶 ${userId} 的貼文`);
        } else {
            // 所有貼文
            console.log(`🌐 獲取所有貼文`);
        }

        const { count, rows: posts } = await Post.findAndCountAll({
            where: whereCondition,
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
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'displayName', 'avatarUrl', 'userRole']
                    }],
                    order: [['createdAt', 'ASC']],
                    limit: 3 // 只顯示前3個評論
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        // 🔥 關鍵修復：為每個貼文添加當前用戶的互動狀態和追蹤狀態
        const postsWithInteractionStatus = await Promise.all(posts.map(async (post) => {
            const postJson = post.toJSON();
            
            // 檢查當前用戶是否已按讚
            const userLike = postJson.likes.find(like => like.userId === req.user.id);
            postJson.isLikedByUser = !!userLike;
            
            // 🔥 關鍵修復：檢查當前用戶是否已追蹤貼文作者
            let isFollowing = false;
            if (req.user.id !== postJson.user.id) {
                const followRecord = await Follow.findOne({
                    where: {
                        followerId: req.user.id,
                        followingId: postJson.user.id
                    }
                });
                isFollowing = !!followRecord;
            }
            
            // 🔥 將追蹤狀態添加到用戶信息中
            postJson.user.isFollowing = isFollowing;
            
            // 隱藏詳細的按讚列表，只保留統計
            postJson.likes = postJson.likes.length;
            
            // 評論數量
            postJson.commentsCount = postJson.comments.length;
            
            console.log(`📝 貼文 ${postJson.id} 作者 ${postJson.user.username} 追蹤狀態: ${isFollowing}`);
            
            return postJson;
        }));

        const totalPages = Math.ceil(count / limit);

        console.log(`✅ 成功獲取 ${posts.length} 個貼文，總計 ${count} 個`);

        res.json({
            posts: postsWithInteractionStatus,
            pagination: {
                page,
                limit,
                total: count,
                totalPages
            },
            feedType,
            ...(includeFollowing && { message: '顯示您追蹤用戶的貼文' })
        });

    } catch (error) {
        console.error('❌ 獲取貼文列表錯誤:', error);
        res.status(500).json({ error: '獲取貼文失敗' });
    }
};

// 創建貼文
const createPost = async (req, res) => {
    try {
        const { content, imageUrl } = req.body;

        console.log('🆕 創建新貼文:', { content: content?.substring(0, 50), imageUrl, userId: req.user.id });

        const post = await Post.create({
            content,
            imageUrl: imageUrl || null,
            userId: req.user.id
        });

        // 更新用戶貼文數量
        await User.increment('postsCount', { where: { id: req.user.id } });

        // 獲取完整的貼文資料（包含用戶資訊）
        const fullPost = await Post.findByPk(post.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'displayName', 'avatarUrl', 'userRole', 'verified']
                }
            ]
        });

        console.log('✅ 貼文創建成功:', post.id);

        const postJson = fullPost.toJSON();
        postJson.isLikedByUser = false;
        postJson.likes = 0;
        postJson.comments = [];
        postJson.commentsCount = 0;
        
        // 自己的貼文不需要追蹤狀態
        postJson.user.isFollowing = false;

        res.status(201).json({
            message: '貼文創建成功',
            post: postJson
        });

    } catch (error) {
        console.error('❌ 創建貼文錯誤:', error);
        res.status(500).json({ error: '創建貼文失敗' });
    }
};

// 獲取單個貼文
const getPost = async (req, res) => {
    try {
        const postId = req.params.id;

        console.log('📄 獲取貼文詳情:', postId);

        const post = await Post.findByPk(postId, {
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
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'displayName', 'avatarUrl', 'userRole']
                    }],
                    order: [['createdAt', 'ASC']]
                }
            ]
        });

        if (!post) {
            return res.status(404).json({ error: '貼文不存在' });
        }

        const postJson = post.toJSON();
        const userLike = postJson.likes.find(like => like.userId === req.user.id);
        postJson.isLikedByUser = !!userLike;
        
        // 🔥 檢查追蹤狀態
        let isFollowing = false;
        if (req.user.id !== postJson.user.id) {
            const followRecord = await Follow.findOne({
                where: {
                    followerId: req.user.id,
                    followingId: postJson.user.id
                }
            });
            isFollowing = !!followRecord;
        }
        postJson.user.isFollowing = isFollowing;
        
        postJson.likes = postJson.likes.length;
        postJson.commentsCount = postJson.comments.length;

        console.log('✅ 成功獲取貼文詳情');

        res.json({ post: postJson });

    } catch (error) {
        console.error('❌ 獲取貼文詳情錯誤:', error);
        res.status(500).json({ error: '獲取貼文失敗' });
    }
};

// 更新貼文
const updatePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const { content, imageUrl } = req.body;

        console.log('✏️ 更新貼文:', postId);

        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).json({ error: '貼文不存在' });
        }

        // 只有作者或管理員可以更新
        if (post.userId !== req.user.id && req.user.userRole !== 'admin') {
            return res.status(403).json({ error: '無權限更新此貼文' });
        }

        await post.update({
            content,
            imageUrl: imageUrl || null
        });

        const updatedPost = await Post.findByPk(postId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'displayName', 'avatarUrl', 'userRole', 'verified']
                }
            ]
        });

        console.log('✅ 貼文更新成功');

        res.json({
            message: '貼文更新成功',
            post: updatedPost.toJSON()
        });

    } catch (error) {
        console.error('❌ 更新貼文錯誤:', error);
        res.status(500).json({ error: '更新貼文失敗' });
    }
};

// 刪除貼文
const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;

        console.log('🗑️ 刪除貼文:', postId);

        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).json({ error: '貼文不存在' });
        }

        // 只有作者或管理員可以刪除
        if (post.userId !== req.user.id && req.user.userRole !== 'admin') {
            return res.status(403).json({ error: '無權限刪除此貼文' });
        }

        // 刪除相關的按讚和評論（會由外鍵約束自動處理）
        await post.destroy();

        // 更新用戶貼文數量
        await User.decrement('postsCount', { where: { id: post.userId } });

        console.log('✅ 貼文刪除成功');

        res.json({ message: '貼文刪除成功' });

    } catch (error) {
        console.error('❌ 刪除貼文錯誤:', error);
        res.status(500).json({ error: '刪除貼文失敗' });
    }
};

// 按讚/取消按讚 - 🔔 包含通知功能
const toggleLike = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        console.log('👍 切換按讚狀態:', { postId, userId });

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ error: '貼文不存在' });
        }

        const existingLike = await Like.findOne({
            where: { postId, userId }
        });

        let isLiked;
        let likeCount;

        if (existingLike) {
            // 取消按讚
            await existingLike.destroy();
            await Post.decrement('likeCount', { where: { id: postId } });
            isLiked = false;
            
            // 獲取更新後的按讚數
            await post.reload();
            likeCount = post.likeCount;
            
            console.log('👎 取消按讚成功');
        } else {
            // 按讚
            await Like.create({ postId, userId });
            await Post.increment('likeCount', { where: { id: postId } });
            isLiked = true;
            
            // 獲取更新後的按讚數
            await post.reload();
            likeCount = post.likeCount;
            
            console.log('👍 按讚成功');

            // 🔔 發送按讚通知（不給自己發通知）
            if (post.userId !== userId) {
                const postContent = post.content.length > 20 
                    ? post.content.substring(0, 20) + '...' 
                    : post.content;

                await createNotification({
                    userId: post.userId,
                    fromUserId: userId,
                    type: 'like',
                    title: `${req.user.username} 按讚了您的貼文`,
                    content: `"${postContent}"`,
                    relatedId: postId
                });

                console.log(`🔔 已發送按讚通知給用戶 ${post.userId}`);
            }
        }

        res.json({
            message: isLiked ? '按讚成功' : '取消按讚成功',
            isLiked,
            likeCount
        });

    } catch (error) {
        console.error('❌ 切換按讚狀態錯誤:', error);
        res.status(500).json({ error: '操作失敗' });
    }
};

// 添加評論 - 🔔 包含通知功能
const addComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const { content } = req.body;
        const userId = req.user.id;

        console.log('💬 添加評論:', { postId, userId, content: content?.substring(0, 30) });

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ error: '貼文不存在' });
        }

        const comment = await Comment.create({
            content,
            postId,
            userId
        });

        // 更新貼文評論數量
        await Post.increment('commentCount', { where: { id: postId } });

        // 獲取完整的評論資料（包含用戶資訊）
        const fullComment = await Comment.findByPk(comment.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'displayName', 'avatarUrl', 'userRole']
            }]
        });

        // 🔔 發送評論通知（不給自己發通知）
        if (post.userId !== userId) {
            const commentContent = content.length > 30 
                ? content.substring(0, 30) + '...' 
                : content;

            await createNotification({
                userId: post.userId,
                fromUserId: userId,
                type: 'comment',
                title: `${req.user.username} 評論了您的貼文`,
                content: `"${commentContent}"`,
                relatedId: postId
            });

            console.log(`🔔 已發送評論通知給用戶 ${post.userId}`);
        }

        console.log('✅ 評論添加成功');

        res.status(201).json({
            message: '評論添加成功',
            comment: fullComment.toJSON()
        });

    } catch (error) {
        console.error('❌ 添加評論錯誤:', error);
        res.status(500).json({ error: '添加評論失敗' });
    }
};

module.exports = {
    createPost,
    getPosts,
    getPost,
    updatePost,
    deletePost,
    toggleLike,
    addComment
};