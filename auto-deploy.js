#!/usr/bin/env node

/**
 * 自動部署腳本
 * 使用 GitHub API 建立倉庫並準備部署
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 AI Pastor 自動部署');
console.log('====================\n');

// 檢查是否已設定 GitHub token
const githubToken = process.env.GITHUB_TOKEN;
const repoName = 'ai-pastor';
const githubUser = process.env.GITHUB_USER || '';

async function createGitHubRepo() {
    if (!githubToken) {
        console.log('ℹ️  未設定 GITHUB_TOKEN 環境變數');
        console.log('   將跳過自動建立 GitHub 倉庫');
        console.log('   請手動在 GitHub 上建立倉庫，然後執行：');
        console.log('   git remote add origin https://github.com/YOUR_USERNAME/ai-pastor.git');
        console.log('   git push -u origin main\n');
        return false;
    }

    try {
        console.log('📦 正在建立 GitHub 倉庫...');
        
        const response = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: repoName,
                description: 'AI 牧師 - 你的隨身靈修導師',
                private: false,
                auto_init: false
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ GitHub 倉庫已建立: ${data.html_url}\n`);
            return data.html_url;
        } else if (response.status === 422) {
            console.log('⚠️  倉庫可能已存在，繼續使用現有倉庫\n');
            return `https://github.com/${githubUser}/${repoName}`;
        } else {
            const error = await response.text();
            console.log(`❌ 建立倉庫失敗: ${error}\n`);
            return false;
        }
    } catch (error) {
        console.log(`❌ 錯誤: ${error.message}\n`);
        return false;
    }
}

function updateFrontendConfig(backendUrl) {
    console.log('📝 更新前端配置...');
    
    const htmlPath = path.join(__dirname, 'index.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    
    // 更新 API_BASE_URL
    const pattern = /const API_BASE_URL = window\.API_BASE_URL \|\| '.*?';/;
    const replacement = `const API_BASE_URL = window.API_BASE_URL || '${backendUrl}';`;
    
    if (pattern.test(htmlContent)) {
        htmlContent = htmlContent.replace(pattern, replacement);
        fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
        console.log(`✅ 前端配置已更新為: ${backendUrl}\n`);
        
        // 重新建置
        console.log('🔨 重新建置前端...');
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ 建置完成\n');
        
        return true;
    }
    
    return false;
}

function pushToGitHub() {
    try {
        console.log('📤 推送到 GitHub...');
        
        // 檢查是否已設定 remote
        try {
            execSync('git remote get-url origin', { stdio: 'ignore' });
        } catch (e) {
            console.log('❌ 未設定 GitHub remote');
            return false;
        }
        
        execSync('git branch -M main', { stdio: 'inherit' });
        execSync('git add -A', { stdio: 'inherit' });
        execSync('git commit -m "Deploy: Update frontend config"', { stdio: 'inherit' });
        execSync('git push -u origin main', { stdio: 'inherit' });
        
        console.log('✅ 已推送到 GitHub\n');
        return true;
    } catch (error) {
        console.log(`❌ 推送失敗: ${error.message}\n`);
        return false;
    }
}

// 主流程
async function main() {
    console.log('步驟 1: 建立 GitHub 倉庫\n');
    const repoUrl = await createGitHubRepo();
    
    if (repoUrl) {
        // 設定 remote（如果還沒有）
        try {
            execSync('git remote get-url origin', { stdio: 'ignore' });
        } catch (e) {
            execSync(`git remote add origin ${repoUrl}.git`, { stdio: 'inherit' });
        }
    }
    
    console.log('\n📋 部署步驟：');
    console.log('============\n');
    console.log('1. 後端部署到 Railway:');
    console.log('   - 前往 https://railway.app/');
    console.log('   - 用 GitHub 登入');
    console.log('   - 建立新專案並連接 GitHub 倉庫');
    console.log('   - 在環境變數中設定: GOOGLE_API_KEY=您的_GOOGLE_API_KEY（請從 Google AI Studio 獲取新的 API Key）');
    console.log('   - Railway 會提供後端 URL\n');
    
    console.log('2. 獲得後端 URL 後，執行：');
    console.log('   BACKEND_URL=https://your-backend.railway.app node auto-deploy.js\n');
    
    console.log('3. 前端部署到 Netlify:');
    console.log('   - 前往 https://www.netlify.com/');
    console.log('   - 用 GitHub 登入');
    console.log('   - 導入專案，選擇 ai-pastor 倉庫');
    console.log('   - Build command: npm run build');
    console.log('   - Publish directory: dist');
    console.log('   - 部署完成後會獲得前端 URL\n');
    
    // 如果提供了後端 URL，自動更新配置
    const backendUrl = process.argv[2] || process.env.BACKEND_URL;
    if (backendUrl) {
        console.log(`\n🔧 檢測到後端 URL: ${backendUrl}`);
        updateFrontendConfig(backendUrl);
        pushToGitHub();
    }
}

main().catch(console.error);

