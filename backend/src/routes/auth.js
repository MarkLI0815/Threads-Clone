// backend/src/routes/auth.js - 新增 Gmail OAuth 支援
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 🔥 Gmail OAuth 配置
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/login';

// 🔥 Gmail OAuth 初始化 - 獲取授權URL
router.get('/google', async (req, res) => {
    try {
        console.log('🔐 Gmail OAuth 初始化請求');
        
        // 檢查是否配置了 Google OAuth
        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your-google-client-id') {
            console.log('⚠️ Google OAuth 未配置');
            return res.status(501).json({
                success: false,
                error: 'Gmail OAuth 功能尚未配置，請使用傳統登入方式',
                configured: false
            });
        }

        // 生成 Google OAuth 授權 URL
        const scope = 'email profile';
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${GOOGLE_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&` +
            `scope=${encodeURIComponent(scope)}&` +
            `response_type=code&` +
            `access_type=offline&` +
            `prompt=consent`;

        console.log('🔗 生成 Gmail OAuth URL:', authUrl);

        res.json({
            success: true,
            authUrl: authUrl,
            configured: true
        });

    } catch (error) {
        console.error('❌ Gmail OAuth 初始化錯誤:', error);
        res.status(500).json({
            success: false,
            error: 'Gmail OAuth 初始化失敗'
        });
    }
});

// 🔥 Gmail OAuth 回調處理
router.post('/google/callback', async (req, res) => {
    try {
        const { code } = req.body;

        console.log('🔐 處理 Gmail OAuth 回調:', { code: code ? 'received' : 'missing' });

        if (!code) {
            return res.status(400).json({
                success: false,
                error: '缺少授權碼'
            });
        }

        // 檢查 Google OAuth 配置
        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your-google-client-id') {
            return res.status(501).json({
                success: false,
                error: 'Gmail OAuth 功能尚未配置'
            });
        }

        // 🔥 用授權碼換取訪問令牌
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: GOOGLE_REDIRECT_URI,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('❌ Google token 交換失敗:', tokenData);
            return res.status(400).json({
                success: false,
                error: 'Google 授權失敗'
            });
        }

        // 🔥 用訪問令牌獲取用戶信息
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
            },
        });

        const googleUser = await userResponse.json();

        if (!userResponse.ok) {
            console.error('❌ Google 用戶信息獲取失敗:', googleUser);
            return res.status(400).json({
                success: false,
                error: '獲取用戶信息失敗'
            });
        }

        console.log('✅ Google 用戶信息:', {
            id: googleUser.id,
            email: googleUser.email,
            name: googleUser.name
        });

        // 🔥 檢查用戶是否已存在
        let user = await User.findOne({
            where: { email: googleUser.email }
        });

        if (user) {
            console.log('✅ 現有用戶登入:', user.email);
        } else {
            // 🔥 創建新用戶
            console.log('📝 創建新用戶:', googleUser.email);
            
            // 生成用戶名（從email獲取，確保唯一性）
            let username = googleUser.email.split('@')[0];
            
            // 檢查用戶名是否已存在
            const existingUser = await User.findOne({ where: { username } });
            if (existingUser) {
                username = `${username}_${Date.now()}`;
            }

            user = await User.create({
                username: username,
                email: googleUser.email,
                displayName: googleUser.name || googleUser.email.split('@')[0],
                password: await bcrypt.hash(Math.random().toString(36), 12), // 隨機密碼
                userRole: 'regular',
                verified: googleUser.verified_email || false,
                // 可以添加 Google ID 作為外部 ID
                googleId: googleUser.id
            });

            console.log('✅ 新用戶創建成功:', user.id);
        }

        // 🔥 生成 JWT Token
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                userRole: user.userRole
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        console.log('✅ Gmail OAuth 登入成功');

        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                userRole: user.userRole,
                verified: user.verified,
                avatarUrl: user.avatarUrl
            },
            message: 'Gmail 登入成功'
        });

    } catch (error) {
        console.error('❌ Gmail OAuth 回調錯誤:', error);
        res.status(500).json({
            success: false,
            error: 'Gmail 登入處理失敗'
        });
    }
});

// 現有的其他路由保持不變...

// 註冊
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        console.log('📝 註冊請求:', { username, email, displayName });

        // 驗證必填欄位
        if (!username || !email || !password || !displayName) {
            return res.status(400).json({
                success: false,
                error: '所有欄位都是必填的'
            });
        }

        // 檢查用戶名是否已存在
        const existingUser = await User.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: existingUser.username === username ? '用戶名已存在' : '電子郵件已存在'
            });
        }

        // 加密密碼
        const hashedPassword = await bcrypt.hash(password, 12);

        // 創建用戶
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            displayName,
            userRole: 'regular',
            verified: false
        });

        // 生成 JWT
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                userRole: user.userRole
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        console.log('✅ 用戶註冊成功:', user.id);

        res.status(201).json({
            success: true,
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                userRole: user.userRole,
                verified: user.verified,
                avatarUrl: user.avatarUrl
            },
            message: '註冊成功'
        });

    } catch (error) {
        console.error('❌ 註冊錯誤:', error);
        res.status(500).json({
            success: false,
            error: '註冊失敗'
        });
    }
});

// 登入
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 登入請求:', { email });

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: '請提供電子郵件和密碼'
            });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: '電子郵件或密碼錯誤'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: '電子郵件或密碼錯誤'
            });
        }

        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                userRole: user.userRole
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        console.log('✅ 用戶登入成功:', user.id);

        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                userRole: user.userRole,
                verified: user.verified,
                avatarUrl: user.avatarUrl
            },
            message: '登入成功'
        });

    } catch (error) {
        console.error('❌ 登入錯誤:', error);
        res.status(500).json({
            success: false,
            error: '登入失敗'
        });
    }
});

// 驗證 token
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: '用戶不存在'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                userRole: user.userRole,
                verified: user.verified,
                avatarUrl: user.avatarUrl
            }
        });

    } catch (error) {
        console.error('❌ Token 驗證錯誤:', error);
        res.status(500).json({
            success: false,
            error: 'Token 驗證失敗'
        });
    }
});

module.exports = router;