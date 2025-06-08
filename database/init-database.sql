-- 使用 social_platform 資料庫
USE social_platform;

-- 刪除現有表格 (如果存在)
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS follows;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;

-- 建立用戶表
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    user_role ENUM('regular', 'verified', 'admin') DEFAULT 'regular',
    verified BOOLEAN DEFAULT FALSE,
    bio TEXT,
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 建立貼文表
CREATE TABLE posts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 建立追蹤關係表
CREATE TABLE follows (
    id VARCHAR(36) PRIMARY KEY,
    follower_id VARCHAR(36) NOT NULL,
    following_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_id, following_id)
);

-- 建立按讚表
CREATE TABLE likes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    post_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (user_id, post_id)
);

-- 建立評論表
CREATE TABLE comments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    post_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 插入測試用戶 (使用 bcrypt 加密的 password123)
INSERT INTO users (id, username, email, password, display_name, user_role, verified) VALUES
('admin-user-1', 'admin', 'admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4mQqF6QHXK', 'Admin User', 'admin', TRUE),
('verified-user-1', 'verified', 'verified@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4mQqF6QHXK', 'Verified User', 'verified', TRUE),
('test-user-1', 'testuser', 'test@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4mQqF6QHXK', 'Test User', 'regular', FALSE);

-- 插入測試貼文
INSERT INTO posts (id, user_id, content) VALUES
('post-1', 'test-user-1', '這是我的第一篇貼文！歡迎來到智慧社交平台！'),
('post-2', 'admin-user-1', '歡迎使用智慧社交平台！我是管理員，這裡展示三種用戶角色系統。'),
('post-3', 'verified-user-1', '我是認證用戶，享有特殊權限和優先推薦功能！'),
('post-4', 'test-user-1', '測試發布第二篇貼文，展示平台的社交功能。'),
('post-5', 'admin-user-1', '管理員可以管理所有用戶和內容，展示權限控制功能。');

-- 插入測試追蹤關係
INSERT INTO follows (id, follower_id, following_id) VALUES
('follow-1', 'test-user-1', 'admin-user-1'),
('follow-2', 'test-user-1', 'verified-user-1'),
('follow-3', 'verified-user-1', 'admin-user-1');

-- 插入測試按讚
INSERT INTO likes (id, user_id, post_id) VALUES
('like-1', 'test-user-1', 'post-2'),
('like-2', 'verified-user-1', 'post-1'),
('like-3', 'admin-user-1', 'post-3'),
('like-4', 'test-user-1', 'post-3'),
('like-5', 'verified-user-1', 'post-2');

-- 插入測試評論
INSERT INTO comments (id, user_id, post_id, content) VALUES
('comment-1', 'verified-user-1', 'post-1', '很棒的第一篇貼文！歡迎加入平台！'),
('comment-2', 'admin-user-1', 'post-1', '感謝使用我們的平台，祝你使用愉快！'),
('comment-3', 'test-user-1', 'post-2', '謝謝管理員的歡迎訊息！'),
('comment-4', 'admin-user-1', 'post-3', '認證用戶的功能很實用！');

-- 更新計數器
UPDATE users SET 
    posts_count = (SELECT COUNT(*) FROM posts WHERE user_id = users.id),
    followers_count = (SELECT COUNT(*) FROM follows WHERE following_id = users.id),
    following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = users.id);

UPDATE posts SET 
    like_count = (SELECT COUNT(*) FROM likes WHERE post_id = posts.id),
    comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = posts.id);

-- 顯示建立結果
SELECT 'Database Creation Complete' AS status;
SHOW TABLES;
SELECT CONCAT('Users: ', COUNT(*)) AS count FROM users;
SELECT CONCAT('Posts: ', COUNT(*)) AS count FROM posts;
SELECT CONCAT('Follows: ', COUNT(*)) AS count FROM follows;
SELECT CONCAT('Likes: ', COUNT(*)) AS count FROM likes;
SELECT CONCAT('Comments: ', COUNT(*)) AS count FROM comments;
