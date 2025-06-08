// backend/src/middleware/auth.js - 調試版認證中間件
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        
        console.log('🔍 認證中間件檢查:', {
            authHeader: authHeader ? 'Bearer ***' : '未提供',
            method: req.method,
            url: req.url
        });

        if (!authHeader) {
            console.log('❌ 缺少 Authorization header');
            return res.status(401).json({ error: 'No authorization header' });
        }

        const token = authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            console.log('❌ Authorization header 格式錯誤');
            return res.status(401).json({ error: 'No token provided' });
        }

        console.log('🔐 驗證 token...');

        // 驗證 JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        console.log('✅ Token 驗證成功:', {
            userId: decoded.userId,
            email: decoded.email,
            userRole: decoded.userRole
        });

        // 從資料庫獲取用戶信息
        const user = await User.findByPk(decoded.userId);
        
        if (!user) {
            console.log('❌ 用戶不存在:', decoded.userId);
            return res.status(401).json({ error: 'User not found' });
        }

        console.log('✅ 用戶驗證成功:', user.username);

        // 將用戶信息添加到請求對象
        req.user = {
            id: user.id,
            userId: user.id, // 保持向後相容
            username: user.username,
            email: user.email,
            userRole: user.userRole,
            verified: user.verified
        };

        next();

    } catch (error) {
        console.error('❌ 認證中間件錯誤:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        } else {
            console.error('❌ 認證中間件異常:', error);
            return res.status(500).json({ error: 'Authentication error' });
        }
    }
};

module.exports = {
    authenticateToken
};