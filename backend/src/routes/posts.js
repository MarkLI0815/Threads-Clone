// backend/src/routes/posts.js - 確保包含編輯刪除功能
const express = require('express');
const router = express.Router();
const { 
    createPost, 
    getPosts, 
    getPost, 
    updatePost,     // 🔥 編輯貼文
    deletePost,     // 🔥 刪除貼文
    toggleLike, 
    addComment 
} = require('../../controllers/postController');
const { authenticateToken } = require('../middleware/auth');

// 獲取貼文列表
router.get('/', authenticateToken, getPosts);

// 創建貼文
router.post('/', authenticateToken, createPost);

// 獲取單個貼文
router.get('/:id', authenticateToken, getPost);

// 🔥 更新貼文
router.put('/:id', authenticateToken, updatePost);

// 🔥 刪除貼文
router.delete('/:id', authenticateToken, deletePost);

// 按讚/取消按讚
router.post('/:id/like', authenticateToken, toggleLike);

// 添加評論
router.post('/:id/comment', authenticateToken, addComment);

module.exports = router;