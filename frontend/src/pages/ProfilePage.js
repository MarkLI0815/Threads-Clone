// frontend/src/pages/ProfilePage.js - 最終版本包含統計刷新
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    getUserProfile, 
    updateUserProfile, 
    forceRefreshUserStats, 
    syncAllUserStats 
} from '../services/userService';
import { toggleUserFollow } from '../services/followService';
import ModernLayout from '../components/ModernLayout';
import ModernPostCard from '../components/ModernPostCard';

const ProfilePage = () => {
    const { userId } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [refreshingStats, setRefreshingStats] = useState(false); // 🔥 統計刷新狀態
    const [syncingAllStats, setSyncingAllStats] = useState(false); // 🔥 同步所有統計狀態
    const [editForm, setEditForm] = useState({
        displayName: '',
        email: '',
        avatarUrl: ''
    });
    const [followLoading, setFollowLoading] = useState(false);

    const targetUserId = userId || currentUser?.id;
    const isOwnProfile = !userId || userId === currentUser?.id;
    const isAdmin = currentUser?.userRole === 'admin';

    useEffect(() => {
        if (targetUserId) {
            loadProfile();
        }
    }, [targetUserId, refreshTrigger]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            console.log('🔄 載入用戶檔案:', targetUserId);
            const result = await getUserProfile(targetUserId);
            if (result.success) {
                const profileData = result.data.data;
                console.log('✅ 檔案載入成功:', profileData);
                
                setProfile(profileData);
                setEditForm({
                    displayName: profileData.displayName || '',
                    email: profileData.email || '',
                    avatarUrl: profileData.avatarUrl || ''
                });
            } else {
                console.error('❌ 載入檔案失敗:', result.error);
            }
        } catch (error) {
            console.error('❌ 載入檔案錯誤:', error);
        } finally {
            setLoading(false);
        }
    };

    // 🔥 強制刷新統計
    const handleForceRefreshStats = async () => {
        if (refreshingStats) return;
        
        setRefreshingStats(true);
        try {
            console.log('🔄 強制刷新統計數據');
            const result = await forceRefreshUserStats(targetUserId);
            
            if (result.success) {
                console.log('✅ 統計刷新成功:', result.data);
                // 刷新整個檔案
                setTimeout(() => {
                    setRefreshTrigger(prev => prev + 1);
                }, 500);
            } else {
                console.error('❌ 統計刷新失敗:', result.error);
                alert('統計刷新失敗：' + result.error);
            }
        } catch (error) {
            console.error('❌ 統計刷新錯誤:', error);
            alert('統計刷新時發生錯誤');
        } finally {
            setRefreshingStats(false);
        }
    };

    // 🔥 同步所有用戶統計（管理員專用）
    const handleSyncAllStats = async () => {
        if (syncingAllStats || !isAdmin) return;
        
        if (!window.confirm('確定要同步所有用戶的統計數據嗎？這個操作可能需要一些時間。')) {
            return;
        }
        
        setSyncingAllStats(true);
        try {
            console.log('🔄 同步所有用戶統計數據（管理員操作）');
            const result = await syncAllUserStats();
            
            if (result.success) {
                console.log('✅ 所有統計同步成功:', result.data);
                alert('所有用戶統計數據已同步完成！');
                // 刷新當前檔案
                setTimeout(() => {
                    setRefreshTrigger(prev => prev + 1);
                }, 1000);
            } else {
                console.error('❌ 同步所有統計失敗:', result.error);
                alert('同步失敗：' + result.error);
            }
        } catch (error) {
            console.error('❌ 同步所有統計錯誤:', error);
            alert('同步時發生錯誤');
        } finally {
            setSyncingAllStats(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await updateUserProfile(editForm);
            if (result.success) {
                setProfile(prev => ({ ...prev, ...result.data.data }));
                setIsEditing(false);
                console.log('✅ 檔案更新成功');
                
                // 更新後重新載入統計
                setTimeout(() => {
                    handleForceRefreshStats();
                }, 1000);
            } else {
                console.error('❌ 更新檔案失敗:', result.error);
            }
        } catch (error) {
            console.error('❌ 更新檔案錯誤:', error);
        }
    };

    const handleFollowToggle = async () => {
        if (followLoading) return;
        
        setFollowLoading(true);
        try {
            const result = await toggleUserFollow(targetUserId, profile.isFollowing);
            if (result.success) {
                const newFollowingStatus = !profile.isFollowing;
                
                // 立即更新 UI
                setProfile(prev => ({
                    ...prev,
                    isFollowing: newFollowingStatus,
                    stats: {
                        ...prev.stats,
                        followersCount: prev.stats.followersCount + (newFollowingStatus ? 1 : -1)
                    }
                }));

                console.log(`✅ 追蹤狀態更新: ${newFollowingStatus ? '已追蹤' : '已取消'}`);
                
                // 延遲刷新統計確保資料同步
                setTimeout(() => {
                    handleForceRefreshStats();
                }, 1500);
            } else {
                console.error('❌ 追蹤操作失敗:', result.error);
            }
        } catch (error) {
            console.error('❌ 追蹤操作錯誤:', error);
        } finally {
            setFollowLoading(false);
        }
    };

    const handlePostInteraction = () => {
        console.log('🔄 貼文互動觸發統計刷新');
        setTimeout(() => {
            handleForceRefreshStats();
        }, 1000);
    };

    const handlePostDeleted = () => {
        console.log('🗑️ 貼文刪除觸發統計刷新');
        setTimeout(() => {
            handleForceRefreshStats();
        }, 500);
    };

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

    const getRoleName = (userRole) => {
        switch (userRole) {
            case 'admin':
                return '管理員';
            case 'verified':
                return '認證用戶';
            default:
                return '一般用戶';
        }
    };

    const formatStatNumber = (num) => {
        if (num === undefined || num === null) return '0';
        return num.toString();
    };

    if (loading) {
        return (
            <ModernLayout>
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-white">載入用戶檔案中...</p>
                    </div>
                </div>
            </ModernLayout>
        );
    }

    if (!profile) {
        return (
            <ModernLayout>
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">用戶不存在</h2>
                        <p className="text-gray-400 mb-6">找不到指定的用戶檔案</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                        >
                            返回首頁
                        </button>
                    </div>
                </div>
            </ModernLayout>
        );
    }

    return (
        <ModernLayout>
            <div className="min-h-screen bg-black">
                {/* 檔案頭部 */}
                <div className="relative">
                    {/* 背景裝飾 */}
                    <div className={`h-32 bg-gradient-to-r ${getRoleColor(profile.userRole)} opacity-20`}></div>
                    
                    {/* 用戶資訊 */}
                    <div className="px-6 pb-6">
                        <div className="relative -mt-16 flex items-end space-x-6">
                            {/* 頭像 */}
                            <div className={`w-24 h-24 bg-gradient-to-br ${getRoleColor(profile.userRole)} rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
                                {profile.displayName?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase()}
                            </div>

                            {/* 基本資訊 */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-2xl font-bold text-white">
                                            {profile.displayName || profile.username}
                                        </h1>
                                        <p className="text-gray-400">@{profile.username}</p>
                                        <div className="flex items-center mt-2 space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                profile.userRole === 'admin' ? 'bg-red-500' :
                                                profile.userRole === 'verified' ? 'bg-blue-500' :
                                                'bg-green-500'
                                            } text-white`}>
                                                {getRoleName(profile.userRole)}
                                            </span>
                                            {profile.verified && (
                                                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>

                                    {/* 🔥 操作按鈕區域 */}
                                    <div className="flex space-x-3">
                                        {isOwnProfile ? (
                                            <>
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="px-6 py-2 border border-gray-600 text-white rounded-full hover:bg-gray-800 transition-colors"
                                                >
                                                    編輯檔案
                                                </button>
                                                <button
                                                    onClick={handleForceRefreshStats}
                                                    disabled={refreshingStats}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                    title="刷新統計數據"
                                                >
                                                    {refreshingStats ? '🔄' : '📊'}
                                                </button>
                                                {/* 🔥 管理員專用：同步所有統計按鈕 */}
                                                {isAdmin && (
                                                    <button
                                                        onClick={handleSyncAllStats}
                                                        disabled={syncingAllStats}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
                                                        title="同步所有用戶統計（管理員專用）"
                                                    >
                                                        {syncingAllStats ? '⏳' : '🔄'}
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={handleFollowToggle}
                                                    disabled={followLoading}
                                                    className={`px-6 py-2 rounded-full font-medium transition-colors ${
                                                        profile.isFollowing
                                                            ? 'bg-gray-800 text-white hover:bg-gray-700'
                                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                                    } disabled:opacity-50`}
                                                >
                                                    {followLoading ? '處理中...' : profile.isFollowing ? '已追蹤' : '追蹤'}
                                                </button>
                                                {/* 🔥 管理員可以刷新任何用戶的統計 */}
                                                {isAdmin && (
                                                    <button
                                                        onClick={handleForceRefreshStats}
                                                        disabled={refreshingStats}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                        title="刷新此用戶統計（管理員）"
                                                    >
                                                        {refreshingStats ? '🔄' : '📊'}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 🔥 統計資訊 - 確保即時更新 */}
                        <div className="grid grid-cols-4 gap-6 mt-6 p-4 bg-gray-900 rounded-2xl">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">
                                    {formatStatNumber(profile.stats?.postsCount)}
                                </div>
                                <div className="text-gray-400 text-sm">貼文</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">
                                    {formatStatNumber(profile.stats?.followersCount)}
                                </div>
                                <div className="text-gray-400 text-sm">粉絲</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">
                                    {formatStatNumber(profile.stats?.followingCount)}
                                </div>
                                <div className="text-gray-400 text-sm">追蹤中</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-400">
                                    {formatStatNumber(profile.stats?.influenceScore)}
                                </div>
                                <div className="text-gray-400 text-sm">影響力</div>
                            </div>
                        </div>

                        {/* 🔥 統計刷新提示 */}
                        {refreshingStats && (
                            <div className="mt-4 p-3 bg-blue-900 rounded-lg border border-blue-500">
                                <p className="text-blue-300 text-sm text-center">
                                    📊 正在重新計算統計數據，請稍候...
                                </p>
                            </div>
                        )}

                        {/* 用戶資訊 */}
                        {isOwnProfile && (
                            <div className="mt-6 p-4 bg-gray-900 rounded-2xl">
                                <h3 className="text-lg font-semibold text-white mb-3">個人資訊</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">電子郵件:</span>
                                        <span className="text-white">{profile.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">註冊時間:</span>
                                        <span className="text-white">
                                            {new Date(profile.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">總獲讚數:</span>
                                        <span className="text-white">
                                            {formatStatNumber(profile.stats?.totalLikesReceived)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">總評論數:</span>
                                        <span className="text-white">
                                            {formatStatNumber(profile.stats?.totalCommentsReceived)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 最近貼文 */}
                <div className="px-6 pb-20">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        {isOwnProfile ? '我的貼文' : `${profile.displayName || profile.username} 的貼文`}
                    </h3>
                    
                    {profile.recentPosts && profile.recentPosts.length > 0 ? (
                        <div className="space-y-0">
                            {profile.recentPosts.map((post) => (
                                <ModernPostCard 
                                    key={post.id} 
                                    post={post} 
                                    onInteraction={handlePostInteraction}
                                    onPostDeleted={handlePostDeleted}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-gray-900 rounded-2xl">
                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <p className="text-gray-400">
                                {isOwnProfile ? '您還沒有發布任何貼文' : '該用戶還沒有發布任何貼文'}
                            </p>
                        </div>
                    )}
                </div>

                {/* 編輯檔案彈窗 */}
                {isEditing && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
                            <h3 className="text-xl font-bold text-white mb-6">編輯檔案</h3>
                            
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        顯示名稱
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.displayName}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                                        placeholder="輸入顯示名稱"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        電子郵件
                                    </label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                                        placeholder="輸入電子郵件"
                                    />
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 px-4 py-3 border border-gray-600 text-white rounded-lg hover:bg-gray-800 transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        儲存
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </ModernLayout>
    );
};

export default ProfilePage;