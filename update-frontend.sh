#!/bin/bash

# 快速更新前端配置腳本

if [ -z "$1" ]; then
    echo "❌ 請提供後端 URL"
    echo ""
    echo "使用方式:"
    echo "  ./update-frontend.sh https://your-backend.railway.app"
    echo ""
    exit 1
fi

BACKEND_URL=$1

echo "🔧 更新前端配置..."
echo "後端 URL: $BACKEND_URL"
echo ""

# 更新 index.html
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|const API_BASE_URL = window.API_BASE_URL || '.*';|const API_BASE_URL = window.API_BASE_URL || '${BACKEND_URL}';|g" index.html
else
    # Linux
    sed -i "s|const API_BASE_URL = window.API_BASE_URL || '.*';|const API_BASE_URL = window.API_BASE_URL || '${BACKEND_URL}';|g" index.html
fi

echo "✅ 配置已更新"
echo ""
echo "🔨 重新建置..."
npm run build

echo ""
echo "📤 準備推送..."
echo "執行以下命令推送："
echo "  git add index.html dist/"
echo "  git commit -m 'Update API_BASE_URL'"
echo "  git push"
echo ""

