// backend/src/app.js - 修復版
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// 中間件
const { authenticateToken } = require('./middleware/auth');

// 路由
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const uploadRoutes = require('./routes/upload');
const usersRoutes = require('./routes/users'); 
const recommendationRoutes = require('./routes/recommendations');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');


const app = express();

// 中間件
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 靜態檔案服務 (用於圖片上傳)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 健康檢查
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API 路由
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/users', usersRoutes); 
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);

console.log('✅ Routes registered: /api/v1/auth, /api/v1/posts, /api/v1/upload, /api/v1/users, /api/v1/recommendations, /api/v1/notifications');

// 404 處理
app.use((req, res, next) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Sequelize 驗證錯誤
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            details: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }

    // Sequelize 唯一約束錯誤
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            error: 'Duplicate entry',
            details: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }

    // JWT 錯誤
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
    }

    // 默認錯誤
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message || 'Something went wrong!',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
    console.log(`💾 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// 優雅關閉
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

module.exports = app;