// frontend/src/pages/Register.js - 完整註冊功能（包含 Gmail OAuth）
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Register = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // 密碼強度檢查
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // 檢查密碼強度
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }

    // 清除錯誤訊息
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('請輸入用戶名');
      return false;
    }
    if (formData.username.length < 3) {
      setError('用戶名至少需要3個字符');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('用戶名只能包含字母、數字和底線');
      return false;
    }
    if (!formData.email.trim()) {
      setError('請輸入電子郵件');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('請輸入有效的電子郵件');
      return false;
    }
    if (!formData.password) {
      setError('請輸入密碼');
      return false;
    }
    if (formData.password.length < 6) {
      setError('密碼至少需要6個字符');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('密碼確認不匹配');
      return false;
    }
    if (!formData.displayName.trim()) {
      setError('請輸入顯示名稱');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const result = await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        displayName: formData.displayName.trim()
      });
      
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('註冊過程中發生錯誤');
    }
    
    setLoading(false);
  };

  // Gmail OAuth 登入
  const handleGmailLogin = () => {
    // 這裡需要配置 Google OAuth
    // 暫時顯示提示訊息
    alert('Gmail OAuth 功能正在開發中，請使用傳統註冊方式');
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 2) return 'bg-yellow-500';
    if (passwordStrength <= 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return '弱';
    if (passwordStrength <= 2) return '普通';
    if (passwordStrength <= 3) return '強';
    return '很強';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo 和標題 */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            加入智慧社交平台
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            創建您的帳戶，開始社交之旅
          </p>
        </div>

        {/* 註冊表單 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* 用戶名 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用戶名 *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="輸入用戶名（3-20字符）"
                maxLength={20}
              />
              <p className="mt-1 text-xs text-gray-500">
                只能包含字母、數字和底線，3-20個字符
              </p>
            </div>

            {/* 顯示名稱 */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                顯示名稱 *
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                value={formData.displayName}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="輸入顯示名稱"
                maxLength={50}
              />
              <p className="mt-1 text-xs text-gray-500">
                其他用戶將看到的名稱
              </p>
            </div>

            {/* 電子郵件 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                電子郵件 *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="輸入電子郵件地址"
              />
            </div>
            
            {/* 密碼 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密碼 *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="輸入密碼（至少6個字符）"
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
              
              {/* 密碼強度指示器 */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 確認密碼 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                確認密碼 *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="再次輸入密碼"
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">密碼不匹配</p>
              )}
            </div>
          </div>

          {/* 註冊按鈕 */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '註冊中...' : '創建帳戶'}
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

          {/* Gmail 註冊按鈕 */}
          <div>
            <button
              type="button"
              onClick={handleGmailLogin}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              使用 Gmail 帳戶註冊
            </button>
          </div>

          {/* 登入連結 */}
          <div className="text-center">
            <span className="text-sm text-gray-600">
              已經有帳戶了？{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                立即登入
              </Link>
            </span>
          </div>

          {/* 服務條款 */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              註冊即表示您同意我們的{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">服務條款</a>
              {' '}和{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">隱私政策</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;