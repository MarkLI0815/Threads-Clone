-- 資料庫初始化腳本
-- 這個檔案會在 MySQL 容器第一次啟動時執行

-- 確保使用正確的資料庫
USE social_platform;

-- 建立基礎表格 (暫時簡單版本，後續會用 Sequelize 遷移)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    user_role ENUM('regular', 'verified', 'admin') DEFAULT 'regular',
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入測試用戶
INSERT IGNORE INTO users (id, username, email, password, display_name, user_role) VALUES
('test-user-1', 'testuser', 'test@example.com', '$2b$12$test.hash.password', 'Test User', 'regular'),
('admin-user-1', 'admin', 'admin@example.com', '$2b$12$admin.hash.password', 'Admin User', 'admin');

-- 顯示初始化完成
SELECT 'Database initialized successfully!' AS message;
