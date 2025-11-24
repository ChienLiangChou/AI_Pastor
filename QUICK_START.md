# 快速部署指南

## 🎯 目標：讓 AI Pastor 可以公開使用

## ✅ 簡短答案

**理論上可以，但需要完成部署步驟：**

1. ✅ 後端代碼已準備好
2. ⏳ 需要部署後端到雲端（Railway/Render/Heroku）
3. ⏳ 需要更新前端配置指向後端
4. ⏳ 需要部署前端到靜態網站（GitHub Pages/Netlify/Vercel）

## 🚀 最簡單的部署方式（5 分鐘）

### 步驟 1：部署後端到 Railway（免費）

1. 前往 https://railway.app/
2. 用 GitHub 登入
3. 點擊 "New Project" → "Deploy from GitHub repo"
4. 選擇您的專案（或先推送到 GitHub）
5. 在 Settings → Variables 中新增：
   - `GOOGLE_API_KEY` = `AIzaSyD993-kCu7liPeaA0F754aPbuS1eXnKJVQ`
6. Railway 會自動部署並提供 URL（例如：`https://ai-pastor-backend.railway.app`）

### 步驟 2：更新前端配置

在 `index.html` 中找到這行（約第 40 行）：
```javascript
const API_BASE_URL = window.API_BASE_URL || '';
```

改為：
```javascript
const API_BASE_URL = window.API_BASE_URL || 'https://your-backend-url.railway.app';
```
（替換為您的 Railway URL）

### 步驟 3：部署前端到 Netlify（免費）

1. 前往 https://www.netlify.com/
2. 拖放整個專案資料夾
3. 或連接 GitHub 自動部署
4. 獲得前端 URL（例如：`https://ai-pastor.netlify.app`）

### 步驟 4：完成！

現在您可以：
- ✅ 公開分享前端連結
- ✅ 讓任何人使用
- ✅ API Key 安全保護在後端

## 📝 本地測試（可選）

在部署前，可以先本地測試：

```bash
# 1. 啟動後端
npm run server

# 2. 在另一個終端，更新 index.html 中的 API_BASE_URL
# 改為：const API_BASE_URL = 'http://localhost:3000';

# 3. 開啟 index.html 測試
```

## 🔒 安全確認

部署後，請確認：

1. 開啟前端網站
2. 按 F12 開啟開發者工具
3. 查看 Network 標籤
4. 應該看到請求發送到您的後端 URL（`/api/chat`）
5. **不應該**看到直接呼叫 `generativelanguage.googleapis.com` 的請求

如果看到直接呼叫 Google API，表示前端還在用 API Key，需要檢查配置。

## 🆘 需要幫助？

詳細部署步驟請參考 [DEPLOY.md](./DEPLOY.md)

