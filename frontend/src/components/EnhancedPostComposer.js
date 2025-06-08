// frontend/src/components/EnhancedPostComposer.js
import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPost } from '../services/postService';
import { uploadMultipleImages } from '../services/uploadService';

const EnhancedPostComposer = ({ onPostCreated }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [images, setImages] = useState([]);
    const [isPosting, setIsPosting] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

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

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 4) {
            setError('最多只能上傳 4 張圖片');
            return;
        }

        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setImages(prev => [...prev, {
                        id: Date.now() + Math.random(),
                        file: file,
                        url: e.target.result,
                        uploaded: false
                    }]);
                };
                reader.readAsDataURL(file);
            }
        });
    };

    const removeImage = (imageId) => {
        setImages(prev => prev.filter(img => img.id !== imageId));
    };

    // ✅ 修復後的 handleSubmit - 重新啟用圖片上傳功能
    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!content.trim() && images.length === 0) || isPosting) return;

        setIsPosting(true);
        setError('');

        try {
            console.log('📝 提交貼文 - 內容:', content.trim());
            console.log('🖼️ 圖片數量:', images.length);

            let imageUrl = null;

            // ✅ 重新啟用圖片上傳功能
            if (images.length > 0) {
                console.log('📤 開始上傳圖片:', images.length, '張');
                
                const imagesToUpload = images.map(img => img.file);
                const uploadResult = await uploadMultipleImages(imagesToUpload);

                if (uploadResult.success) {
                    console.log('✅ 圖片上傳成功:', uploadResult.data);
                    // 取第一張圖片的 URL（目前貼文只支援單張圖片顯示）
                    imageUrl = uploadResult.data.images[0].url;
                    console.log('🔗 圖片 URL:', imageUrl);
                } else {
                    console.error('❌ 圖片上傳失敗:', uploadResult.error);
                    setError('圖片上傳失敗：' + uploadResult.error);
                    setIsPosting(false);
                    return;
                }
            }

            // 準備貼文數據
            const postData = {
                content: content.trim()
            };

            // ✅ 如果有圖片 URL，加入貼文數據
            if (imageUrl) {
                postData.imageUrl = imageUrl;
                console.log('📸 貼文包含圖片:', imageUrl);
            }

            console.log('📡 呼叫 createPost API，數據:', postData);
            const result = await createPost(postData);
            console.log('📡 CreatePost 回應:', result);

            if (result.success) {
                console.log('✅ 貼文發布成功:', result.data);

                // 通知父組件新貼文已創建
                if (onPostCreated) {
                    onPostCreated(result.data.post);
                }

                // 重置表單
                setContent('');
                setImages([]);
                setError('');
                
                // 成功提示
                if (imageUrl) {
                    console.log('🎉 貼文發布成功！包含圖片');
                } else {
                    console.log('🎉 純文字貼文發布成功');
                }
            } else {
                console.error('❌ 建立貼文失敗:', result.error);
                setError(result.error || '發布貼文失敗');
            }
        } catch (error) {
            console.error('💥 發布貼文異常:', error);
            setError('發布貼文時發生錯誤，請稍後再試');
        } finally {
            setIsPosting(false);
        }
    };

    const canPost = (content.trim() || images.length > 0) && !isPosting;

    return (
        <div className="bg-white border-0 border-b border-gray-100 px-4 py-4">
            {/* 錯誤提示 */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="flex space-x-3">
                    {/* 用戶頭像 */}
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-semibold text-lg">
                                {user?.displayName?.charAt(0) || user?.username?.charAt(0)}
                            </span>
                        </div>
                    </div>

                    {/* 輸入區域 */}
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="font-semibold text-gray-900">
                                {user?.displayName || user?.username}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getRoleColor(user?.userRole)}`}>
                                {getRoleText(user?.userRole)}
                            </span>
                        </div>

                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="有什麼新鮮事？"
                            className="w-full p-0 border-0 resize-none focus:ring-0 text-lg placeholder-gray-400 bg-transparent"
                            rows="3"
                            maxLength="500"
                            style={{ outline: 'none' }}
                        />

                        {/* 圖片預覽區域 */}
                        {images.length > 0 && (
                            <div className="mt-4">
                                <div className={`grid gap-2 rounded-2xl overflow-hidden ${
                                    images.length === 1 ? 'grid-cols-1' :
                                    images.length === 2 ? 'grid-cols-2' :
                                    images.length === 3 ? 'grid-cols-2' :
                                    'grid-cols-2'
                                }`}>
                                    {images.map((image, index) => (
                                        <div
                                            key={image.id}
                                            className={`relative group ${
                                                images.length === 3 && index === 0 ? 'row-span-2' : ''
                                            }`}
                                        >
                                            <img
                                                src={image.url}
                                                alt={`預覽 ${index + 1}`}
                                                className={`w-full object-cover ${
                                                    images.length === 1 ? 'h-64' :
                                                    images.length === 3 && index === 0 ? 'h-full' :
                                                    'h-32'
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(image.id)}
                                                className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                            {/* 上傳狀態指示器 */}
                                            {isPosting && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                    <div className="text-white text-sm">上傳中...</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 功能按鈕區域 */}
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center space-x-4">
                                {/* 圖片上傳 */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                                    disabled={images.length >= 4 || isPosting}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </button>

                                {/* GIF 按鈕 */}
                                <button
                                    type="button"
                                    className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors"
                                    disabled={isPosting}
                                >
                                    <span className="text-sm font-bold">GIF</span>
                                </button>

                                {/* 表情符號 */}
                                <button
                                    type="button"
                                    className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-full transition-colors"
                                    disabled={isPosting}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>

                                {/* 字數統計 */}
                                <span className="text-sm text-gray-400">
                                    {content.length}/500
                                </span>
                            </div>

                            {/* 發布按鈕 */}
                            <button
                                type="submit"
                                disabled={!canPost}
                                className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${
                                    canPost
                                        ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {isPosting ? 
                                    (images.length > 0 ? '上傳圖片中...' : '發布中...') 
                                    : '發布'
                                }
                            </button>
                        </div>
                    </div>
                </div>

                {/* 隱藏的文件輸入 */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                />
            </form>
        </div>
    );
};

export default EnhancedPostComposer;