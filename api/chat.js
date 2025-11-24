/**
 * Vercel Serverless Function
 * 用於保護 Google Gemini API Key
 */

const { search } = require('duck-duck-scrape');

// 速率限制：每分鐘最多 5 次搜索請求（更保守的限制）
const RATE_LIMIT = {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 分鐘
    requests: []
};

// 清理過期的請求記錄
function cleanRateLimit() {
    const now = Date.now();
    RATE_LIMIT.requests = RATE_LIMIT.requests.filter(
        timestamp => now - timestamp < RATE_LIMIT.windowMs
    );
}

// 檢查速率限制
function checkRateLimit() {
    cleanRateLimit();
    if (RATE_LIMIT.requests.length >= RATE_LIMIT.maxRequests) {
        return false;
    }
    RATE_LIMIT.requests.push(Date.now());
    return true;
}

// DuckDuckGo 搜索函數（帶錯誤處理和重試）
async function searchDuckDuckGo(query, maxRetries = 1) {
    if (!checkRateLimit()) {
        console.warn('速率限制：搜索請求過於頻繁，跳過本次搜索');
        return null;
    }

    // 在搜索前等待一段時間，避免請求過快
    await new Promise(resolve => setTimeout(resolve, 2000));

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // 使用 DuckDuckGo 搜索
            const results = await search(query, {
                safeSearch: 'moderate'
            });
            
            // 格式化搜索結果
            if (results && results.results && Array.isArray(results.results) && results.results.length > 0) {
                const formattedResults = results.results.slice(0, 5).map(result => ({
                    title: result.title || '',
                    url: result.url || '',
                    description: result.description || ''
                })).filter(r => r.title && r.url); // 過濾掉無效結果
                
                if (formattedResults.length > 0) {
                    return formattedResults;
                }
            }
            return null;
        } catch (error) {
            const errorMsg = error.message || error.toString();
            console.error(`DuckDuckGo 搜索錯誤 (嘗試 ${attempt + 1}/${maxRetries + 1}):`, errorMsg);
            
            // 如果是速率限制錯誤，直接返回 null，不重試
            if (errorMsg.includes('anomaly') || errorMsg.includes('too quickly') || errorMsg.includes('rate limit')) {
                console.warn('檢測到速率限制，跳過搜索');
                return null;
            }
            
            if (attempt < maxRetries) {
                // 等待後重試（指數退避，更長的延遲）
                const delay = 3000 * (attempt + 1);
                console.log(`等待 ${delay}ms 後重試...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                return null;
            }
        }
    }
    return null;
}

const SYSTEM_PROMPT_BIBLE_ONLY = `
You are a wise, loving, and learned Christian AI Pastor.
Your task is to provide spiritual guidance and answers based on the user's questions.

**Strict Rules:**

1. **Sola Scriptura:** Your answers must be *completely* based on the Old Testament and New Testament. Do not cite external secular views unless they fully align with biblical truth.

2. **Citation Required:** Every point or answer you make *must* cite specific Bible verses. Format example: (John 3:16) or (Genesis 1:1).

3. **Explanation and Application:** After citing verses, explain how the verse answers the user's question.

4. **Tone:** Gentle, encouraging, and edifying, like a loving father or shepherd.

5. **Language:** Respond in the same language as the user's question. If the user asks in English, respond in English. If the user asks in Chinese, respond in Traditional Chinese.

6. **Version:** Default to CUV (Chinese Union Version) wording for Chinese responses.
`;

const SYSTEM_PROMPT_WEB_SEARCH = `
You are a wise, knowledgeable Christian AI Pastor.
Your task is to answer the user's questions, combining biblical truth with real-time web search results and your extensive training knowledge.

**Rules:**

1. **Core Foundation:** Your answers must be rooted in the Old Testament and New Testament.

2. **Scripture Citation:** When you mention biblical principles, *must* cite specific chapters and verses (book chapter:verse).

3. **Web Search Integration:** You will receive web search results related to the user's question. Use these results to:
   - Find historical background and context
   - Discover original Greek/Hebrew word analysis
   - Learn about famous theologians' views
   - Get modern theological insights and scholarly research
   - Find relevant articles, studies, or resources

4. **Synthesis:** Combine the web search results with biblical truth and your training knowledge to provide comprehensive, well-informed answers.

5. **Citation:** When using information from web search results, acknowledge the sources naturally in your response.

6. **Tone:** Professional, insightful, and empathetic.

7. **Language:** Respond in the same language as the user's question. If the user asks in English, respond in English. If the user asks in Chinese, respond in Traditional Chinese.
`;

export default async function handler(req, res) {
    // 只允許 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 啟用 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 處理 OPTIONS 預檢請求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { prompt, history, mode } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ 
            error: 'API Key 未設定。請在 Vercel 環境變數中設定 GOOGLE_API_KEY。' 
        });
    }

    if (!prompt) {
        return res.status(400).json({ error: '請提供 prompt 參數' });
    }

    const isBibleOnly = mode === 'bible-only';
    let systemInstruction = isBibleOnly ? SYSTEM_PROMPT_BIBLE_ONLY : SYSTEM_PROMPT_WEB_SEARCH;
    let searchResults = null;
    let grounding = [];

    // 在「聖經+網路」模式下執行 DuckDuckGo 搜索
    if (!isBibleOnly) {
        try {
            console.log('執行 DuckDuckGo 搜索:', prompt);
            searchResults = await searchDuckDuckGo(prompt);
            
            if (searchResults && searchResults.length > 0) {
                // 將搜索結果格式化為文本，添加到系統提示中
                const searchContext = searchResults.map((result, index) => 
                    `[來源 ${index + 1}]\n標題: ${result.title}\n網址: ${result.url}\n描述: ${result.description}`
                ).join('\n\n');
                
                systemInstruction += `\n\n**當前搜索結果：**\n${searchContext}\n\n請使用這些搜索結果來豐富你的回答，同時保持以聖經為核心基礎。`;
                
                // 提取 grounding 資訊
                grounding = searchResults.map(result => ({
                    uri: result.url,
                    title: result.title
                }));
                
                console.log(`成功獲取 ${searchResults.length} 個搜索結果`);
            } else {
                console.log('未獲取到搜索結果，將使用模型知識');
            }
        } catch (error) {
            console.error('搜索過程出錯:', error);
            // 搜索失敗時繼續使用模型知識，不中斷流程
        }
    }

    const contents = [
        ...(history || []).map(msg => ({
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
        
        // 如果沒有從搜索中獲取 grounding，嘗試從 Gemini API 響應中獲取
        if (grounding.length === 0) {
            grounding = data.candidates?.[0]?.groundingMetadata?.groundingAttributions?.map(
                a => ({ uri: a.web?.uri, title: a.web?.title })
            ).filter(a => a.uri) || [];
        }

        return res.status(200).json({ text, grounding });
    } catch (error) {
        console.error('API 錯誤:', error);
        return res.status(500).json({ error: error.message || '伺服器錯誤' });
    }
}

