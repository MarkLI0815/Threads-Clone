import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();

  const getRoleDescription = (role) => {
    const descriptions = {
      regular: '您是一般用戶，可以使用基礎的社交功能',
      verified: '您是認證用戶，享有進階功能和優先推薦',
      admin: '您是管理員，擁有完整的系統管理權限'
    };
    return descriptions[role] || '';
  };

  const getRoleColor = (role) => {
    const colors = {
      regular: 'text-gray-600',
      verified: 'text-blue-600',
      admin: 'text-red-600'
    };
    return colors[role] || 'text-gray-600';
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            歡迎來到智慧社交平台！
          </h1>
          
          <div className="mb-6">
            <p className="text-lg text-gray-600 mb-2">
              歡迎，{user?.displayName || user?.username}！
            </p>
            <p className={`text-lg font-medium ${getRoleColor(user?.userRole)}`}>
              {getRoleDescription(user?.userRole)}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🟢 一般用戶
              </h3>
              <p className="text-sm text-gray-600">
                基礎社交功能，包括建立貼文、查看內容、互動等
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-blue-700 mb-2">
                🔵 認證用戶
              </h3>
              <p className="text-sm text-gray-600">
                進階功能，優先推薦、特殊標誌、查看用戶列表
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-red-700 mb-2">
                🔴 管理員
              </h3>
              <p className="text-sm text-gray-600">
                完整管理權限，用戶管理、角色控制、系統設置
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              🎯 PRD 第一週里程碑完成！
            </h3>
            <p className="text-sm text-blue-700">
              已建立完整的三種用戶角色系統、JWT 認證、權限控制和前後端整合
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
