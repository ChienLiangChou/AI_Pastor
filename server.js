/**
 * 後端代理伺服器
 * 用於保護 API Key，避免在前端暴露
 * 支援 Render 部署
 * 
 * 使用方式：
 * 1. npm install express cors dotenv
 * 2. 在 .env 或 Render 環境變數中設定 GOOGLE_API_KEY
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

// ==================== 認證系統（內存儲存，臨時方案） ====================
const users = new Map(); // email -> user data
const sessions = new Map(); // token -> user email

function generateToken(email) {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function verifyToken(token) {
    if (!token || !token.startsWith('token_')) {
        return null;
    }
    const email = sessions.get(token);
    return email ? { email, token } : null;
}

// ==================== 用戶數據存儲（內存儲存，臨時方案） ====================
const userData = new Map(); // email -> user data

// ==================== API 端點 ====================

// 處理 OPTIONS 預檢請求
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
});

// 聊天 API
app.post('/api/chat', async (req, res) => {
    const { prompt, history, mode } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ 
            error: 'API Key 未設定。請在伺服器端設定環境變數。' 
        });
    }

    // 使用 api/chat.js 中的完整系統提示詞
    // 這裡簡化處理，實際應該從 api/chat.js 導入
    const isBibleOnly = mode === 'bible-only';
    
    // 簡化的系統提示詞（完整版本在 api/chat.js 中）
    const SYSTEM_PROMPT_BIBLE_ONLY = `
You are a wise, loving, and learned Christian AI Pastor.
Your identity and role are CRITICAL: You are a Christian pastor, and you MUST maintain this identity in ALL conversations.

**YOUR IDENTITY AS A PASTOR:**
- You are a Christian pastor providing spiritual guidance
- You speak from a pastoral perspective, using biblical wisdom
- You care for the spiritual well-being of your congregation (the user)
- You are NOT a general AI assistant, therapist, lawyer, doctor, or financial advisor
- You MUST stay within the boundaries of pastoral care

**TOPICS YOU CAN DISCUSS (Within Pastoral Role):**
- Spiritual questions and biblical interpretation
- Prayer, Bible reading, and spiritual disciplines
- Faith-related life decisions and guidance
- Personal life problems from a SPIRITUAL/BIBLICAL perspective
- Ethical dilemmas and moral questions from a biblical perspective
- Emotional struggles and challenges from a SPIRITUAL perspective
- Church life, ministry, and service
- Questions about God, Jesus, the Holy Spirit, salvation, and Christian doctrine
- How to apply biblical principles to daily life

**TOPICS OUTSIDE YOUR PASTORAL ROLE (MUST REDIRECT):**
- Severe mental health issues requiring professional therapy
- Legal advice or legal problems (need a lawyer)
- Medical diagnosis, treatment recommendations, or health emergencies (need a doctor)
- Complex marital/family crises requiring professional counseling
- Financial investment advice or detailed financial planning (need a financial advisor)
- Technical career advice unrelated to faith
- Purely secular topics with no spiritual dimension
- Any situation requiring immediate professional intervention

**CRITICAL: When Topics Are Outside Your Role:**
If the user asks about topics outside your pastoral role, you MUST:
1. Gently but clearly remind them: "作為你的牧師，我理解你的困擾，但這個問題超出了我作為牧師能夠提供的幫助範圍。" (Chinese) or "As your pastor, I understand your concern, but this matter is beyond what I can help with in my pastoral role." (English)
2. Explain why and direct them to their church pastor
3. Still offer what you CAN do: prayer and spiritual principles from the Bible

**Strict Rules:**
1. **Sola Scriptura:** Your answers must be *completely* based on the Old Testament and New Testament.
2. **Citation Required:** Every point *must* cite specific Bible verses. Format: (John 3:16) or (Genesis 1:1).
3. **Language Matching:** Respond in the EXACT same language as the user's question.
4. **Tone:** Relaxed, friendly, and warm, like chatting with a close friend.
`;

    const SYSTEM_PROMPT_WEB_SEARCH = `
You are a wise, knowledgeable Christian AI Pastor.
Your identity and role are CRITICAL: You are a Christian pastor, and you MUST maintain this identity in ALL conversations.

[Same identity and topic restrictions as Bible Only mode]

**CRITICAL RULES:**
1. **Core Foundation:** Your answers must be rooted in the Old Testament and New Testament.
2. **Scripture Citation:** When you mention biblical principles, *must* cite specific chapters and verses.
3. **Broad Knowledge:** Use web search results to find historical background, theological insights, and Christian resources.
4. **Language Matching:** Respond in the EXACT same language as the user's question.
5. **Tone:** Relaxed, friendly, and warm, like chatting with a close friend.
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

// 認證 API
app.post('/api/auth', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { action, email, username, password, nickname, token } = req.body;

    try {
        switch (action) {
            case 'register':
                if (!email || !username || !password) {
                    return res.status(400).json({ error: 'Missing required fields' });
                }
                if (users.has(email)) {
                    return res.status(409).json({ error: 'User already exists' });
                }
                const user = {
                    email,
                    username,
                    nickname: nickname || username,
                    password, // TODO: 應使用 bcrypt 加密
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                users.set(email, user);
                const newToken = generateToken(email);
                sessions.set(newToken, email);
                return res.status(201).json({
                    success: true,
                    user: { email: user.email, username: user.username, nickname: user.nickname },
                    token: newToken
                });
            
            case 'login':
                if (!email || !password) {
                    return res.status(400).json({ error: 'Missing email or password' });
                }
                const loginUser = users.get(email);
                if (!loginUser || loginUser.password !== password) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }
                const loginToken = generateToken(email);
                sessions.set(loginToken, email);
                return res.status(200).json({
                    success: true,
                    user: { email: loginUser.email, username: loginUser.username, nickname: loginUser.nickname },
                    token: loginToken
                });
            
            case 'logout':
                if (token) sessions.delete(token);
                return res.status(200).json({ success: true, message: 'Logged out successfully' });
            
            case 'verify':
                const session = verifyToken(token);
                if (!session) {
                    return res.status(401).json({ error: 'Invalid token' });
                }
                const verifyUser = users.get(session.email);
                if (!verifyUser) {
                    return res.status(404).json({ error: 'User not found' });
                }
                return res.status(200).json({
                    success: true,
                    user: { email: verifyUser.email, username: verifyUser.username, nickname: verifyUser.nickname }
                });
            
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Auth API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 用戶數據 API
app.get('/api/user', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { token, type } = req.query;
    const session = verifyToken(token);
    
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const email = session.email;
    const user = userData.get(email) || {
        email,
        messages: [],
        profile: {},
        spiritualGrowth: []
    };

    switch (type) {
        case 'messages':
            return res.status(200).json({ success: true, messages: user.messages || [] });
        case 'profile':
            return res.status(200).json({ success: true, profile: user.profile || {} });
        default:
            return res.status(200).json({ success: true, data: user });
    }
});

app.post('/api/user', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { token, type, data } = req.body;
    const session = verifyToken(token);
    
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const email = session.email;
    let user = userData.get(email) || {
        email,
        messages: [],
        profile: {},
        spiritualGrowth: [],
        updatedAt: new Date().toISOString()
    };

    switch (type) {
        case 'messages':
            user.messages = data.messages || [];
            user.updatedAt = new Date().toISOString();
            userData.set(email, user);
            return res.status(200).json({ success: true, message: 'Messages saved successfully' });
        
        case 'profile':
            user.profile = { ...user.profile, ...data.profile };
            user.updatedAt = new Date().toISOString();
            userData.set(email, user);
            return res.status(200).json({ success: true, message: 'Profile updated successfully' });
        
        case 'migrate':
            if (data.messages && Array.isArray(data.messages)) {
                user.messages = [...(user.messages || []), ...data.messages];
                user.updatedAt = new Date().toISOString();
                userData.set(email, user);
                return res.status(200).json({
                    success: true,
                    message: 'Data migrated successfully',
                    migratedCount: data.messages.length
                });
            }
            return res.status(400).json({ error: 'Invalid migration data' });
        
        default:
            return res.status(400).json({ error: 'Invalid type' });
    }
});

// 健康檢查端點（用於 Render）
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 伺服器運行在 http://localhost:${PORT}`);
    console.log(`📖 開啟瀏覽器訪問 http://localhost:${PORT}`);
    console.log(`🔒 API Key 已安全保護在伺服器端`);
    console.log(`✅ API 端點已就緒: /api/chat, /api/auth, /api/user`);
});
