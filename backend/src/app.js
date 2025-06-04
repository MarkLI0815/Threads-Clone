const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// 安全性中間件
app.use(helmet());

// 壓縮回應
app.use(compression());

// CORS 設定
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// 限制請求頻率
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分鐘
    max: 100 // 每 IP 最多 100 次請求
});
app.use(limiter);

// 日誌中間件
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// 解析請求內容
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 靜態檔案服務 (替代 S3)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 健康檢查端點
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: require('../package.json').version
    });
});

// API 路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/posts', postRoutes);

// 404 處理
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// 全域錯誤處理中間件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // 開發環境顯示完整錯誤
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.status || 500).json({
            error: err.message,
            stack: err.stack
        });
    }
    
    // 生產環境只顯示簡化錯誤
    res.status(err.status || 500).json({
        error: 'Internal server error'
    });
});

const PORT = process.env.PORT || 3001;

// 啟動服務器
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🌐 API base URL: http://localhost:${PORT}/api/v1`);
        console.log(`📂 Uploads: http://localhost:${PORT}/uploads`);
    });
}

module.exports = app;
