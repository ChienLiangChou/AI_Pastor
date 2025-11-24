/**
 * Vercel Serverless Function
 * 用於保護 Google Gemini API Key
 * Updated: 2025-11-24
 */

const { search } = require('duck-duck-scrape');

// 速率限制：每分鐘最多 1 次搜索請求（非常保守的限制，避免被封鎖）
const RATE_LIMIT = {
    maxRequests: 1,
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

// 生成隨機延遲（模擬人類行為）
function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// DuckDuckGo 搜索函數（帶錯誤處理和重試）
async function searchDuckDuckGo(query, maxRetries = 1) {
    if (!checkRateLimit()) {
        console.warn('速率限制：搜索請求過於頻繁，跳過本次搜索');
        return null;
    }

    // 在搜索前等待更長時間，並添加隨機延遲模擬人類行為
    // 基礎延遲 5-8 秒，加上隨機 2-5 秒
    const baseDelay = getRandomDelay(5000, 8000);
    const randomDelay = getRandomDelay(2000, 5000);
    const totalDelay = baseDelay + randomDelay;
    console.log(`等待 ${totalDelay}ms 後執行搜索（模擬人類行為）...`);
    await new Promise(resolve => setTimeout(resolve, totalDelay));

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
                    console.log(`成功獲取 ${formattedResults.length} 個搜索結果`);
                    return formattedResults;
                }
            }
            
            // 如果沒有結果，嘗試重試
            if (attempt < maxRetries) {
                const retryDelay = getRandomDelay(10000, 15000);
                console.log(`未獲取到結果，等待 ${retryDelay}ms 後重試 (嘗試 ${attempt + 1}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
            
            console.log('未獲取到搜索結果');
            return null;
        } catch (error) {
            const errorMsg = error.message || error.toString();
            console.error(`DuckDuckGo 搜索錯誤 (嘗試 ${attempt + 1}/${maxRetries + 1}):`, errorMsg);
            
            // 如果是速率限制錯誤，直接返回 null，不重試（避免進一步觸發限制）
            if (errorMsg.includes('anomaly') || errorMsg.includes('too quickly') || errorMsg.includes('rate limit')) {
                console.warn('檢測到速率限制，停止搜索以避免進一步觸發限制');
                return null;
            }
            
            if (attempt < maxRetries) {
                // 等待後重試（指數退避，更長的延遲，加上隨機延遲）
                const baseRetryDelay = 10000 * (attempt + 1);
                const randomRetryDelay = getRandomDelay(5000, 10000);
                const totalRetryDelay = baseRetryDelay + randomRetryDelay;
                console.log(`等待 ${totalRetryDelay}ms 後重試...`);
                await new Promise(resolve => setTimeout(resolve, totalRetryDelay));
            } else {
                console.log('搜索失敗，已達最大重試次數');
                return null;
            }
        }
    }
    return null;
}

// SerpAPI 搜索函數（備援方案）
async function searchSerpAPI(query) {
    const apiKey = process.env.SERPAPI_API_KEY;
    
    if (!apiKey) {
        console.warn('SerpAPI API Key 未設定，無法使用 SerpAPI 搜索');
        return null;
    }

    try {
        console.log('使用 SerpAPI 進行搜索:', query);
        
        // 構建 SerpAPI 請求 URL
        const params = new URLSearchParams({
            q: query,
            api_key: apiKey,
            engine: 'google',
            num: 5, // 獲取 5 個結果
            safe: 'active' // 安全搜索
        });

        const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`SerpAPI 請求失敗: ${response.status} - ${errorText}`);
            return null;
        }

        const data = await response.json();
        
        // 格式化搜索結果
        if (data && data.organic_results && Array.isArray(data.organic_results) && data.organic_results.length > 0) {
            const formattedResults = data.organic_results.slice(0, 5).map(result => ({
                title: result.title || '',
                url: result.link || '',
                description: result.snippet || ''
            })).filter(r => r.title && r.url); // 過濾掉無效結果
            
            if (formattedResults.length > 0) {
                console.log(`SerpAPI 成功獲取 ${formattedResults.length} 個搜索結果`);
                return formattedResults;
            }
        }
        
        console.log('SerpAPI 未獲取到搜索結果');
        return null;
    } catch (error) {
        console.error('SerpAPI 搜索錯誤:', error.message || error.toString());
        return null;
    }
}

// 統一的搜索函數（帶 fallback）
async function performWebSearch(query) {
    // 先嘗試 DuckDuckGo
    console.log('嘗試使用 DuckDuckGo 搜索...');
    let results = await searchDuckDuckGo(query);
    
    if (results && results.length > 0) {
        console.log('DuckDuckGo 搜索成功');
        return { results, source: 'duckduckgo' };
    }
    
    // 如果 DuckDuckGo 失敗，使用 SerpAPI 作為備援
    console.log('DuckDuckGo 搜索失敗，切換到 SerpAPI...');
    results = await searchSerpAPI(query);
    
    if (results && results.length > 0) {
        console.log('SerpAPI 搜索成功');
        return { results, source: 'serpapi' };
    }
    
    console.log('所有搜索方法都失敗了');
    return { results: null, source: null };
}

// 檢查問題是否包含不當內容
function containsInappropriateContent(text) {
    const inappropriateKeywords = [
        '自殺', 'suicide', 'kill myself', 'end my life',
        '色情', 'porn', 'pornography', 'sexual',
        '非法', 'illegal', 'drug', '毒品', '犯罪', 'crime'
    ];
    const lowerText = text.toLowerCase();
    return inappropriateKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

const DISCLAIMER = `
---

**重要提醒：** 如果您真的需要幫助，請務必前往教會尋找能夠幫助您的牧師。AI 牧師無法替代真實的人際關係和專業的屬靈輔導。
`;

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

7. **Source Declaration:** At the beginning of your response, clearly state: "本回答僅使用聖經資訊（唯獨聖經模式）" (for Chinese) or "This answer uses Bible-only information (Bible Only mode)" (for English).

8. **Disclaimer:** Always end your response with the disclaimer about seeking help from a real pastor at church.
`;

const SYSTEM_PROMPT_WEB_SEARCH = `
You are a wise, knowledgeable Christian AI Pastor.
Your task is to answer the user's questions, combining biblical truth with real-time web search results.

**CRITICAL RULES:**

1. **MANDATORY Web Search Usage:** You MUST use the web search results provided to you. If web search results are provided, you MUST incorporate them into your answer.

2. **Source Citation:** When using information from web search results, you MUST clearly mark it with:
   - For Chinese: "【網路資訊來源】" followed by the source title and URL
   - For English: "【Web Source】" followed by the source title and URL
   - Example: 【網路資訊來源】標題: [title], 網址: [url]

3. **Core Foundation:** Your answers must be rooted in the Old Testament and New Testament.

4. **Scripture Citation:** When you mention biblical principles, *must* cite specific chapters and verses (book chapter:verse).

5. **Web Search Integration:** Use the web search results to:
   - Find historical background and context
   - Discover original Greek/Hebrew word analysis
   - Learn about famous theologians' views
   - Get modern theological insights and scholarly research
   - Find relevant articles, studies, or resources

6. **Synthesis:** Combine the web search results with biblical truth to provide comprehensive, well-informed answers.

7. **Tone:** Professional, insightful, and empathetic.

8. **Language:** Respond in the same language as the user's question. If the user asks in English, respond in English. If the user asks in Chinese, respond in Traditional Chinese.

9. **Source Declaration:** At the beginning of your response, clearly state which sources you are using:
   - If using web search results: "本回答結合聖經與網路資訊（聖經+網路模式）" (Chinese) or "This answer combines Bible and web information (Bible + Web mode)" (English)
   - List all web sources used in your response

10. **Disclaimer:** Always end your response with the disclaimer about seeking help from a real pastor at church.
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

    // 檢查不當內容
    if (containsInappropriateContent(prompt)) {
        return res.status(400).json({ 
            error: '抱歉，我無法回答與自殺、非法活動或色情內容相關的問題。如果您需要幫助，請尋求專業的輔導或醫療協助。' 
        });
    }

    const isBibleOnly = mode === 'bible-only';
    let systemInstruction = isBibleOnly ? SYSTEM_PROMPT_BIBLE_ONLY : SYSTEM_PROMPT_WEB_SEARCH;
    let searchResults = null;
    let grounding = [];
    let searchFailed = false;
    let searchErrorMsg = '';

    // 在「聖經+網路」模式下執行網路搜索（帶 fallback）
    if (!isBibleOnly) {
        try {
            console.log('執行網路搜索:', prompt);
            const searchResponse = await performWebSearch(prompt);
            searchResults = searchResponse.results;
            
            if (searchResults && searchResults.length > 0) {
                // 將搜索結果格式化為文本，添加到系統提示中
                const searchContext = searchResults.map((result, index) => 
                    `[來源 ${index + 1}]\n標題: ${result.title}\n網址: ${result.url}\n描述: ${result.description}`
                ).join('\n\n');
                
                const sourceInfo = searchResponse.source === 'serpapi' 
                    ? '（使用 SerpAPI 搜索）' 
                    : '（使用 DuckDuckGo 搜索）';
                
                systemInstruction += `\n\n**當前搜索結果（必須使用）${sourceInfo}：**\n${searchContext}\n\n**重要：你必須使用這些搜索結果來回答問題。在回答中明確標註所有使用的網路資訊來源，格式為：【網路資訊來源】標題: [title], 網址: [url]**`;
                
                // 提取 grounding 資訊
                grounding = searchResults.map(result => ({
                    uri: result.url,
                    title: result.title
                }));
                
                console.log(`成功獲取 ${searchResults.length} 個搜索結果（來源: ${searchResponse.source}）`);
            } else {
                searchFailed = true;
                searchErrorMsg = '無法獲取網路搜索結果（DuckDuckGo 和 SerpAPI 都失敗）';
                console.log('所有搜索方法都失敗了');
                
                // 如果搜索失敗，明確告知用戶並提供選項
                systemInstruction += `\n\n**重要通知：** 目前無法使用網路搜索功能。請告知用戶：
1. 現在無法使用網路的資訊
2. 詢問用戶是否可以稍後再試，或者
3. 詢問用戶是否願意只使用聖經資訊來回答問題
請用友善、理解的語氣告知用戶這個情況。`;
            }
        } catch (error) {
            searchFailed = true;
            searchErrorMsg = error.message || '搜索過程出錯';
            console.error('搜索過程出錯:', error);
            
            // 如果搜索失敗，明確告知用戶並提供選項
            systemInstruction += `\n\n**重要通知：** 目前無法使用網路搜索功能。請告知用戶：
1. 現在無法使用網路的資訊
2. 詢問用戶是否可以稍後再試，或者
3. 詢問用戶是否願意只使用聖經資訊來回答問題
請用友善、理解的語氣告知用戶這個情況。`;
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
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "牧師正在默想中...(無法生成回應)";
        
        // 確保回答中包含 disclaimer（如果還沒有）
        if (!text.includes('教會') && !text.includes('church') && !text.includes('牧師') && !text.includes('pastor')) {
            text += DISCLAIMER;
        }
        
        // 如果沒有從搜索中獲取 grounding，嘗試從 Gemini API 響應中獲取
        if (grounding.length === 0) {
            grounding = data.candidates?.[0]?.groundingMetadata?.groundingAttributions?.map(
                a => ({ uri: a.web?.uri, title: a.web?.title })
            ).filter(a => a.uri) || [];
        }

        return res.status(200).json({ 
            text, 
            grounding,
            searchUsed: !isBibleOnly && searchResults && searchResults.length > 0,
            searchFailed: !isBibleOnly && searchFailed
        });
    } catch (error) {
        console.error('API 錯誤:', error);
        return res.status(500).json({ error: error.message || '伺服器錯誤' });
    }
}

