// frontend/src/components/FollowButton.js - 無限循環修復版
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFollow } from '../context/FollowContext';
import { followUser, unfollowUser } from '../services/followService';

const FollowButton = ({ 
    targetUser, 
    onFollowChange,
    size = 'sm',
    className = '' 
}) => {
    const { user: currentUser } = useAuth();
    const { getFollowState, updateFollowState } = useFollow();
    const [isLoading, setIsLoading] = useState(false);
    
    // 🔥 修復：使用 ref 來避免 useEffect 依賴問題
    const updateFollowStateRef = useRef(updateFollowState);
    updateFollowStateRef.current = updateFollowState;

    // 🔥 修復：使用 ref 來存儲 targetUser，避免不必要的 effect 觸發
    const targetUserRef = useRef(targetUser);
    targetUserRef.current = targetUser;

    // 從全局狀態獲取追蹤狀態，如果沒有則使用 targetUser 的初始狀態
    const isFollowing = getFollowState(targetUser?.id) ?? targetUser?.isFollowing ?? false;

    // 🔥 修復：簡化 useEffect，移除函數依賴，使用 ref
    useEffect(() => {
        const currentTargetUser = targetUserRef.current;
        if (currentTargetUser?.isFollowing !== undefined && currentTargetUser?.id) {
            // 只在狀態真的不同時才更新
            const currentState = getFollowState(currentTargetUser.id);
            if (currentState !== currentTargetUser.isFollowing) {
                updateFollowStateRef.current(currentTargetUser.id, currentTargetUser.isFollowing);
            }
        }
    }, [targetUser?.id, targetUser?.isFollowing]); // 🔥 移除 updateFollowState 依賴

    // 如果是自己，不顯示追蹤按鈕
    if (!currentUser || !targetUser || currentUser.id === targetUser.id) {
        return null;
    }

    const handleToggleFollow = async () => {
        if (isLoading) return;

        setIsLoading(true);
        
        try {
            let result;
            if (isFollowing) {
                result = await unfollowUser(targetUser.id);
            } else {
                result = await followUser(targetUser.id);
            }

            if (result.success) {
                const newFollowState = !isFollowing;
                
                // 更新全局狀態，這會同步所有相關的追蹤按鈕
                updateFollowStateRef.current(targetUser.id, newFollowState);
                
                // 通知父組件追蹤狀態變更
                if (onFollowChange) {
                    onFollowChange({
                        targetUserId: targetUser.id,
                        isFollowing: newFollowState,
                        followersChange: newFollowState ? 1 : -1
                    });
                }
            } else {
                console.error('追蹤/取消追蹤失敗:', result.error);
            }
        } catch (error) {
            console.error('追蹤/取消追蹤錯誤:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 根據大小設定樣式
    const sizeClasses = {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    const baseClasses = `
        font-semibold rounded-full border transition-all duration-200 flex items-center space-x-1
        ${sizeClasses[size]}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
    `;

    // Threads 風格的按鈕設計
    const followingClasses = `
        ${baseClasses}
        bg-gray-100 text-gray-700 border-gray-300 
        hover:bg-red-50 hover:text-red-600 hover:border-red-300
    `;

    const notFollowingClasses = `
        ${baseClasses}
        bg-blue-500 text-white border-blue-500 
        hover:bg-blue-600 hover:border-blue-600
    `;

    return (
        <button
            onClick={handleToggleFollow}
            disabled={isLoading}
            className={`${isFollowing ? followingClasses : notFollowingClasses} ${className}`}
            aria-label={isFollowing ? `取消追蹤 ${targetUser.displayName || targetUser.username}` : `追蹤 ${targetUser.displayName || targetUser.username}`}
        >
            {isLoading ? (
                <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>處理中...</span>
                </div>
            ) : (
                <div className="flex items-center space-x-1">
                    {/* Threads 風格：未追蹤時顯示加號 */}
                    {!isFollowing && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    )}
                    <span>
                        {isFollowing ? '追蹤中' : '追蹤'}
                    </span>
                </div>
            )}
        </button>
    );
};

export default FollowButton;