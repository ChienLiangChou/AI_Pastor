#!/bin/bash

# AI Pastor 自動部署腳本
# 此腳本會協助您完成部署流程

set -e

echo "🚀 AI Pastor 自動部署腳本"
echo "=========================="
echo ""

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 檢查必要的工具
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ 未安裝 $1${NC}"
        echo "請先安裝 $1"
        exit 1
    fi
    echo -e "${GREEN}✅ $1 已安裝${NC}"
}

echo "📋 檢查必要工具..."
check_tool "git"
check_tool "node"
check_tool "npm"

echo ""
echo "📦 初始化 Git 倉庫..."
if [ ! -d ".git" ]; then
    git init
    echo -e "${GREEN}✅ Git 倉庫已初始化${NC}"
else
    echo -e "${YELLOW}⚠️  Git 倉庫已存在${NC}"
fi

echo ""
echo "📝 建立初始提交..."
git add .
git commit -m "Initial commit: AI Pastor application" || echo "已是最新提交"

echo ""
echo "🌐 部署選項："
echo "1. Railway (後端) + Netlify (前端) - 推薦"
echo "2. Render (後端) + Vercel (前端)"
echo "3. 手動部署指南"
echo ""
read -p "請選擇部署方式 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚂 Railway + Netlify 部署"
        echo "========================"
        echo ""
        echo "步驟 1: 推送到 GitHub"
        echo "-------------------"
        read -p "GitHub 倉庫名稱 (例如: ai-pastor): " repo_name
        read -p "GitHub 用戶名: " github_user
        
        echo ""
        echo "正在建立 GitHub 倉庫..."
        
        # 檢查是否已設定 remote
        if git remote | grep -q "origin"; then
            echo -e "${YELLOW}⚠️  已存在 origin remote${NC}"
            read -p "是否更新? (y/n): " update_remote
            if [ "$update_remote" = "y" ]; then
                git remote set-url origin "https://github.com/$github_user/$repo_name.git"
            fi
        else
            git remote add origin "https://github.com/$github_user/$repo_name.git"
        fi
        
        echo ""
        echo "📤 推送到 GitHub..."
        echo "請確保您已經："
        echo "1. 在 GitHub 上建立了名為 '$repo_name' 的倉庫"
        echo "2. 已設定 GitHub 認證"
        echo ""
        read -p "準備好推送到 GitHub? (y/n): " ready
        
        if [ "$ready" = "y" ]; then
            git branch -M main
            git push -u origin main || {
                echo -e "${RED}❌ 推送失敗${NC}"
                echo "請手動執行:"
                echo "  git remote add origin https://github.com/$github_user/$repo_name.git"
                echo "  git branch -M main"
                echo "  git push -u origin main"
            }
        fi
        
        echo ""
        echo "🚂 步驟 2: 部署後端到 Railway"
        echo "---------------------------"
        echo "1. 前往 https://railway.app/"
        echo "2. 用 GitHub 登入"
        echo "3. 點擊 'New Project' → 'Deploy from GitHub repo'"
        echo "4. 選擇 '$repo_name' 倉庫"
        echo "5. 在 Settings → Variables 中新增："
        echo "   - GOOGLE_API_KEY = AIzaSyD993-kCu7liPeaA0F754aPbuS1eXnKJVQ"
        echo "6. Railway 會自動部署並提供 URL"
        echo ""
        read -p "請輸入 Railway 後端 URL (例如: https://ai-pastor.railway.app): " backend_url
        
        if [ -n "$backend_url" ]; then
            echo ""
            echo "📝 更新前端配置..."
            # 更新 index.html 中的 API_BASE_URL
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s|const API_BASE_URL = window.API_BASE_URL || '.*';|const API_BASE_URL = window.API_BASE_URL || '${backend_url}';|g" index.html
            else
                # Linux
                sed -i "s|const API_BASE_URL = window.API_BASE_URL || '.*';|const API_BASE_URL = window.API_BASE_URL || '${backend_url}';|g" index.html
            fi
            
            # 重新建置
            npm run build
            
            # 提交更改
            git add index.html dist/
            git commit -m "Update API_BASE_URL to ${backend_url}" || echo "無更改"
            git push || echo "請手動推送"
            
            echo -e "${GREEN}✅ 前端配置已更新${NC}"
        fi
        
        echo ""
        echo "🌐 步驟 3: 部署前端到 Netlify"
        echo "---------------------------"
        echo "1. 前往 https://www.netlify.com/"
        echo "2. 用 GitHub 登入"
        echo "3. 點擊 'Add new site' → 'Import an existing project'"
        echo "4. 選擇 '$repo_name' 倉庫"
        echo "5. 設定："
        echo "   - Build command: npm run build"
        echo "   - Publish directory: dist"
        echo "6. 點擊 'Deploy site'"
        echo ""
        echo -e "${GREEN}✅ 部署完成後，Netlify 會提供前端 URL${NC}"
        ;;
    2)
        echo "Render + Vercel 部署指南請參考 DEPLOY.md"
        ;;
    3)
        echo "詳細手動部署指南請參考 DEPLOY.md 和 QUICK_START.md"
        ;;
    *)
        echo "無效選項"
        ;;
esac

echo ""
echo "✅ 部署腳本執行完成！"
echo ""
echo "📚 更多資訊："
echo "- 詳細部署指南: DEPLOY.md"
echo "- 快速開始: QUICK_START.md"
echo "- 安全說明: SECURITY.md"

