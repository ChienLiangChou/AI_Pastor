/**
 * 用戶數據 API - 處理對話歷史、個人檔案等
 * 目前使用內存儲存（可替換為數據庫）
 * Updated: 2025-12-10
 */

// TODO: 替換為真實數據庫
const userData = new Map(); // email -> user data

// 驗證 token（簡化版，實際應從 auth.js 導入）
function verifyToken(token) {
    // 這裡應該調用 auth API 驗證 token
    // 目前簡化處理
    if (!token || !token.startsWith('token_')) {
        return null;
    }
    // 從 token 中提取 email（簡化處理）
    return { email: 'user@example.com' }; // TODO: 實際驗證
}

export default async function handler(req, res) {
    // 啟用 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 處理 OPTIONS 預檢請求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        return handleGet(req, res);
    } else if (req.method === 'POST') {
        return handlePost(req, res);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}

// GET: 獲取用戶數據
async function handleGet(req, res) {
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
            return res.status(200).json({
                success: true,
                messages: user.messages || []
            });
        
        case 'profile':
            return res.status(200).json({
                success: true,
                profile: user.profile || {}
            });
        
        default:
            return res.status(200).json({
                success: true,
                data: user
            });
    }
}

// POST: 保存用戶數據
async function handlePost(req, res) {
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
            // 保存對話歷史
            user.messages = data.messages || [];
            user.updatedAt = new Date().toISOString();
            userData.set(email, user);
            return res.status(200).json({
                success: true,
                message: 'Messages saved successfully'
            });
        
        case 'profile':
            // 更新個人檔案
            user.profile = { ...user.profile, ...data.profile };
            user.updatedAt = new Date().toISOString();
            userData.set(email, user);
            return res.status(200).json({
                success: true,
                message: 'Profile updated successfully'
            });
        
        case 'migrate':
            // 已禁用：不允許遷移訪客對話到後端
            // 訪客模式的對話記錄不應該被儲存到伺服器
            return res.status(403).json({ 
                error: 'Migration disabled: Guest conversations are not stored on the server' 
            });
        
        default:
            return res.status(400).json({ error: 'Invalid type' });
    }
}





