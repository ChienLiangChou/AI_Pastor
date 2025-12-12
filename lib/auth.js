/**
 * 認證工具函數
 * 包含 token 生成和驗證
 */

const jwt = require('jsonwebtoken');
const { getSession } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

/**
 * 生成 JWT token
 */
function generateToken(email) {
    return jwt.sign(
        { email, type: 'access' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

/**
 * 驗證 token
 */
async function verifyToken(token) {
    if (!token) {
        return null;
    }

    try {
        // 先嘗試 JWT 驗證
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.email) {
            // 檢查 session 是否存在
            const session = await getSession(token);
            if (session) {
                return { email: decoded.email, token };
            }
        }
    } catch (error) {
        // JWT 驗證失敗，嘗試舊的 token 格式（向後兼容）
        if (token.startsWith('token_')) {
            const session = await getSession(token);
            if (session) {
                return session;
            }
        }
    }

    return null;
}

module.exports = {
    generateToken,
    verifyToken
};


