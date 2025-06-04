const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { User } = require('../models');
const { authenticateToken, requireAdmin, requireVerifiedOrAdmin } = require('../middleware/auth');

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
 * @route   GET /api/v1/users
 * @desc    獲取用戶列表 (支援分頁和篩選)
 * @access  Private (認證用戶或管理員)
 */
router.get('/', authenticateToken, requireVerifiedOrAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      search
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};

    // 角色篩選
    if (role && ['regular', 'verified', 'admin'].includes(role)) {
      whereClause.userRole = role;
    }

    // 搜尋功能
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { displayName: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users: users.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(users.count / limit),
        totalItems: users.count,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: '獲取用戶列表失敗' });
  }
});

/**
 * @route   GET /api/v1/users/:id
 * @desc    獲取特定用戶詳情
 * @access  Private
 */
router.get('/:id', [
  authenticateToken,
  param('id').isUUID().withMessage('無效的用戶 ID')
], handleValidationErrors, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    res.json({ user: user.toJSON() });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: '獲取用戶資訊失敗' });
  }
});

/**
 * @route   PUT /api/v1/users/:id
 * @desc    更新用戶資訊
 * @access  Private (本人或管理員)
 */
router.put('/:id', [
  authenticateToken,
  param('id').isUUID().withMessage('無效的用戶 ID'),
  body('displayName').optional().isLength({ min: 1, max: 100 }),
  body('bio').optional().isLength({ max: 500 }),
  body('avatarUrl').optional().isURL()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, bio, avatarUrl } = req.body;

    // 檢查權限：只有本人或管理員可以更新
    if (req.user.id !== id && req.user.userRole !== 'admin') {
      return res.status(403).json({ error: '無權限修改此用戶資訊' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    // 更新允許的欄位
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    await user.update(updateData);

    res.json({
      message: '用戶資訊更新成功',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: '更新用戶資訊失敗' });
  }
});

/**
 * @route   PUT /api/v1/users/:id/role
 * @desc    更新用戶角色 (管理員專用)
 * @access  Private (管理員)
 */
router.put('/:id/role', [
  authenticateToken,
  requireAdmin,
  param('id').isUUID().withMessage('無效的用戶 ID'),
  body('userRole').isIn(['regular', 'verified', 'admin']).withMessage('無效的用戶角色')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { userRole } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    // 防止管理員移除自己的管理員權限
    if (req.user.id === id && userRole !== 'admin') {
      return res.status(400).json({ error: '不能移除自己的管理員權限' });
    }

    const oldRole = user.userRole;
    await user.update({ userRole });

    res.json({
      message: '用戶角色更新成功',
      user: user.toJSON(),
      roleChange: {
        from: oldRole,
        to: userRole
      }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: '更新用戶角色失敗' });
  }
});

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    刪除用戶 (管理員專用)
 * @access  Private (管理員)
 */
router.delete('/:id', [
  authenticateToken,
  requireAdmin,
  param('id').isUUID().withMessage('無效的用戶 ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // 防止管理員刪除自己
    if (req.user.id === id) {
      return res.status(400).json({ error: '不能刪除自己的帳號' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    await user.destroy();

    res.json({
      message: '用戶刪除成功',
      deletedUser: {
        id: user.id,
        username: user.username,
        userRole: user.userRole
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: '刪除用戶失敗' });
  }
});

/**
 * @route   GET /api/v1/users/stats/overview
 * @desc    獲取用戶統計概覽 (管理員專用)
 * @access  Private (管理員)
 */
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await User.findAll({
      attributes: [
        'userRole',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['userRole']
    });

    const overview = {
      total: 0,
      regular: 0,
      verified: 0,
      admin: 0
    };

    stats.forEach(stat => {
      const role = stat.userRole;
      const count = parseInt(stat.dataValues.count);
      overview[role] = count;
      overview.total += count;
    });

    res.json({ stats: overview });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: '獲取用戶統計失敗' });
  }
});

module.exports = router;
