# Supabase 資料庫設定指南

## 📋 概述

本專案已整合 Supabase 作為資料庫後端，支援持久化儲存用戶資料、對話記錄等。如果不設定 Supabase，系統會自動降級使用記憶體儲存（伺服器重啟後資料會遺失）。

## 🚀 快速設定步驟

### 1. 建立 Supabase 專案

1. 前往 [Supabase](https://supabase.com/)
2. 註冊/登入帳號
3. 點擊「New Project」建立新專案
4. 填寫專案資訊：
   - **Name**: `ai-pastor`（或您喜歡的名稱）
   - **Database Password**: 設定強密碼（請保存好）
   - **Region**: 選擇最接近您的區域
5. 等待專案建立完成（約 1-2 分鐘）

### 2. 執行資料庫架構 SQL

1. 在 Supabase Dashboard 中，點擊左側選單的「SQL Editor」
2. 點擊「New Query」
3. 開啟專案中的 `supabase-schema.sql` 檔案
4. 複製全部內容並貼上到 SQL Editor
5. 點擊「Run」執行 SQL
6. 確認執行成功（應該會看到成功訊息）

### 3. 取得 API 金鑰

1. 在 Supabase Dashboard 中，點擊左側選單的「Settings」（⚙️ 圖示）
2. 點擊「API」
3. 找到以下資訊：
   - **Project URL**: 例如 `https://xxxxx.supabase.co`
   - **anon public key**: 長字串，用於前端 API 呼叫

### 4. 設定環境變數

在您的伺服器環境（Render、Vercel、本地等）設定以下環境變數：

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

**注意：**
- 對於需要更高權限的操作（如管理端點），可以使用 `SUPABASE_SERVICE_ROLE_KEY`
- Service Role Key 具有完整權限，請勿在前端使用，僅用於後端

### 5. 驗證設定

啟動伺服器後，檢查日誌中應該會看到：
- ✅ `Supabase 連接成功` - 表示連接正常
- ⚠️ `Supabase 未配置或連接失敗，使用記憶體儲存` - 表示未設定或連接失敗

## 📊 資料庫結構

### Users 表
- `email` (Primary Key) - 用戶 Email
- `username` - 使用者名稱
- `nickname` - 暱稱
- `password` - 加密後的密碼（bcrypt）
- `created_at` - 建立時間
- `updated_at` - 更新時間

### Sessions 表
- `token` (Primary Key) - JWT token
- `email` - 用戶 Email（Foreign Key）
- `created_at` - 建立時間
- `expires_at` - 過期時間（預設 30 天）

### User_data 表
- `email` (Primary Key) - 用戶 Email（Foreign Key）
- `messages` (JSONB) - 對話記錄陣列
- `profile` (JSONB) - 個人檔案物件
- `spiritual_growth` (JSONB) - 屬靈成長記錄陣列
- `updated_at` - 更新時間

## 🔒 Row Level Security (RLS)

資料庫已啟用 RLS 保護資料安全。預設策略：
- 用戶只能存取自己的資料
- 管理員可以存取所有資料（需透過 Service Role Key）

如需自訂 RLS 策略，請在 Supabase Dashboard → Authentication → Policies 中調整。

## 🔄 降級機制

如果 Supabase 未配置或連接失敗，系統會自動降級使用記憶體儲存：
- ✅ 應用程式仍可正常運作
- ⚠️ 伺服器重啟後資料會遺失
- ⚠️ 無法跨伺服器實例共享資料

## 📝 注意事項

1. **免費層限制**：
   - 資料庫大小：500MB
   - API 請求：無限制（但建議實作速率限制）
   - 儲存空間：1GB

2. **備份**：
   - Supabase 會自動備份資料庫
   - 建議定期匯出重要資料

3. **安全性**：
   - 不要在公開場所暴露 Service Role Key
   - 定期輪換 API 金鑰
   - 啟用 Row Level Security

## 🆘 疑難排解

### 連接失敗

1. 檢查環境變數是否正確設定
2. 確認 Project URL 和 API Key 是否正確
3. 檢查網路連線
4. 查看 Supabase Dashboard 中的專案狀態

### 資料表不存在

1. 確認已執行 `supabase-schema.sql`
2. 檢查 SQL Editor 中的執行結果
3. 在 Table Editor 中確認資料表是否已建立

### RLS 策略問題

1. 檢查 RLS 是否已啟用
2. 確認當前使用的 API Key 權限
3. 如需要管理員權限，使用 Service Role Key

## 📚 相關資源

- [Supabase 官方文件](https://supabase.com/docs)
- [PostgreSQL 文件](https://www.postgresql.org/docs/)
- [Row Level Security 說明](https://supabase.com/docs/guides/auth/row-level-security)


