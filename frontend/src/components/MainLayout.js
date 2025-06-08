import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const MainLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('home');

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-500';
            case 'verified': return 'bg-blue-500';
            case 'regular': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const getRoleText = (role) => {
        switch (role) {
            case 'admin': return '管理員';
            case 'verified': return '認證用戶';
            case 'regular': return '一般用戶';
            default: return '用戶';
        }
    };

    const navigation = [
        { id: 'home', name: '首頁', icon: '🏠' },
        { id: 'search', name: '搜尋', icon: '🔍' },
        { id: 'notifications', name: '通知', icon: '🔔' },
        { id: 'profile', name: '個人檔案', icon: '👤' },
    ];

    if (user?.userRole === 'admin') {
        navigation.push({ id: 'admin', name: '管理面板', icon: '⚙️' });
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 頂部導航欄 */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Threads</h1>
                            <span className="ml-2 text-sm text-gray-500">智慧社交平台</span>
                        </div>

                        {/* 用戶資訊 */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">
                                        {user?.displayName?.charAt(0) || user?.username?.charAt(0)}
                                    </span>
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-sm font-medium text-gray-900">{user?.displayName || user?.username}</p>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getRoleColor(user?.userRole)}`}>
                                        {getRoleText(user?.userRole)}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="text-gray-500 hover:text-gray-700 text-sm"
                            >
                                登出
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto flex">
                {/* 左側導航 */}
                <nav className="hidden lg:block w-64 px-4 py-6">
                    <div className="space-y-1">
                        {navigation.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${activeTab === item.id
                                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <span className="text-xl mr-3">{item.icon}</span>
                                <span className="font-medium">{item.name}</span>
                            </button>
                        ))}
                    </div>
                </nav>

                {/* 主內容區域 */}
                <main className="flex-1 max-w-2xl">
                    {children}
                </main>

                {/* 右側推薦區域 */}
                <aside className="hidden xl:block w-80 px-4 py-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">推薦用戶</h3>
                        <div className="space-y-3">
                            {[
                                { name: 'Admin User', role: 'admin', username: '@admin' },
                                { name: 'Verified User', role: 'verified', username: '@verified' },
                                { name: 'Test User', role: 'regular', username: '@testuser' }
                            ].map((suggestedUser, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-medium text-gray-700">
                                                {suggestedUser.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{suggestedUser.name}</p>
                                            <p className="text-xs text-gray-500">{suggestedUser.username}</p>
                                        </div>
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                        追蹤
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                        <h3 className="font-semibold text-gray-900 mb-4">熱門話題</h3>
                        <div className="space-y-2">
                            {['#智慧社交平台', '#三種用戶角色', '#JWT認證', '#React開發'].map((topic, index) => (
                                <div key={index} className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm">
                                    {topic}
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>

            {/* 底部導航 (手機版) */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
                <div className="flex justify-around py-2">
                    {navigation.slice(0, 4).map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center py-2 px-3 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-500'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-xs mt-1">{item.name}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default MainLayout;