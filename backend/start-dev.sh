#!/bin/bash

echo "🚀 啟動智慧社交平台開發環境..."

# 檢查是否在正確的目錄
if [ ! -f "package.json" ]; then
    echo "❌ 請在 backend 目錄中執行此腳本"
    exit 1
fi

# 檢查 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安裝依賴套件..."
    npm install
fi

# 檢查 .env 檔案
if [ ! -f "../.env" ]; then
    echo "⚠️ 找不到 .env 檔案，請確保環境變數已設置"
fi

# 檢查 Docker 服務
echo "🐳 檢查 Docker 服務狀態..."
docker ps | grep social_platform_mysql > /dev/null
if [ $? -ne 0 ]; then
    echo "⚠️ MySQL 容器未運行，請先啟動 Docker 服務："
    echo "   cd .. && ./docker/docker-manage.sh start"
    echo ""
fi

echo "🌐 啟動後端服務器..."
echo "📍 服務器將運行在: http://localhost:3001"
echo "📊 健康檢查: http://localhost:3001/health"
echo "🔗 API 基礎路徑: http://localhost:3001/api/v1"
echo ""
echo "💡 可用的 API 端點："
echo "   POST /api/v1/auth/register  - 用戶註冊"
echo "   POST /api/v1/auth/login     - 用戶登入"
echo "   GET  /api/v1/auth/me        - 獲取當前用戶"
echo "   GET  /api/v1/users          - 獲取用戶列表"
echo "   POST /api/v1/posts          - 建立貼文"
echo "   GET  /api/v1/posts          - 獲取貼文列表"
echo ""
echo "按 Ctrl+C 停止服務器"
echo "========================"

npm run dev
