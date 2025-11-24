# 部署狀態

## ✅ 已完成的準備工作

- [x] Git 倉庫已初始化
- [x] 所有文件已提交
- [x] 後端代理伺服器代碼已準備 (`server.js`)
- [x] 前端已支援後端代理模式
- [x] 部署配置文件已建立：
  - `railway.json` - Railway 後端配置
  - `netlify.toml` - Netlify 前端配置
  - `vercel.json` - Vercel 前端配置
  - `Procfile` - Heroku 後端配置
- [x] 自動部署腳本已準備 (`deploy.sh`, `auto-deploy.js`)

## ⏳ 待完成的部署步驟

### 步驟 1: 推送到 GitHub

```bash
# 如果還沒有 GitHub 倉庫，先建立一個：
# 1. 前往 https://github.com/new
# 2. 建立名為 "ai-pastor" 的倉庫
# 3. 然後執行：

git remote add origin https://github.com/YOUR_USERNAME/ai-pastor.git
git push -u origin main
```

### 步驟 2: 部署後端到 Railway

1. 前往 https://railway.app/
2. 用 GitHub 登入
3. 點擊 "New Project" → "Deploy from GitHub repo"
4. 選擇 "ai-pastor" 倉庫
5. Railway 會自動偵測並部署
6. 在 Settings → Variables 中新增環境變數：
   ```
   GOOGLE_API_KEY=您的_GOOGLE_API_KEY（請從 Google AI Studio 獲取新的 API Key）
   ```
7. Railway 會自動重新部署
8. 在 Settings → Domains 中可以看到後端 URL（例如：`https://ai-pastor-production.up.railway.app`）

### 步驟 3: 更新前端配置

獲得後端 URL 後，更新 `index.html`：

```javascript
// 第 40 行，將：
const API_BASE_URL = window.API_BASE_URL || '';

// 改為：
const API_BASE_URL = window.API_BASE_URL || 'https://your-backend.railway.app';
```

然後重新建置：
```bash
npm run build
git add index.html dist/
git commit -m "Update API_BASE_URL"
git push
```

### 步驟 4: 部署前端到 Netlify

1. 前往 https://www.netlify.com/
2. 用 GitHub 登入
3. 點擊 "Add new site" → "Import an existing project"
4. 選擇 "ai-pastor" 倉庫
5. 設定：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. 點擊 "Deploy site"
7. Netlify 會自動部署並提供 URL（例如：`https://ai-pastor.netlify.app`）

## 🎉 完成後

您將獲得：
- **後端 URL**: `https://your-backend.railway.app`
- **前端 URL**: `https://your-frontend.netlify.app`

前端 URL 就是可以公開分享的連結！

## 🔍 驗證部署

1. 開啟前端網站
2. 按 F12 開啟開發者工具
3. 查看 Network 標籤
4. 應該看到請求發送到您的後端 URL (`/api/chat`)
5. **不應該**看到直接呼叫 Google API 的請求

## 📞 需要幫助？

- 詳細部署指南: `DEPLOY.md`
- 快速開始: `QUICK_START.md`
- 安全說明: `SECURITY.md`

