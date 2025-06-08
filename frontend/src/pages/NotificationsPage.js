// frontend/src/pages/NotificationsPage.js
import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationsAsRead, markAllNotificationsAsRead } from '../services/notificationService';
import ModernLayout from '../components/ModernLayout';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'
    const [markingAsRead, setMarkingAsRead] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, [filter]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const result = await getNotifications({
                page: 1,
                limit: 50,
                unreadOnly: filter === 'unread'
            });

            if (result.success) {
                setNotifications(result.data.data.notifications);
                setUnreadCount(result.data.data.unreadCount);
            } else {
                console.error('載入通知失敗:', result.error);
            }
        } catch (error) {
            console.error('載入通知錯誤:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        const result = await markNotificationsAsRead([notificationId]);
        if (result.success) {
            loadNotifications(); // 重新載入
        }
    };

    const handleMarkAllAsRead = async () => {
        if (markingAsRead) return;
        
        setMarkingAsRead(true);
        try {
            const result = await markAllNotificationsAsRead();
            if (result.success) {
                loadNotifications(); // 重新載入
            }
        } catch (error) {
            console.error('標記所有已讀錯誤:', error);
        } finally {
            setMarkingAsRead(false);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'follow':
                return '👥';
            case 'like':
                return '❤️';
            case 'comment':
                return '💬';
            case 'system':
                return '📢';
            default:
                return '🔔';
        }
    };

    const formatTimeAgo = (date) => {
        const now = new Date();
        const notificationDate = new Date(date);
        const diffInMs = now - notificationDate;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        
        if (diffInMinutes < 1) return '剛剛';
        if (diffInMinutes < 60) return `${diffInMinutes} 分鐘前`;
        if (diffInHours < 24) return `${diffInHours} 小時前`;
        if (diffInDays < 7) return `${diffInDays} 天前`;
        return notificationDate.toLocaleDateString();
    };

    return (
        <ModernLayout>
            <div className="min-h-screen bg-black">
                {/* 頁面標題 */}
                <div className="sticky top-0 bg-black bg-opacity-80 backdrop-blur-sm border-b border-gray-800 px-6 py-4 z-40">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold text-white">通知</h1>
                        {unreadCount > 0 && !markingAsRead && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                            >
                                全部標為已讀
                            </button>
                        )}
                        {markingAsRead && (
                            <div className="text-gray-400 text-sm">
                                標記中...
                            </div>
                        )}
                    </div>

                    {/* 篩選標籤 */}
                    <div className="flex space-x-1 bg-gray-900 rounded-full p-1">
                        <button
                            onClick={() => setFilter('all')}
                            className={`
                                flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                                ${filter === 'all' 
                                    ? 'bg-white text-black' 
                                    : 'text-gray-400 hover:text-white'}
                            `}
                        >
                            全部
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`
                                flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 relative
                                ${filter === 'unread' 
                                    ? 'bg-red-500 text-white' 
                                    : 'text-gray-400 hover:text-white'}
                            `}
                        >
                            未讀 {unreadCount > 0 && <span className="ml-1">({unreadCount})</span>}
                        </button>
                    </div>
                </div>

                {/* 通知列表 */}
                <div className="pb-20">
                    {loading ? (
                        <div className="space-y-4 px-6 py-8">
                            {[...Array(5)].map((_, index) => (
                                <div key={index} className="animate-pulse flex space-x-4 p-4">
                                    <div className="w-12 h-12 bg-gray-800 rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="divide-y divide-gray-800">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`
                                        px-6 py-4 hover:bg-gray-900 transition-colors cursor-pointer
                                        ${!notification.isRead ? 'bg-gray-950 border-l-4 border-l-blue-500' : ''}
                                    `}
                                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                                >
                                    <div className="flex items-start space-x-4">
                                        {/* 通知圖標 */}
                                        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                                            {notification.fromUser ? (
                                                <div className={`w-full h-full rounded-full flex items-center justify-center text-white font-semibold ${
                                                    notification.fromUser.userRole === 'admin' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                                                    notification.fromUser.userRole === 'verified' ? 'bg-gradient-to-br from-blue-500 to-purple-500' :
                                                    'bg-gradient-to-br from-green-500 to-blue-500'
                                                }`}>
                                                    {notification.fromUser.displayName?.[0]?.toUpperCase() || notification.fromUser.username?.[0]?.toUpperCase()}
                                                </div>
                                            ) : (
                                                <span>{getNotificationIcon(notification.type)}</span>
                                            )}
                                        </div>

                                        {/* 通知內容 */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-1">
                                                <p className="text-white font-medium">
                                                    {notification.title}
                                                </p>
                                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </span>
                                            </div>
                                            
                                            {notification.content && (
                                                <p className="text-gray-400 text-sm mt-1">
                                                    {notification.content}
                                                </p>
                                            )}

                                            {/* 發送者資訊 */}
                                            {notification.fromUser && (
                                                <div className="flex items-center mt-2 space-x-2">
                                                    <span className="text-xs text-gray-500">來自</span>
                                                    <span className="text-xs text-blue-400">
                                                        @{notification.fromUser.username}
                                                    </span>
                                                    {notification.fromUser.verified && (
                                                        <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                            )}

                                            {/* 未讀指示器 */}
                                            {!notification.isRead && (
                                                <div className="flex items-center mt-2">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                                    <span className="text-xs text-blue-400">未讀</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 px-6">
                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-2xl">🔔</span>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {filter === 'unread' ? '沒有未讀通知' : '還沒有通知'}
                            </h3>
                            <p className="text-gray-400">
                                {filter === 'unread' 
                                    ? '所有通知都已讀取完畢' 
                                    : '當有人按讚、評論或追蹤您時，通知會出現在這裡'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </ModernLayout>
    );
};

export default NotificationsPage;