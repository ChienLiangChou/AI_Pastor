#!/bin/bash

# 自動部署腳本 - 前端和後端
# 使用方式: ./deploy-auto.sh "commit message"
# 或: npm run deploy "commit message"

set -e  # 遇到錯誤立即停止

COMMIT_MSG=${1:-"Auto deploy: Update code $(date +'%Y-%m-%d %H:%M:%S')"}

echo "🚀 開始自動部署流程..."
echo "📝 Commit message: $COMMIT_MSG"
echo ""

# 檢查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "📦 發現未提交的更改，開始提交..."
    
    # 添加所有更改
    git add .
    
    # 提交更改
    git commit -m "$COMMIT_MSG"
    
    echo "✅ 更改已提交"
    echo ""
else
    echo "ℹ️  沒有未提交的更改，檢查是否需要建置..."
fi

# 檢查是否需要建置前端（如果 index.html 有更改或 dist 不存在）
NEED_BUILD=false
if [ ! -d "dist" ]; then
    NEED_BUILD=true
    echo "📁 dist 目錄不存在，需要建置"
elif git diff --quiet HEAD -- index.html 2>/dev/null; then
    # index.html 沒有更改
    if [ -z "$(git status --porcelain dist/ 2>/dev/null)" ]; then
        echo "ℹ️  前端文件沒有更改，跳過建置"
    else
        NEED_BUILD=true
        echo "📝 dist 目錄有未提交的更改，需要重新建置"
    fi
else
    NEED_BUILD=true
    echo "📝 index.html 有更改，需要重新建置"
fi

if [ "$NEED_BUILD" = true ]; then
    echo "🔨 建置前端..."
    npm run build
    if [ -n "$(git status --porcelain dist/)" ]; then
        git add dist/
        git commit -m "Build frontend: $COMMIT_MSG" || true
    fi
    echo "✅ 前端建置完成"
    echo ""
fi

# 推送到 GitHub（這會觸發 Vercel 和 Render 的自動部署）
echo "📤 推送到 GitHub..."
if git push origin main; then
    echo ""
    echo "✅ 部署流程完成！"
    echo ""
    echo "📋 部署狀態："
    echo "  - 前端 (Vercel): 會自動從 GitHub 部署"
    echo "  - 後端 (Render): 會自動從 GitHub 部署"
    echo ""
    echo "⏳ 請等待 1-2 分鐘讓平台完成部署"
    echo "🔍 檢查部署狀態："
    echo "  - Vercel: https://vercel.com/dashboard"
    echo "  - Render: https://dashboard.render.com/"
else
    echo "❌ 推送失敗，請檢查網路連接或權限"
    exit 1
fi
