# 管理員指南 - 查看註冊用戶資料

## 📋 目前的資料儲存方式

**重要提醒：** 目前系統使用**內存儲存**（臨時方案），這意味著：
- ⚠️ 資料只存在伺服器記憶體中
- ⚠️ 服務重啟後，所有資料會遺失
- ⚠️ 不會自動發送 Email 通知
- ⚠️ 沒有持久化儲存

## 🔍 如何查看註冊用戶

### 方法 1：使用管理 API（推薦）

我已經為您添加了管理端點，可以查看所有註冊用戶：

#### 查看所有用戶

在瀏覽器或使用 curl：

```
https://ai-pastor-ealr.onrender.com/api/admin/users?password=您的管理員密碼
```

或在 Render Dashboard 設定環境變數 `ADMIN_PASSWORD`，然後使用：

```
https://ai-pastor-ealr.onrender.com/api/admin/users?password=您設定的密碼
```

**回應格式：**
```json
{
  "success": true,
  "totalUsers": 5,
  "users": [
    {
      "email": "user@example.com",
      "username": "username",
      "nickname": "nickname",
      "createdAt": "2025-12-11T05:30:00.000Z",
      "updatedAt": "2025-12-11T05:30:00.000Z"
    }
  ]
}
```

#### 查看統計資訊

```
https://ai-pastor-ealr.onrender.com/api/admin/stats?password=您的管理員密碼
```

**回應格式：**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 5,
    "totalSessions": 3,
    "totalUserData": 5,
    "timestamp": "2025-12-11T05:54:07.188Z"
  }
}
```

### 方法 2：查看 Render Logs

在 Render Dashboard：
1. 進入您的 `ai-pastor-backend` 服務
2. 點擊 "Logs" 標籤
3. 搜尋 "register" 或 "註冊" 關鍵字
4. 可以看到註冊請求的日誌（但不會顯示完整用戶資料）

### 方法 3：設定環境變數（安全）

1. 在 Render Dashboard 中，進入服務的 "Environment" 標籤
2. 添加環境變數：
   - **Key**: `ADMIN_PASSWORD`
   - **Value**: 設定一個強密碼（例如：`MySecureAdminPass123!`）
3. 保存後，使用這個密碼訪問管理端點

---

## ⚠️ 重要限制

### 目前系統的限制

1. **資料不持久化**
   - 所有資料只存在記憶體中
   - 服務重啟後會遺失
   - 無法長期保存用戶資料

2. **沒有 Email 通知**
   - 不會自動發送註冊通知
   - 需要手動查看管理端點

3. **沒有資料備份**
   - 無法恢復遺失的資料
   - 無法匯出用戶資料

---

## 🚀 建議的升級方案

### 方案 1：添加 Email 通知（簡單）

當用戶註冊時，自動發送 Email 通知到您的信箱。

**需要：**
- Email 服務（SendGrid、Mailgun、或 Gmail SMTP）
- 設定環境變數

### 方案 2：升級到數據庫（推薦）

使用 Supabase 或 Firebase 儲存用戶資料：

**優點：**
- ✅ 資料持久化保存
- ✅ 可以隨時查看所有用戶
- ✅ 支援資料匯出
- ✅ 可以添加 Email 通知
- ✅ 支援資料備份

**實施步驟：**
1. 建立 Supabase 專案（免費）
2. 建立用戶表
3. 更新 `server.js` 連接數據庫
4. 添加註冊通知功能

### 方案 3：添加日誌記錄

將所有註冊記錄寫入日誌文件或外部服務（如 Logtail、Papertrail）。

---

## 📝 快速查看用戶的方法

### 使用 curl（終端機）

```bash
# 查看所有用戶（使用預設密碼）
curl "https://ai-pastor-ealr.onrender.com/api/admin/users?password=admin123"

# 查看統計
curl "https://ai-pastor-ealr.onrender.com/api/admin/stats?password=admin123"
```

### 使用瀏覽器

直接在瀏覽器開啟：
```
https://ai-pastor-ealr.onrender.com/api/admin/users?password=admin123
```

**⚠️ 安全提醒：** 預設密碼是 `admin123`，建議立即在 Render 環境變數中設定 `ADMIN_PASSWORD` 並更改。

---

## 🔒 安全建議

1. **立即設定管理員密碼**
   - 在 Render 環境變數中設定 `ADMIN_PASSWORD`
   - 使用強密碼（至少 16 個字元，包含大小寫、數字、符號）

2. **限制訪問**
   - 考慮添加 IP 白名單
   - 或使用更安全的認證方式（JWT、OAuth）

3. **定期備份**
   - 升級到數據庫後，設定定期備份
   - 或定期匯出用戶資料

---

## 📈 數據源配置指南

### 時間序列數據功能

系統現在支援查詢財經和天氣相關的時間序列數據。

#### 環境變數配置

在 `.env` 文件或 Render 環境變數中添加：

```bash
# Alpha Vantage API Key (可選，用於增強財經數據)
ALPHAVANTAGE_KEY=your_alpha_vantage_api_key

# Weather API Key (可選，用於增強天氣數據)
WEATHER_API_KEY=your_weather_api_key

# 預設查詢地點 (可選)
DEFAULT_LOCATION=taipei
```

#### 如何取得 API Keys

1. **Alpha Vantage** (財經數據，可選)
   - 網址：https://www.alphavantage.co/support/#api-key
   - 提供免費方案
   - 用於增強財經數據查詢

2. **WeatherAPI** (天氣數據，可選)
   - 網址：https://www.weatherapi.com/
   - 提供免費方案（每月100萬次請求）
   - 用於增強天氣數據查詢
   - 注意：系統已內建 Open-Meteo 免費 API，此為可選增強

#### 支援的查詢類型

**財經數據：**
- 台股加權指數、上證指數、恆生指數、日經指數
- NASDAQ、道瓊、標普500等國際指數
- 自動返回≥2倍查詢時間範圍的數據點

**天氣數據：**
- 全球主要城市溫度數據
- 台北、東京、北京、上海、香港、首爾、新加坡等
- 溫度統一使用攝氏溫度（°C）

#### 使用範例

```javascript
const { fetchTimeSeries } = require('./services/dataSources');

// 查詢台股指數（30天數據，返回≥60個數據點）
const financeData = await fetchTimeSeries({ 
  query: '台股加權指數', 
  horizonDays: 30 
});

// 查詢台北氣溫（14天數據，返回≥28個數據點）
const weatherData = await fetchTimeSeries({ 
  query: '台北氣溫', 
  horizonDays: 14 
});
```

#### 錯誤處理

系統會區分兩種錯誤類型：
1. `UnrecognizedTopicError` - 無法識別查詢主題
2. `SourceUnavailableError` - 數據源暫時不可用（網路問題、API限制等）

API 端點應根據錯誤類型返回適當的 HTTP 狀態碼：
- `UnrecognizedTopicError` → 400 Bad Request
- `SourceUnavailableError` → 503 Service Unavailable

---

## 📊 下一步建議

1. **立即行動**：設定 `ADMIN_PASSWORD` 環境變數
2. **短期**：添加 Email 通知功能
3. **中期**：升級到 Supabase 數據庫
4. **長期**：建立完整的管理後台

需要我幫您實施哪個方案？我可以：
- 添加 Email 通知功能
- 整合 Supabase 數據庫
- 建立管理後台界面




