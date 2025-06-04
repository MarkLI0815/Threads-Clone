import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon, 
  UserIcon, 
  CogIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    const badges = {
      regular: 'bg-gray-100 text-gray-800',
      verified: 'bg-blue-100 text-blue-800',
      admin: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      regular: '一般用戶',
      verified: '認證用戶',
      admin: '管理員'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[role]}`}>
        {labels[role]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 導航欄 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary-600">
                  智慧社交平台
                </h1>
              </Link>
              
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link
                  to="/"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-primary-600"
                >
                  <HomeIcon className="h-4 w-4 mr-1" />
                  首頁
                </Link>
                
                <Link
                  to="/profile"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-primary-600"
                >
                  <UserIcon className="h-4 w-4 mr-1" />
                  個人檔案
                </Link>
                
                {user?.userRole === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600"
                  >
                    <CogIcon className="h-4 w-4 mr-1" />
                    管理面板
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* 用戶資訊 */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.displayName || user?.username}
                  </p>
                  <div className="flex items-center justify-end">
                    {getRoleBadge(user?.userRole)}
                  </div>
                </div>
                
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {(user?.displayName || user?.username)?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* 登出按鈕 */}
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
