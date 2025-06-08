// frontend/src/context/FollowContext.js - 無限循環修復版
import React, { createContext, useContext, useState, useCallback } from 'react';

const FollowContext = createContext({});

export const useFollow = () => {
    const context = useContext(FollowContext);
    if (!context) {
        throw new Error('useFollow must be used within a FollowProvider');
    }
    return context;
};

export const FollowProvider = ({ children }) => {
    // 用戶追蹤狀態映射 { userId: isFollowing }
    const [followStates, setFollowStatesInternal] = useState({});

    // 🔥 修復：使用 useCallback 記憶化函數，避免無限循環
    const updateFollowState = useCallback((userId, isFollowing) => {
        setFollowStatesInternal(prev => ({
            ...prev,
            [userId]: isFollowing
        }));
    }, []);

    // 🔥 修復：使用 useCallback 記憶化函數
    const getFollowState = useCallback((userId) => {
        return followStates[userId];
    }, [followStates]);

    // 🔥 修復：使用 useCallback 記憶化函數
    const initializeFollowStates = useCallback((states) => {
        setFollowStatesInternal(states);
    }, []);

    // 🔥 修復：使用 useCallback 記憶化函數
    const clearFollowStates = useCallback(() => {
        setFollowStatesInternal({});
    }, []);

    // 🔥 修復：使用 useMemo 記憶化 value 物件，避免不必要的重新渲染
    const value = React.useMemo(() => ({
        followStates,
        updateFollowState,
        getFollowState,
        initializeFollowStates,
        clearFollowStates
    }), [followStates, updateFollowState, getFollowState, initializeFollowStates, clearFollowStates]);

    return (
        <FollowContext.Provider value={value}>
            {children}
        </FollowContext.Provider>
    );
};