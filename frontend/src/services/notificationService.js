// frontend/src/services/notificationService.js
import api from './api';

// 獲取通知列表
export const getNotifications = async (params = {}) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = params;
        console.log('notificationService: Getting notifications:', { page, limit, unreadOnly });
        
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(unreadOnly && { unreadOnly: 'true' })
        });

        const response = await api.get(`/notifications?${queryParams}`);
        console.log('notificationService: Get notifications success:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('notificationService: Get notifications error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '獲取通知失敗'
        };
    }
};

// 獲取未讀通知數量
export const getUnreadCount = async () => {
    try {
        console.log('notificationService: Getting unread count');
        const response = await api.get('/notifications/unread-count');
        console.log('notificationService: Get unread count success:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('notificationService: Get unread count error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '獲取未讀通知數量失敗'
        };
    }
};

// 標記通知為已讀
export const markNotificationsAsRead = async (notificationIds) => {
    try {
        console.log('notificationService: Marking notifications as read:', notificationIds);
        const response = await api.patch('/notifications/read', { notificationIds });
        console.log('notificationService: Mark as read success:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('notificationService: Mark as read error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '標記通知已讀失敗'
        };
    }
};

// 標記所有通知為已讀
export const markAllNotificationsAsRead = async () => {
    try {
        console.log('notificationService: Marking all notifications as read');
        const response = await api.patch('/notifications/read-all');
        console.log('notificationService: Mark all as read success:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('notificationService: Mark all as read error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '標記所有通知已讀失敗'
        };
    }
};