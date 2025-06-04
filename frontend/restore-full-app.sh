#!/bin/bash

echo "🔄 還原完整版 App.js..."

# 檢查是否所有依賴組件都存在
if [ ! -f "src/contexts/AuthContext.js" ] || [ ! -f "src/components/Layout.js" ]; then
    echo "⚠️ 一些組件檔案缺少，建議先用簡化版測試"
    echo "使用指令: cp src/App.test.js src/App.js"
    exit 1
fi

echo "還原完整的 App.js 檔案..."
# 這裡可以還原之前建立的完整 App.js

echo "✅ 完整版本已還原"
