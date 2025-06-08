// frontend/src/components/PostCard.js
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const PostCard = ({ post, currentUser }) => {
    const [liked, setLiked] = useState(post.liked || false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [showComments, setShowComments] = useState(false);

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
        // 樂觀更新 UI
        setLiked(!liked);
        setLikeCount(prev => liked ? prev - 1 : prev + 1);

        try {
            // 這裡之後會連接到實際的 API
            console.log('Toggle like for post:', post.id);
        } catch (error) {
            // 如果失敗，回滾狀態
            setLiked(liked);
            setLikeCount(likeCount);
            console.error('按讚失敗:', error);
        }
    };

    const formatTimeAgo = (dateString) => {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: zhTW
            });
        } catch {
            return '剛才';
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-sm transition-shadow">
            {/* 貼文頭部 */}
            <div className="flex items-start space-x-3">
                {/* 用戶頭像 */}
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                            {post.user?.displayName?.charAt(0) || post.user?.username?.charAt(0)}
                        </span>
                    </div>
                </div>

                {/* 貼文內容 */}
                <div className="flex-1 min-w-0">
                    {/* 用戶資訊 */}
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                            {post.user?.displayName || post.user?.username}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getRoleColor(post.user?.userRole)}`}>
                            {getRoleText(post.user?.userRole)}
                        </span>
                        <span className="text-sm text-gray-500">@{post.user?.username}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">
                            {formatTimeAgo(post.createdAt)}
                        </span>
                    </div>

                    {/* 貼文內容 */}
                    <div className="text-gray-900 mb-3">
                        <p className="whitespace-pre-wrap break-words">
                            {post.content}
                        </p>
                    </div>

                    {/* 圖片 (如果有) */}
                    {post.imageUrl && (
                        <div className="mb-3">
                            <img
                                src={post.imageUrl}
                                alt="貼文圖片"
                                className="max-w-full h-auto rounded-lg border border-gray-200"
                            />
                        </div>
                    )}

                    {/* 互動按鈕 */}
                    <div className="flex items-center space-x-6 text-gray-500">
                        {/* 按讚 */}
                        <button
                            onClick={handleLike}
                            className={`flex items-center space-x-2 hover:text-red-500 transition-colors ${liked ? 'text-red-500' : ''
                                }`}
                        >
                            <span className="text-lg">{liked ? '❤️' : '🤍'}</span>
                            <span className="text-sm">{likeCount}</span>
                        </button>

                        {/* 評論 */}
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="flex items-center space-x-2 hover:text-blue-500 transition-colors"
                        >
                            <span className="text-lg">💬</span>
                            <span className="text-sm">{post.commentCount || 0}</span>
                        </button>

                        {/* 分享 */}
                        <button className="flex items-center space-x-2 hover:text-green-500 transition-colors">
                            <span className="text-lg">🔄</span>
                            <span className="text-sm">分享</span>
                        </button>

                        {/* 更多選項 */}
                        <button className="flex items-center space-x-2 hover:text-gray-700 transition-colors ml-auto">
                            <span className="text-lg">⋯</span>
                        </button>
                    </div>

                    {/* 評論區域 */}
                    {showComments && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex space-x-3 mb-4">
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-medium text-gray-700">
                                        {currentUser?.displayName?.charAt(0) || currentUser?.username?.charAt(0)}
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="寫個評論..."
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* 評論列表 */}
                            <div className="space-y-3">
                                {/* 這裡之後會顯示實際的評論 */}
                                <div className="text-sm text-gray-500 text-center py-2">
                                    暫無評論
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostCard;