const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { generateUserToken } = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 輸入驗證規則
const registerValidation = [
  body('username')
    .isLength({ min: 2, max: 50 })
    .withMessage('用戶名必須在 2-50 個字符之間')
    .isAlphanumeric()
    .withMessage('用戶名只能包含字母和數字'),
  body('email')
    .isEmail()
    .withMessage('請提供有效的電子郵件地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密碼至少需要 6 個字符'),
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('顯示名稱不能超過 100 個字符')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('請提供有效的電子郵件地址')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('密碼不能為空')
];

// 處理驗證錯誤的中間件
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
 * @route   POST /api/v1/auth/register
 * @desc    用戶註冊
 * @access  Public
 */
router.post('/register', registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // 檢查用戶是否已存在
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(409).json({ error: '該電子郵件已被註冊' });
    }

    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(409).json({ error: '該用戶名已被使用' });
    }

    // 建立新用戶
    const user = await User.create({
      username,
      email,
      password,
      displayName: displayName || username,
      userRole: 'regular' // 預設為一般用戶
    });

    // 生成 JWT Token
    const token = generateUserToken(user);

    // 回傳用戶資訊 (不包含密碼)
    res.status(201).json({
      message: '註冊成功',
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('Register error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: '用戶名或電子郵件已存在' });
    }
    
    res.status(500).json({ error: '註冊失敗，請稍後再試' });
  }
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    用戶登入
 * @access  Public
 */
router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用戶
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: '電子郵件或密碼不正確' });
    }

    // 驗證密碼
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '電子郵件或密碼不正確' });
    }

    // 生成 JWT Token
    const token = generateUserToken(user);

    res.json({
      message: '登入成功',
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登入失敗，請稍後再試' });
  }
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    獲取當前用戶資訊
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // req.user 來自 authenticateToken 中間件
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    res.json({
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: '獲取用戶資訊失敗' });
  }
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    用戶登出 (前端處理，後端返回確認)
 * @access  Private
 */
router.post('/logout', authenticateToken, (req, res) => {
  // JWT 是無狀態的，實際登出由前端處理（清除 token）
  // 這裡只是提供一個登出確認端點
  res.json({ message: '登出成功' });
});

module.exports = router;
