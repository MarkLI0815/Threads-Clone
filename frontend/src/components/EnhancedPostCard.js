// frontend/src/components/EnhancedPostCard.js
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toggleLike, addComment } from '../services/postService';

const EnhancedPostCard = ({ post, currentUser, onPostUpdate, onPostDelete }) => {
    // 🔧 修復初始狀態 - 確保使用後端返回的真實數據
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [commentContent, setCommentContent] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);
    const [error, setError] = useState('');

    // 🔧 使用 useEffect 來正確初始化狀態
    useEffect(() => {
        console.log('🔍 PostCard useEffect - Initializing post state:', {
            postId: post.id,
            postLiked: post.liked,
            postLikeCount: post.likeCount,
            postContent: post.content?.substring(0, 30) + '...'
        });

        // 設置真實的初始狀態
        setLiked(Boolean(post.liked));
        setLikeCount(Number(post.likeCount) || 0);
        
        console.log('✅ PostCard state initialized:', {
            liked: Boolean(post.liked),
            likeCount: Number(post.likeCount) || 0
        });
    }, [post.id, post.liked, post.likeCount]);

    // 🔧 新增：評論資料除錯日誌
    useEffect(() => {
        console.log('🔍 PostCard - Post data:', {
            postId: post.id,
            commentCount: post.commentCount,
            commentsArray: post.comments,
            commentsLength: post.comments?.length || 0
        });
    }, [post.id, post.comments]);

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-500';
            case 'verified': return 'bg-blue-500';
            case 'regular': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const getRoleText = (role) => {
        switch (role) {
            case 'admin': return '管理員';
            case 'verified': return '認證用戶';
            case 'regular': return '一般用戶';
            default: return '用戶';
        }
    };

    const handleLike = async () => {
        console.log('🚀 Starting like toggle for post:', post.id);
        console.log('📊 Current state before toggle:', { liked, likeCount });

        // 樂觀更新 UI
        const previousLiked = liked;
        const previousCount = likeCount;

        const newLiked = !liked;
        const newCount = liked ? likeCount - 1 : likeCount + 1;

        console.log('🔄 Optimistic update:', { newLiked, newCount });

        setLiked(newLiked);
        setLikeCount(newCount);

        try {
            console.log('📡 Calling toggleLike API for post:', post.id);
            const result = await toggleLike(post.id);
            console.log('📥 Toggle like API result:', result);

            if (result.success) {
                console.log('✅ API success, updating to real values:', {
                    liked: result.data.liked,
                    likeCount: result.data.likeCount
                });
                
                setLiked(Boolean(result.data.liked));
                setLikeCount(Number(result.data.likeCount) || 0);
                
                console.log('✅ Like state updated successfully');
                setError('');
            } else {
                console.error('❌ Toggle like failed:', result.error);
                setLiked(previousLiked);
                setLikeCount(previousCount);
                setError(result.error);
            }
        } catch (error) {
            console.error('💥 Toggle like exception:', error);
            setLiked(previousLiked);
            setLikeCount(previousCount);
            setError('操作失敗，請稍後再試');
        }
    };

    // 🔧 新增：評論按鈕點擊處理（包含除錯）
    const handleCommentToggle = () => {
        console.log('💬 Comment button clicked:', {
            currentShowComments: showComments,
            postId: post.id,
            hasComments: post.comments?.length > 0
        });
        setShowComments(!showComments);
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentContent.trim() || isCommenting) return;

        setIsCommenting(true);
        setError('');

        try {
            console.log('Adding comment to post:', post.id, 'Content:', commentContent.trim());
            const result = await addComment(post.id, commentContent.trim());
            console.log('Add comment result:', result);

            if (result.success) {
                setCommentContent('');
                console.log('Comment added successfully:', result.data.comment);

                // 更新貼文的評論數和評論列表
                if (onPostUpdate) {
                    onPostUpdate({
                        ...post,
                        commentCount: (post.commentCount || 0) + 1,
                        comments: [...(post.comments || []), result.data.comment]
                    });
                }
            } else {
                console.error('Add comment failed:', result.error);
                setError(result.error);
            }
        } catch (error) {
            console.error('Add comment exception:', error);
            setError('添加評論失敗，請稍後再試');
        } finally {
            setIsCommenting(false);
        }
    };

    const formatTimeAgo = (dateString) => {
        try {
            const now = new Date();
            const postDate = new Date(dateString);
            const diffInMinutes = (now - postDate) / (1000 * 60);

            if (diffInMinutes < 1) return '剛才';
            if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)} 分鐘`;
            if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} 小時`;

            return formatDistanceToNow(postDate, {
                addSuffix: true,
                locale: zhTW
            });
        } catch {
            return '剛才';
        }
    };

    return (
        <div className="bg-white border-0 border-b border-gray-100 px-4 py-4 hover:bg-gray-50/50 transition-colors">
            {/* 🔧 加入除錯資訊 - 只在開發環境顯示 */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mb-2 p-2 bg-gray-50 border text-xs text-gray-600 rounded">
                    Post ID: {post.id} | Liked: {liked ? 'true' : 'false'} | Count: {likeCount} | API Liked: {post.liked ? 'true' : 'false'} | API Count: {post.likeCount} | Comments: {post.comments?.length || 0}
                </div>
            )}

            {/* 錯誤提示 */}
            {error && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
                    {error}
                    <button
                        onClick={() => setError('')}
                        className="ml-2 text-red-500 hover:text-red-700"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="flex space-x-3">
                {/* 用戶頭像 - 更大更現代 */}
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-semibold text-lg">
                            {post.user?.displayName?.charAt(0) || post.user?.username?.charAt(0)}
                        </span>
                    </div>
                </div>

                {/* 貼文內容 */}
                <div className="flex-1 min-w-0">
                    {/* 用戶資訊 - 更精緻的排版 */}
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900 text-base">
                            {post.user?.displayName || post.user?.username}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getRoleColor(post.user?.userRole)}`}>
                            {getRoleText(post.user?.userRole)}
                        </span>
                        <span className="text-gray-500 text-sm">@{post.user?.username}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500 text-sm">
                            {formatTimeAgo(post.createdAt)}
                        </span>
                    </div>

                    {/* 貼文內容 - 更好的字體和間距 */}
                    <div className="text-gray-900 mb-4 leading-relaxed">
                        <p className="whitespace-pre-wrap break-words text-base">
                            {post.content}
                        </p>
                    </div>

                    {/* 圖片展示區域 - 適配後端的 imageUrl */}
                    {post.imageUrl && (
                        <div className="mb-4">
                            <img
                                src={post.imageUrl}
                                alt="貼文圖片"
                                className="w-full max-w-lg h-auto rounded-2xl border border-gray-200 shadow-sm"
                            />
                        </div>
                    )}

                    {/* 互動按鈕 - 更像 Threads 的樣式 */}
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-6">
                            {/* 按讚 */}
                            <button
                                onClick={handleLike}
                                className={`flex items-center space-x-2 group transition-all duration-200 ${
                                    liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                                }`}
                            >
                                <div className={`p-2 rounded-full transition-colors ${
                                    liked ? 'bg-red-50' : 'group-hover:bg-red-50'
                                }`}>
                                    <svg className="w-5 h-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium">{likeCount}</span>
                            </button>

                            {/* 🔧 修復評論按鈕 - 使用新的處理函數 */}
                            <button
                                onClick={handleCommentToggle}
                                className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 group transition-all duration-200"
                            >
                                <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium">{post.commentCount || 0}</span>
                            </button>

                            {/* 分享 */}
                            <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 group transition-all duration-200">
                                <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium">分享</span>
                            </button>
                        </div>

                        {/* 更多選項 */}
                        <button className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                        </button>
                    </div>

                    {/* 🔧 完全重寫評論區域 */}
                    {showComments && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            {/* 🔧 加入除錯資訊 */}
                            {process.env.NODE_ENV === 'development' && (
                                <div className="mb-2 p-2 bg-blue-50 border text-xs text-blue-600 rounded">
                                    除錯: 評論數量 = {post.comments?.length || 0} | 顯示狀態 = {showComments ? '展開' : '收起'}
                                </div>
                            )}
                            
                            {/* 評論輸入區域 */}
                            <form onSubmit={handleAddComment} className="flex space-x-3 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-medium">
                                        {currentUser?.displayName?.charAt(0) || currentUser?.username?.charAt(0)}
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="寫個評論..."
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    disabled={isCommenting}
                                    className={`flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                        isCommenting ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                />
                                <button
                                    type="submit"
                                    disabled={!commentContent.trim() || isCommenting}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        commentContent.trim() && !isCommenting
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {isCommenting ? '發布中...' : '發布'}
                                </button>
                            </form>

                            {/* 🔧 改進的評論列表顯示 */}
                            {post.comments && post.comments.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="text-sm text-gray-500 mb-2">
                                        共 {post.comments.length} 條評論
                                    </div>
                                    {post.comments.map((comment) => (
                                        <div key={comment.id} className="flex space-x-3">
                                            <div className="w-6 h-6 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-xs">
                                                    {comment.user?.displayName?.charAt(0) || comment.user?.username?.charAt(0)}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <span className="font-medium text-sm text-gray-900">
                                                        {comment.user?.displayName || comment.user?.username}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatTimeAgo(comment.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-800">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    還沒有評論，成為第一個留言的人吧！
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EnhancedPostCard;