#!/bin/bash

# 快速重启脚本 - 简化版
echo "🔄 快速重启服务..."

# 停止服务
pkill -f "node server.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
sleep 2

# 强制清理端口
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# 启动服务
echo "🚀 启动后端..."
cd server && nohup node server.js > ../backend.log 2>&1 & cd ..

echo "🎨 启动前端..."
cd client && nohup npm start > ../frontend.log 2>&1 & cd ..

echo "✅ 服务启动中，请等待10-15秒..."
echo "后端: http://localhost:5001"
echo "前端: http://localhost:3000"