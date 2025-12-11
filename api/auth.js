/**
 * 認證 API - 處理註冊、登入、登出
 * 目前使用內存儲存（可替換為數據庫）
 * Updated: 2025-12-10
 */

// TODO: 替換為真實數據庫（Supabase/Firebase/PostgreSQL）
// 目前使用內存儲存作為臨時方案
const users = new Map(); // email -> user data
const sessions = new Map(); // token -> user email

// 簡單的 JWT 模擬（實際應使用 jsonwebtoken 庫）
function generateToken(email) {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 驗證 token
function verifyToken(token) {
    if (!token || !token.startsWith('token_')) {
        return null;
    }
    const email = sessions.get(token);
    return email ? { email, token } : null;
}

export default async function handler(req, res) {
    // 啟用 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 處理 OPTIONS 預檢請求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 只允許 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, email, username, password, nickname, token } = req.body;

    try {
        switch (action) {
            case 'register':
                return handleRegister(req, res, { email, username, password, nickname });
            
            case 'login':
                return handleLogin(req, res, { email, password });
            
            case 'logout':
                return handleLogout(req, res, { token });
            
            case 'verify':
                return handleVerify(req, res, { token });
            
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Auth API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// 處理註冊
async function handleRegister(req, res, { email, username, password, nickname }) {
    if (!email || !username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // 檢查用戶是否已存在
    if (users.has(email)) {
        return res.status(409).json({ error: 'User already exists' });
    }

    // TODO: 實際應使用 bcrypt 加密密碼
    // const hashedPassword = await bcrypt.hash(password, 10);
    
    // 創建用戶
    const user = {
        email,
        username,
        nickname: nickname || username,
        password, // TODO: 應儲存加密後的密碼
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    users.set(email, user);

    // 生成 token
    const token = generateToken(email);
    sessions.set(token, email);

    return res.status(201).json({
        success: true,
        user: {
            email: user.email,
            username: user.username,
            nickname: user.nickname
        },
        token
    });
}

// 處理登入
async function handleLogin(req, res, { email, password }) {
    if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
    }

    const user = users.get(email);
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    // TODO: 實際應使用 bcrypt 驗證密碼
    // const isValid = await bcrypt.compare(password, user.password);
    if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 生成新 token
    const token = generateToken(email);
    sessions.set(token, email);

    return res.status(200).json({
        success: true,
        user: {
            email: user.email,
            username: user.username,
            nickname: user.nickname
        },
        token
    });
}

// 處理登出
async function handleLogout(req, res, { token }) {
    if (!token) {
        return res.status(400).json({ error: 'Missing token' });
    }

    sessions.delete(token);

    return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
}

// 驗證 token
async function handleVerify(req, res, { token }) {
    if (!token) {
        return res.status(400).json({ error: 'Missing token' });
    }

    const session = verifyToken(token);
    if (!session) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const user = users.get(session.email);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
        success: true,
        user: {
            email: user.email,
            username: user.username,
            nickname: user.nickname
        }
    });
}

