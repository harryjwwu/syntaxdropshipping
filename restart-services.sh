#!/bin/bash

# Syntax Dropshipping 服务重启脚本
# Author: AI Assistant
# Date: $(date +%Y-%m-%d)

echo "🔄 正在重启 Syntax Dropshipping 前后端服务..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 停止现有服务
echo -e "${YELLOW}🛑 正在停止现有服务...${NC}"

# 杀掉后端 Node.js 进程
echo "  - 停止后端服务器..."
pkill -f "node server.js" 2>/dev/null || echo "    后端服务器未运行"

# 杀掉前端 React 进程
echo "  - 停止前端服务器..."
pkill -f "react-scripts" 2>/dev/null || echo "    前端服务器未运行"

# 杀掉管理后台 React 进程
echo "  - 停止管理后台服务器..."
pkill -f "admin.*react-scripts" 2>/dev/null || echo "    管理后台服务器未运行"

# 等待进程完全停止
echo "  - 等待进程停止..."
sleep 3

# 2. 检查端口是否被释放
echo -e "${BLUE}🔍 检查端口状态...${NC}"
if lsof -i :5001 >/dev/null 2>&1; then
    echo -e "${RED}  ⚠️ 端口 5001 仍被占用，强制终止...${NC}"
    lsof -ti:5001 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${RED}  ⚠️ 端口 3000 仍被占用，强制终止...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

if lsof -i :3001 >/dev/null 2>&1; then
    echo -e "${RED}  ⚠️ 端口 3001 仍被占用，强制终止...${NC}"
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

echo -e "${GREEN}  ✅ 端口已释放${NC}"

# 3. 启动后端服务器
echo -e "${BLUE}🚀 启动后端服务器...${NC}"
cd server
nohup node server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 5

# 检查后端是否启动成功
if lsof -i :5001 >/dev/null 2>&1; then
    echo -e "${GREEN}  ✅ 后端服务器启动成功 (PID: $BACKEND_PID) - http://localhost:5001${NC}"
else
    echo -e "${RED}  ❌ 后端服务器启动失败${NC}"
    echo "查看日志: tail -f backend.log"
    exit 1
fi

# 4. 启动前端服务器
echo -e "${BLUE}🎨 启动前端服务器...${NC}"
cd client
nohup npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# 等待前端启动
echo "  - 等待前端编译完成..."
sleep 15

# 检查前端是否启动成功
if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${GREEN}  ✅ 前端服务器启动成功 (PID: $FRONTEND_PID) - http://localhost:3000${NC}"
else
    echo -e "${RED}  ❌ 前端服务器启动失败${NC}"
    echo "查看日志: tail -f frontend.log"
    exit 1
fi

# 5. 启动管理后台服务器
echo -e "${BLUE}🔧 启动管理后台服务器...${NC}"
cd admin
nohup npm start > ../admin.log 2>&1 &
ADMIN_PID=$!
cd ..

# 等待管理后台启动
echo "  - 等待管理后台编译完成..."
sleep 15

# 检查管理后台是否启动成功
if lsof -i :3001 >/dev/null 2>&1; then
    echo -e "${GREEN}  ✅ 管理后台服务器启动成功 (PID: $ADMIN_PID) - http://localhost:3001${NC}"
else
    echo -e "${RED}  ❌ 管理后台服务器启动失败${NC}"
    echo "查看日志: tail -f admin.log"
fi

# 6. 服务状态检查
echo -e "${BLUE}🔍 服务状态检查...${NC}"

# 检查后端API
if curl -s http://localhost:5001/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}  ✅ 后端API正常响应${NC}"
else
    echo -e "${RED}  ⚠️ 后端API响应异常${NC}"
fi

# 检查前端页面
if curl -s http://localhost:3000 | grep -q "Syntax Dropshipping" 2>/dev/null; then
    echo -e "${GREEN}  ✅ 前端页面正常加载${NC}"
else
    echo -e "${RED}  ⚠️ 前端页面加载异常${NC}"
fi

# 检查管理后台页面
if curl -s http://localhost:3001 >/dev/null 2>&1; then
    echo -e "${GREEN}  ✅ 管理后台页面正常加载${NC}"
else
    echo -e "${RED}  ⚠️ 管理后台页面加载异常${NC}"
fi

echo ""
echo -e "${GREEN}🎉 服务重启完成！${NC}"
echo ""
echo -e "${BLUE}📊 服务信息：${NC}"
echo "  - 后端服务器: http://localhost:5001 (PID: $BACKEND_PID)"
echo "  - 前端服务器: http://localhost:3000 (PID: $FRONTEND_PID)"
echo "  - 管理后台:   http://localhost:3001 (PID: $ADMIN_PID)"
echo "  - 注册页面:   http://localhost:3000/register"
echo "  - 管理登录:   http://localhost:3001/login"
echo ""
echo -e "${YELLOW}📝 日志文件：${NC}"
echo "  - 后端日志: tail -f backend.log"
echo "  - 前端日志: tail -f frontend.log"
echo "  - 管理后台日志: tail -f admin.log"
echo ""
echo -e "${BLUE}🛠️ 常用命令：${NC}"
echo "  - 查看进程: lsof -i :5001 && lsof -i :3000 && lsof -i :3001"
echo "  - 停止服务: pkill -f 'node server.js' && pkill -f 'react-scripts'"
echo ""