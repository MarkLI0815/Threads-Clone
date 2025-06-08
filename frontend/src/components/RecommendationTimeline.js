// frontend/src/components/RecommendationTimeline.js - 智慧推薦時間線
import React, { useState, useEffect, useCallback } from 'react';
import { getRecommendedPosts, getUserInterests, trackUserInteraction } from '../services/recommendationService';
import ModernPostCard from './ModernPostCard';

const RecommendationTimeline = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [algorithm, setAlgorithm] = useState(null);
    const [interests, setInterests] = useState(null);
    const [showDebug, setShowDebug] = useState(false);

    // 載入推薦貼文
    const loadRecommendedPosts = useCallback(async (pageNum = 1, append = false) => {
        if (loading) return;

        setLoading(true);
        setError(null);

        try {
            const result = await getRecommendedPosts(pageNum, 10);

            if (result.success) {
                setPosts(prev => append ? [...prev, ...result.posts] : result.posts);
                setHasMore(result.pagination.hasMore);
                setAlgorithm(result.algorithm);

                // 記錄調試信息
                if (result.debug) {
                    console.log('🎯 推薦算法調試信息:', result.debug);
                }
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('載入推薦內容時發生錯誤');
        } finally {
            setLoading(false);
        }
    }, [loading]);

    // 載入用戶興趣分析
    const loadUserInterests = useCallback(async () => {
        const result = await getUserInterests();
        if (result.success) {
            setInterests(result.interests);
        }
    }, []);

    // 載入更多貼文
    const loadMore = useCallback(() => {
        if (hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadRecommendedPosts(nextPage, true);
        }
    }, [hasMore, loading, page, loadRecommendedPosts]);

    // 重新整理
    const refresh = useCallback(() => {
        setPage(1);
        loadRecommendedPosts(1, false);
        loadUserInterests();
    }, [loadRecommendedPosts, loadUserInterests]);

    // 處理貼文互動
    const handlePostInteraction = useCallback(async (postId, action) => {
        // 記錄用戶互動用於改善推薦
        await trackUserInteraction(postId, action);
    }, []);

    // 初始化
    useEffect(() => {
        loadRecommendedPosts(1, false);
        loadUserInterests();
    }, []);

    // 滾動到底部時自動載入更多
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop >=
                document.documentElement.offsetHeight - 1000) {
                loadMore();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMore]);

    return (
        <div className="max-w-2xl mx-auto bg-black text-white">
            {/* 推薦算法資訊區域 */}
            <div className="sticky top-0 bg-black/90 backdrop-blur-sm border-b border-gray-800 p-4 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">智慧推薦</h2>
                            <p className="text-xs text-gray-400">
                                AI 個人化內容推薦
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* 調試開關 */}
                        <button
                            onClick={() => setShowDebug(!showDebug)}
                            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded"
                        >
                            {showDebug ? '隱藏' : '顯示'} 調試
                        </button>

                        {/* 重新整理按鈕 */}
                        <button
                            onClick={refresh}
                            disabled={loading}
                            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                            title="重新整理推薦"
                        >
                            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 算法資訊顯示 */}
                {algorithm && showDebug && (
                    <div className="mt-3 p-3 bg-gray-900 rounded-lg text-xs">
                        <div className="flex items-center space-x-4">
                            <span className="text-purple-400">📊 推薦權重:</span>
                            <span className="text-blue-400">追蹤用戶 {algorithm.weights.following}</span>
                            <span className="text-red-400">熱門內容 {algorithm.weights.popularity}</span>
                            <span className="text-green-400">最新內容 {algorithm.weights.recency}</span>
                        </div>
                    </div>
                )}

                {/* 用戶興趣摘要 */}
                {interests && showDebug && (
                    <div className="mt-2 p-3 bg-gray-900 rounded-lg text-xs">
                        <div className="flex items-center space-x-4">
                            <span className="text-yellow-400">🧠 你的興趣:</span>
                            <span className="text-gray-300">
                                總互動 {interests.interests.totalInteractions} 次
                            </span>
                            {interests.interests.verifiedContent > 0 && (
                                <span className="text-blue-400">
                                    偏好認證內容 {interests.interests.verifiedContent} 次
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 錯誤訊息 */}
            {error && (
                <div className="mx-4 mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-red-300">{error}</span>
                    </div>
                </div>
            )}

            {/* 貼文列表 */}
            <div className="space-y-0">
                {posts.map((post, index) => (
                    <div key={post.id} className="relative">
                        {/* 推薦原因標籤 */}
                        {showDebug && post.debugScore && (
                            <div className="absolute top-2 right-2 z-10 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                                分數: {post.debugScore.toFixed(1)}
                            </div>
                        )}

                        <ModernPostCard
                            post={post}
                            onLike={() => handlePostInteraction(post.id, 'like')}
                            onComment={() => handlePostInteraction(post.id, 'comment')}
                            onView={() => handlePostInteraction(post.id, 'view')}
                            showRecommendationTag={index < 3} // 前3個顯示推薦標籤
                        />
                    </div>
                ))}
            </div>

            {/* 載入更多指示器 */}
            {loading && (
                <div className="flex justify-center py-8">
                    <div className="flex items-center space-x-2 text-gray-400">
                        <div className="w-4 h-4 border border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>正在載入推薦內容...</span>
                    </div>
                </div>
            )}

            {/* 沒有更多內容 */}
            {!hasMore && posts.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <p>你已經看完所有推薦內容了！</p>
                        <button
                            onClick={refresh}
                            className="text-purple-400 hover:text-purple-300 text-sm"
                        >
                            重新整理獲取新內容
                        </button>
                    </div>
                </div>
            )}

            {/* 空狀態 */}
            {!loading && posts.length === 0 && !error && (
                <div className="text-center py-16">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-300">開始建立你的個人化體驗</h3>
                        <p className="text-gray-500 max-w-md">
                            追蹤一些用戶、按讚一些貼文，我們的 AI 就能為你推薦更符合興趣的內容！
                        </p>
                        <button
                            onClick={refresh}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors"
                        >
                            重新載入
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecommendationTimeline;