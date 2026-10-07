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
const nodemailer = require('nodemailer');
require('dotenv').config();

// 導入資料庫和認證模組
const db = require('./lib/db');
const { generateToken, verifyToken } = require('./lib/auth');
const { checkConnection } = require('./lib/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors());
app.use(express.json());

// 靜態檔案服務（提供 HTML）
app.use(express.static(path.join(__dirname, 'dist')));

// 檢查資料庫連接
(async () => {
    const connection = await checkConnection();
    if (connection.connected) {
        console.log('✅ Supabase 連接成功');
    } else {
        console.log('⚠️ Supabase 未配置或連接失敗，使用記憶體儲存');
        console.log(`   錯誤: ${connection.error || '未配置'}`);
    }
})();

// ==================== Email 通知功能 ====================
// 建立 Email 傳送器（支援多種服務）
function createEmailTransporter() {
    // 優先使用 SendGrid（如果設定了 SENDGRID_API_KEY）
    if (process.env.SENDGRID_API_KEY) {
        return nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
                user: 'apikey',
                pass: process.env.SENDGRID_API_KEY
            }
        });
    }
    
    // 使用 Gmail SMTP（如果設定了 GMAIL_USER 和 GMAIL_APP_PASSWORD）
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });
    }
    
    // 使用自訂 SMTP（如果設定了 SMTP 相關環境變數）
    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }
    
    // 如果沒有設定任何 Email 服務，返回 null
    return null;
}

// 發送註冊通知 Email
async function sendRegistrationNotification(userEmail, username, nickname) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NOTIFICATION_EMAIL;
    
    if (!adminEmail) {
        console.log('⚠️ 未設定 ADMIN_EMAIL，跳過 Email 通知');
        return false;
    }
    
    const transporter = createEmailTransporter();
    if (!transporter) {
        console.log('⚠️ 未設定 Email 服務，跳過 Email 通知');
        return false;
    }
    
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || `AI Pastor <${process.env.GMAIL_USER || 'noreply@ai-pastor.com'}>`,
            to: adminEmail,
            subject: '🎉 新用戶註冊 - AI 牧師',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #d97706;">新用戶註冊通知</h2>
                    <p>有新的用戶註冊了 AI 牧師服務！</p>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">用戶資訊</h3>
                        <p><strong>Email:</strong> ${userEmail}</p>
                        <p><strong>使用者名稱:</strong> ${username}</p>
                        <p><strong>暱稱:</strong> ${nickname || username}</p>
                        <p><strong>註冊時間:</strong> ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px;">
                        您可以透過管理端點查看所有註冊用戶：<br>
                        <a href="https://ai-pastor-ealr.onrender.com/api/admin/users?password=您的管理員密碼">
                            https://ai-pastor-ealr.onrender.com/api/admin/users
                        </a>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #9ca3af; font-size: 12px;">
                        這是自動發送的系統通知，請勿直接回覆此郵件。
                    </p>
                </div>
            `,
            text: `
新用戶註冊通知

有新的用戶註冊了 AI 牧師服務！

用戶資訊：
- Email: ${userEmail}
- 使用者名稱: ${username}
- 暱稱: ${nickname || username}
- 註冊時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}

您可以透過管理端點查看所有註冊用戶：
https://ai-pastor-ealr.onrender.com/api/admin/users?password=您的管理員密碼
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ 註冊通知 Email 已發送:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ 發送 Email 通知失敗:', error);
        // 不影響註冊流程，只記錄錯誤
        return false;
    }
}

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
            maxOutputTokens: 2000,
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

                try {
                    const user = await db.createUser(email, username, password, nickname);
                    const newToken = generateToken(email);
                    await db.createSession(email, newToken);
                    
                    // 發送註冊通知 Email（非阻塞，不影響註冊流程）
                    sendRegistrationNotification(user.email, user.username, user.nickname).catch(err => {
                        console.error('Email 通知發送失敗（不影響註冊）:', err);
                    });
                    
                    return res.status(201).json({
                        success: true,
                        user: { email: user.email, username: user.username, nickname: user.nickname },
                        token: newToken
                    });
                } catch (error) {
                    if (error.message === 'User already exists') {
                        return res.status(409).json({ error: 'User already exists' });
                    }
                    throw error;
                }
            
            case 'login':
                if (!email || !password) {
                    return res.status(400).json({ error: 'Missing email or password' });
                }

                const loginUser = await db.getUserByEmail(email);
                if (!loginUser) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }

                const isValidPassword = await db.verifyPassword(loginUser, password);
                if (!isValidPassword) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }

                const loginToken = generateToken(email);
                await db.createSession(email, loginToken);
                
                return res.status(200).json({
                    success: true,
                    user: { email: loginUser.email, username: loginUser.username, nickname: loginUser.nickname },
                    token: loginToken
                });
            
            case 'logout':
                if (token) {
                    await db.deleteSession(token);
                }
                return res.status(200).json({ success: true, message: 'Logged out successfully' });
            
            case 'verify':
                const session = await verifyToken(token);
                if (!session) {
                    return res.status(401).json({ error: 'Invalid token' });
                }
                const verifyUser = await db.getUserByEmail(session.email);
                if (!verifyUser) {
                    return res.status(404).json({ error: 'User not found' });
                }
                return res.status(200).json({
                    success: true,
                    user: { email: verifyUser.email, username: verifyUser.username, nickname: verifyUser.nickname }
                });
            
            case 'changePassword':
                if (!token) {
                    return res.status(401).json({ error: 'Token required' });
                }
                const changePasswordSession = await verifyToken(token);
                if (!changePasswordSession) {
                    return res.status(401).json({ error: 'Invalid token' });
                }
                const { oldPassword, newPassword } = req.body;
                if (!oldPassword || !newPassword) {
                    return res.status(400).json({ error: 'Old password and new password are required' });
                }
                if (newPassword.length < 6) {
                    return res.status(400).json({ error: 'New password must be at least 6 characters' });
                }
                try {
                    await db.updatePassword(changePasswordSession.email, oldPassword, newPassword);
                    return res.status(200).json({ success: true, message: 'Password updated successfully' });
                } catch (error) {
                    if (error.message === 'Invalid old password') {
                        return res.status(401).json({ error: 'Invalid old password' });
                    }
                    if (error.message === 'User not found') {
                        return res.status(404).json({ error: 'User not found' });
                    }
                    throw error;
                }
            
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
    const session = await verifyToken(token);
    
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const email = session.email;
    const user = await db.getUserData(email);

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
    const session = await verifyToken(token);
    
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const email = session.email;
    const existingUser = await db.getUserData(email);

    switch (type) {
        case 'messages':
            await db.saveUserData(email, {
                ...existingUser,
                messages: data.messages || []
            });
            return res.status(200).json({ success: true, message: 'Messages saved successfully' });
        
        case 'profile':
            await db.saveUserData(email, {
                ...existingUser,
                profile: { ...existingUser.profile, ...data.profile }
            });
            return res.status(200).json({ success: true, message: 'Profile updated successfully' });
        
        case 'migrate':
            // 已禁用：不允許遷移訪客對話到後端
            // 訪客模式的對話記錄不應該被儲存到伺服器
            return res.status(403).json({ 
                error: 'Migration disabled: Guest conversations are not stored on the server' 
            });
        
        default:
            return res.status(400).json({ error: 'Invalid type' });
    }
});

// 管理端點：查看所有註冊用戶（需要管理員密碼保護）
app.get('/api/admin/users', async (req, res) => {
    // 簡單的密碼保護（生產環境應使用更安全的方式）
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const providedPassword = req.query.password || req.headers['x-admin-password'];
    
    if (providedPassword !== adminPassword) {
        return res.status(401).json({ error: 'Unauthorized: Admin password required' });
    }
    
    try {
        // 從資料庫獲取所有用戶
        const { supabase } = require('./lib/supabase');
        let usersList = [];
        
        if (supabase) {
            const { data, error } = await supabase
                .from('users')
                .select('email, username, nickname, created_at, updated_at')
                .order('created_at', { ascending: false });
            
            if (!error && data) {
                usersList = data.map(user => ({
                    email: user.email,
                    username: user.username,
                    nickname: user.nickname,
                    createdAt: user.created_at,
                    updatedAt: user.updated_at
                }));
            }
        }
        
        res.json({
            success: true,
            totalUsers: usersList.length,
            users: usersList
        });
    } catch (error) {
        console.error('獲取用戶列表失敗:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 管理端點：查看用戶統計
app.get('/api/admin/stats', async (req, res) => {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const providedPassword = req.query.password || req.headers['x-admin-password'];
    
    if (providedPassword !== adminPassword) {
        return res.status(401).json({ error: 'Unauthorized: Admin password required' });
    }
    
    try {
        const { supabase } = require('./lib/supabase');
        let stats = {
            totalUsers: 0,
            totalSessions: 0,
            totalUserData: 0,
            timestamp: new Date().toISOString()
        };
        
        if (supabase) {
            // 獲取用戶數
            const { count: userCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });
            stats.totalUsers = userCount || 0;
            
            // 獲取 session 數
            const { count: sessionCount } = await supabase
                .from('sessions')
                .select('*', { count: 'exact', head: true });
            stats.totalSessions = sessionCount || 0;
            
            // 獲取用戶數據數
            const { count: dataCount } = await supabase
                .from('user_data')
                .select('*', { count: 'exact', head: true });
            stats.totalUserData = dataCount || 0;
        }
        
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('獲取統計數據失敗:', error);
        res.status(500).json({ error: 'Internal server error' });
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
