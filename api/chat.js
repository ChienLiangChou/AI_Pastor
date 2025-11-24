/**
 * Vercel Serverless Function
 * 用於保護 Google Gemini API Key
 */

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
Your task is to answer the user's questions, combining biblical truth with your extensive training knowledge.

**Rules:**

1. **Core Foundation:** Your answers must be rooted in the Old Testament and New Testament.

2. **Scripture Citation:** When you mention biblical principles, *must* cite specific chapters and verses (book chapter:verse).

3. **Broad Knowledge:** Draw upon your training knowledge including historical background, original Greek/Hebrew analysis, views of famous theologians, and theological insights to enrich your answers.

4. **Analysis:** Synthesize your knowledge with biblical truth to provide comprehensive answers.

5. **Tone:** Professional, insightful, and empathetic.

6. **Language:** Respond in the same language as the user's question. If the user asks in English, respond in English. If the user asks in Chinese, respond in Traditional Chinese.
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
    const systemInstruction = isBibleOnly ? SYSTEM_PROMPT_BIBLE_ONLY : SYSTEM_PROMPT_WEB_SEARCH;

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

    if (!isBibleOnly) {
        // 注意：某些 Gemini 模型版本不支持搜索工具
        // googleSearchRetrieval 已被棄用，而 google_search 工具可能在此模型版本中不可用
        // 暫時移除工具配置，讓模型基於其訓練數據回答（包含截至訓練時的知識）
        // 這樣可以確保功能正常運作，雖然無法獲取最新的網路資訊
        console.log('Web search mode: Using model knowledge (search tools not available for this model version)');
        // payload.tools = [{ googleSearchRetrieval: {} }]; // 已棄用
        // payload.tools = [{ google_search: {} }]; // 此模型版本可能不支持
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

        return res.status(200).json({ text, grounding });
    } catch (error) {
        console.error('API 錯誤:', error);
        return res.status(500).json({ error: error.message || '伺服器錯誤' });
    }
}

