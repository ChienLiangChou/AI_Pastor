/**
 * 後端代理伺服器
 * 用於保護 API Key，避免在前端暴露
 * 
 * 使用方式：
 * 1. npm install express cors dotenv
 * 2. 在 .env 中設定 GOOGLE_API_KEY
 * 3. node server.js
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors());
app.use(express.json());

// 靜態檔案服務（提供 HTML）
app.use(express.static(path.join(__dirname, 'dist')));

// API 代理端點
app.post('/api/chat', async (req, res) => {
    const { prompt, history, mode } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ 
            error: 'API Key 未設定。請在伺服器端設定環境變數。' 
        });
    }

    const isBibleOnly = mode === 'bible-only';
    
    const SYSTEM_PROMPT_BIBLE_ONLY = `
你是一位充滿智慧、慈愛且博學的基督教 AI 牧師。
你的任務是根據使用者的問題，提供屬靈的指引和回答。

**嚴格規則 (Strict Rules):**

1. **唯獨聖經 (Sola Scriptura):** 你的回答內容必須 *完全* 基於《舊約聖經》和《新約聖經》。不要引用外部世俗觀點，除非它們完全符合聖經真理。

2. **經文引用 (Citation Required):** 你的每一個論點或回答，都 *必須* 引用具體的聖經章節。格式範例：(約翰福音 3:16) 或 (創世記 1:1)。

3. **解釋與應用:** 引用經文後，請解釋該經文如何回答使用者的問題。

4. **語氣:** 溫柔、鼓勵、造就人，像一位慈父或牧羊人。

5. **語言:** 請使用繁體中文 (Traditional Chinese) 回答。

6. **版本:** 默認使用和合本 (CUV) 的經文措辭。
`;

    const SYSTEM_PROMPT_WEB_SEARCH = `
你是一位充滿智慧、跟上時代的基督教 AI 牧師。
你的任務是回答使用者的問題，結合聖經真理與廣博的知識。

**規則 (Rules):**

1. **核心根基:** 你的回答必須以《舊約聖經》和《新約聖經》為核心根基。

2. **經文引用:** 當你提到聖經原則時，*必須* 引用具體章節 (書卷 章:節)。

3. **廣博知識:** 你可以利用搜尋工具來查找歷史背景、原文希臘文/希伯來文分析、著名神學家的觀點，或是現代社會的相關數據來豐富你的回答。

4. **分析:** 將網路上的資訊與聖經真理進行對照分析。

5. **語氣:** 專業、充滿洞見且富有同理心。

6. **語言:** 請使用繁體中文 (Traditional Chinese) 回答。
`;

    const systemInstruction = isBibleOnly ? SYSTEM_PROMPT_BIBLE_ONLY : SYSTEM_PROMPT_WEB_SEARCH;

    const contents = [
        ...history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        })),
        { role: 'user', parts: [{ text: prompt }] }
    ];

    const payload = {
        contents: contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { 
            temperature: 0.7, 
            maxOutputTokens: 2000,
            topP: 0.95,
            topK: 40
        }
    };

    if (!isBibleOnly) {
        try {
            payload.tools = [{ googleSearchRetrieval: {} }];
        } catch (e) {
            console.warn('無法啟用搜尋工具');
        }
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errorMessage = errData.error?.message || `API Error: ${response.status}`;
            
            if (response.status === 401) {
                return res.status(401).json({ error: 'API Key 無效或已過期' });
            } else if (response.status === 429) {
                return res.status(429).json({ error: 'API 請求過於頻繁，請稍後再試' });
            }
            
            return res.status(response.status).json({ error: errorMessage });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "牧師正在默想中...(無法生成回應)";
        
        const grounding = data.candidates?.[0]?.groundingMetadata?.groundingAttributions?.map(
            a => ({ uri: a.web?.uri, title: a.web?.title })
        ).filter(a => a.uri) || [];

        res.json({ text, grounding });
    } catch (error) {
        console.error('API 錯誤:', error);
        res.status(500).json({ error: error.message || '伺服器錯誤' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 伺服器運行在 http://localhost:${PORT}`);
    console.log(`📖 開啟瀏覽器訪問 http://localhost:${PORT}`);
    console.log(`🔒 API Key 已安全保護在伺服器端`);
});

