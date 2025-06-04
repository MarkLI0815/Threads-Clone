#!/bin/bash

echo "🧪 測試 React 應用啟動..."

# 檢查必要檔案
echo "檢查必要檔案..."
missing_files=0

for file in "public/index.html" "src/index.js" "src/App.js" "src/index.css"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少檔案: $file"
        missing_files=$((missing_files + 1))
    else
        echo "✅ $file"
    fi
done

if [ $missing_files -gt 0 ]; then
    echo "❌ 有 $missing_files 個檔案缺少，請先修復"
    exit 1
fi

echo ""
echo "📦 檢查依賴..."
if [ ! -d "node_modules" ]; then
    echo "安裝依賴..."
    npm install
fi

echo ""
echo "🚀 啟動 React 應用..."
echo "如果看到編譯錯誤，請檢查 src/App.js 中的組件導入"

npm start
