// frontend/src/pages/SearchPage.js
import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { searchUsers, getRecommendedUsers } from '../services/followService';
import FollowButton from '../components/FollowButton';
import ModernLayout from '../components/ModernLayout';

const SearchPage = () => {
    const { user: currentUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [recommendedUsers, setRecommendedUsers] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [isLoadingRecommended, setIsLoadingRecommended] = useState(true);

    // 載入推薦用戶
    useEffect(() => {
        loadRecommendedUsers();
    }, []);

    const loadRecommendedUsers = async () => {
        setIsLoadingRecommended(true);
        try {
            const result = await getRecommendedUsers({ limit: 8 });
            if (result.success) {
                // 過濾掉當前用戶
                const filtered = result.data.users.filter(user => user.id !== currentUser?.id);
                setRecommendedUsers(filtered);
            }
        } catch (error) {
            console.error('Load recommended users error:', error);
        } finally {
            setIsLoadingRecommended(false);
        }
    };

    // 執行搜尋
    const handleSearch = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setHasSearched(false);
            return;
        }

        setIsSearching(true);
        setHasSearched(true);

        try {
            const result = await searchUsers(query.trim());
            if (result.success) {
                // 過濾掉當前用戶
                const filtered = result.data.users.filter(user => user.id !== currentUser?.id);
                setSearchResults(filtered);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // 搜尋輸入變化處理
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        
        // 延遲搜尋，避免過於頻繁的 API 呼叫
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            handleSearch(value);
        }, 300);
    };

    // 獲取用戶角色顏色
    const getRoleColor = (userRole) => {
        switch (userRole) {
            case 'admin':
                return 'from-red-500 to-pink-500';
            case 'verified':
                return 'from-blue-500 to-purple-500';
            default:
                return 'from-green-500 to-blue-500';
        }
    };

    // 獲取角色圖標
    const getRoleIcon = (userRole) => {
        if (userRole === 'verified' || userRole === 'admin') {
            const colorClass = userRole === 'admin' ? 'text-red-400' : 'text-blue-400';
            return (
                <svg className={`w-4 h-4 ${colorClass}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            );
        }
        return null;
    };

    // 用戶卡片組件
    const UserCard = ({ user, showStats = false }) => (
        <div className="flex items-center justify-between p-4 hover:bg-gray-950 transition-colors duration-200">
            <div className="flex items-center space-x-3 flex-1">
                {/* 用戶頭像 */}
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRoleColor(user?.userRole)} flex items-center justify-center text-white font-semibold text-lg`}>
                    {user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                </div>

                {/* 用戶信息 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white truncate">
                            {user?.displayName || user?.username}
                        </span>
                        {getRoleIcon(user?.userRole)}
                    </div>
                    <div className="text-gray-500 text-sm">
                        @{user?.username}
                    </div>
                    {showStats && (
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                            <span>{user?.postsCount || 0} 貼文</span>
                            <span>{user?.followersCount || 0} 粉絲</span>
                            <span>{user?.followingCount || 0} 追蹤中</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 追蹤按鈕 */}
            <FollowButton 
                targetUser={user}
                size="sm"
                onFollowChange={() => {
                    // 重新載入推薦用戶列表
                    if (!hasSearched) {
                        loadRecommendedUsers();
                    }
                }}
            />
        </div>
    );

    return (
        <ModernLayout>
            <div className="min-h-screen bg-black">
                {/* 🔥 頁面標題和搜尋欄 */}
                <div className="sticky top-0 bg-black bg-opacity-80 backdrop-blur-sm border-b border-gray-800 px-6 py-4 z-40">
                    <h1 className="text-2xl font-bold text-white mb-4">搜尋</h1>
                    
                    {/* 搜尋輸入框 */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="搜尋用戶..."
                            className="w-full bg-gray-900 text-white pl-12 pr-4 py-3 rounded-full border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                        />
                        {isSearching && (
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 🔥 主要內容區域 */}
                <div className="pb-20">
                    {/* 搜尋結果 */}
                    {hasSearched && (
                        <div className="border-b border-gray-800">
                            <div className="px-6 py-4">
                                <h2 className="text-lg font-semibold text-white mb-4">
                                    搜尋結果
                                    {searchResults.length > 0 && (
                                        <span className="text-gray-400 font-normal ml-2">({searchResults.length})</span>
                                    )}
                                </h2>

                                {searchResults.length > 0 ? (
                                    <div className="space-y-2">
                                        {searchResults.map((user) => (
                                            <UserCard key={user.id} user={user} showStats={true} />
                                        ))}
                                    </div>
                                ) : !isSearching && (
                                    <div className="text-center py-8">
                                        <svg className="mx-auto h-12 w-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <p className="text-gray-400">沒有找到符合條件的用戶</p>
                                        <p className="text-gray-500 text-sm mt-1">試試其他關鍵字</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 推薦用戶 */}
                    {!hasSearched && (
                        <div>
                            <div className="px-6 py-4">
                                <h2 className="text-lg font-semibold text-white mb-4">推薦追蹤</h2>

                                {isLoadingRecommended ? (
                                    <div className="space-y-4">
                                        {[...Array(5)].map((_, index) => (
                                            <div key={index} className="flex items-center space-x-3 p-4">
                                                <div className="w-12 h-12 bg-gray-800 rounded-full animate-pulse"></div>
                                                <div className="flex-1">
                                                    <div className="h-4 bg-gray-800 rounded w-1/3 mb-2 animate-pulse"></div>
                                                    <div className="h-3 bg-gray-800 rounded w-1/4 animate-pulse"></div>
                                                </div>
                                                <div className="h-8 w-16 bg-gray-800 rounded-full animate-pulse"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : recommendedUsers.length > 0 ? (
                                    <div className="space-y-2">
                                        {recommendedUsers.map((user) => (
                                            <UserCard key={user.id} user={user} showStats={true} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <svg className="mx-auto h-12 w-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <p className="text-gray-400">目前沒有推薦用戶</p>
                                        <p className="text-gray-500 text-sm mt-1">稍後再來看看</p>
                                    </div>
                                )}

                                {/* 搜尋建議 */}
                                <div className="mt-8 p-4 bg-gray-900 rounded-2xl">
                                    <h3 className="font-semibold text-white mb-3">搜尋建議</h3>
                                    <div className="space-y-2 text-sm text-gray-400">
                                        <p>• 嘗試搜尋用戶名或顯示名稱</p>
                                        <p>• 關鍵字至少需要 2 個字符</p>
                                        <p>• 可以搜尋部分匹配的內容</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ModernLayout>
    );
};

export default SearchPage;