# 部署指南

## 🎯 目標：公開部署 AI Pastor，讓大家安全使用

## 📋 部署前檢查清單

### ✅ 已完成
- [x] 後端代理伺服器代碼 (`server.js`)
- [x] 前端支援後端代理模式
- [x] API Key 已設定在 `.env`

### ⏳ 待完成
- [ ] 安裝後端依賴
- [ ] 測試後端伺服器本地運行
- [ ] 部署後端到雲端服務
- [ ] 更新前端配置指向後端 URL
- [ ] 部署前端到靜態網站服務

## 🚀 完整部署步驟

### 步驟 1：安裝依賴

```bash
npm install
```

### 步驟 2：測試本地後端

```bash
npm run server
```

應該看到：
```
🚀 伺服器運行在 http://localhost:3000
📖 開啟瀏覽器訪問 http://localhost:3000
🔒 API Key 已安全保護在伺服器端
```

在瀏覽器開啟 `http://localhost:3000` 測試功能是否正常。

### 步驟 3：部署後端到雲端

選擇一個雲端服務部署後端：

#### 選項 A：Railway（推薦，簡單）

1. 前往 [Railway](https://railway.app/)
2. 登入並建立新專案
3. 連接 GitHub 倉庫或直接上傳檔案
4. 設定環境變數：
   - `GOOGLE_API_KEY` = 您的 API Key
   - `PORT` = 3000（Railway 會自動設定）
5. Railway 會自動部署並提供 URL（如：`https://your-app.railway.app`）

#### 選項 B：Render

1. 前往 [Render](https://render.com/)
2. 建立新的 Web Service
3. 連接 GitHub 倉庫
4. 設定：
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - 環境變數：`GOOGLE_API_KEY`
5. 部署後會獲得 URL（如：`https://your-app.onrender.com`）

#### 選項 C：Heroku

1. 安裝 Heroku CLI
2. 登入：`heroku login`
3. 建立應用：`heroku create your-app-name`
4. 設定環境變數：`heroku config:set GOOGLE_API_KEY=您的_API_KEY`
5. 部署：`git push heroku main`
6. 獲得 URL：`https://your-app-name.herokuapp.com`

### 步驟 4：更新前端配置

獲得後端 URL 後，更新前端：

**方式 A：修改 `index.html` 直接設定**

```javascript
const API_BASE_URL = 'https://your-backend-url.com'; // 您的後端 URL
```

**方式 B：使用建置腳本（推薦）**

在 `.env` 中新增：
```
API_BASE_URL=https://your-backend-url.com
```

然後執行：
```bash
npm run build
```

### 步驟 5：部署前端

#### 選項 A：GitHub Pages

1. 將專案推送到 GitHub
2. 在 GitHub 設定中啟用 Pages
3. 選擇 `dist` 目錄作為來源
4. 獲得 URL：`https://your-username.github.io/ai-pastor`

#### 選項 B：Netlify

1. 前往 [Netlify](https://www.netlify.com/)
2. 拖放 `dist` 資料夾或連接 GitHub
3. 設定：
   - Build command: `npm run build`
   - Publish directory: `dist`
4. 部署後獲得 URL

#### 選項 C：Vercel

1. 前往 [Vercel](https://vercel.com/)
2. 導入專案
3. 設定：
   - Build command: `npm run build`
   - Output directory: `dist`
4. 部署後獲得 URL

## 🔒 安全檢查

部署前確認：

- [ ] `.env` 檔案已加入 `.gitignore`（不會被提交）
- [ ] 後端 API Key 只在伺服器端，不在前端
- [ ] 前端 HTML 中沒有 API Key
- [ ] CORS 已正確設定（允許前端網域）
- [ ] 後端 URL 正確設定在前端

## 📝 部署後測試

1. 開啟前端網站
2. 開啟瀏覽器開發者工具（F12）
3. 檢查 Network 標籤：
   - 應該看到請求發送到您的後端 URL（`/api/chat`）
   - 不應該看到直接呼叫 Google API 的請求
4. 測試對話功能是否正常

## 🎉 完成！

部署完成後，您就可以：
- ✅ 公開分享前端連結
- ✅ 讓任何人使用 AI Pastor
- ✅ API Key 安全保護在後端
- ✅ 不會有 API Key 洩露風險

## 🆘 常見問題

### Q: 後端部署後無法訪問？
A: 檢查：
- 環境變數是否正確設定
- 後端服務是否正在運行
- 防火牆設定是否允許訪問

### Q: 前端無法連接到後端？
A: 檢查：
- CORS 設定是否正確
- 後端 URL 是否正確
- 瀏覽器控制台是否有錯誤訊息

### Q: API 請求失敗？
A: 檢查：
- 後端日誌是否有錯誤
- API Key 是否有效
- 網路連線是否正常










