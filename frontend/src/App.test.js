import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

// 簡化版 App 組件用於測試
const SimpleApp = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🎉 React 應用啟動成功！
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              智慧社交平台前端正在運行
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                下一步：
              </h3>
              <p className="text-xs text-blue-700">
                1. 確保後端 API 在 http://localhost:3001 運行<br/>
                2. 測試完整的認證功能<br/>
                3. 驗證三種用戶角色系統
              </p>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default SimpleApp;
