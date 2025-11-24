#!/usr/bin/env node

/**
 * 建置腳本：將環境變數注入到 HTML 檔案中
 * 使用方式：npm run build
 */

const fs = require('fs');
const path = require('path');

// 讀取 .env 檔案
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    
    // 如果沒有 .env 檔案，返回空物件（Vercel 上使用環境變數）
    if (!fs.existsSync(envPath)) {
        console.log('⚠️  找不到 .env 檔案，使用環境變數（適用於 Vercel 部署）');
        return {};
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                env[key.trim()] = valueParts.join('=').trim();
            }
        }
    });

    return env;
}

// 讀取 HTML 檔案並注入環境變數
function buildHTML() {
    const htmlPath = path.join(__dirname, 'index.html');
    const distPath = path.join(__dirname, 'dist');
    const distHtmlPath = path.join(distPath, 'index.html');

    if (!fs.existsSync(htmlPath)) {
        console.error('❌ 找不到 index.html 檔案');
        process.exit(1);
    }

    const env = loadEnv();
    const apiKey = env.GOOGLE_API_KEY;
    const apiBaseUrl = env.API_BASE_URL || '';

    console.log('📖 讀取 index.html...');
    let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    // 在 Vercel 上，使用相對路徑（同域 API），不需要注入 API_BASE_URL
    // 如果設定了 API_BASE_URL，優先使用後端代理模式
    if (apiBaseUrl) {
        console.log('🔒 使用後端代理模式（推薦，安全）');
        const apiBaseUrlPattern = /const API_BASE_URL = window\.API_BASE_URL \|\| '.*?';/;
        const apiBaseUrlReplacement = `const API_BASE_URL = window.API_BASE_URL || '${apiBaseUrl}';`;
        
        if (apiBaseUrlPattern.test(htmlContent)) {
            htmlContent = htmlContent.replace(apiBaseUrlPattern, apiBaseUrlReplacement);
            console.log('✅ API_BASE_URL 已注入');
        }
        
        // 確保 GOOGLE_API_KEY 設為 null（不使用前端 API Key）
        const apiKeyPattern = /const GOOGLE_API_KEY = window\.GOOGLE_API_KEY \|\| .*?;/;
        const apiKeyReplacement = `const GOOGLE_API_KEY = window.GOOGLE_API_KEY || null;`;
        if (apiKeyPattern.test(htmlContent)) {
            htmlContent = htmlContent.replace(apiKeyPattern, apiKeyReplacement);
            console.log('✅ 已停用前端 API Key（使用後端代理）');
        }
    } else {
        // 在 Vercel 上，使用相對路徑（同域 API），不需要前端 API Key
        console.log('🔒 使用相對路徑模式（Vercel 部署，使用 serverless functions）');
        
        // 確保 GOOGLE_API_KEY 設為 null（不使用前端 API Key）
        const apiKeyPattern = /const GOOGLE_API_KEY = window\.GOOGLE_API_KEY \|\| .*?;/;
        const apiKeyReplacement = `const GOOGLE_API_KEY = window.GOOGLE_API_KEY || null;`;
        if (apiKeyPattern.test(htmlContent)) {
            htmlContent = htmlContent.replace(apiKeyPattern, apiKeyReplacement);
            console.log('✅ 已停用前端 API Key（使用 serverless functions）');
        }
        
        // 確保 API_BASE_URL 為空（使用相對路徑）
        const apiBaseUrlPattern = /const API_BASE_URL = window\.API_BASE_URL \|\| '.*?';/;
        const apiBaseUrlReplacement = `const API_BASE_URL = window.API_BASE_URL || '';`;
        if (apiBaseUrlPattern.test(htmlContent)) {
            htmlContent = htmlContent.replace(apiBaseUrlPattern, apiBaseUrlReplacement);
            console.log('✅ API_BASE_URL 已設為空（使用相對路徑）');
        }
    }

    // 確保 dist 目錄存在
    if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true });
        console.log('📁 建立 dist 目錄');
    }

    // 寫入建置後的檔案
    fs.writeFileSync(distHtmlPath, htmlContent, 'utf-8');
    console.log('✅ 建置完成！輸出檔案：dist/index.html');
    console.log('💡 您可以直接開啟 dist/index.html 使用');
}

// 執行建置
try {
    buildHTML();
} catch (error) {
    console.error('❌ 建置失敗：', error.message);
    process.exit(1);
}

