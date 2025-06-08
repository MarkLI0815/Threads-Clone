// frontend/src/pages/Login.js - 完整 Gmail OAuth 版本
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';

const Login = () => {
  const { login, loginWithGmail, handleGmailCallback, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();

  // 🔥 處理 Gmail OAuth 回調
  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (code) {
      console.log('🔐 收到 Gmail OAuth 授權碼，正在處理...');
      setSuccess('正在處理 Gmail 登入，請稍候...');
      handleGmailOAuthCallback(code);
    } else if (error) {
      console.error('❌ Gmail OAuth 錯誤:', error);
      setError('Gmail 登入失敗：' + error);
    }
  }, [searchParams]);

  const handleGmailOAuthCallback = async (code) => {
    setLocalLoading(true);
    setError('');
    
    try {
      const result = await handleGmailCallback(code);
      
      if (result.success) {
        setSuccess('Gmail 登入成功！正在跳轉...');
        // AuthContext 會自動處理跳轉
      } else {
        setError('Gmail 登入失敗：' + result.error);
      }
    } catch (error) {
      console.error('Gmail 回調處理錯誤:', error);
      setError('Gmail 登入處理失敗');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalLoading(true);
    setError('');
    setSuccess('');

    console.log('🔐 提交登入表單:', { email: formData.email });

    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error);
      console.log('❌ 登入失敗:', result.error);
    } else {
      setSuccess('登入成功！正在跳轉...');
      console.log('✅ 登入成功，等待跳轉...');
    }
    
    setLocalLoading(false);
  };

  const testAccounts = [
    { 
      email: 'admin@example.com', 
      password: 'password123', 
      role: '管理員',
      description: '可管理用戶和內容',
      color: 'bg-red-500'
    },
    { 
      email: 'verified@example.com', 
      password: 'password123', 
      role: '認證用戶',
      description: '認證標誌和優先推薦',
      color: 'bg-blue-500'
    },
    { 
      email: 'test@example.com', 
      password: 'password123', 
      role: '一般用戶',
      description: '基礎社交功能',
      color: 'bg-green-500'
    }
  ];

  const quickLogin = async (account) => {
    setFormData({
      email: account.email,
      password: account.password
    });
    setError('');
    setSuccess('');
    
    setLocalLoading(true);
    console.log('🚀 快速登入:', account.email);
    
    const result = await login(account.email, account.password);
    
    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess('登入成功！正在跳轉...');
    }
    
    setLocalLoading(false);
  };

  const fillTestAccount = (account) => {
    setFormData({
      email: account.email,
      password: account.password
    });
    setError('');
    setSuccess('');
  };

  // 🔥 Gmail OAuth 登入
  const handleGmailLogin = async () => {
    setLocalLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🔐 開始 Gmail OAuth 流程...');
      
      const result = await loginWithGmail();
      
      if (result.success) {
        setSuccess(result.message || '正在跳轉到 Gmail 登入...');
        // loginWithGmail 會自動跳轉到 Google OAuth 頁面
      } else {
        setError(result.error);
      }
      
    } catch (error) {
      console.error('❌ Gmail OAuth 初始化失敗:', error);
      setError('Gmail 登入初始化失敗');
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = loading || localLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo 和標題 */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            雲端計算期末專題
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            M11359017 - 李柏翰
          </p>
        </div>

        {/* 🔥 Gmail OAuth 處理中提示 */}
        {searchParams.get('code') && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
              正在處理 Gmail 登入，請稍候...
            </div>
          </div>
        )}

        {/* 登入表單 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                {success}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                電子郵件
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="請輸入電子郵件"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密碼
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="請輸入密碼"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  登入中...
                </div>
              ) : (
                '登入'
              )}
            </button>
          </div>

          {/* 分隔線 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">或</span>
            </div>
          </div>

          {/* 🔥 Gmail 登入按鈕 - 完整功能版 */}
          <div>
            <button
              type="button"
              onClick={handleGmailLogin}
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                  處理中...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  使用 Gmail 帳戶登入
                </>
              )}
            </button>
          </div>
        </form>

        {/* 測試帳號區域 */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                🧪 快速測試登入（密碼統一：password123）
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {testAccounts.map((account, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${account.color} rounded-full flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">
                        {account.role[0]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {account.email}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full text-white ${account.color}`}>
                          {account.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {account.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fillTestAccount(account)}
                      disabled={isLoading}
                      className="px-3 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      填入
                    </button>
                    <button
                      onClick={() => quickLogin(account)}
                      disabled={isLoading}
                      className={`px-3 py-1 text-xs text-white rounded hover:opacity-90 transition-colors disabled:opacity-50 ${account.color}`}
                    >
                      {isLoading ? '登入中...' : '直接登入'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              💡 提示：點擊「直接登入」可快速體驗不同角色功能
            </p>
          </div>
        </div>

        {/* 註冊連結 */}
        <div className="text-center">
          <span className="text-sm text-gray-600">
            還沒有帳戶？{' '}
            <Link 
              to="/register" 
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              立即註冊
            </Link>
          </span>
        </div>

        
      </div>
    </div>
  );
};

export default Login;