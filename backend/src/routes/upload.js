// backend/src/routes/upload.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const {
    uploadSingleImage,
    uploadMultipleImages,
    deleteImage
} = require('../../controllers/uploadController');

const router = express.Router();

// 認證中間件（直接在這裡定義）
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
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

// 所有上傳路由都需要認證
router.use(authenticateToken);

// 上傳單張圖片
// POST /api/v1/upload/image
router.post('/image', uploadSingleImage);

// 上傳多張圖片
// POST /api/v1/upload/images
router.post('/images', uploadMultipleImages);

// 刪除圖片
// DELETE /api/v1/upload/:filename
router.delete('/:filename', deleteImage);

module.exports = router;