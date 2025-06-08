// frontend/src/services/postService.js - 修復版本
import api from './api';

// 🔍 獲取貼文列表 - 支援不同類型
export const getPosts = async (params = {}) => {
    try {
        const { page = 1, limit = 50, feedType = 'all' } = params;
        
        console.log('postService: Getting posts with params:', { page, limit, feedType });
        
        let endpoint = '/posts';
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        // 🔥 根據不同的 feedType 使用不同的端點
        if (feedType === 'trending') {
            // 使用熱門貼文端點
            endpoint = '/posts/trending';
            queryParams.set('timeRange', '24h');
        } else if (feedType === 'following') {
            // 可以加入追蹤用戶篩選邏輯
            queryParams.set('feedType', 'following');
        }

        const response = await api.get(`${endpoint}?${queryParams}`);
        
        console.log('postService: Raw API response:', response.data);
        
        // 🔥 安全處理不同的回應格式
        let posts = [];
        
        if (response.data) {
            if (response.data.success && response.data.data) {
                // 新格式：{ success: true, data: { posts: [...] } } 或 { success: true, data: [...] }
                if (Array.isArray(response.data.data)) {
                    posts = response.data.data;
                } else if (response.data.data.posts && Array.isArray(response.data.data.posts)) {
                    posts = response.data.data.posts;
                } else {
                    posts = [];
                }
            } else if (Array.isArray(response.data)) {
                // 舊格式：直接是陣列
                posts = response.data;
            } else if (response.data.posts && Array.isArray(response.data.posts)) {
                // 其他格式：{ posts: [...] }
                posts = response.data.posts;
            } else {
                console.warn('postService: 未知的回應格式，使用空陣列');
                posts = [];
            }
        }
        
        console.log('postService: Processed posts:', { count: posts.length, sample: posts.slice(0, 1) });
        
        return {
            success: true,
            data: posts
        };
        
    } catch (error) {
        console.error('postService: Get posts error:', error);
        console.error('Error response:', error.response?.data);
        
        return {
            success: false,
            error: error.response?.data?.error || error.message || '獲取貼文失敗',
            data: [] // 🔥 確保即使錯誤也返回空陣列
        };
    }
};

// 🔥 建立新貼文
export const createPost = async (postData) => {
    try {
        console.log('postService: Creating post:', { ...postData, content: postData.content?.slice(0, 50) + '...' });
        
        const response = await api.post('/posts', postData);
        
        console.log('postService: Post created successfully:', response.data);
        
        // 安全處理創建回應
        let createdPost = null;
        if (response.data) {
            if (response.data.success && response.data.data) {
                createdPost = response.data.data;
            } else if (response.data.id) {
                createdPost = response.data;
            }
        }
        
        return {
            success: true,
            data: createdPost
        };
        
    } catch (error) {
        console.error('postService: Create post error:', error);
        
        return {
            success: false,
            error: error.response?.data?.error || error.message || '建立貼文失敗'
        };
    }
};

// 🔥 按讚/取消按讚
export const toggleLike = async (postId) => {
    try {
        console.log('postService: Toggling like for post:', postId);
        
        const response = await api.post(`/posts/${postId}/like`);
        
        console.log('postService: Like toggled successfully:', response.data);
        
        return {
            success: true,
            data: response.data
        };
        
    } catch (error) {
        console.error('postService: Toggle like error:', error);
        
        return {
            success: false,
            error: error.response?.data?.error || error.message || '按讚操作失敗'
        };
    }
};

// 🔥 新增評論
export const addComment = async (postId, content) => {
    try {
        console.log('postService: Adding comment to post:', postId);
        
        const response = await api.post(`/posts/${postId}/comments`, { content });
        
        console.log('postService: Comment added successfully:', response.data);
        
        return {
            success: true,
            data: response.data
        };
        
    } catch (error) {
        console.error('postService: Add comment error:', error);
        
        return {
            success: false,
            error: error.response?.data?.error || error.message || '新增評論失敗'
        };
    }
};

