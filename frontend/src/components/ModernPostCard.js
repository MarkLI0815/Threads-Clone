// frontend/src/components/ModernPostCard.js - 修復評論功能版本
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { togglePostLike, addPostComment, deletePost, updatePost } from '../services/postService';
import FollowButton from './FollowButton';

const ModernPostCard = ({ post, onInteraction, onPostDeleted }) => {
    const { user } = useAuth();
    const [localPost, setLocalPost] = useState(post);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false); // 🔥 專門的評論提交狀態
    const [liking, setLiking] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [editForm, setEditForm] = useState({
        content: post.content,
        imageUrl: post.imageUrl || ''
    });
    const [editingPost, setEditingPost] = useState(false);
    const [deletingPost, setDeletingPost] = useState(false);

    // 檢查權限
    const canEditPost = user && (user.id === post.user.id || user.userRole === 'admin');
    const canDeletePost = user && (user.id === post.user.id || user.userRole === 'admin');

    const handleLike = async () => {
        if (liking) return;
        
        setLiking(true);
        try {
            const result = await togglePostLike(localPost.id, localPost.isLikedByUser);
            if (result.success) {
                setLocalPost(prev => ({
                    ...prev,
                    isLikedByUser: !prev.isLikedByUser,
                    likes: result.data.likeCount
                }));

                if (onInteraction) {
                    onInteraction();
                }
            }
        } catch (error) {
            console.error('按讚操作錯誤:', error);
        } finally {
            setLiking(false);
        }
    };

    // 🔥 修復評論提交功能
    const handleComment = async (e) => {
        e.preventDefault();
        
        console.log('🔥 評論提交開始:', {
            commentText: commentText.trim(),
            isSubmittingComment,
            postId: localPost.id
        });

        // 檢查評論內容
        if (!commentText || !commentText.trim()) {
            console.log('❌ 評論內容為空');
            alert('請輸入評論內容');
            return;
        }

        // 防止重複提交
        if (isSubmittingComment) {
            console.log('❌ 正在提交中，請稍後');
            return;
        }

        setIsSubmittingComment(true);
        
        try {
            console.log('📡 發送評論請求:', localPost.id, commentText.trim());
            
            const result = await addPostComment(localPost.id, commentText.trim());
            
            console.log('📡 評論請求結果:', result);

            if (result.success && result.data && result.data.comment) {
                console.log('✅ 評論提交成功:', result.data.comment);
                
                // 🔥 更新本地貼文狀態
                setLocalPost(prev => ({
                    ...prev,
                    comments: [...(prev.comments || []), result.data.comment],
                    commentsCount: (prev.commentsCount || 0) + 1
                }));
                
                // 🔥 清空輸入框
                setCommentText('');
                
                // 🔥 確保評論區保持展開
                setShowComments(true);

                // 通知父組件
                if (onInteraction) {
                    onInteraction();
                }

                console.log('✅ 評論狀態更新完成');
            } else {
                console.error('❌ 評論提交失敗:', result.error || '未知錯誤');
                alert('評論提交失敗：' + (result.error || '未知錯誤'));
            }
        } catch (error) {
            console.error('❌ 評論提交錯誤:', error);
            alert('評論提交時發生錯誤：' + error.message);
        } finally {
            setIsSubmittingComment(false);
            console.log('🔄 評論提交流程結束');
        }
    };

    // 🔥 簡化評論按鈕點擊邏輯
    const handleCommentButtonClick = () => {
        console.log('🔥 評論按鈕點擊 - 當前狀態:', { showComments });
        setShowComments(!showComments);
    };

    const handleEditPost = async (e) => {
        e.preventDefault();
        if (!editForm.content.trim() || editingPost) return;

        setEditingPost(true);
        try {
            const result = await updatePost(localPost.id, {
                content: editForm.content.trim(),
                imageUrl: editForm.imageUrl.trim() || null
            });

            if (result.success) {
                setLocalPost(prev => ({
                    ...prev,
                    content: editForm.content.trim(),
                    imageUrl: editForm.imageUrl.trim() || null
                }));
                setShowEditModal(false);

                if (onInteraction) {
                    onInteraction();
                }
            } else {
                alert('編輯貼文失敗：' + result.error);
            }
        } catch (error) {
            alert('編輯貼文時發生錯誤');
        } finally {
            setEditingPost(false);
        }
    };

    const handleDeletePost = async () => {
        if (deletingPost) return;

        setDeletingPost(true);
        try {
            const result = await deletePost(localPost.id);
            if (result.success) {
                setShowDeleteConfirm(false);
                if (onPostDeleted) {
                    onPostDeleted();
                }
            } else {
                alert('刪除貼文失敗：' + result.error);
            }
        } catch (error) {
            alert('刪除貼文時發生錯誤');
        } finally {
            setDeletingPost(false);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `${localPost.user.displayName || localPost.user.username} 的貼文`,
            text: localPost.content,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                setShowShareModal(true);
            }
        } catch (error) {
            setShowShareModal(true);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            alert('連結已複製到剪貼簿！');
            setShowShareModal(false);
        } catch (error) {
            alert('複製失敗，請手動複製連結');
        }
    };

    const handleFollowChange = (data) => {
        setLocalPost(prev => ({
            ...prev,
            user: {
                ...prev.user,
                isFollowing: data.isFollowing
            }
        }));

        if (onInteraction) {
            onInteraction();
        }
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const postDate = new Date(dateString);
        const diffInMs = now - postDate;
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        
        if (diffInHours < 1) return '剛剛';
        if (diffInHours < 24) return `${diffInHours} 小時`;
        if (diffInDays < 7) return `${diffInDays} 天`;
        return postDate.toLocaleDateString();
    };

    const getRoleColor = (userRole) => {
        switch (userRole) {
            case 'admin':
                return 'from-red-500 to-pink-500';
            case 'verified':
                return 'from-blue-500 to-purple-500';
            case 'regular':
            default:
                return 'from-green-500 to-blue-500';
        }
    };

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }
        
        if (imageUrl.startsWith('/uploads')) {
            return `http://localhost:3001${imageUrl}`;
        }
        
        return imageUrl;
    };

    return (
        <>
            <div className="border-b border-gray-800 px-6 py-4 hover:bg-gray-950/50 transition-colors">
                <div className="flex space-x-3">
                    {/* 用戶頭像 */}
                    <div className={`w-12 h-12 bg-gradient-to-br ${getRoleColor(localPost.user.userRole)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                        {localPost.user.displayName?.[0]?.toUpperCase() || localPost.user.username?.[0]?.toUpperCase()}
                    </div>

                    {/* 貼文內容 */}
                    <div className="flex-1 min-w-0">
                        {/* 用戶資訊和操作按鈕 */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <span className="font-semibold text-white">
                                    {localPost.user.displayName || localPost.user.username}
                                </span>
                                <span className="text-gray-400 text-sm">@{localPost.user.username}</span>
                                
                                {/* 角色標籤 */}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    localPost.user.userRole === 'admin' ? 'bg-red-500' :
                                    localPost.user.userRole === 'verified' ? 'bg-blue-500' :
                                    'bg-green-500'
                                } text-white`}>
                                    {localPost.user.userRole === 'admin' ? '管理員' :
                                     localPost.user.userRole === 'verified' ? '認證' : '一般'}
                                </span>

                                {localPost.user.verified && (
                                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}

                                <span className="text-gray-500 text-sm">· {formatTimeAgo(localPost.createdAt)}</span>
                            </div>

                            {/* 右側按鈕區域 */}
                            <div className="flex items-center space-x-2">
                                {/* 追蹤按鈕 */}
                                {user && user.id !== localPost.user.id && (
                                    <FollowButton
                                        targetUser={localPost.user}
                                        onFollowChange={handleFollowChange}
                                        size="xs"
                                        className="ml-2"
                                    />
                                )}

                                {/* 編輯/刪除按鈕 */}
                                {(canEditPost || canDeletePost) && (
                                    <div className="flex items-center space-x-1">
                                        {canEditPost && (
                                            <button
                                                onClick={() => {
                                                    setEditForm({
                                                        content: localPost.content,
                                                        imageUrl: localPost.imageUrl || ''
                                                    });
                                                    setShowEditModal(true);
                                                }}
                                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-colors"
                                                title="編輯貼文"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        )}
                                        {canDeletePost && (
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                                title="刪除貼文"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 貼文文字內容 */}
                        <div className="text-white mb-3 leading-relaxed">
                            {localPost.content}
                        </div>

                        {/* 貼文圖片 */}
                        {localPost.imageUrl && (
                            <div className="mb-3">
                                <img
                                    src={getImageUrl(localPost.imageUrl)}
                                    alt="貼文圖片"
                                    className="rounded-2xl max-w-full h-auto border border-gray-700"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}

                        {/* 互動按鈕 */}
                        <div className="flex items-center justify-between text-gray-400 text-sm">
                            <button
                                onClick={handleLike}
                                disabled={liking}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-colors ${
                                    localPost.isLikedByUser
                                        ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20'
                                        : 'hover:text-red-500 hover:bg-red-500/10'
                                } disabled:opacity-50`}
                            >
                                <svg className="w-5 h-5" fill={localPost.isLikedByUser ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span>{localPost.likes || 0}</span>
                            </button>

                            <button
                                onClick={handleCommentButtonClick}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-colors ${
                                    showComments 
                                        ? 'text-blue-500 bg-blue-500/10' 
                                        : 'hover:text-blue-500 hover:bg-blue-500/10'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span>{localPost.commentsCount || 0}</span>
                            </button>

                            <button 
                                onClick={handleShare}
                                className="flex items-center space-x-2 px-3 py-2 rounded-full hover:text-green-500 hover:bg-green-500/10 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span>分享</span>
                            </button>
                        </div>

                        {/* 🔥 修復評論區域 */}
                        {showComments && (
                            <div className="mt-4">
                                {/* 🔥 評論輸入框 - 始終顯示 */}
                                <form onSubmit={handleComment} className="flex space-x-3 mb-4">
                                    <div className={`w-8 h-8 bg-gradient-to-br ${getRoleColor(user?.userRole || 'regular')} rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                                        {user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 flex space-x-2">
                                        <input
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => {
                                                console.log('🔥 評論輸入變化:', e.target.value);
                                                setCommentText(e.target.value);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleComment(e);
                                                }
                                            }}
                                            placeholder="寫下你的評論..."
                                            className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
                                            disabled={isSubmittingComment}
                                            autoFocus
                                        />
                                        <button
                                            type="submit"
                                            disabled={!commentText.trim() || isSubmittingComment}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmittingComment ? (
                                                <div className="flex items-center space-x-1">
                                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>發送中</span>
                                                </div>
                                            ) : (
                                                '發送'
                                            )}
                                        </button>
                                    </div>
                                </form>

                                {/* 顯示評論列表 */}
                                {localPost.comments && localPost.comments.length > 0 && (
                                    <div className="space-y-3">
                                        {localPost.comments.filter(comment => comment && comment.user).map((comment) => (
                                            <div key={comment.id} className="flex space-x-3">
                                                <div className={`w-8 h-8 bg-gradient-to-br ${getRoleColor(comment.user?.userRole || 'regular')} rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                                                    {comment.user?.displayName?.[0]?.toUpperCase() || comment.user?.username?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-gray-800 rounded-2xl px-4 py-2">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <span className="font-medium text-white text-sm">
                                                                {comment.user?.displayName || comment.user?.username || '未知用戶'}
                                                            </span>
                                                            <span className="text-gray-500 text-xs">
                                                                {formatTimeAgo(comment.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-white text-sm">{comment.content}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(!localPost.comments || localPost.comments.length === 0) && (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500 text-sm">還沒有評論，成為第一個評論的人吧！</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 編輯貼文彈窗 */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-6">編輯貼文</h3>
                        
                        <form onSubmit={handleEditPost} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    貼文內容
                                </label>
                                <textarea
                                    value={editForm.content}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
                                    placeholder="分享你的想法..."
                                    rows={4}
                                    maxLength={280}
                                    required
                                />
                                <div className="text-right text-xs text-gray-400 mt-1">
                                    {editForm.content.length}/280
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    圖片網址 (選填)
                                </label>
                                <input
                                    type="url"
                                    value={editForm.imageUrl}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-600 text-white rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={!editForm.content.trim() || editingPost}
                                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                                >
                                    {editingPost ? '更新中...' : '更新貼文'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 刪除確認彈窗 */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">確認刪除</h3>
                        <p className="text-gray-300 mb-6">
                            您確定要刪除這則貼文嗎？此操作無法復原。
                        </p>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-3 border border-gray-600 text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleDeletePost}
                                disabled={deletingPost}
                                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {deletingPost ? '刪除中...' : '確認刪除'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 分享選項彈窗 */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-6">分享貼文</h3>
                        
                        <div className="space-y-3">
                            <button
                                onClick={handleCopyLink}
                                className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span className="text-white">複製連結</span>
                            </button>
                            
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="w-full px-4 py-3 border border-gray-600 text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ModernPostCard;