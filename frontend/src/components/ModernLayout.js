// frontend/src/components/ModernLayout.js - 包含未讀通知數量
import React, { useContext, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUnreadCount } from '../services/notificationService';

const ModernLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('home');
    const [unreadCount, setUnreadCount] = useState(0); // 🔔 新增未讀通知數量

    // 🔔 定期獲取未讀通知數量
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const result = await getUnreadCount();
                if (result.success) {
                    setUnreadCount(result.data.data.count);
                }
            } catch (error) {
                console.error('獲取未讀通知數量錯誤:', error);
            }
        };

        // 立即獲取一次
        fetchUnreadCount();
        
        // 每30秒檢查一次
        const interval = setInterval(fetchUnreadCount, 30000);

        return () => clearInterval(interval);
    }, []);

    // 🔔 根據路由設置活動標籤
    useEffect(() => {
        const path = location.pathname;
        if (path === '/' || path === '/home') {
            setActiveTab('home');
        } else if (path === '/search') {
            setActiveTab('search');
        } else if (path === '/notifications') {
            setActiveTab('notifications');
        } else if (path.startsWith('/profile')) {
            setActiveTab('profile');
        } else if (path === '/admin') {
            setActiveTab('admin');
        }
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getRoleColor = (userRole) => {
        switch (userRole) {
            case 'admin':
                return 'bg-red-500';
            case 'verified':
                return 'bg-blue-500';
            default:
                return 'bg-green-500';
        }
    };

    const getRoleText = (userRole) => {
        switch (userRole) {
            case 'admin':
                return '管理員';
            case 'verified':
                return '認證用戶';
            default:
                return '一般用戶';
        }
    };

    const navItems = [
        {
            id: 'home',
            icon: (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
            ),
            label: '首頁',
            path: '/'
        },
        {
            id: 'search',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            ),
            label: '搜尋',
            path: '/search'
        },
        {
            id: 'notifications',
            icon: (
                <div className="relative">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zm-7.586-3L5 12l2.414-2.414L12 7.172 16.586 3.414 19 1l2 2-2.414 2.414L21 8l-2.414 2.414L16 12l-2.414 2.414L12 16.828 7.414 21.414 5 19l2.414-2.414z" />
                    </svg>
                    {/* 🔔 未讀通知數量顯示 */}
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            ),
            label: '通知',
            path: '/notifications',
            badgeCount: unreadCount // 🔔 傳遞未讀數量
        },
        {
            id: 'profile',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            label: '個人檔案',
            path: '/profile'
        }
    ];

    // 如果是管理員，加入管理面板
    if (user?.userRole === 'admin') {
        navItems.push({
            id: 'admin',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            label: '管理面板',
            path: '/admin'
        });
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="flex">
                {/* 🔥 現代化側邊導航 */}
                <div className="fixed left-0 top-0 h-full w-20 bg-black border-r border-gray-800 flex flex-col items-center py-6 z-50">
                    {/* Logo */}
                    <div className="mb-8">
                        <div className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center font-bold text-xl">
                            @
                        </div>
                    </div>

                    {/* 導航項目 */}
                    <nav className="flex flex-col space-y-6 flex-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    navigate(item.path);
                                    // 🔔 如果點擊通知，立即更新未讀數量
                                    if (item.id === 'notifications' && unreadCount > 0) {
                                        setTimeout(() => {
                                            setUnreadCount(0);
                                        }, 1000);
                                    }
                                }}
                                className={`
                                    relative p-3 rounded-xl transition-all duration-200 group
                                    ${activeTab === item.id 
                                        ? 'bg-gray-800 text-white' 
                                        : 'text-gray-400 hover:text-white hover:bg-gray-900'
                                    }
                                `}
                                title={item.label}
                            >
                                {item.icon}
                                
                                {/* Tooltip */}
                                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                    {item.label}
                                    {/* 🔔 通知 Tooltip 顯示未讀數量 */}
                                    {item.id === 'notifications' && unreadCount > 0 && (
                                        <span className="ml-2 text-red-400 font-bold">
                                            ({unreadCount} 未讀)
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </nav>

                    {/* 用戶頭像和登出 */}
                    <div className="mt-auto space-y-4">
                        {/* 用戶頭像 */}
                        <div className="relative group">
                            <button
                                onClick={() => {
                                    setActiveTab('profile');
                                    navigate('/profile');
                                }}
                                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-lg hover:scale-105 transition-transform"
                            >
                                {user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                            </button>
                            
                            {/* 角色標籤 */}
                            <div className={`absolute -top-1 -right-1 w-4 h-4 ${getRoleColor(user?.userRole)} rounded-full border-2 border-black`} 
                                 title={getRoleText(user?.userRole)}>
                            </div>

                            {/* 用戶信息 Tooltip */}
                            <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                <div className="font-semibold">{user?.displayName || user?.username}</div>
                                <div className="text-xs text-gray-400">{getRoleText(user?.userRole)}</div>
                                <div className="text-xs text-blue-400 mt-1">點擊查看檔案</div>
                            </div>
                        </div>

                        {/* 登出按鈕 */}
                        <button
                            onClick={handleLogout}
                            className="p-3 text-gray-400 hover:text-white hover:bg-gray-900 rounded-xl transition-all duration-200 group"
                            title="登出"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            
                            {/* Tooltip */}
                            <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                登出
                            </div>
                        </button>
                    </div>
                </div>

                {/* 🔥 主要內容區域 */}
                <div className="flex-1 ml-20">
                    <div className="max-w-2xl mx-auto">
                        {children}
                    </div>
                </div>

                {/* 🔥 右側推薦區域（可選） */}
                <div className="hidden xl:block w-80 p-6">
                    <div className="sticky top-6">
                        {/* 🔔 通知摘要 */}
                        {unreadCount > 0 && (
                            <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-2xl p-4 mb-6 border border-blue-500/20">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-bold text-white">🔔 新通知</h3>
                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                        {unreadCount}
                                    </span>
                                </div>
                                <p className="text-gray-300 text-sm mb-3">
                                    您有 {unreadCount} 個未讀通知
                                </p>
                                <button
                                    onClick={() => navigate('/notifications')}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                                >
                                    查看通知
                                </button>
                            </div>
                        )}

                        {/* 推薦用戶 */}
                        <div className="bg-gray-900 rounded-2xl p-6 mb-6">
                            <h3 className="text-xl font-bold mb-4">推薦追蹤</h3>
                            <div className="space-y-3">
                                <div className="text-gray-400 text-sm">
                                    即將推出推薦功能...
                                </div>
                            </div>
                        </div>

                        {/* 趨勢話題 */}
                        <div className="bg-gray-900 rounded-2xl p-6">
                            <h3 className="text-xl font-bold mb-4">熱門話題</h3>
                            <div className="space-y-3">
                                <div className="text-gray-400 text-sm">
                                    即將推出熱門話題...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModernLayout;