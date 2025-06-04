const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { Post, User } = require('../models');
const { authenticateToken, requireVerifiedOrAdmin } = require('../middleware/auth');

const router = express.Router();

// 處理驗證錯誤
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * @route   POST /api/v1/posts
 * @desc    建立新貼文
 * @access  Private
 */
router.post('/', [
  authenticateToken,
  body('content').isLength({ min: 1, max: 2000 }).withMessage('貼文內容必須在 1-2000 字符之間'),
  body('imageUrl').optional().isURL().withMessage('請提供有效的圖片網址')
], handleValidationErrors, async (req, res) => {
  try {
    const { content, imageUrl } = req.body;

    const post = await Post.create({
      userId: req.user.id,
      content,
      imageUrl
    });

    // 取得完整貼文資訊（包含作者）
    const fullPost = await Post.findByPk(post.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'displayName', 'userRole', 'verified', 'avatarUrl']
      }]
    });

    res.status(201).json({
      message: '貼文建立成功',
      post: fullPost
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: '建立貼文失敗' });
  }
});

/**
 * @route   GET /api/v1/posts
 * @desc    獲取貼文列表 (支援分頁)
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      userId
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};

    // 如果指定用戶 ID，只顯示該用戶的貼文
    if (userId) {
      whereClause.userId = userId;
    }

    const posts = await Post.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'displayName', 'userRole', 'verified', 'avatarUrl']
      }],
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      posts: posts.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(posts.count / limit),
        totalItems: posts.count,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: '獲取貼文列表失敗' });
  }
});

/**
 * @route   GET /api/v1/posts/:id
 * @desc    獲取特定貼文
 * @access  Private
 */
router.get('/:id', [
  authenticateToken,
  param('id').isUUID().withMessage('無效的貼文 ID')
], handleValidationErrors, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'displayName', 'userRole', 'verified', 'avatarUrl']
      }]
    });

    if (!post) {
      return res.status(404).json({ error: '貼文不存在' });
    }

    res.json({ post });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: '獲取貼文失敗' });
  }
});

/**
 * @route   DELETE /api/v1/posts/:id
 * @desc    刪除貼文
 * @access  Private (作者或管理員)
 */
router.delete('/:id', [
  authenticateToken,
  param('id').isUUID().withMessage('無效的貼文 ID')
], handleValidationErrors, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ error: '貼文不存在' });
    }

    // 檢查權限：只有作者或管理員可以刪除
    if (post.userId !== req.user.id && req.user.userRole !== 'admin') {
      return res.status(403).json({ error: '無權限刪除此貼文' });
    }

    await post.destroy();

    res.json({ message: '貼文刪除成功' });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: '刪除貼文失敗' });
  }
});

module.exports = router;