// 🔥 獲取特定貼文
export const getPost = async (postId) => {
    try {
        console.log('postService: Getting post:', postId);
        
        const response = await api.get(`/posts/${postId}`);
        
        console.log('postService: Post retrieved:', response.data);
        
        // 安全處理回應
        let post = null;
        
        if (response.data) {
            if (response.data.success && response.data.data) {
                post = response.data.data;
            } else if (response.data.id) {
                post = response.data;
            }
        }
        
        return {
            success: true,
            data: post
        };
        
    } catch (error) {
        console.error('postService: Get post error:', error);
        
        return {
            success: false,
            error: error.response?.data?.error || error.message || '獲取貼文失敗'
        };
    }
};

// 🔥 搜尋貼文
export const searchPosts = async (query, params = {}) => {
    try {
        const { page = 1, limit = 20 } = params;
        
        console.log('postService: Searching posts:', { query, page, limit });
        
        const queryParams = new URLSearchParams({
            q: query,
            page: page.toString(),
            limit: limit.toString()
        });

        const response = await api.get(`/posts/search?${queryParams}`);
        
        console.log('postService: Search results:', response.data);
        
        // 安全處理搜尋結果
        let posts = [];
        
        if (response.data) {
            if (response.data.success && response.data.data && response.data.data.posts) {
                posts = Array.isArray(response.data.data.posts) ? response.data.data.posts : [];
            } else if (response.data.posts && Array.isArray(response.data.posts)) {
                posts = response.data.posts;
            }
        }
        
        return {
            success: true,
            data: posts
        };
        
    } catch (error) {
        console.error('postService: Search posts error:', error);
        
        return {
            success: false,
            error: error.response?.data?.error || error.message || '搜尋貼文失敗',
            data: []
        };
    }
};

// 🔥 獲取熱門貼文
export const getTrendingPosts = async (params = {}) => {
    try {
        const { limit = 50, timeRange = '24h' } = params;
        
        console.log('postService: Getting trending posts:', { limit, timeRange });
        
        const queryParams = new URLSearchParams({
            limit: limit.toString(),
            timeRange
        });

        const response = await api.get(`/posts/trending?${queryParams}`);
        
        console.log('postService: Trending posts:', response.data);
        
        // 安全處理回應
        let posts = [];
        
        if (response.data) {
            if (response.data.success && response.data.data) {
                if (Array.isArray(response.data.data)) {
                    posts = response.data.data;
                } else if (response.data.data.posts && Array.isArray(response.data.data.posts)) {
                    posts = response.data.data.posts;
                }
            } else if (response.data.posts && Array.isArray(response.data.posts)) {
                posts = response.data.posts;
            }
        }
        
        return {
            success: true,
            data: posts
        };
        
    } catch (error) {
        console.error('postService: Get trending posts error:', error);
        
        return {
            success: false,
            error: error.response?.data?.error || error.message || '獲取熱門貼文失敗',
            data: []
        };
    }
};

// 🔥 更新貼文
export const updatePost = async (postId, updateData) => {
    try {
        console.log('postService: Updating post:', postId, updateData);
        
        const response = await api.put(`/posts/${postId}`, updateData);
        
        console.log('postService: Post updated successfully:', response.data);
        
        return {
            success: true,
            data: response.data
        };
        
    } catch (error) {
        console.error('postService: Update post error:', error);
        
        return {
            success: false,
            error: error.response?.data?.error || error.message || '更新貼文失敗'
        };
    }
};

// 🔥 刪除貼文
export const deletePost = async (postId) => {
    try {
        console.log('postService: Deleting post:', postId);
        
        const response = await api.delete(`/posts/${postId}`);
        
        console.log('postService: Post deleted successfully:', response.data);
        
        return {
            success: true,
            data: response.data
        };
        
    } catch (error) {
        console.error('postService: Delete post error:', error);
        
        return {
            success: false,
            error: error.response?.data?.error || error.message || '刪除貼文失敗'
        };
    }
};

// 🔥 別名函數 - 保持向後相容
export const togglePostLike = toggleLike;
export const addPostComment = addComment;

// 🔥 預設匯出
export default {
    getPosts,
    createPost,
    toggleLike,
    addComment,
    getPost,
    searchPosts,
    getTrendingPosts,
    updatePost,
    deletePost,
    togglePostLike,
    addPostComment
};