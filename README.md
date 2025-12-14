# AI 牧師 - 你的隨身靈修導師

一個基於 Google Gemini API 的基督教 AI 牧師聊天應用，提供屬靈指引和聖經問答。

## 功能特色

- 📖 **唯獨聖經模式**：完全基於聖經的回答，引用具體章節
- 🌐 **聖經+網路模式**：結合聖經真理與網路搜尋，提供更豐富的資訊
- 💬 **對話歷史保存**：自動保存對話記錄到瀏覽器本地儲存
- 📱 **響應式設計**：支援桌面和行動裝置
- 🎨 **優雅介面**：使用 Tailwind CSS 打造的美觀 UI

## 快速開始

### ⚠️ 重要安全提示

**直接在前端使用 API Key 不適合公開部署！** 請使用後端代理方案（方式三）以保護您的 API Key。

### 方式一：直接使用（僅本地開發，不公開）

1. 開啟 `index.html`
2. 在檔案中找到配置區域，填入您的 Google Gemini API Key：
   ```javascript
   const GOOGLE_API_KEY = "您的_API_KEY";
   ```
3. 在瀏覽器中開啟 `index.html`

### 方式二：使用環境變數建置（僅本地使用，不公開）

1. 複製 `.env.example` 為 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 在 `.env` 中填入您的 API Key：
   ```
   GOOGLE_API_KEY=您的_API_KEY
   ```

3. 執行建置腳本注入環境變數：
   ```bash
   npm run build
   ```

4. 開啟生成的 `index.html`（或使用 `dist/index.html`）

### 方式三：使用後端代理（✅ 推薦，可公開部署）

1. **安裝依賴**：
   ```bash
   npm install
   ```

2. **設定環境變數**：
   ```bash
   cp .env.example .env
   # 編輯 .env 填入您的 API Key
   ```

3. **啟動後端伺服器**：
   ```bash
   npm run server
   ```

4. **修改前端配置**（在 `index.html` 中）：
   ```javascript
   const API_BASE_URL = 'http://localhost:3000'; // 本地開發
   // 或生產環境
   const API_BASE_URL = 'https://your-domain.com';
   ```

5. **開啟應用**：
   - 本地：`http://localhost:3000`
   - 生產：部署前端和後端到各自的伺服器

詳細安全說明請參考 [SECURITY.md](./SECURITY.md)

## 取得 Google Gemini API Key

1. 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登入您的 Google 帳號
3. 建立新的 API Key
4. 複製 API Key 並設定到環境變數或直接填入 HTML

## 專案結構

```
AI Pastor/
├── index.html              # 主應用檔案（單一 HTML 檔案）
├── server.js               # 後端 Express 伺服器
├── build.js                # 環境變數注入腳本
├── services/               # 服務模組
│   └── dataSources/        # 時間序列數據抓取
│       ├── index.js        # 主要 fetchTimeSeries 導出
│       ├── queryClassifier.js  # 查詢分類器
│       ├── financeSource.js    # 財經數據源
│       └── weatherSource.js    # 天氣數據源
├── .env.example            # 環境變數範例檔
├── .env                    # 環境變數（需自行建立，已加入 .gitignore）
├── .gitignore              # Git 忽略檔案
├── package.json            # Node.js 專案配置
└── README.md               # 本文件
```

## 技術棧

- **React 18**：UI 框架（透過 CDN）
- **Babel Standalone**：JSX 轉譯
- **Tailwind CSS**：樣式框架
- **Lucide Icons**：圖示庫
- **Google Gemini API**：AI 模型（gemini-2.5-flash-preview-09-2025）
- **Data Sources**：時間序列數據抓取（財經、天氣等）
  - `yahoo-finance2`：財經數據
  - `axios`：HTTP 請求
  - `duck-duck-scrape`：網路搜尋與分類
  - Open-Meteo API：免費天氣數據

## 使用說明

### 兩種回答模式

1. **唯獨聖經**：回答完全基於聖經，每個論點都會引用具體章節
2. **聖經+網路**：結合聖經真理與網路搜尋結果，提供更豐富的背景資訊

### 功能操作

- **發送訊息**：在輸入框輸入問題，點擊發送按鈕或按 Enter
- **清除記錄**：點擊右上角的「清除」按鈕可清除所有對話記錄
- **切換模式**：使用頂部的切換按鈕在兩種模式間切換

### 時間序列數據功能

系統支援查詢財經和天氣相關的時間序列數據：

#### 財經數據查詢
支援查詢各類股市指數和股票數據：
- 台股加權指數、上證指數、恆生指數、日經指數
- NASDAQ、道瓊、標普500、FTSE、DAX等國際指數
- 自動返回至少2倍查詢時間範圍的數據點
- 數據來源：Yahoo Finance

範例查詢：
```javascript
const { fetchTimeSeries } = require('./services/dataSources');
const result = await fetchTimeSeries({ 
  query: '台股加權指數', 
  horizonDays: 30 
});
```

#### 天氣數據查詢
支援查詢全球主要城市的溫度數據：
- 台北、台中、台南、高雄、新北、桃園
- 東京、北京、上海、香港、首爾、新加坡
- 紐約、倫敦、巴黎、柏林、雪梨等
- 溫度統一使用攝氏溫度（°C）
- 數據來源：Open-Meteo API（免費）或 WeatherAPI（需API Key）

範例查詢：
```javascript
const result = await fetchTimeSeries({ 
  query: '台北氣溫', 
  horizonDays: 14 
});
```

#### 錯誤處理
系統區分兩種錯誤類型：
1. **UnrecognizedTopicError**：無法識別查詢主題
2. **SourceUnavailableError**：數據源暫時不可用（網路問題、API限制等）

## 開發

### 安裝依賴（僅用於建置腳本）

```bash
npm install
```

### 建置（注入環境變數）

```bash
npm run build
```

### 本地開發

直接開啟 `index.html` 即可，無需額外建置步驟。

## 注意事項

- ⚠️ **API Key 安全**：請勿將包含 API Key 的檔案提交到公開的 Git 倉庫
- ⚠️ **API 限制**：Google Gemini API 有使用限制，請注意您的配額
- 💾 **資料儲存**：對話記錄儲存在瀏覽器本地，清除瀏覽器資料會遺失記錄
- 🌐 **網路需求**：需要網路連線以載入 CDN 資源和呼叫 API

## 授權

本專案為開源專案，可自由使用和修改。

## 問題回報

如有問題或建議，請建立 Issue 或提交 Pull Request。

