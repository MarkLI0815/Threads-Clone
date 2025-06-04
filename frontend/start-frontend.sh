#!/bin/bash

echo "⚛️ 啟動 React 前端應用..."

# 檢查是否在正確的目錄
if [ ! -f "package.json" ]; then
    echo "❌ 請在 frontend 目錄中執行此腳本"
    exit 1
fi

# 檢查 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安裝依賴套件..."
    npm install
fi

echo "🌐 啟動前端開發服務器..."
echo "�� 前端將運行在: http://localhost:3000"
echo "🔗 API 連接: http://localhost:3001/api/v1"
echo ""
echo "💡 請確保後端服務器也在運行："
echo "   cd ../backend && npm run dev"
echo ""
echo "按 Ctrl+C 停止服務器"
echo "========================"

npm run dev
