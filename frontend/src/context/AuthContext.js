// frontend/src/context/AuthContext.js - 修復端點問題
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 檢查本地儲存的 token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      getCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  // 🔥 修復：使用正確的驗證端點
  const getCurrentUser = async () => {
    try {
      console.log('🔍 驗證現有 token...');
      
      // 🔥 修復：使用正確的端點 /auth/verify 而不是 /auth/me
      const response = await api.get('/auth/verify');
      
      console.log('📡 Token 驗證回應:', response.data);
      
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        console.log('✅ Token 驗證成功:', response.data.user);
      } else {
        console.error('❌ Token 驗證失敗 - 回應格式錯誤:', response.data);
        throw new Error('Token 驗證失敗');
      }
    } catch (error) {
      console.error('❌ Token 驗證錯誤:', error);
      console.log('🔄 清除無效 token，重定向到登入頁');
      
      // 清除無效 token
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      
      // 如果當前不在登入或註冊頁面，重定向到登入頁
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔥 修復登入功能
  const login = async (email, password) => {
    try {
      console.log('🔐 開始登入:', email);
      setLoading(true);
      
      const response = await api.post('/auth/login', { email, password });
      
      console.log('📡 登入 API 回應:', response.data);

      // 🔥 檢查回應格式 - 支援不同的回應結構
      let userData, token;
      
      if (response.data.success) {
        // 新格式：{ success: true, token: "...", user: {...} }
        userData = response.data.user;
        token = response.data.token;
      } else if (response.data.user && response.data.token) {
        // 舊格式：{ user: {...}, token: "..." }
        userData = response.data.user;
        token = response.data.token;
      } else {
        throw new Error('登入回應格式錯誤');
      }

      if (token && userData) {
        // 保存 token
        localStorage.setItem('token', token);
        
        // 設置 API 請求頭
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // 設置用戶狀態
        setUser(userData);
        
        console.log('✅ 登入成功，用戶設置完成:', userData);
        
        // 🔥 強制跳轉到首頁
        setTimeout(() => {
          console.log('🔄 執行頁面跳轉...');
          navigate('/', { replace: true });
        }, 100);

        return { success: true, user: userData };
        
      } else {
        throw new Error('登入回應缺少必要信息');
      }
    } catch (error) {
      console.error('❌ 登入錯誤:', error);
      
      let errorMessage = '登入失敗';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // 🔥 註冊功能
  const register = async (userData) => {
    try {
      console.log('📝 開始註冊:', { ...userData, password: '***' });
      setLoading(true);
      
      const response = await api.post('/auth/register', userData);
      
      console.log('📡 註冊 API 回應:', response.data);

      // 檢查回應格式
      let user, token;
      
      if (response.data.success) {
        user = response.data.user;
        token = response.data.token;
      } else if (response.data.user && response.data.token) {
        user = response.data.user;
        token = response.data.token;
      } else {
        throw new Error('註冊回應格式錯誤');
      }

      if (token && user) {
        // 註冊成功，自動登入
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
        
        console.log('✅ 註冊成功，自動登入完成');
        
        // 跳轉到首頁
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);

        return { success: true, user: user };
        
      } else {
        throw new Error('註冊回應缺少必要信息');
      }
    } catch (error) {
      console.error('❌ 註冊錯誤:', error);
      
      let errorMessage = '註冊失敗';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Gmail OAuth 登入功能
  const loginWithGmail = async () => {
    try {
      console.log('🔐 開始 Gmail OAuth 登入...');
      setLoading(true);
      
      // 獲取 Google OAuth 授權 URL
      const response = await api.get('/auth/google');
      
      if (response.data.success && response.data.authUrl) {
        console.log('🔗 跳轉到 Gmail OAuth:', response.data.authUrl);
        // 跳轉到 Google OAuth 授權頁面
        window.location.href = response.data.authUrl;
        return { success: true, message: '正在跳轉到 Gmail 登入...' };
      } else {
        throw new Error(response.data.error || 'Gmail OAuth 初始化失敗');
      }
      
    } catch (error) {
      console.error('❌ Gmail OAuth 錯誤:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Gmail 登入失敗'
      };
    } finally {
      setLoading(false);
    }
  };

  // 🔥 處理 Gmail OAuth 回調
  const handleGmailCallback = async (code) => {
    try {
      console.log('🔐 處理 Gmail OAuth 回調...');
      setLoading(true);
      
      const response = await api.post('/auth/google/callback', { code });
      
      if (response.data.success && response.data.token && response.data.user) {
        // Gmail 登入成功
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setUser(response.data.user);
        
        console.log('✅ Gmail 登入成功:', response.data.user);
        
        // 跳轉到首頁
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);

        return { success: true, user: response.data.user };
        
      } else {
        throw new Error(response.data.error || 'Gmail 登入處理失敗');
      }
      
    } catch (error) {
      console.error('❌ Gmail 回調處理錯誤:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Gmail 登入處理失敗'
      };
    } finally {
      setLoading(false);
    }
  };

  // 登出功能
  const logout = async () => {
    try {
      console.log('👋 用戶登出');
      // 可選：呼叫後端登出 API
      // await api.post('/auth/logout');
    } catch (error) {
      console.error('❌ 登出錯誤:', error);
    } finally {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      navigate('/login', { replace: true });
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    loginWithGmail,
    handleGmailCallback,
    logout,
    getCurrentUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};