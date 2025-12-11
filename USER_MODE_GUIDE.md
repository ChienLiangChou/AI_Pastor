# 用戶模式系統說明

## 📋 概述

AI 牧師現在支援兩種使用模式：
1. **訪客模式**：無需註冊，立即使用
2. **註冊模式**：完整功能，多裝置同步

## 🎯 功能對比

### 訪客模式
- ✅ 立即使用，無需註冊
- ✅ 資料僅儲存在您的裝置（隱私保護）
- ❌ 僅限單一裝置使用
- ❌ 最多保留最近 20 條對話
- ❌ 清除瀏覽器資料會遺失對話記錄

### 註冊模式
- ✅ 完整對話歷史儲存（無限制）
- ✅ 多裝置同步
- ✅ 個人化記憶系統
- ✅ 屬靈成長追蹤
- ✅ 數據備份與恢復
- ✅ 個人檔案管理

## 🚀 使用方式

### 首次使用
1. 開啟 AI 牧師時會顯示歡迎界面
2. 選擇「訪客模式」或「註冊帳號」
3. 如果選擇註冊，填寫 Email、使用者名稱、密碼（可選填暱稱）

### 訪客模式升級
- 點擊 Header 右側的「訪客模式」按鈕
- 選擇「註冊帳號」
- 系統會自動將現有的對話記錄遷移到雲端

### 登入/登出
- 已註冊用戶可在 Header 看到使用者名稱
- 點擊「登出」按鈕可切換回訪客模式
- 對話記錄會保留在雲端，下次登入時會自動載入

## 🔧 技術架構

### 前端
- 使用 React state 管理用戶狀態
- localStorage 儲存訪客模式的對話記錄
- 註冊模式：對話記錄同步到後端 API

### 後端 API
目前使用內存儲存（臨時方案）：
- `/api/auth` - 處理註冊、登入、登出
- `/api/user` - 處理對話歷史、個人檔案

### 數據遷移
- 從訪客模式升級時，自動將 localStorage 數據遷移到後端
- 遷移後保留本地備份

## 📝 後續升級計劃

### 第一階段：免費後端方案（建議）
當有足夠使用者註冊後，可以升級到：

**選項 1：Supabase（推薦）**
- 免費層：500MB 數據庫、2GB 儲存
- 支援 PostgreSQL、即時同步、認證系統
- 易於擴展

**選項 2：Firebase**
- 免費層：1GB 儲存、10GB 傳輸
- 支援 NoSQL、即時同步、認證系統

**選項 3：Railway + PostgreSQL**
- Railway 免費層 + PostgreSQL
- 完全控制，易於遷移

### 升級步驟
1. 選擇後端方案
2. 建立數據庫
3. 更新 API 文件（`api/auth.js`、`api/user.js`）
4. 設定環境變數
5. 測試數據遷移

### 數據庫設計建議

```sql
-- 用戶表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    nickname VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 對話記錄表
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    role VARCHAR(10) NOT NULL, -- 'user' or 'model'
    content TEXT NOT NULL,
    grounding JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 個人檔案表
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,
    profile_data JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔒 安全性考量

### 目前實現
- 密碼以明文儲存（僅用於開發測試）
- Token 為簡單字串（非標準 JWT）

### 生產環境建議
1. **密碼加密**：使用 bcrypt 加密密碼
2. **JWT Token**：使用 jsonwebtoken 庫生成標準 JWT
3. **HTTPS**：確保所有 API 調用使用 HTTPS
4. **速率限制**：實作 API 速率限制
5. **輸入驗證**：驗證所有用戶輸入
6. **SQL 注入防護**：使用參數化查詢

## 📊 監控建議

當使用者數量增加時，建議監控：
- 註冊用戶數量
- 數據庫使用量
- API 請求頻率
- 儲存空間使用情況

當接近免費層限制時，評估升級到付費方案。

## 🎉 完成的功能

- ✅ 歡迎選擇界面
- ✅ 模式說明與比較
- ✅ 註冊/登入界面
- ✅ 用戶狀態管理
- ✅ Header 狀態顯示
- ✅ 後端 API 架構（內存儲存）
- ✅ 數據遷移功能

## ⏳ 待完成功能

- [ ] 真實數據庫整合
- [ ] 密碼加密
- [ ] JWT Token 實作
- [ ] 個人檔案管理界面
- [ ] 屬靈成長追蹤功能
- [ ] 多裝置同步測試

