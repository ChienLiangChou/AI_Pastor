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
    
    if (!fs.existsSync(envPath)) {
        console.error('❌ 找不到 .env 檔案');
        console.log('💡 請先複製 .env.example 為 .env 並填入您的 API Key');
        process.exit(1);
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
        // 使用前端 API Key 模式（僅本地開發，不推薦公開）
        console.warn('⚠️  使用前端 API Key 模式（僅限本地開發，不適合公開部署）');
        
        if (!apiKey || apiKey.includes('在此處貼上') || apiKey.trim() === '') {
            console.error('❌ API Key 未設定或無效');
            console.log('💡 請在 .env 檔案中設定 GOOGLE_API_KEY');
            console.log('💡 或設定 API_BASE_URL 使用後端代理（推薦）');
            process.exit(1);
        }

        // 替換 API Key
        const apiKeyPattern = /const GOOGLE_API_KEY = window\.GOOGLE_API_KEY \|\| .*?;/;
        const replacement = `const GOOGLE_API_KEY = window.GOOGLE_API_KEY || "${apiKey}";`;
        
        if (apiKeyPattern.test(htmlContent)) {
            htmlContent = htmlContent.replace(apiKeyPattern, replacement);
            console.log('✅ API Key 已注入（前端模式）');
        } else {
            console.warn('⚠️  無法找到 API Key 配置區域，請檢查 HTML 檔案格式');
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

