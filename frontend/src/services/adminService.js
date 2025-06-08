// frontend/src/services/adminService.js - 管理員功能服務
import api from './api';

// 📊 獲取系統統計
export const getSystemStats = async () => {
    try {
        console.log('adminService: Getting system stats');
        const response = await api.get('/admin/stats');
        console.log('adminService: System stats retrieved:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('adminService: Get system stats error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '獲取系統統計失敗'
        };
    }
};

// 📊 獲取管理員儀表板數據
export const getAdminDashboard = async () => {
    try {
        console.log('adminService: Getting admin dashboard');
        const response = await api.get('/admin/dashboard');
        console.log('adminService: Dashboard data retrieved:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('adminService: Get dashboard error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '載入管理員儀表板失敗'
        };
    }
};

// 👥 獲取用戶列表
export const getAllUsers = async (params = {}) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            role = '', 
            search = '', 
            sortBy = 'createdAt',
            sortOrder = 'DESC' 
        } = params;

        console.log('adminService: Getting all users with params:', params);
        
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sortBy,
            sortOrder
        });

        if (role) queryParams.append('role', role);
        if (search) queryParams.append('search', search);

        const response = await api.get(`/admin/users?${queryParams}`);
        console.log('adminService: Users retrieved:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('adminService: Get all users error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '獲取用戶列表失敗'
        };
    }
};

// ⚡ 變更用戶角色
export const changeUserRole = async (userId, newRole) => {
    try {
        console.log('adminService: Changing user role:', { userId, newRole });
        const response = await api.put(`/admin/users/${userId}/role`, { newRole });
        console.log('adminService: User role changed:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('adminService: Change user role error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '變更用戶角色失敗'
        };
    }
};

// 📱 獲取所有貼文（管理員視圖）
export const getAllPosts = async (params = {}) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            userId = '', 
            search = '', 
            sortBy = 'createdAt',
            sortOrder = 'DESC' 
        } = params;

        console.log('adminService: Getting all posts with params:', params);
        
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sortBy,
            sortOrder
        });

        if (userId) queryParams.append('userId', userId);
        if (search) queryParams.append('search', search);

        const response = await api.get(`/admin/posts?${queryParams}`);
        console.log('adminService: Posts retrieved:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('adminService: Get all posts error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '獲取貼文列表失敗'
        };
    }
};

// 🗑️ 刪除貼文
export const deletePost = async (postId, reason = '') => {
    try {
        console.log('adminService: Deleting post:', { postId, reason });
        const response = await api.delete(`/admin/posts/${postId}`, {
            data: { reason }
        });
        console.log('adminService: Post deleted:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('adminService: Delete post error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '刪除貼文失敗'
        };
    }
};

// 🔄 強制刷新所有統計
export const forceRefreshAllStats = async () => {
    try {
        console.log('adminService: Force refreshing all stats');
        const response = await api.post('/admin/stats/refresh');
        console.log('adminService: Stats refresh completed:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('adminService: Force refresh stats error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '刷新統計失敗'
        };
    }
};

// 🏥 系統健康檢查
export const getSystemHealth = async () => {
    try {
        console.log('adminService: Getting system health');
        const response = await api.get('/admin/health');
        console.log('adminService: System health retrieved:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('adminService: Get system health error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '系統健康檢查失敗'
        };
    }
};

// 📈 獲取用戶活動統計
export const getUserActivityStats = async (userId, timeRange = '7d') => {
    try {
        console.log('adminService: Getting user activity stats:', { userId, timeRange });
        
        // 使用現有的用戶檔案端點獲取詳細統計
        const response = await api.get(`/users/${userId}/profile`);
        
        if (response.data.success) {
            return { success: true, data: response.data.data };
        } else {
            throw new Error('獲取用戶統計失敗');
        }
    } catch (error) {
        console.error('adminService: Get user activity stats error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '獲取用戶活動統計失敗'
        };
    }
};

// 🔍 搜尋管理員功能
export const adminSearch = async (query, type = 'all') => {
    try {
        console.log('adminService: Admin search:', { query, type });
        
        const results = {};
        
        // 根據類型搜尋
        if (type === 'all' || type === 'users') {
            const userResult = await getAllUsers({ search: query, limit: 5 });
            if (userResult.success) {
                results.users = userResult.data.users;
            }
        }
        
        if (type === 'all' || type === 'posts') {
            const postResult = await getAllPosts({ search: query, limit: 5 });
            if (postResult.success) {
                results.posts = postResult.data.posts;
            }
        }
        
        return { success: true, data: results };
    } catch (error) {
        console.error('adminService: Admin search error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '管理員搜尋失敗'
        };
    }
};

// 📊 獲取用戶角色統計
export const getUserRoleStats = async () => {
    try {
        console.log('adminService: Getting user role stats');
        
        // 使用系統統計端點
        const statsResult = await getSystemStats();
        
        if (statsResult.success && statsResult.data.data) {
            const userDistribution = statsResult.data.data.userDistribution || {};
            return { 
                success: true, 
                data: {
                    regular: userDistribution.regular || 0,
                    verified: userDistribution.verified || 0,
                    admin: userDistribution.admin || 0,
                    total: Object.values(userDistribution).reduce((sum, count) => sum + count, 0)
                }
            };
        } else {
            throw new Error('獲取角色統計失敗');
        }
    } catch (error) {
        console.error('adminService: Get user role stats error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '獲取用戶角色統計失敗'
        };
    }
};

// 🎯 批量操作
export const batchUserOperation = async (userIds, operation, data = {}) => {
    try {
        console.log('adminService: Batch user operation:', { userIds, operation, data });
        
        // 目前實作單個操作，未來可以添加真正的批量端點
        const results = [];
        
        for (const userId of userIds) {
            try {
                let result;
                
                switch (operation) {
                    case 'changeRole':
                        result = await changeUserRole(userId, data.newRole);
                        break;
                    default:
                        throw new Error(`不支援的批量操作: ${operation}`);
                }
                
                results.push({
                    userId,
                    success: result.success,
                    data: result.data,
                    error: result.error
                });
            } catch (error) {
                results.push({
                    userId,
                    success: false,
                    error: error.message
                });
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        
        return {
            success: true,
            data: {
                results,
                summary: {
                    total: userIds.length,
                    successful: successCount,
                    failed: userIds.length - successCount
                }
            }
        };
    } catch (error) {
        console.error('adminService: Batch user operation error:', error);
        return {
            success: false,
            error: error.message || '批量操作失敗'
        };
    }
};

export default {
    getSystemStats,
    getAdminDashboard,
    getAllUsers,
    changeUserRole,
    getAllPosts,
    deletePost,
    forceRefreshAllStats,
    getSystemHealth,
    getUserActivityStats,
    adminSearch,
    getUserRoleStats,
    batchUserOperation
};