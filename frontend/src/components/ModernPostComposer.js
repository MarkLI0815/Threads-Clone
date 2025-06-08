// frontend/src/components/ModernPostComposer.js
import React, { useState, useContext, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPost } from '../services/postService';
import { uploadSingleImage } from '../services/uploadService';

const ModernPostComposer = ({ onPostCreated }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const MAX_CONTENT_LENGTH = 500;
    const remainingChars = MAX_CONTENT_LENGTH - content.length;
    const isOverLimit = remainingChars < 0;

    // 處理圖片選擇
    const handleImageSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // 檢查檔案大小 (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('圖片檔案不能超過 5MB');
                return;
            }

            // 檢查檔案類型
            if (!file.type.startsWith('image/')) {
                alert('請選擇圖片檔案');
                return;
            }

            setSelectedImage(file);

            // 創建預覽
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // 移除圖片
    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 提交貼文
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!content.trim() || isOverLimit || isLoading) {
            return;
        }

        setIsLoading(true);

        try {
            let imageUrl = null;

            // 如果有選擇圖片，先上傳
            if (selectedImage) {
                setIsUploading(true);
                const uploadResult = await uploadSingleImage(selectedImage);
                setIsUploading(false);

                if (uploadResult.success) {
                    imageUrl = uploadResult.data.imageUrl;
                } else {
                    console.error('Image upload failed:', uploadResult.error);
                    alert('圖片上傳失敗：' + uploadResult.error);
                    setIsLoading(false);
                    return;
                }
            }

            // 創建貼文
            const postData = {
                content: content.trim(),
                ...(imageUrl && { imageUrl })
            };

            const result = await createPost(postData);

            if (result.success) {
                console.log('✅ 貼文創建成功:', result.data);

                // 重置表單
                setContent('');
                removeImage();

                // 🔥 修復：正確調用父組件回調
                if (onPostCreated && result.data) {
                    console.log('🔄 調用 onPostCreated 回調:', result.data);
                    onPostCreated(result.data);  // 🔥 result.data 就是貼文對象
                }

                // 🔥 可選：顯示成功訊息
                console.log('✅ 貼文發布成功！');

            } else {
                console.error('❌ 貼文創建失敗:', result.error);
                alert('發布失敗：' + result.error);
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('發布時發生錯誤');
        } finally {
            setIsLoading(false);
        }
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

    return (
        <div className="border-b border-gray-800 px-6 py-4">
            <form onSubmit={handleSubmit}>
                <div className="flex space-x-4">
                    {/* 用戶頭像 */}
                    <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRoleColor(user?.userRole)} flex items-center justify-center text-white font-semibold text-xl relative`}>
                            {user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                            {/* 角色標誌 */}
                            {getRoleIcon(user?.userRole) && (
                                <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-1">
                                    {getRoleIcon(user?.userRole)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 發文區域 */}
                    <div className="flex-1">
                        {/* 用戶信息 */}
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="font-semibold text-white">
                                {user?.displayName || user?.username}
                            </span>
                            {getRoleIcon(user?.userRole)}
                        </div>

                        {/* 文字輸入區域 */}
                        <div className="relative">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="有什麼新鮮事？"
                                className="w-full bg-transparent text-white text-xl placeholder-gray-500 resize-none border-none outline-none"
                                rows="3"
                                disabled={isLoading}
                                style={{ minHeight: '80px' }}
                            />

                            {/* 字數統計 */}
                            <div className="absolute bottom-2 right-2">
                                <div className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
                                    {remainingChars < 100 && (
                                        <span>{remainingChars}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 圖片預覽 */}
                        {imagePreview && (
                            <div className="mt-4 relative">
                                <div className="relative inline-block rounded-2xl overflow-hidden border border-gray-700 max-w-md">
                                    <img
                                        src={imagePreview}
                                        alt="預覽圖片"
                                        className="max-w-full h-auto max-h-80 object-cover"
                                    />
                                    {/* 移除圖片按鈕 */}
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-70 text-white rounded-full flex items-center justify-center hover:bg-opacity-90 transition-all duration-200"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 上傳進度提示 */}
                        {isUploading && (
                            <div className="mt-3 flex items-center space-x-2 text-blue-400">
                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">正在上傳圖片...</span>
                            </div>
                        )}

                        {/* 工具列 */}
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-4">
                                {/* 圖片上傳按鈕 */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-full transition-colors duration-200 disabled:opacity-50"
                                    title="添加圖片"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </button>

                                {/* GIF 按鈕 (暫時不可用) */}
                                <button
                                    type="button"
                                    disabled
                                    className="p-2 text-gray-600 rounded-full cursor-not-allowed"
                                    title="GIF (即將推出)"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m4 0H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM9 8h6m-6 4h6m-6 4h4" />
                                    </svg>
                                </button>

                                {/* 投票按鈕 (暫時不可用) */}
                                <button
                                    type="button"
                                    disabled
                                    className="p-2 text-gray-600 rounded-full cursor-not-allowed"
                                    title="投票 (即將推出)"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </button>
                            </div>

                            {/* 發布按鈕 */}
                            <button
                                type="submit"
                                disabled={!content.trim() || isOverLimit || isLoading}
                                className={`
                                    px-6 py-2 rounded-full font-semibold text-sm transition-all duration-200
                                    ${(!content.trim() || isOverLimit || isLoading)
                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105'
                                    }
                                `}
                            >
                                {isLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>發布中...</span>
                                    </div>
                                ) : (
                                    '發布'
                                )}
                            </button>
                        </div>

                        {/* 隱藏的文件輸入 */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ModernPostComposer;