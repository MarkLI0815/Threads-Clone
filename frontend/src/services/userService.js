// frontend/src/services/userService.js - 增強版包含統計刷新
import api from './api';

// 獲取用戶檔案
export const getUserProfile = async (userId) => {
    try {
        console.log('userService: Getting user profile:', userId);
        const response = await api.get(`/users/${userId}/profile`);
        console.log('userService: Get user profile success:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('userService: Get user profile error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '獲取用戶檔案失敗'
        };
    }
};

// 更新用戶檔案
export const updateUserProfile = async (profileData) => {
    try {
        console.log('userService: Updating user profile:', profileData);
        const response = await api.put('/users/profile', profileData);
        console.log('userService: Update user profile success:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('userService: Update user profile error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '更新檔案失敗'
        };
    }
};

// 獲取當前用戶檔案
export const getCurrentUserProfile = async () => {
    try {
        console.log('userService: Getting current user profile');
        const response = await api.get('/users/me');
        console.log('userService: Get current user profile success:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('userService: Get current user profile error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '獲取檔案失敗'
        };
    }
};

// 🔥 強制刷新用戶統計
export const forceRefreshUserStats = async (userId = null) => {
    try {
        console.log('userService: Force refreshing user stats:', userId);
        
        // 如果提供了用戶ID，刷新指定用戶；否則刷新當前用戶
        const url = userId ? `/users/${userId}/stats/refresh` : '/users/stats/refresh';
        const response = await api.post(url);
        
        console.log('userService: Force refresh stats success:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('userService: Force refresh stats error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '刷新統計失敗'
        };
    }
};

// 🔥 同步所有用戶統計（管理員專用）
export const syncAllUserStats = async () => {
    try {
        console.log('userService: Syncing all user stats (admin only)');
        const response = await api.post('/users/stats/sync-all');
        console.log('userService: Sync all stats success:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('userService: Sync all stats error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '同步所有統計失敗'
        };
    }
};

// 🔥 測試用戶統計
export const testUserStats = async (userId) => {
    try {
        console.log('userService: Testing user stats:', userId);
        const response = await api.get(`/users/${userId}/stats/test`);
        console.log('userService: Test stats success:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('userService: Test stats error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '測試統計失敗'
        };
    }
};