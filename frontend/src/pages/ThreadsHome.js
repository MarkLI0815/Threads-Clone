// frontend/src/pages/ThreadsHome.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout';
import PostComposer from '../components/PostComposer';
import PostCard from '../components/PostCard';

const ThreadsHome = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // 模擬貼文資料 (之後會從 API 獲取)
    const mockPosts = [
        {
            id: 'post-1',
            content: '歡迎使用智慧社交平台！我是管理員，這裡展示三種用戶角色系統。管理員擁有最高權限，可以管理所有用戶和內容。',
            user: {
                id: 'admin-user-1',
                username: 'admin',
                displayName: 'Admin User',
                userRole: 'admin'
            },
            likeCount: 12,
            commentCount: 3,
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30分鐘前
            liked: false
        },
        {
            id: 'post-2',
            content: '我是認證用戶，享有特殊權限和優先推薦功能！認證用戶可以獲得更多曝光機會，內容會優先顯示給其他用戶。',
            user: {
                id: 'verified-user-1',
                username: 'verified',
                displayName: 'Verified User',
                userRole: 'verified'
            },
            likeCount: 8,
            commentCount: 2,
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1小時前
            liked: true
        },
        {
            id: 'post-3',
            content: '這是我的第一篇貼文！歡迎來到智慧社交平台！作為一般用戶，我可以使用基礎的社交功能，包括發布貼文、按讚和評論。',
            user: {
                id: 'test-user-1',
                username: 'testuser',
                displayName: 'Test User',
                userRole: 'regular'
            },
            likeCount: 5,
            commentCount: 1,
            createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2小時前
            liked: false
        }
    ];

    useEffect(() => {
        // 模擬 API 載入
        const loadPosts = async () => {
            setLoading(true);
            try {
                // 模擬網路延遲
                await new Promise(resolve => setTimeout(resolve, 1000));
                setPosts(mockPosts);
            } catch (error) {
                console.error('載入貼文失敗:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPosts();
    }, []);

    const handlePostCreated = (newPost) => {
        setPosts(prevPosts => [newPost, ...prevPosts]);
    };

    return (
        <MainLayout>
            <div className="py-6 px-4">
                {/* 頁面標題 */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">首頁</h2>
                    <p className="text-gray-600">歡迎回到智慧社交平台！</p>
                </div>

                {/* 發布貼文 */}
                <PostComposer onPostCreated={handlePostCreated} />

                {/* 時間線 */}
                <div className="space-y-4">
                    {loading ? (
                        // 載入中狀態
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                                    <div className="flex space-x-3">
                                        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                                            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                                            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : posts.length > 0 ? (
                        // 貼文列表
                        posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                currentUser={user}
                            />
                        ))
                    ) : (
                        // 空狀態
                        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                            <div className="text-4xl mb-4">📝</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">還沒有貼文</h3>
                            <p className="text-gray-500 mb-4">成為第一個分享想法的人！</p>
                        </div>
                    )}
                </div>

                {/* 載入更多 */}
                {!loading && posts.length > 0 && (
                    <div className="mt-8 text-center">
                        <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            載入更多貼文
                        </button>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default ThreadsHome;