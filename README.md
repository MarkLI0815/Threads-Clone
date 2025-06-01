# Smart Social Platform 智慧社交平台

## 專案概述
把threads復刻練習，再加入一些個人我自己的喜好優化

## 技術棧
- **前端**: React.js
- **後端**: Node.js + Express
- **資料庫**: MySQL (本地) / Aurora RDS (AWS)
- **快取**: Redis
- **雲端部署**: AWS (Lambda + API Gateway + S3)

## 開發環境設置

### 環境需求
- Node.js 16+
- Docker
- MySQL 8.0
- Redis

### 快速開始
```bash
# 1. 安裝依賴
cd frontend && npm install
cd ../backend && npm install

# 2. 啟動開發環境
docker-compose -f docker/docker-compose.yml up -d
npm run dev

# 3. 訪問應用
# 前端: http://localhost:3000
# 後端: http://localhost:3001
```

## 專案結構
```
social-platform/
├── frontend/          # React 前端應用
├── backend/           # Node.js 後端 API
├── database/          # 資料庫相關檔案
├── docker/            # Docker 配置
├── aws/               # AWS 部署配置
└── docs/              # 專案文檔
```

## 開發進度
- [x] 專案初始化
- [x] Git 版本控制設置
- [ ] 開發環境配置
- [ ] 基礎認證系統
- [ ] 核心社群功能
- [ ] 用戶角色系統
- [ ] 推薦算法
- [ ] 數據分析功能
- [ ] AWS 部署
