// frontend/src/pages/AdminPanel.js - 增強版管理員面板
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ModernLayout from '../components/ModernLayout';
import adminService from '../services/adminService';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 🔥 修復：先定義所有 Hooks，再做權限檢查
  // 載入儀表板數據
  useEffect(() => {
    // 只有管理員才執行載入
    if (user?.userRole === 'admin') {
      if (activeTab === 'dashboard') {
        loadDashboard();
      } else if (activeTab === 'users') {
        loadUsers();
      } else if (activeTab === 'posts') {
        loadPosts();
      }
    }
  }, [activeTab, user?.userRole]);

  // 🔥 權限檢查移到 Hooks 後面
  if (user?.userRole !== 'admin') {
    return (
      <ModernLayout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-400 mb-4">🚫 權限不足</h1>
            <p className="text-gray-400">您沒有權限訪問管理員面板</p>
          </div>
        </div>
      </ModernLayout>
    );
  }

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminService.getAdminDashboard();
      if (result.success) {
        setDashboardData(result.data.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('載入儀表板失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminService.getAllUsers({ limit: 50 });
      if (result.success) {
        setUsers(result.data.data.users);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('載入用戶列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminService.getAllPosts({ limit: 50 });
      if (result.success) {
        setPosts(result.data.data.posts);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('載入貼文列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole, username) => {
    if (window.confirm(`確定要將 ${username} 的角色變更為 ${newRole} 嗎？`)) {
      setLoading(true);
      try {
        const result = await adminService.changeUserRole(userId, newRole);
        if (result.success) {
          setSuccess(`✅ ${username} 的角色已更新為 ${newRole}`);
          loadUsers(); // 重新載入用戶列表
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('變更角色失敗');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeletePost = async (postId, authorUsername) => {
    const reason = window.prompt(`確定要刪除 ${authorUsername} 的貼文嗎？請輸入刪除原因：`);
    if (reason) {
      setLoading(true);
      try {
        const result = await adminService.deletePost(postId, reason);
        if (result.success) {
          setSuccess(`✅ 貼文已刪除，原因：${reason}`);
          loadPosts(); // 重新載入貼文列表
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('刪除貼文失敗');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRefreshStats = async () => {
    if (window.confirm('確定要刷新全系統統計嗎？這可能需要幾分鐘時間。')) {
      setLoading(true);
      try {
        const result = await adminService.forceRefreshAllStats();
        if (result.success) {
          setSuccess(`✅ 統計刷新完成！處理了 ${result.data.data.processed} 個用戶`);
          loadDashboard(); // 重新載入儀表板
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('刷新統計失敗');
      } finally {
        setLoading(false);
      }
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'verified': return 'text-blue-400';
      default: return 'text-green-400';
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'admin' || role === 'verified') {
      const colorClass = role === 'admin' ? 'text-red-400' : 'text-blue-400';
      return (
        <svg className={`w-4 h-4 ${colorClass}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  return (
    <ModernLayout>
      <div className="min-h-screen bg-black">
        {/* 頂部標題和通知 */}
        <div className="sticky top-0 bg-black bg-opacity-80 backdrop-blur-sm border-b border-gray-800 px-6 py-4 z-40">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center">
              🛡️ 管理員控制台
              <span className="ml-3 text-sm text-gray-400">歡迎，{user?.username}</span>
            </h1>
            <button
              onClick={handleRefreshStats}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {loading ? '刷新中...' : '🔄 刷新統計'}
            </button>
          </div>

          {/* 通知訊息 */}
          {error && (
            <div className="mt-3 p-3 bg-red-900 border border-red-700 text-red-200 rounded-lg">
              ❌ {error}
              <button
                onClick={() => setError('')}
                className="ml-2 text-red-300 hover:text-red-100"
              >
                ✕
              </button>
            </div>
          )}

          {success && (
            <div className="mt-3 p-3 bg-green-900 border border-green-700 text-green-200 rounded-lg">
              {success}
              <button
                onClick={() => setSuccess('')}
                className="ml-2 text-green-300 hover:text-green-100"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* 標籤導航 */}
        <div className="border-b border-gray-800">
          <div className="px-6">
            <nav className="flex space-x-8">
              {[
                { id: 'dashboard', label: '📊 儀表板', icon: '📊' },
                { id: 'users', label: '👥 用戶管理', icon: '👥' },
                { id: 'posts', label: '📱 內容管理', icon: '📱' },
                { id: 'system', label: '⚙️ 系統設置', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 主要內容區域 */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-400 mt-2">載入中...</p>
            </div>
          )}

          {/* 儀表板標籤 */}
          {activeTab === 'dashboard' && dashboardData && !loading && (
            <div className="space-y-6">
              {/* 統計卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400">總用戶數</p>
                      <p className="text-2xl font-semibold text-white">{dashboardData.overview.totalUsers}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-green-400 text-sm">今日新增: {dashboardData.today.newUsers}</span>
                  </div>
                </div>

                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400">總貼文數</p>
                      <p className="text-2xl font-semibold text-white">{dashboardData.overview.totalPosts}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-green-400 text-sm">今日新增: {dashboardData.today.newPosts}</span>
                  </div>
                </div>

                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-600 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400">總按讚數</p>
                      <p className="text-2xl font-semibold text-white">{dashboardData.overview.totalLikes}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-green-400 text-sm">今日新增: {dashboardData.today.newLikes}</span>
                  </div>
                </div>

                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400">總評論數</p>
                      <p className="text-2xl font-semibold text-white">{dashboardData.overview.totalComments}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-green-400 text-sm">今日新增: {dashboardData.today.newComments}</span>
                  </div>
                </div>
              </div>

              {/* 用戶角色分布 */}
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">用戶角色分布</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{dashboardData.userDistribution.regular || 0}</p>
                    <p className="text-sm text-gray-400">一般用戶</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{dashboardData.userDistribution.verified || 0}</p>
                    <p className="text-sm text-gray-400">認證用戶</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">{dashboardData.userDistribution.admin || 0}</p>
                    <p className="text-sm text-gray-400">管理員</p>
                  </div>
                </div>
              </div>

              {/* 參與度指標 */}
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">參與度指標</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{dashboardData.engagement.avgPostsPerUser}</p>
                    <p className="text-sm text-gray-400">平均每用戶貼文數</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{dashboardData.engagement.avgLikesPerPost}</p>
                    <p className="text-sm text-gray-400">平均每貼文按讚數</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{dashboardData.engagement.avgCommentsPerPost}</p>
                    <p className="text-sm text-gray-400">平均每貼文評論數</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 用戶管理標籤 */}
          {activeTab === 'users' && !loading && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">用戶管理</h3>
                <p className="text-gray-400">總共 {users.length} 個用戶</p>
              </div>

              <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">用戶</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">角色</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">統計</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">註冊時間</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {(user.displayName || user.username)[0].toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-white">{user.displayName || user.username}</span>
                                  {getRoleIcon(user.userRole)}
                                </div>
                                <div className="text-sm text-gray-400">@{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${getRoleColor(user.userRole)}`}>
                              {user.userRole}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {user.postsCount} 貼文 • {user.followersCount} 粉絲
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={user.userRole}
                              onChange={(e) => {
                                console.log('🔄 角色變更:', {
                                  targetUserId: user.id,
                                  currentAdminId: user.id,  // 從 useAuth 來的當前管理員
                                  newRole: e.target.value,
                                  username: user.username
                                });
                                handleRoleChange(user.id, e.target.value, user.username);
                              }}
                              onClick={(e) => {
                                console.log('👆 下拉選單點擊');
                                e.stopPropagation();
                              }}
                              className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                              disabled={loading} // ✅ 只在載入時禁用，移除錯誤的自我檢查
                            >
                              <option value="regular">Regular</option>
                              <option value="verified">Verified</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 內容管理標籤 */}
          {activeTab === 'posts' && !loading && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">內容管理</h3>
                <p className="text-gray-400">總共 {posts.length} 篇貼文</p>
              </div>

              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {(post.user.displayName || post.user.username)[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-white">{post.user.displayName || post.user.username}</span>
                              {getRoleIcon(post.user.userRole)}
                            </div>
                            <span className="text-gray-400 text-sm">@{post.user.username}</span>
                          </div>
                        </div>
                        <p className="text-white mb-3">{post.content}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>❤️ {post.likesCount} 讚</span>
                          <span>💬 {post.commentsCount} 評論</span>
                          <span>📅 {new Date(post.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePost(post.id, post.user.username)}
                        className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        🗑️ 刪除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 系統設置標籤 */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">系統設置</h3>

              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <h4 className="text-lg font-semibold text-white mb-4">系統維護</h4>
                <div className="space-y-4">
                  <button
                    onClick={handleRefreshStats}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    🔄 強制刷新所有統計
                  </button>
                  <p className="text-sm text-gray-400">
                    重新計算所有用戶的統計數據，包括貼文數、按讚數、追蹤數等。
                  </p>
                </div>
              </div>

              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <h4 className="text-lg font-semibold text-white mb-4">系統資訊</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-400">平台版本: <span className="text-white">v1.0.0</span></p>
                  <p className="text-gray-400">當前管理員: <span className="text-white">{user?.username}</span></p>
                  <p className="text-gray-400">最後更新: <span className="text-white">{new Date().toLocaleString()}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModernLayout>
  );
};

export default AdminPanel;