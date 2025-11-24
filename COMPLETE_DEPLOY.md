# 🚀 完整部署指南 - 一步一步完成

## 📋 當前狀態

✅ **已完成**：
- Git 倉庫已初始化並提交
- 所有代碼和配置文件已準備就緒
- 後端代理伺服器代碼已就緒
- 前端已支援後端代理模式

⏳ **需要您完成**（約 10-15 分鐘）：

## 🎯 部署流程

### 步驟 1: 推送到 GitHub（2 分鐘）

#### 選項 A: 使用 GitHub 網頁

1. 前往 https://github.com/new
2. 倉庫名稱：`ai-pastor`
3. 選擇 Public
4. **不要**勾選 "Initialize with README"
5. 點擊 "Create repository"

#### 選項 B: 使用 GitHub CLI（如果已安裝）

```bash
gh repo create ai-pastor --public --source=. --remote=origin --push
```

#### 選項 C: 手動推送

```bash
# 在專案目錄執行
git remote add origin https://github.com/YOUR_USERNAME/ai-pastor.git
git branch -M main
git push -u origin main
```

---

### 步驟 2: 部署後端到 Railway（5 分鐘）

1. **前往 Railway**
   - 開啟 https://railway.app/
   - 點擊 "Login" 或 "Start a New Project"
   - 選擇 "Login with GitHub"

2. **建立新專案**
   - 點擊 "New Project"
   - 選擇 "Deploy from GitHub repo"
   - 授權 Railway 訪問您的 GitHub
   - 選擇 `ai-pastor` 倉庫

3. **設定環境變數**
   - 點擊專案進入設定頁面
   - 點擊 "Variables" 標籤
   - 新增環境變數：
     - **Key**: `GOOGLE_API_KEY`
     - **Value**: `AIzaSyD993-kCu7liPeaA0F754aPbuS1eXnKJVQ`
   - 點擊 "Add"

4. **獲得後端 URL**
   - Railway 會自動開始部署
   - 等待部署完成（約 1-2 分鐘）
   - 點擊 "Settings" → "Domains"
   - 點擊 "Generate Domain"（如果還沒有）
   - 複製生成的 URL（例如：`https://ai-pastor-production.up.railway.app`）

**記下這個 URL，下一步會用到！**

---

### 步驟 3: 更新前端配置（1 分鐘）

獲得後端 URL 後，更新前端配置：

```bash
# 在專案目錄執行
# 將 YOUR_BACKEND_URL 替換為您的 Railway URL

# macOS/Linux
sed -i '' "s|const API_BASE_URL = window.API_BASE_URL || '.*';|const API_BASE_URL = window.API_BASE_URL || 'YOUR_BACKEND_URL';|g" index.html

# 或手動編輯 index.html 第 40 行
# 將空字串改為您的後端 URL
```

然後重新建置並推送：

```bash
npm run build
git add index.html dist/
git commit -m "Update API_BASE_URL for production"
git push
```

---

### 步驟 4: 部署前端到 Netlify（3 分鐘）

1. **前往 Netlify**
   - 開啟 https://www.netlify.com/
   - 點擊 "Sign up" 或 "Log in"
   - 選擇 "Log in with GitHub"

2. **導入專案**
   - 點擊 "Add new site" → "Import an existing project"
   - 選擇 "Deploy with GitHub"
   - 授權 Netlify 訪問您的 GitHub
   - 選擇 `ai-pastor` 倉庫

3. **設定建置選項**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - 點擊 "Deploy site"

4. **獲得前端 URL**
   - Netlify 會自動開始部署
   - 等待部署完成（約 1-2 分鐘）
   - 您會看到類似 `https://ai-pastor-123456.netlify.app` 的 URL

**這就是可以公開分享的連結！** 🎉

---

## ✅ 部署完成檢查清單

- [ ] 後端已部署到 Railway
- [ ] 後端 URL 已獲得
- [ ] 前端配置已更新為後端 URL
- [ ] 前端已部署到 Netlify
- [ ] 前端 URL 已獲得

## 🔍 驗證部署

1. 開啟前端網站（Netlify URL）
2. 按 `F12` 開啟開發者工具
3. 切換到 "Network" 標籤
4. 在 AI Pastor 中發送一條測試訊息
5. 檢查 Network 標籤：
   - ✅ 應該看到請求發送到您的 Railway 後端 URL (`/api/chat`)
   - ❌ **不應該**看到直接呼叫 `generativelanguage.googleapis.com` 的請求

如果看到直接呼叫 Google API，表示前端配置有問題，請檢查 `index.html` 中的 `API_BASE_URL`。

## 🎉 完成！

現在您可以：
- ✅ 公開分享前端連結
- ✅ 讓任何人使用 AI Pastor
- ✅ API Key 安全保護在後端
- ✅ 不會有 API Key 洩露風險

## 📞 遇到問題？

- 檢查 `DEPLOYMENT_STATUS.md` 查看當前狀態
- 查看 `DEPLOY.md` 獲取詳細說明
- 查看 `SECURITY.md` 了解安全相關資訊

---

## 🚀 快速命令參考

```bash
# 1. 推送到 GitHub（如果還沒）
git remote add origin https://github.com/YOUR_USERNAME/ai-pastor.git
git push -u origin main

# 2. 更新前端配置（替換 YOUR_BACKEND_URL）
sed -i '' "s|const API_BASE_URL = window.API_BASE_URL || '.*';|const API_BASE_URL = window.API_BASE_URL || 'YOUR_BACKEND_URL';|g" index.html

# 3. 重新建置並推送
npm run build
git add index.html dist/
git commit -m "Update API_BASE_URL"
git push
```

