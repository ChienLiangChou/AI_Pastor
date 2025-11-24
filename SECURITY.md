# 安全指南

## ⚠️ 重要：API Key 安全

### 問題說明

**目前的實作方式（直接在前端使用 API Key）不適合公開部署！**

如果將包含 API Key 的 HTML 檔案公開（例如放在 GitHub Pages、Netlify、Vercel 等），任何人都可以：
- 在瀏覽器中查看原始碼看到您的 API Key
- 濫用您的 API 配額
- 產生高額費用
- 導致 API Key 被 Google 停用

## ✅ 推薦解決方案：使用後端代理

### 架構說明

```
用戶瀏覽器 → 前端 HTML (無 API Key) → 後端伺服器 (API Key 安全保護) → Google API
```

### 使用步驟

1. **安裝後端依賴**：
   ```bash
   npm install
   ```

2. **設定環境變數**：
   確保 `.env` 檔案中包含：
   ```
   GOOGLE_API_KEY=您的_API_KEY
   PORT=3000
   ```

3. **啟動後端伺服器**：
   ```bash
   npm run server
   ```

4. **修改前端配置**：
   在 `index.html` 中設定後端 URL：
   ```javascript
   const API_BASE_URL = 'http://localhost:3000'; // 本地開發
   // 或
   const API_BASE_URL = 'https://your-domain.com'; // 生產環境
   ```

5. **部署**：
   - 前端：可以公開部署（不包含 API Key）
   - 後端：部署到安全的伺服器（如 Heroku、Railway、Render 等）

## 🔒 其他安全建議

### 1. API Key 限制（在 Google Cloud Console 設定）

- **HTTP 引用來源限制**：只允許特定網域使用
- **IP 地址限制**：只允許特定 IP
- **API 限制**：只啟用必要的 API

### 2. 速率限制

在後端伺服器中實作速率限制，防止濫用：
```javascript
// 可以使用 express-rate-limit
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100 // 限制每個 IP 100 次請求
});
app.use('/api/chat', limiter);
```

### 3. 監控與日誌

- 監控 API 使用量
- 記錄異常請求
- 設定使用量警報

## 📋 部署檢查清單

- [ ] API Key 不在前端程式碼中
- [ ] 後端伺服器已部署並運行
- [ ] 環境變數已正確設定
- [ ] CORS 已正確配置
- [ ] 速率限制已啟用
- [ ] 錯誤處理已實作
- [ ] 日誌記錄已設定

## 🚨 如果 API Key 已洩露

1. 立即前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 刪除或重新生成 API Key
3. 檢查使用記錄，確認是否有異常
4. 更新 `.env` 檔案中的新 API Key
5. 重新部署應用

