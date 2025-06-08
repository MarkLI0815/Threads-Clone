// frontend/src/components/PostComposer.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const PostComposer = ({ onPostCreated }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() || isPosting) return;

        setIsPosting(true);
        try {
            // 這裡之後會連接到實際的 API
            const newPost = {
                id: Date.now(),
                content: content.trim(),
                user: {
                    id: user.id,
                    username: user.username,
                    displayName: user.displayName,
                    userRole: user.userRole
                },
                likeCount: 0,
                commentCount: 0,
                createdAt: new Date().toISOString(),
                liked: false
            };

            if (onPostCreated) {
                onPostCreated(newPost);
            }

            setContent('');
        } catch (error) {
            console.error('發布貼文失敗:', error);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <form onSubmit={handleSubmit}>
                <div className="flex space-x-3">
                    {/* 用戶頭像 */}
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                                {user?.displayName?.charAt(0) || user?.username?.charAt(0)}
                            </span>
                        </div>
                    </div>

                    {/* 輸入區域 */}
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-gray-900">
                                {user?.displayName || user?.username}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getRoleColor(user?.userRole)}`}>
                                {getRoleText(user?.userRole)}
                            </span>
                        </div>

                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="分享你的想法..."
                            className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows="3"
                            maxLength="500"
                        />

                        {/* 字數統計 */}
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-500">
                                {content.length}/500
                            </span>

                            {/* 功能按鈕 */}
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                                    title="添加圖片"
                                >
                                    📷
                                </button>
                                <button
                                    type="button"
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                                    title="添加表情"
                                >
                                    😊
                                </button>
                                <button
                                    type="submit"
                                    disabled={!content.trim() || isPosting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPosting ? '發布中...' : '發布'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PostComposer;