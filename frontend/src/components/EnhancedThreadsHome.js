// frontend/src/pages/EnhancedThreadsHome.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout';
import EnhancedPostComposer from '../components/EnhancedPostComposer';
import EnhancedPostCard from '../components/EnhancedPostCard';
import { getPosts } from '../services/postService'; // 🔧 加入真實 API

const EnhancedThreadsHome = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); // 🔧 加入錯誤處理

    // 🔧 使用真實 API 載入貼文
    useEffect(() => {
        const loadPosts = async () => {
            setLoading(true);
            setError('');
            
            try {
                console.log('🔍 Loading posts from API...');
                const result = await getPosts({ page: 1, limit: 20 });
                
                if (result.success) {
                    console.log('✅ Posts loaded successfully:', result.data.posts);
                    console.log('📊 API Response:', result.data);
                    
                    // 🔧 檢查每個貼文的愛心狀態
                    result.data.posts?.forEach((post, index) => {
                        console.log(`🔍 Post ${index + 1}:`, {
                            id: post.id,
                            content: post.content?.substring(0, 30) + '...',
                            liked: post.liked,
                            likeCount: post.likeCount,
                            user: post.user?.username
                        });
                    });
                    
                    setPosts(result.data.posts || []);
                } else {
                    console.error('❌ Failed to load posts:', result.error);
                    setError(result.error || '載入貼文失敗');
                    // 🔧 失敗時使用少量模擬資料作為備用
                    setPosts(getFallbackPosts());
                }
            } catch (error) {
                console.error('💥 載入貼文異常:', error);
                setError('載入貼文時發生錯誤: ' + error.message);
                // 🔧 異常時使用備用資料
                setPosts(getFallbackPosts());
            } finally {
                setLoading(false);
            }
        };

        loadPosts();
    }, []);

    // 🔧 備用的模擬資料（只在 API 完全失敗時使用，且數據要合理）
    const getFallbackPosts = () => [
        {
            id: 'fallback-1',
            content: '⚠️ 無法連接到後端 API，這是備用資料。請檢查後端服務是否正常運行。',
            user: {
                id: 'fallback-user',
                username: 'system',
                displayName: 'System Message',
                userRole: 'admin'
            },
            likeCount: 0, // 🔧 使用合理的數字
            commentCount: 0,
            createdAt: new Date().toISOString(),
            liked: false
        }
    ];

    const handlePostCreated = (newPost) => {
        console.log('✅ New post created:', newPost);
        setPosts(prevPosts => [newPost, ...prevPosts]);
        // 🔧 清除錯誤狀態，因為發文功能正常
        if (error) {
            setError('');
        }
    };

    const handlePostUpdate = (updatedPost) => {
        console.log('🔄 Post updated:', updatedPost);
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === updatedPost.id ? updatedPost : post
            )
        );
    };

    return (
        <MainLayout>
            <div className="min-h-screen bg-white">
                {/* 頂部區域 */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10">
                    <div className="px-4 py-3">
                        <h1 className="text-xl font-bold text-gray-900">首頁</h1>
                        {/* 🔧 顯示當前用戶資訊和 API 狀態 */}
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-500">
                                歡迎，{user?.displayName || user?.username}
                            </span>
                            <span className={`inline-block w-2 h-2 rounded-full ${error ? 'bg-red-400' : 'bg-green-400'}`}></span>
                            <span className="text-xs text-gray-400">
                                {error ? 'API 連接異常' : 'API 連接正常'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 🔧 錯誤提示 */}
                {error && (
                    <div className="mx-4 mt-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span>{error}</span>
                            </div>
                            <button
                                onClick={() => window.location.reload()}
                                className="ml-2 px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                            >
                                重新載入
                            </button>
                        </div>
                    </div>
                )}

                {/* 發布貼文 */}
                <EnhancedPostComposer onPostCreated={handlePostCreated} />

                {/* 時間線 */}
                <div className="divide-y divide-gray-100">
                    {loading ? (
                        // 載入中狀態 - 更精緻的骨架屏
                        <div>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="px-4 py-4 animate-pulse">
                                    <div className="flex space-x-3">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                                                <div className="h-4 bg-gray-200 rounded w-16"></div>
                                                <div className="h-4 bg-gray-200 rounded w-12"></div>
                                            </div>
                                            <div className="space-y-2 mb-4">
                                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                            </div>
                                            <div className="flex space-x-6">
                                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : posts.length > 0 ? (
                        // 🔧 貼文列表 - 加入更新回調
                        posts.map((post) => (
                            <EnhancedPostCard
                                key={post.id}
                                post={post}
                                currentUser={user}
                                onPostUpdate={handlePostUpdate} // 🔧 加入這個
                            />
                        ))
                    ) : (
                        // 空狀態
                        <div className="px-4 py-16 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {error ? '暫時無法載入貼文' : '還沒有任何貼文'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {error ? '請檢查網路連接或聯繫管理員' : '開始發布你的第一篇貼文吧！'}
                            </p>
                            <div className="flex justify-center space-x-4">
                                <button 
                                    onClick={() => document.querySelector('textarea')?.focus()}
                                    className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                                >
                                    發布貼文
                                </button>
                                {error && (
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
                                    >
                                        重新載入
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 載入更多 */}
                {!loading && posts.length > 0 && !error && (
                    <div className="px-4 py-8 text-center border-t border-gray-100">
                        <button className="px-8 py-3 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors font-medium">
                            載入更多貼文
                        </button>
                    </div>
                )}

                {/* 底部間距 */}
                <div className="h-16 lg:h-0"></div>
            </div>
        </MainLayout>
    );
};

export default EnhancedThreadsHome;