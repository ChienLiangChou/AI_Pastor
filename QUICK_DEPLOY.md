# ⚡ 5 分鐘快速部署指南

## 🎯 目標：獲得公開連結

## 步驟 1: 推送到 GitHub（1 分鐘）

```bash
# 在專案目錄執行
# 1. 先在 GitHub 建立新倉庫：https://github.com/new
#    倉庫名稱：ai-pastor
#    選擇 Public
#    不要勾選任何初始化選項

# 2. 然後執行（替換 YOUR_USERNAME）：
git remote add origin https://github.com/YOUR_USERNAME/ai-pastor.git
git branch -M main
git push -u origin main
```

## 步驟 2: 部署後端到 Railway（3 分鐘）

1. **前往** https://railway.app/
2. **點擊** "Login with GitHub"
3. **點擊** "New Project" → "Deploy from GitHub repo"
4. **選擇** `ai-pastor` 倉庫
5. **等待** Railway 自動偵測並部署（約 30 秒）
6. **點擊** 專案 → "Variables" 標籤
7. **新增** 環境變數：
   - Key: `GOOGLE_API_KEY`
   - Value: `AIzaSyD993-kCu7liPeaA0F754aPbuS1eXnKJVQ`
8. **點擊** "Settings" → "Domains" → "Generate Domain"
9. **複製** 生成的 URL（例如：`https://ai-pastor-production.up.railway.app`）

**記下這個 URL！**

## 步驟 3: 更新前端並部署到 Netlify（1 分鐘）

### 3.1 更新前端配置

```bash
# 將 YOUR_BACKEND_URL 替換為您剛才獲得的 Railway URL
# macOS:
sed -i '' "s|const API_BASE_URL = window.API_BASE_URL || '.*';|const API_BASE_URL = window.API_BASE_URL || 'YOUR_BACKEND_URL';|g" index.html

# 然後：
npm run build
git add index.html dist/
git commit -m "Update API_BASE_URL"
git push
```

### 3.2 部署到 Netlify

1. **前往** https://www.netlify.com/
2. **點擊** "Login with GitHub"
3. **點擊** "Add new site" → "Import an existing project"
4. **選擇** `ai-pastor` 倉庫
5. **設定**：
   - Build command: `npm run build`
   - Publish directory: `dist`
6. **點擊** "Deploy site"
7. **等待** 部署完成（約 30 秒）
8. **複製** 生成的 URL（例如：`https://ai-pastor-123456.netlify.app`）

## 🎉 完成！

**這就是您的公開連結！** 可以分享給任何人使用。

---

## 🔍 驗證

開啟連結後，按 F12 → Network，發送一條訊息，應該看到請求發送到您的 Railway 後端。

