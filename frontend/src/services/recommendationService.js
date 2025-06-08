// frontend/src/services/recommendationService.js - 修復版本
import api from './api';

/**
 * 獲取推薦貼文
 * @param {number} page - 頁碼
 * @param {number} limit - 每頁數量
 */
export const getRecommendedPosts = async (page = 1, limit = 20) => {
    try {
        console.log(`🎯 獲取推薦貼文 - 頁面: ${page}, 數量: ${limit}`);
        
        const response = await api.get('/recommendations/posts', {
            params: { page, limit }
        });

        console.log('🔍 推薦API完整回應:', response.data);

        if (response.data.success) {
            // 🔥 修復：確保使用正確的數據路徑
            const posts = response.data.posts || [];
            console.log(`✅ 成功獲取 ${posts.length} 篇推薦貼文`);
            
            // 🔥 確保分數數據正確傳遞
            const postsWithScores = posts.map(post => ({
                ...post,
                debugScore: post.debugScore || post.recommendationScore || 0,
                // 🔥 確保用戶資料完整
                user: {
                    ...post.user,
                    userRole: post.user?.userRole || 'regular',
                    verified: post.user?.verified || false
                },
                // 🔥 確保互動數據完整
                likesCount: post.likes || post.likesCount || 0,
                commentsCount: post.commentsCount || 0,
                isLikedByUser: post.isLikedByUser || false
            }));
            
            console.log('📊 推薦算法統計:', response.data.debug?.stats);
            console.log('🎯 前3篇貼文分數:', postsWithScores.slice(0, 3).map(p => ({
                id: p.id,
                username: p.user?.username,
                score: p.debugScore
            })));
            
            return {
                success: true,
                posts: postsWithScores,
                pagination: response.data.pagination,
                algorithm: response.data.algorithm,
                debug: response.data.debug
            };
        }
        
        throw new Error(response.data.error || '獲取推薦貼文失敗');
        
    } catch (error) {
        console.error('❌ 推薦貼文服務錯誤:', error);
        console.error('❌ 錯誤詳情:', error.response?.data);
        return {
            success: false,
            error: error.response?.data?.error || error.message || '推薦系統暫時無法使用',
            posts: []
        };
    }
};

/**
 * 獲取用戶興趣分析
 */
export const getUserInterests = async () => {
    try {
        console.log('🧠 獲取用戶興趣分析...');
        
        const response = await api.get('/recommendations/interests');

        console.log('🔍 興趣分析API回應:', response.data);

        if (response.data.success) {
            console.log('✅ 成功獲取興趣分析:', response.data.data);
            return {
                success: true,
                interests: response.data.data
            };
        }
        
        throw new Error(response.data.error || '獲取興趣分析失敗');
        
    } catch (error) {
        console.error('❌ 興趣分析服務錯誤:', error);
        return {
            success: false,
            error: error.response?.data?.error || error.message || '興趣分析暫時無法使用'
        };
    }
};

/**
 * 獲取熱門話題
 */
export const getTrendingPosts = async () => {
    try {
        console.log('🔥 獲取熱門話題...');
        
        const response = await api.get('/recommendations/trending');

        if (response.data.success) {
            // 🔥 修復：根據實際API結構調整
            const posts = response.data.data || response.data.posts || [];
            console.log(`✅ 成功獲取 ${posts.length} 篇熱門貼文`);
            return {
                success: true,
                posts: posts,
                meta: response.data.meta
            };
        }
        
        throw new Error(response.data.error || '獲取熱門話題失敗');
        
    } catch (error) {
        console.error('❌ 熱門話題服務錯誤:', error);
        return {
            success: false,
            error: error.response?.data?.error || error.message || '熱門話題暫時無法使用',
            posts: []
        };
    }
};

/**
 * 模擬點擊事件 (用於改善推薦)
 * @param {string} postId - 貼文ID
 * @param {string} action - 動作類型 ('view', 'like', 'comment', 'share')
 */
export const trackUserInteraction = async (postId, action) => {
    try {
        // 這裡可以記錄用戶行為，用於改善推薦算法
        console.log(`📊 記錄用戶互動: ${action} on ${postId}`);
        
        // 未來可以發送到分析服務
        // await api.post('/analytics/interaction', { postId, action });
        
        return { success: true };
    } catch (error) {
        console.error('❌ 互動追蹤錯誤:', error);
        return { success: false };
    }
};