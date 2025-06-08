// frontend/src/services/followService.js - 修復搜尋功能
import api from './api';

// 追蹤用戶
export const followUser = async (userId) => {
    try {
        console.log('followService: Following user:', userId);
        const response = await api.post(`/users/${userId}/follow`);
        console.log('followService: Follow successful:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('followService: Follow error:', error);
        console.error('Error response:', error.response?.data);
        return {
            success: false,
            error: error.response?.data?.error || '追蹤失敗'
        };
    }
};

// 取消追蹤用戶
export const unfollowUser = async (userId) => {
    try {
        console.log('followService: Unfollowing user:', userId);
        const response = await api.post(`/users/${userId}/follow`); // 🔥 修復：統一使用 POST
        console.log('followService: Unfollow successful:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('followService: Unfollow error:', error);
        console.error('Error response:', error.response?.data);
        return {
            success: false,
            error: error.response?.data?.error || '取消追蹤失敗'
        };
    }
};

// 獲取用戶資料（包含追蹤狀態）
export const getUserProfile = async (userId) => {
    try {
        console.log('followService: Getting user profile:', userId);
        const response = await api.get(`/users/${userId}/profile`); // 🔥 修復：使用正確端點
        console.log('followService: User profile retrieved:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('followService: Get user profile error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '獲取用戶資料失敗'
        };
    }
};

// 獲取追蹤列表（我追蹤的人）
export const getFollowing = async (userId, params = {}) => {
    try {
        const { page = 1, limit = 20 } = params;
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        console.log('followService: Getting following list for user:', userId);
        const response = await api.get(`/users/${userId}/following?${queryParams}`);
        console.log('followService: Following list retrieved:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('followService: Get following error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '獲取追蹤列表失敗'
        };
    }
};

// 獲取粉絲列表（追蹤我的人）
export const getFollowers = async (userId, params = {}) => {
    try {
        const { page = 1, limit = 20 } = params;
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        console.log('followService: Getting followers list for user:', userId);
        const response = await api.get(`/users/${userId}/followers?${queryParams}`);
        console.log('followService: Followers list retrieved:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('followService: Get followers error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '獲取粉絲列表失敗'
        };
    }
};

// 🔥 修復搜尋用戶 - 使用正確的 API 端點
export const searchUsers = async (query, params = {}) => {
    try {
        const { page = 1, limit = 10 } = params;
        
        console.log('followService: Searching users with query:', query);
        
        // 🔥 修復：使用正確的端點格式
        const response = await api.get('/users/search', {
            params: {
                q: query,
                page,
                limit
            }
        });
        
        console.log('followService: User search results:', response.data);
        
        // 🔥 統一回應格式
        if (response.data && response.data.users) {
            return { 
                success: true, 
                data: { 
                    users: response.data.users 
                } 
            };
        } else {
            return { 
                success: true, 
                data: { 
                    users: response.data || [] 
                } 
            };
        }
    } catch (error) {
        console.error('followService: Search users error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '搜尋用戶失敗',
            data: { users: [] }
        };
    }
};

// 🔥 修復獲取推薦用戶 - 使用推薦算法端點
export const getRecommendedUsers = async (params = {}) => {
    try {
        const { limit = 8 } = params;
        
        console.log('followService: Getting recommended users');
        
        // 🔥 修復：使用推薦算法端點
        const response = await api.get('/recommendations/users', {
            params: { limit }
        });
        
        console.log('followService: Recommended users retrieved:', response.data);
        
        // 🔥 統一回應格式
        if (response.data && response.data.success) {
            return { 
                success: true, 
                data: { 
                    users: response.data.data?.recommendedUsers || [] 
                } 
            };
        } else if (response.data && response.data.users) {
            return { 
                success: true, 
                data: { 
                    users: response.data.users 
                } 
            };
        } else {
            // 🔥 備用方案：如果推薦端點不可用，從搜尋獲取活躍用戶
            console.log('⚠️ 推薦端點不可用，使用備用方案...');
            return await getActiveUsers(limit);
        }
    } catch (error) {
        console.error('followService: Get recommended users error:', error);
        
        // 🔥 備用方案：如果推薦失敗，嘗試獲取活躍用戶
        console.log('⚠️ 推薦失敗，嘗試備用方案...');
        try {
            return await getActiveUsers(params.limit || 8);
        } catch (fallbackError) {
            console.error('followService: Fallback also failed:', fallbackError);
            return {
                success: false,
                error: error.response?.data?.error || '獲取推薦用戶失敗',
                data: { users: [] }
            };
        }
    }
};

// 🔥 新增：獲取活躍用戶作為推薦的備用方案
const getActiveUsers = async (limit = 8) => {
    try {
        console.log('followService: Getting active users as fallback');
        
        // 使用空搜尋獲取用戶列表（如果後端支援）
        const response = await api.get('/users/search', {
            params: {
                q: '',
                limit: limit
            }
        });
        
        if (response.data && response.data.users) {
            return { 
                success: true, 
                data: { 
                    users: response.data.users 
                } 
            };
        } else {
            return { 
                success: true, 
                data: { 
                    users: [] 
                } 
            };
        }
    } catch (error) {
        console.error('followService: Get active users fallback error:', error);
        return {
            success: false,
            error: '獲取活躍用戶失敗',
            data: { users: [] }
        };
    }
};

// 切換追蹤狀態（通用函數）
export const toggleUserFollow = async (userId, currentFollowState) => {
    if (currentFollowState) {
        return await unfollowUser(userId);
    } else {
        return await followUser(userId);
    }
};