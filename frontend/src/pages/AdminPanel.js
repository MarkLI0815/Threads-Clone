import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AdminPanel = () => {
  const { user } = useAuth();

  if (user?.userRole !== 'admin') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="card text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">權限不足</h1>
          <p className="text-gray-600">您沒有權限訪問管理面板</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">管理員面板</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">用戶管理</h3>
            <p className="text-sm text-gray-600 mb-4">
              管理用戶帳號、角色和權限
            </p>
            <button className="btn-primary">管理用戶</button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">內容管理</h3>
            <p className="text-sm text-gray-600 mb-4">
              審核和管理平台內容
            </p>
            <button className="btn-primary">管理內容</button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">系統統計</h3>
            <p className="text-sm text-gray-600 mb-4">
              查看平台使用情況和統計數據
            </p>
            <button className="btn-primary">查看統計</button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">系統設置</h3>
            <p className="text-sm text-gray-600 mb-4">
              配置系統參數和設置
            </p>
            <button className="btn-primary">系統設置</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
