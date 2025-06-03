#!/bin/bash

# Docker 管理腳本

case "$1" in
    start)
        echo "🚀 啟動 Docker 開發環境..."
        docker-compose up -d
        echo "✅ 服務已啟動！"
        echo "📊 MySQL: localhost:3306"
        echo "🔴 Redis: localhost:6379"
        echo "🌐 phpMyAdmin: http://localhost:8080"
        echo "🔧 Redis Commander: http://localhost:8081"
        ;;
    stop)
        echo "🛑 停止 Docker 開發環境..."
        docker-compose down
        echo "✅ 服務已停止！"
        ;;
    restart)
        echo "🔄 重啟 Docker 開發環境..."
        docker-compose down
        docker-compose up -d
        echo "✅ 服務已重啟！"
        ;;
    status)
        echo "📋 Docker 服務狀態："
        docker-compose ps
        ;;
    logs)
        echo "📜 查看服務日誌："
        docker-compose logs -f
        ;;
    clean)
        echo "🧹 清理 Docker 資源 (謹慎使用!)..."
        docker-compose down -v
        docker system prune -f
        echo "✅ 清理完成！"
        ;;
    *)
        echo "使用方法: $0 {start|stop|restart|status|logs|clean}"
        echo ""
        echo "指令說明："
        echo "  start   - 啟動所有服務"
        echo "  stop    - 停止所有服務"
        echo "  restart - 重啟所有服務"
        echo "  status  - 查看服務狀態"
        echo "  logs    - 查看服務日誌"
        echo "  clean   - 清理所有資源 (會刪除資料!)"
        exit 1
        ;;
esac
