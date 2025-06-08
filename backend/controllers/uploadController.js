// backend/controllers/uploadController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 確保上傳目錄存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // 生成唯一檔名：時間戳_用戶ID_原始檔名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const userId = req.user?.id || 'anonymous';
        const extension = path.extname(file.originalname);
        const filename = `${userId}_${uniqueSuffix}${extension}`;
        cb(null, filename);
    }
});

// 檔案過濾器
const fileFilter = (req, file, cb) => {
    console.log('📁 Uploading file:', file.originalname, 'Type:', file.mimetype);

    // 允許的圖片類型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('只允許上傳 JPEG, PNG, GIF, WebP 格式的圖片'), false);
    }
};

// 創建 multer 實例
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB 限制
        files: 4 // 最多 4 個檔案
    }
});

// 單張圖片上傳
const uploadSingle = upload.single('image');

// 多張圖片上傳
const uploadMultiple = upload.array('images', 4);

// 上傳單張圖片
const uploadSingleImage = (req, res) => {
    uploadSingle(req, res, (err) => {
        if (err) {
            console.error('❌ Upload single image error:', err.message);
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: '沒有選擇檔案' });
        }

        console.log('✅ Single image uploaded:', req.file.filename);

        // 返回圖片 URL
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        res.json({
            message: '圖片上傳成功',
            imageUrl: imageUrl,
            filename: req.file.filename,
            size: req.file.size
        });
    });
};

// 上傳多張圖片
const uploadMultipleImages = (req, res) => {
    uploadMultiple(req, res, (err) => {
        if (err) {
            console.error('❌ Upload multiple images error:', err.message);
            return res.status(400).json({ error: err.message });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: '沒有選擇檔案' });
        }

        console.log('✅ Multiple images uploaded:', req.files.length);

        // 返回所有圖片 URL
        const imageUrls = req.files.map(file => ({
            url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
            filename: file.filename,
            size: file.size
        }));

        res.json({
            message: '圖片上傳成功',
            images: imageUrls,
            count: req.files.length
        });
    });
};

// 刪除圖片
const deleteImage = async (req, res) => {
    try {
        const { filename } = req.params;

        // 安全檢查檔名
        if (!filename || filename.includes('..') || filename.includes('/')) {
            return res.status(400).json({ error: '無效的檔案名稱' });
        }

        const filePath = path.join(uploadDir, filename);

        // 檢查檔案是否存在
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '檔案不存在' });
        }

        // 檢查權限：只有上傳者或管理員可以刪除
        const userId = req.user.id;
        const isAdmin = req.user.userRole === 'admin';
        const isOwner = filename.startsWith(userId + '_');

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: '沒有權限刪除此檔案' });
        }

        // 刪除檔案
        fs.unlinkSync(filePath);
        console.log('✅ Image deleted:', filename);

        res.json({ message: '圖片刪除成功' });

    } catch (error) {
        console.error('❌ Delete image error:', error);
        res.status(500).json({ error: '刪除圖片失敗' });
    }
};

module.exports = {
    uploadSingleImage,
    uploadMultipleImages,
    deleteImage
};