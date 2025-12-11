# 🚀 Vercel + Render 部署指南

## 📋 當前狀態

✅ **前端**：已部署在 Vercel
- 專案：`ai-pastor`
- 團隊：`skc-realty-teams-projects`
- 部署連結：https://vercel.com/skc-realty-teams-projects/ai-pastor/5svG6N737oZX3e6RcAZ51cFdm6aH

⏳ **後端**：需要部署到 Render

---

## 🎯 部署步驟

### 步驟 1：部署後端到 Render（約 5 分鐘）

1. **前往 Render Dashboard**
   - 開啟 https://dashboard.render.com/
   - 確認您已登入

2. **建立新的 Web Service**
   - 點擊 "New +" → "Web Service"
   - 選擇 "Build and deploy from a Git repository"
   - 連接您的 GitHub 帳號（如果還沒連接）
   - 選擇 `ai-pastor` 倉庫

3. **設定服務配置**
   - **Name**: `ai-pastor-backend`（或您喜歡的名稱）
   - **Region**: 選擇離您最近的區域（建議選擇與 Vercel 相同的區域）
   - **Branch**: `main`（或您的主要分支）
   - **Root Directory**: 留空（使用根目錄）
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: 選擇 `Free`（或付費方案）

4. **設定環境變數**
   在 "Environment" 區塊中，點擊 "Add Environment Variable"：
   - **Key**: `GOOGLE_API_KEY`
   - **Value**: 您的 Google Gemini API Key
   - 點擊 "Save Changes"

5. **部署**
   - 點擊 "Create Web Service"
   - Render 會自動開始建置和部署
   - 等待部署完成（約 2-3 分鐘）

6. **獲得後端 URL**
   - 部署完成後，在服務頁面頂部會顯示 URL
   - 格式類似：`https://ai-pastor-backend.onrender.com`
   - **複製這個 URL，下一步會用到！**

---

### 步驟 2：更新前端配置（約 2 分鐘）

獲得 Render 後端 URL 後，需要更新前端配置：

1. **在本地更新 `index.html`**
   
   找到第 325 行左右：
   ```javascript
   const API_BASE_URL = window.API_BASE_URL || '';
   ```
   
   改為：
   ```javascript
   const API_BASE_URL = window.API_BASE_URL || 'https://your-backend-url.onrender.com';
   ```
   （將 `your-backend-url.onrender.com` 替換為您的實際 Render URL）

2. **提交並推送更改**
   ```bash
   git add index.html
   git commit -m "Update API_BASE_URL to point to Render backend"
   git push origin main
   ```

3. **Vercel 自動重新部署**
   - Vercel 會自動偵測到 GitHub 的更改
   - 自動觸發新的部署
   - 等待部署完成（約 1-2 分鐘）

---

### 步驟 3：驗證部署（約 2 分鐘）

1. **檢查後端是否正常運行**
   - 在瀏覽器開啟您的 Render 後端 URL
   - 應該會看到一些回應（可能是錯誤頁面，這是正常的，因為根路徑沒有處理）

2. **測試 API 端點**
   - 開啟您的 Vercel 前端網站
   - 按 `F12` 開啟開發者工具
   - 切換到 "Network" 標籤
   - 在 AI 牧師中發送一條測試訊息
   - 檢查 Network 標籤：
     - ✅ 應該看到請求發送到您的 Render 後端 URL（`/api/chat`）
     - ✅ 應該收到正常的回應
     - ❌ **不應該**看到直接呼叫 `generativelanguage.googleapis.com` 的請求

3. **測試認證功能**
   - 嘗試註冊一個新帳號
   - 檢查是否能成功註冊和登入
   - 檢查對話記錄是否能正常保存

---

## 🔧 Render 後端配置詳情

### 環境變數設定

在 Render Dashboard 中，確保設定以下環境變數：

| Key | Value | 說明 |
|-----|-------|------|
| `GOOGLE_API_KEY` | 您的 API Key | Google Gemini API Key |
| `NODE_ENV` | `production` | 生產環境標記（可選）|
| `PORT` | 自動設定 | Render 會自動設定，無需手動設定 |

### 健康檢查

Render 會自動檢查服務是否正常運行。`server.js` 中的 `/api/chat` 端點可以用作健康檢查。

如果需要，可以在 Render Dashboard 中設定：
- **Health Check Path**: `/api/chat`

---

## 📝 重要注意事項

### Render 免費方案限制

- **服務休眠**：如果 15 分鐘內沒有請求，免費服務會進入休眠狀態
- **首次請求延遲**：休眠後首次請求可能需要 30-60 秒來喚醒服務
- **解決方案**：
  - 使用付費方案（$7/月起）可避免休眠
  - 或設定定期 ping 服務以保持活躍

### CORS 設定

`server.js` 中已經設定了 CORS：
```javascript
app.use(cors());
```

這允許所有來源的請求。如果需要限制，可以更新為：
```javascript
app.use(cors({
  origin: 'https://your-vercel-frontend.vercel.app'
}));
```

### API 端點

後端提供以下 API 端點：

- `POST /api/chat` - 聊天 API（主要功能）
- `POST /api/auth` - 認證 API（註冊、登入、登出）
- `GET /api/user` - 獲取用戶數據
- `POST /api/user` - 保存用戶數據

---

## 🎉 部署完成檢查清單

- [ ] 後端已部署到 Render
- [ ] 後端 URL 已獲得
- [ ] 環境變數 `GOOGLE_API_KEY` 已設定
- [ ] 前端 `index.html` 中的 `API_BASE_URL` 已更新
- [ ] 更改已提交並推送到 GitHub
- [ ] Vercel 已自動重新部署
- [ ] 前端可以正常連接到後端
- [ ] 聊天功能測試通過
- [ ] 認證功能測試通過

---

## 🔍 故障排除

### 問題 1：前端無法連接到後端

**檢查項目：**
1. 確認 `API_BASE_URL` 是否正確設定
2. 檢查 Render 服務是否正在運行
3. 檢查瀏覽器 Console 是否有 CORS 錯誤
4. 檢查 Network 標籤中的請求 URL 是否正確

### 問題 2：API 請求失敗

**檢查項目：**
1. 檢查 Render 的 Runtime Logs 查看錯誤訊息
2. 確認 `GOOGLE_API_KEY` 環境變數是否正確設定
3. 檢查 API Key 是否有效

### 問題 3：服務休眠

**解決方案：**
1. 等待 30-60 秒讓服務喚醒
2. 或升級到付費方案避免休眠

---

## 📞 需要幫助？

如果遇到問題：
1. 檢查 Render 的 Runtime Logs
2. 檢查 Vercel 的 Deployment Logs
3. 檢查瀏覽器的 Console 和 Network 標籤
4. 確認所有環境變數都已正確設定

---

## 🎯 快速命令參考

```bash
# 1. 更新前端配置（替換 YOUR_RENDER_URL）
# 編輯 index.html 第 325 行
# 將 API_BASE_URL 改為您的 Render URL

# 2. 提交並推送
git add index.html
git commit -m "Update API_BASE_URL to Render backend"
git push origin main

# 3. Vercel 會自動重新部署
```

---

**完成後，您的前端和後端就都部署好了！** 🎉

