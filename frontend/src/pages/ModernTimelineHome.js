// frontend/src/pages/ModernTimelineHome.js - 合併版完整功能
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ModernLayout from '../components/ModernLayout';
import ModernPostCard from '../components/ModernPostCard';
import ModernPostComposer from '../components/ModernPostComposer';
import { getPosts, getTrendingPosts } from '../services/postService';
import { getRecommendedPosts } from '../services/recommendationService'; // 🔥 新增推薦服務

const ModernTimelineHome = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]); // 🔥 確保初始化為空陣列
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedType, setFeedType] = useState('all'); // 'all', 'following', 'recommendations'
    const [refreshing, setRefreshing] = useState(false);
    const [recommendationStats, setRecommendationStats] = useState(null); // 🔥 推薦統計

    // 🔥 載入推薦貼文 - 修復版本
    const loadRecommendedPosts = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            setError('');

            console.log('🎯 載入推薦貼文...');

            const result = await getRecommendedPosts(1, 50); // 第一頁，50篇

            console.log('📡 推薦 API 完整回應:', result);

            if (result.success) {
                const postsData = Array.isArray(result.posts) ? result.posts : [];
                console.log(`✅ 成功載入 ${postsData.length} 篇推薦貼文`);

                // 🔥 確保每個貼文都有分數數據
                const postsWithValidScores = postsData.map((post, index) => ({
                    ...post,
                    debugScore: post.debugScore || post.recommendationScore || (100 - index * 2), // 🔥 確保有分數顯示
                    // 🔥 確保用戶資料格式正確
                    user: {
                        ...post.user,
                        userRole: post.user?.userRole || 'regular',
                        verified: post.user?.verified || false,
                        displayName: post.user?.displayName || post.user?.username
                    }
                }));

                setPosts(postsWithValidScores);

                // 🔥 設定推薦統計資訊
                setRecommendationStats({
                    algorithm: result.algorithm || { version: '2.2-fixed' },
                    debug: result.debug || {
                        stats: {
                            totalScored: postsWithValidScores.length,
                            followingPosts: 0,
                            verifiedPosts: postsWithValidScores.filter(p => p.user?.verified || p.user?.userRole === 'verified').length,
                            avgScore: postsWithValidScores.length > 0 ?
                                postsWithValidScores.reduce((sum, p) => sum + (p.debugScore || 0), 0) / postsWithValidScores.length : 0
                        }
                    }
                });

                console.log('📊 推薦統計設定完成:', {
                    totalPosts: postsWithValidScores.length,
                    hasScores: postsWithValidScores.filter(p => p.debugScore > 0).length,
                    topScores: postsWithValidScores.slice(0, 3).map(p => p.debugScore)
                });
            } else {
                console.error('❌ 載入推薦貼文失敗:', result.error);
                setError(result.error || '載入推薦貼文失敗');
                setPosts([]);
                setRecommendationStats(null);
            }
        } catch (err) {
            console.error('❌ 載入推薦貼文異常:', err);
            setError('網路錯誤，請稍後再試');
            setPosts([]);
            setRecommendationStats(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // 🔥 載入一般貼文（全部、追蹤）
    const loadGeneralPosts = useCallback(async (feedTypeParam, showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            setError('');

            console.log('🔄 載入貼文...', { feedType: feedTypeParam });

            let result;

            // 🔥 根據不同類型載入不同的貼文
            switch (feedTypeParam) {
                case 'following':
                    // 載入追蹤用戶的貼文
                    result = await getPosts({
                        page: 1,
                        limit: 50,
                        feedType: 'following'
                    });
                    break;

                case 'trending':
                    // 載入推薦/熱門貼文
                    result = await getTrendingPosts({
                        limit: 50,
                        timeRange: '24h'
                    });
                    break;

                case 'all':
                default:
                    // 載入所有貼文
                    result = await getPosts({
                        page: 1,
                        limit: 50,
                        feedType: 'all'
                    });
                    break;
            }

            console.log('📡 API 回應:', result);

            if (result.success) {
                // 🔥 安全檢查：確保 data 是陣列
                let postsData = [];

                if (feedTypeParam === 'trending') {
                    // 熱門貼文的回應格式可能不同
                    postsData = Array.isArray(result.data) ? result.data : [];
                } else {
                    // 一般貼文
                    postsData = Array.isArray(result.data) ? result.data :
                        Array.isArray(result.data?.posts) ? result.data.posts : [];
                }

                console.log(`✅ 成功載入 ${postsData.length} 篇貼文 (${feedTypeParam})`);
                setPosts(postsData);
                setRecommendationStats(null); // 清除推薦統計
            } else {
                console.error('❌ 載入貼文失敗:', result.error);
                setError(result.error || '載入貼文失敗');
                setPosts([]);
            }
        } catch (err) {
            console.error('❌ 載入貼文異常:', err);
            setError('網路錯誤，請稍後再試');
            setPosts([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // 🔥 統一的載入函數
    const loadPosts = useCallback((showLoading = true) => {
        console.log(`🔄 載入貼文: ${feedType}`);

        if (feedType === 'recommendations') {
            return loadRecommendedPosts(showLoading);
        } else {
            return loadGeneralPosts(feedType, showLoading);
        }
    }, [feedType, loadRecommendedPosts, loadGeneralPosts]);

    // 🔥 修復：當 feedType 變化時重新載入
    useEffect(() => {
        console.log('🔄 feedType 變化，重新載入貼文:', feedType);
        loadPosts(true);
    }, [feedType, loadPosts]);

    // 重新整理
    const handleRefresh = async () => {
        setRefreshing(true);
        await loadPosts(false);
    };

    // 🔥 修復：動態類型切換處理
    const handleFeedTypeChange = (newType) => {
        console.log(`🔄 切換動態類型: ${feedType} → ${newType}`);
        setFeedType(newType);
        setRecommendationStats(null); // 清除之前的推薦統計
        // loadPosts 會由 useEffect 觸發
    };

    // 新貼文建立成功後的回調
    const handlePostCreated = (newPost) => {
        console.log('📝 新貼文建立:', newPost);
        // 🔥 安全地添加新貼文到列表開頭
        setPosts(prevPosts => {
            const currentPosts = Array.isArray(prevPosts) ? prevPosts : [];
            return [newPost, ...currentPosts];
        });
    };

    const handlePostDeleted = useCallback((deletedPostId) => {
        console.log('🗑️ 父組件收到刪除通知 - ID:', deletedPostId, '類型:', typeof deletedPostId);
        console.log('📋 當前貼文數量:', posts?.length);
        console.log('📋 當前貼文IDs:', posts?.map(p => `${p.id}(${typeof p.id})`));

        // 🔥 強制重新載入貼文（備用方案）
        const forceReload = () => {
            console.log('🔄 強制重新載入貼文');
            loadPosts(false);
        };

        // 🔥 嘗試即時更新
        setPosts(prevPosts => {
            if (!Array.isArray(prevPosts)) {
                console.error('❌ prevPosts 不是陣列:', prevPosts);
                forceReload();
                return prevPosts;
            }

            // 🔥 支援字串和數字ID比較
            const updatedPosts = prevPosts.filter(post => {
                const match = String(post.id) === String(deletedPostId);
                return !match; // 保留不匹配的（即不是要刪除的）
            });

            console.log('✅ 即時更新結果:', {
                原本數量: prevPosts.length,
                更新後數量: updatedPosts.length,
                成功移除: prevPosts.length > updatedPosts.length
            });

            // 🔥 如果沒有成功移除，使用備用方案
            if (prevPosts.length === updatedPosts.length) {
                console.warn('⚠️ 即時更新失敗，1秒後重新載入');
                setTimeout(forceReload, 1000);
            }

            return updatedPosts;
        });
    }, [posts, loadPosts]); // 🔥 添加必要的依賴


    // 按讚狀態變更回調
    const handleLikeChange = (postId, newLikeState) => {
        console.log('👍 按讚狀態變更:', { postId, newLikeState });
        // 🔥 安全地更新貼文的按讚狀態
        setPosts(prevPosts => {
            if (!Array.isArray(prevPosts)) return [];

            return prevPosts.map(post => {
                if (post && post.id === postId) {
                    return {
                        ...post,
                        isLikedByUser: newLikeState.isLiked,
                        likesCount: newLikeState.likesCount || post.likesCount || 0
                    };
                }
                return post;
            });
        });
    };

    const handleInteraction = useCallback(() => {
        // 可以選擇重新載入貼文或其他處理
        console.log('📝 貼文互動發生');
    }, []);

    // 評論新增回調
    const handleCommentAdded = (postId, newComment) => {
        console.log('💬 新評論添加:', { postId, newComment });
        // 🔥 安全地更新貼文的評論
        setPosts(prevPosts => {
            if (!Array.isArray(prevPosts)) return [];

            return prevPosts.map(post => {
                if (post && post.id === postId) {
                    const currentComments = Array.isArray(post.comments) ? post.comments : [];
                    return {
                        ...post,
                        comments: [...currentComments, newComment],
                        commentsCount: (post.commentsCount || 0) + 1
                    };
                }
                return post;
            });
        });
    };

    // 🔥 獲取時間線描述
    const getTimelineDescription = () => {
        switch (feedType) {
            case 'all':
                return '顯示所有用戶的最新貼文';
            case 'following':
                return '只顯示您追蹤用戶的動態';
            case 'recommendations':
                return '根據熱門度和您的興趣推薦內容';
            default:
                return '';
        }
    };

    // 載入狀態
    if (loading && !refreshing) {
        return (
            <ModernLayout>
                <div className="min-h-screen bg-black">
                    {/* 載入中的骨架屏 */}
                    <div className="max-w-2xl mx-auto px-4 py-6">
                        {/* 頂部骨架 */}
                        <div className="sticky top-0 bg-black bg-opacity-80 backdrop-blur-sm z-10 pb-4 mb-6">
                            <div className="h-8 bg-gray-800 rounded w-1/3 mb-4 animate-pulse"></div>
                            <div className="flex space-x-1">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex-1 h-12 bg-gray-800 rounded-full animate-pulse"></div>
                                ))}
                            </div>
                        </div>

                        {/* 發布框骨架 */}
                        <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800">
                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-gray-800 rounded-full animate-pulse"></div>
                                <div className="flex-1">
                                    <div className="h-16 bg-gray-800 rounded-lg animate-pulse mb-4"></div>
                                    <div className="h-10 bg-gray-800 rounded-lg w-20 animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        {/* 貼文骨架 */}
                        {[...Array(3)].map((_, index) => (
                            <div key={index} className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800">
                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 bg-gray-800 rounded-full animate-pulse"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-800 rounded w-1/3 mb-2 animate-pulse"></div>
                                        <div className="h-16 bg-gray-800 rounded mb-4 animate-pulse"></div>
                                        <div className="flex space-x-6">
                                            <div className="h-6 bg-gray-800 rounded w-16 animate-pulse"></div>
                                            <div className="h-6 bg-gray-800 rounded w-16 animate-pulse"></div>
                                            <div className="h-6 bg-gray-800 rounded w-16 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ModernLayout>
        );
    }

    return (
        <ModernLayout>
            <div className="min-h-screen bg-black">
                <div className="max-w-2xl mx-auto px-4 py-6">
                    {/* 🔥 頂部導航 - 合併版本 */}
                    <div className="sticky top-0 bg-black bg-opacity-80 backdrop-blur-sm z-10 pb-4 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-2xl font-bold text-white">
                                首頁
                            </h1>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-2 text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50"
                                title="重新整理"
                            >
                                <svg
                                    className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* 當前用戶信息 */}
                        {user && (
                            <div className="text-sm text-gray-400 mb-4">
                                歡迎回來，{user.displayName || user.username}！
                                <span className="ml-2 text-xs">
                                    姓名：張小明 | 學號：B12345678
                                </span>
                                {/* 🔥 用戶角色標誌 */}
                                <span className={`
                                    ml-3 px-2 py-1 rounded-full text-xs font-medium
                                    ${user?.userRole === 'admin' ? 'bg-red-500 text-white' :
                                        user?.userRole === 'verified' ? 'bg-blue-500 text-white' :
                                            'bg-green-500 text-white'}
                                `}>
                                    {user?.userRole === 'admin' ? '🛡️ 管理員' :
                                        user?.userRole === 'verified' ? '⭐ 認證用戶' : '👤 一般用戶'}
                                </span>
                            </div>
                        )}

                        {/* 🔥 動態類型選擇 - 合併版本 */}
                        <div className="flex space-x-1">
                            {[
                                { value: 'all', label: '全部', icon: '🌟', desc: '所有貼文' },
                                { value: 'following', label: '追蹤中', icon: '👥', desc: '追蹤用戶的動態' },
                                { value: 'recommendations', label: '推薦', icon: '🤖', desc: 'AI 推薦內容' }
                            ].map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => handleFeedTypeChange(type.value)}
                                    className={`relative flex-1 py-3 px-3 rounded-full text-sm font-medium transition-all duration-200 ${feedType === type.value
                                        ? (type.value === 'recommendations'
                                            ? ' from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                                            : 'bg-white text-black shadow-lg transform scale-105')
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                                        }`}
                                    title={type.desc}
                                    disabled={loading || refreshing}
                                >
                                    <span className="mr-2">{type.icon}</span>
                                    {type.label}
                                    {/* 🔥 選中狀態指示器 */}
                                    {feedType === type.value && type.value === 'recommendations' && (
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* 🔥 當前動態類型說明 */}
                        <div className="mt-3 text-xs text-gray-500 text-center">
                            {getTimelineDescription()}
                        </div>

                        {/* 🔥 推薦算法統計顯示 - 修復CSS */}
                        {feedType === 'recommendations' && recommendationStats && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl border border-purple-500/30 shadow-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-purple-400">🤖 AI 推薦引擎</span>
                                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                                            v{recommendationStats.algorithm?.version || '2.2'}
                                        </span>
                                    </div>
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                </div>

                                {recommendationStats.debug?.stats && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="text-center p-2 bg-black/30 rounded-lg">
                                            <div className="text-blue-400 font-bold text-lg">
                                                {recommendationStats.debug.stats.totalScored || 0}
                                            </div>
                                            <div className="text-gray-400 text-xs">總貼文</div>
                                        </div>
                                        <div className="text-center p-2 bg-black/30 rounded-lg">
                                            <div className="text-green-400 font-bold text-lg">
                                                {recommendationStats.debug.stats.followingPosts || 0}
                                            </div>
                                            <div className="text-gray-400 text-xs">追蹤用戶</div>
                                        </div>
                                        <div className="text-center p-2 bg-black/30 rounded-lg">
                                            <div className="text-yellow-400 font-bold text-lg">
                                                {recommendationStats.debug.stats.verifiedPosts || 0}
                                            </div>
                                            <div className="text-gray-400 text-xs">認證內容</div>
                                        </div>
                                        <div className="text-center p-2 bg-black/30 rounded-lg">
                                            <div className="text-red-400 font-bold text-lg">
                                                {(recommendationStats.debug.stats.avgScore || 0).toFixed(1)}
                                            </div>
                                            <div className="text-gray-400 text-xs">平均分數</div>
                                        </div>
                                    </div>
                                )}

                                {/* 🔥 新增算法說明 */}
                                <div className="mt-3 text-xs text-gray-500 text-center">
                                    追蹤用戶 70分 + 熱門度 20分 + 新鮮度 10分 + 角色加成
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 發布新貼文 */}
                    {user && (
                        <div className="mb-6">
                            <ModernPostComposer
                                onPostCreated={handlePostCreated}
                                currentUser={user}
                            />
                        </div>
                    )}

                    {/* 錯誤訊息 */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-2xl">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-red-200">{error}</span>
                                <button
                                    onClick={() => setError('')}
                                    className="ml-auto text-red-300 hover:text-red-100 transition-colors duration-200"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setError('');
                                    loadPosts();
                                }}
                                className="mt-3 px-4 py-2 bg-red-800 text-red-100 rounded-lg hover:bg-red-700 transition-colors duration-200"
                            >
                                重新載入
                            </button>
                        </div>
                    )}

                    {/* 🔥 正在載入指示器（刷新時顯示） */}
                    {refreshing && (
                        <div className="mb-6 p-4 bg-blue-900 border border-blue-700 rounded-2xl">
                            <div className="flex items-center">
                                <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mr-3 ${feedType === 'recommendations' ? 'border-purple-400' : 'border-blue-400'
                                    }`}></div>
                                <span className="text-blue-200">
                                    正在載入{feedType === 'all' ? '所有' :
                                        feedType === 'following' ? '追蹤' :
                                            feedType === 'recommendations' ? 'AI推薦' : ''}貼文...
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 貼文列表 */}
                    <div className="space-y-6">
                        {/* 🔥 安全檢查：確保 posts 是陣列且有內容 */}
                        {Array.isArray(posts) && posts.length > 0 ? (
                            posts.map((post, index) => {
                                // 🔥 安全檢查：確保 post 對象存在且有 id
                                if (!post || !post.id) {
                                    console.warn(`⚠️ 第 ${index} 個貼文資料無效:`, post);
                                    return null;
                                }

                                return (
                                    <div key={post.id} className="relative mb-6">
                                        <ModernPostCard
                                            post={post}
                                            currentUser={user}
                                            onLikeChange={handleLikeChange}
                                            onCommentAdded={handleCommentAdded}
                                            onPostDeleted={handlePostDeleted}  // 🔥 添加這一行
                                            onInteraction={handleInteraction}  // 🔥 添加這一行
                                            showRecommendationTag={feedType === 'recommendations' && index < 3}
                                        />

                                        {/* 🔥 推薦分數標籤 - 修復：放在 ModernPostCard 之後，確保正確定位 */}
                                        {feedType === 'recommendations' && post.debugScore && (
                                            <div className="absolute bottom-4 left-4  from-purple-600/95 to-pink-600/95 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full shadow-lg border border-purple-400/40 z-1">
                                                <div className="flex items-center space-x-1">
                                                    <svg className="w-3 h-3 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                    <span className="font-semibold text-xs">{post.debugScore.toFixed(1)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            /* 🔥 改進的空狀態 */
                            <div className="text-center py-12">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center">
                                    {feedType === 'following' ? (
                                        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center">
                                            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                    ) : feedType === 'recommendations' ? (
                                        <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center">
                                            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                                    {feedType === 'following' ? '還沒有追蹤的用戶動態' :
                                        feedType === 'recommendations' ? '正在學習您的偏好' :
                                            '還沒有貼文'}
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    {feedType === 'following'
                                        ? '去追蹤一些有趣的用戶，就能看到他們的動態了！'
                                        : feedType === 'recommendations'
                                            ? '追蹤一些用戶、按讚一些貼文，AI 就能為您推薦更符合興趣的內容！'
                                            : '成為第一個發布貼文的人吧！'
                                    }
                                </p>
                                <div className="space-x-3">
                                    <button
                                        onClick={handleRefresh}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200"
                                    >
                                        重新載入
                                    </button>
                                    {feedType !== 'all' && (
                                        <button
                                            onClick={() => handleFeedTypeChange('all')}
                                            className="px-6 py-3 bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600 transition-colors duration-200"
                                        >
                                            查看全部貼文
                                        </button>
                                    )}
                                    {feedType !== 'recommendations' && (
                                        <button
                                            onClick={() => handleFeedTypeChange('recommendations')}
                                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-colors duration-200"
                                        >
                                            🤖 嘗試 AI 推薦
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 載入更多 */}
                    {Array.isArray(posts) && posts.length > 0 && (
                        <div className="text-center py-8">
                            <button
                                onClick={() => loadPosts(false)}
                                disabled={refreshing}
                                className={`px-6 py-3 rounded-full transition-colors duration-200 disabled:opacity-50 ${feedType === 'recommendations'
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                {refreshing ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>載入中...</span>
                                    </div>
                                ) : (
                                    <span>
                                        {feedType === 'recommendations' ? '🤖 載入更多推薦' : '載入更多'}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </ModernLayout>
    );
};

export default ModernTimelineHome;