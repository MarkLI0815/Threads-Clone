import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="card max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">個人檔案</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">用戶名</label>
            <p className="mt-1 text-sm text-gray-900">{user?.username}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">顯示名稱</label>
            <p className="mt-1 text-sm text-gray-900">{user?.displayName}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">電子郵件</label>
            <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">用戶角色</label>
            <p className="mt-1 text-sm text-gray-900">{user?.userRole}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">註冊時間</label>
            <p className="mt-1 text-sm text-gray-900">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
