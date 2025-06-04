# Windows 環境重建指南

## 🚀 快速開始

### 1. 環境準備
```bash
# 確保已安裝:
node --version  # 應該 >= 16
npm --version
git --version
docker --version
```

### 2. 克隆專案
```bash
git clone https://github.com/你的用戶名/social-platform.git
cd social-platform
```

### 3. 安裝依賴
```bash
# 後端依賴
cd backend
npm install

# 前端依賴
cd ../frontend
npm install

# 返回根目錄
cd ..
```

### 4. 啟動 Docker 服務
```bash
# 啟動 MySQL 和 Redis
docker-compose -f docker/docker-compose.yml up -d

# 檢查容器狀態
docker ps
```

### 5. 恢復資料庫
```bash
# 如果有備份檔案
docker exec social_platform_mysql mysql -u root -prootpassword123 social_platform < database/backup_20241225.sql

# 或重新初始化
cd backend
# 執行資料庫初始化腳本
```

### 6. 啟動服務
```bash
# 終端1: 啟動後端
cd backend
npm run dev

# 終端2: 啟動前端
cd frontend
npm start
```

### 7. 驗證功能
- 前端: http://localhost:3000
- 後端: http://localhost:3001/health
- 測試帳號: admin@example.com / password123

## 🔧 故障排除

### Docker 問題
```bash
# 重啟 Docker 服務
docker-compose -f docker/docker-compose.yml down
docker-compose -f docker/docker-compose.yml up -d
```

### 依賴問題
```bash
# 清除並重新安裝
rm -rf node_modules package-lock.json
npm install
```

### 連接埠問題
```bash
# Windows 檢查連接埠使用
netstat -ano | findstr :3001
# 終止程序或修改 .env 中的 PORT
```
