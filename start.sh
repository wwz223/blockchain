#!/bin/bash

echo "🚀 启动区块链模拟项目"
echo "===================="

# 检查是否有 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查是否有 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

echo "📦 检查后端依赖..."
if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend && npm install && cd ..
fi

echo "📦 检查前端依赖..."
if [ ! -d "fronend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd fronend && npm install && cd ..
fi

echo ""
echo "🔧 启动服务..."
echo "后端服务将在 http://localhost:3001 启动"
echo "前端应用将在 http://localhost:5173 启动"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 启动后端服务 (后台)
echo "🔄 启动后端服务..."
cd backend && npm start &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端服务 (后台)
echo "🔄 启动前端服务..."
cd fronend && npm run dev &
FRONTEND_PID=$!

# 等待用户中断
wait

# 清理进程
echo "🛑 停止服务..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
echo "✅ 服务已停止"