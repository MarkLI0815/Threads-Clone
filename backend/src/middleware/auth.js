const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT 驗證中間件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// 角色權限檢查中間件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.userRole
      });
    }

    next();
  };
};

// 管理員權限檢查
const requireAdmin = requireRole(['admin']);

// 認證用戶或管理員權限檢查
const requireVerifiedOrAdmin = requireRole(['verified', 'admin']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireVerifiedOrAdmin
};
