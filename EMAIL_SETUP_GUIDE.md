# 📧 Email 通知設定指南

## 📋 功能說明

當有用戶註冊時，系統會自動發送 Email 通知到您指定的管理員信箱。

## 🚀 設定步驟

### 方案 1：使用 Gmail（最簡單，推薦）

#### 步驟 1：建立 Gmail 應用程式密碼

1. 前往 Google 帳號設定：https://myaccount.google.com/
2. 點擊「安全性」
3. 在「登入 Google」區塊中，找到「兩步驟驗證」並啟用（如果還沒啟用）
4. 啟用後，回到「安全性」頁面
5. 找到「應用程式密碼」
6. 選擇「郵件」和「其他（自訂名稱）」
7. 輸入名稱：`AI Pastor`
8. 點擊「產生」
9. 複製生成的 16 位密碼（格式類似：`abcd efgh ijkl mnop`）

#### 步驟 2：在 Render 設定環境變數

在 Render Dashboard → 您的服務 → Environment：

添加以下環境變數：

| Key | Value | 說明 |
|-----|-------|------|
| `GMAIL_USER` | `your-email@gmail.com` | 您的 Gmail 地址 |
| `GMAIL_APP_PASSWORD` | `abcd efgh ijkl mnop` | 剛才生成的應用程式密碼（移除空格） |
| `ADMIN_EMAIL` | `your-email@gmail.com` | 接收通知的 Email（通常是同一個） |
| `EMAIL_FROM` | `AI Pastor <your-email@gmail.com>` | 發送者名稱（可選） |

**重要：** 應用程式密碼中的空格可以保留或移除，都可以正常運作。

---

### 方案 2：使用 SendGrid（專業方案，免費額度大）

#### 步驟 1：建立 SendGrid 帳號

1. 前往 https://sendgrid.com/
2. 註冊免費帳號（每月可免費發送 100 封 Email）
3. 完成 Email 驗證

#### 步驟 2：建立 API Key

1. 在 SendGrid Dashboard，前往「Settings」→「API Keys」
2. 點擊「Create API Key」
3. 選擇「Full Access」或「Restricted Access」（選擇「Mail Send」權限）
4. 複製生成的 API Key

#### 步驟 3：在 Render 設定環境變數

| Key | Value | 說明 |
|-----|-------|------|
| `SENDGRID_API_KEY` | `SG.xxxxx` | SendGrid API Key |
| `ADMIN_EMAIL` | `your-email@example.com` | 接收通知的 Email |
| `EMAIL_FROM` | `AI Pastor <noreply@yourdomain.com>` | 發送者（可選） |

---

### 方案 3：使用其他 SMTP 服務

如果您使用其他 Email 服務（如 Outlook、Yahoo、自訂 SMTP），可以設定：

| Key | Value | 說明 |
|-----|-------|------|
| `SMTP_HOST` | `smtp.example.com` | SMTP 伺服器地址 |
| `SMTP_PORT` | `587` | SMTP 端口（通常是 587 或 465） |
| `SMTP_SECURE` | `false` | 是否使用 SSL（587 用 false，465 用 true） |
| `SMTP_USER` | `your-email@example.com` | SMTP 使用者名稱 |
| `SMTP_PASSWORD` | `your-password` | SMTP 密碼 |
| `ADMIN_EMAIL` | `your-email@example.com` | 接收通知的 Email |
| `EMAIL_FROM` | `AI Pastor <your-email@example.com>` | 發送者（可選） |

---

## ✅ 驗證設定

設定完成後：

1. **等待 Render 重新部署**（約 1-2 分鐘）
2. **測試註冊功能**：
   - 訪問 `https://ai-pastor.vercel.app`
   - 註冊一個測試帳號
   - 檢查您的 Email 是否收到通知

3. **檢查 Render Logs**：
   - 在 Render Dashboard → Logs
   - 應該看到：`✅ 註冊通知 Email 已發送: ...`
   - 如果有錯誤，會顯示：`❌ 發送 Email 通知失敗: ...`

---

## 📧 Email 通知內容

您會收到類似這樣的 Email：

**主旨：** 🎉 新用戶註冊 - AI 牧師

**內容：**
- 用戶 Email
- 使用者名稱
- 暱稱
- 註冊時間
- 管理端點連結

---

## 🔧 故障排除

### 問題 1：沒有收到 Email

**檢查項目：**
1. 確認環境變數是否正確設定
2. 檢查 Render Logs 是否有錯誤訊息
3. 確認 Email 服務設定是否正確（Gmail 應用程式密碼、SendGrid API Key 等）
4. 檢查垃圾郵件資料夾

### 問題 2：Gmail 應用程式密碼無效

**解決方案：**
1. 確認已啟用兩步驟驗證
2. 確認複製的密碼完整（16 位字元）
3. 嘗試重新生成應用程式密碼

### 問題 3：SendGrid API Key 無效

**解決方案：**
1. 確認 API Key 是否正確複製
2. 確認 API Key 是否有「Mail Send」權限
3. 檢查 SendGrid 帳號是否已驗證 Email

---

## 📝 環境變數總結

### 必要環境變數

**Gmail 方案：**
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `ADMIN_EMAIL`

**SendGrid 方案：**
- `SENDGRID_API_KEY`
- `ADMIN_EMAIL`

**自訂 SMTP 方案：**
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `ADMIN_EMAIL`

### 可選環境變數

- `EMAIL_FROM` - 自訂發送者名稱和 Email
- `SMTP_SECURE` - SMTP 安全連接設定

---

## 🎉 完成！

設定完成後，每當有新用戶註冊，您就會自動收到 Email 通知！




