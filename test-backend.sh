#!/bin/bash
echo "🧪 測試後端伺服器..."
echo ""
echo "步驟 1: 啟動後端伺服器（在背景運行）"
npm run server &
SERVER_PID=$!
sleep 3

echo ""
echo "步驟 2: 測試 API 端點"
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "你好",
    "history": [],
    "mode": "bible-only"
  }' 2>/dev/null | head -c 200

echo ""
echo ""
echo "步驟 3: 停止伺服器"
kill $SERVER_PID 2>/dev/null
echo "✅ 測試完成"
