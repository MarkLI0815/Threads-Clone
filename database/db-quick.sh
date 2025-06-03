#!/bin/bash

case "$1" in
    status)
        echo "📊 資料庫快速狀態檢查："
        docker exec social_platform_mysql mysql -u social_user -psocial_password123 social_platform -e "
        SHOW TABLES;
        SELECT CONCAT('👥 Users: ', COUNT(*)) AS summary FROM users;
        SELECT CONCAT('📝 Posts: ', COUNT(*)) AS summary FROM posts;
        SELECT CONCAT('👥 Follows: ', COUNT(*)) AS summary FROM follows;
        SELECT CONCAT('❤️ Likes: ', COUNT(*)) AS summary FROM likes;
        "
        ;;
    users)
        echo "👥 用戶列表："
        docker exec social_platform_mysql mysql -u social_user -psocial_password123 social_platform -e "
        SELECT username, user_role, created_at FROM users ORDER BY created_at;
        "
        ;;
    posts)
        echo "📝 貼文列表："
        docker exec social_platform_mysql mysql -u social_user -psocial_password123 social_platform -e "
        SELECT p.content, u.username as author, p.like_count, p.created_at 
        FROM posts p 
        JOIN users u ON p.user_id = u.id 
        ORDER BY p.created_at DESC;
        "
        ;;
    shell)
        echo "🔗 進入 MySQL..."
        docker exec -it social_platform_mysql mysql -u social_user -psocial_password123 social_platform
        ;;
    *)
        echo "使用方法: $0 {status|users|posts|shell}"
        echo "  status - 快速狀態檢查"
        echo "  users  - 顯示用戶列表"  
        echo "  posts  - 顯示貼文列表"
        echo "  shell  - 進入 MySQL 命令列"
        ;;
esac
