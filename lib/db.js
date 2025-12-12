/**
 * 資料庫抽象層
 * 支援 Supabase 和記憶體儲存（備用方案）
 */

const { supabase, isAvailable } = require('./supabase');
const bcrypt = require('bcryptjs');

// ==================== 記憶體儲存（備用方案） ====================
const memoryStore = {
    users: new Map(),
    sessions: new Map(),
    userData: new Map()
};

// ==================== 用戶管理 ====================

/**
 * 創建用戶
 */
async function createUser(email, username, password, nickname) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
        email,
        username,
        nickname: nickname || username,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (isAvailable()) {
        try {
            const { data, error } = await supabase
                .from('users')
                .insert([{
                    email: userData.email,
                    username: userData.username,
                    nickname: userData.nickname,
                    password: userData.password,
                    created_at: userData.createdAt,
                    updated_at: userData.updatedAt
                }])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // 唯一約束違反
                    throw new Error('User already exists');
                }
                throw error;
            }

            return {
                email: data.email,
                username: data.username,
                nickname: data.nickname,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
        } catch (error) {
            console.error('Supabase 創建用戶失敗，使用記憶體儲存:', error.message);
            // 降級到記憶體儲存
        }
    }

    // 記憶體儲存
    if (memoryStore.users.has(email)) {
        throw new Error('User already exists');
    }
    memoryStore.users.set(email, userData);
    return {
        email: userData.email,
        username: userData.username,
        nickname: userData.nickname,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
    };
}

/**
 * 獲取用戶（根據 email）
 */
async function getUserByEmail(email) {
    if (isAvailable()) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // 用戶不存在
                }
                throw error;
            }

            return data ? {
                email: data.email,
                username: data.username,
                nickname: data.nickname,
                password: data.password,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            } : null;
        } catch (error) {
            console.error('Supabase 查詢用戶失敗，使用記憶體儲存:', error.message);
        }
    }

    // 記憶體儲存
    const user = memoryStore.users.get(email);
    return user ? { ...user } : null;
}

/**
 * 驗證用戶密碼
 */
async function verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password);
}

/**
 * 更新用戶密碼
 */
async function updatePassword(email, oldPassword, newPassword) {
    const user = await getUserByEmail(email);
    if (!user) {
        throw new Error('User not found');
    }

    // 驗證舊密碼
    const isValid = await verifyPassword(user, oldPassword);
    if (!isValid) {
        throw new Error('Invalid old password');
    }

    // 加密新密碼
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (isAvailable()) {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    password: hashedPassword,
                    updated_at: new Date().toISOString()
                })
                .eq('email', email);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Supabase 更新密碼失敗，使用記憶體儲存:', error.message);
            // 降級到記憶體儲存
        }
    }

    // 記憶體儲存
    const userData = memoryStore.users.get(email);
    if (userData) {
        userData.password = hashedPassword;
        userData.updatedAt = new Date().toISOString();
        memoryStore.users.set(email, userData);
        return true;
    }

    throw new Error('User not found');
}

// ==================== Session 管理 ====================

/**
 * 創建 session
 */
async function createSession(email, token) {
    const sessionData = {
        email,
        token,
        createdAt: new Date().toISOString()
    };

    if (isAvailable()) {
        try {
            const { error } = await supabase
                .from('sessions')
                .upsert([{
                    token,
                    email,
                    created_at: sessionData.createdAt
                }], {
                    onConflict: 'token'
                });

            if (error) throw error;
            return sessionData;
        } catch (error) {
            console.error('Supabase 創建 session 失敗，使用記憶體儲存:', error.message);
        }
    }

    // 記憶體儲存
    memoryStore.sessions.set(token, email);
    return sessionData;
}

/**
 * 獲取 session
 */
async function getSession(token) {
    if (isAvailable()) {
        try {
            const { data, error } = await supabase
                .from('sessions')
                .select('email')
                .eq('token', token)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw error;
            }

            return data ? { email: data.email, token } : null;
        } catch (error) {
            console.error('Supabase 查詢 session 失敗，使用記憶體儲存:', error.message);
        }
    }

    // 記憶體儲存
    const email = memoryStore.sessions.get(token);
    return email ? { email, token } : null;
}

/**
 * 刪除 session
 */
async function deleteSession(token) {
    if (isAvailable()) {
        try {
            const { error } = await supabase
                .from('sessions')
                .delete()
                .eq('token', token);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Supabase 刪除 session 失敗，使用記憶體儲存:', error.message);
        }
    }

    // 記憶體儲存
    return memoryStore.sessions.delete(token);
}

// ==================== 用戶數據管理 ====================

/**
 * 獲取用戶數據
 */
async function getUserData(email) {
    if (isAvailable()) {
        try {
            const { data, error } = await supabase
                .from('user_data')
                .select('*')
                .eq('email', email)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // 用戶數據不存在，返回預設值
                    return {
                        email,
                        messages: [],
                        profile: {},
                        spiritualGrowth: []
                    };
                }
                throw error;
            }

            return {
                email: data.email,
                messages: data.messages || [],
                profile: data.profile || {},
                spiritualGrowth: data.spiritual_growth || [],
                updatedAt: data.updated_at
            };
        } catch (error) {
            console.error('Supabase 查詢用戶數據失敗，使用記憶體儲存:', error.message);
        }
    }

    // 記憶體儲存
    const userData = memoryStore.userData.get(email);
    return userData || {
        email,
        messages: [],
        profile: {},
        spiritualGrowth: []
    };
}

/**
 * 保存用戶數據
 */
async function saveUserData(email, data) {
    const userData = {
        email,
        messages: data.messages || [],
        profile: data.profile || {},
        spiritualGrowth: data.spiritualGrowth || [],
        updatedAt: new Date().toISOString()
    };

    if (isAvailable()) {
        try {
            const { error } = await supabase
                .from('user_data')
                .upsert([{
                    email: userData.email,
                    messages: userData.messages,
                    profile: userData.profile,
                    spiritual_growth: userData.spiritualGrowth,
                    updated_at: userData.updatedAt
                }], {
                    onConflict: 'email'
                });

            if (error) throw error;
            return userData;
        } catch (error) {
            console.error('Supabase 保存用戶數據失敗，使用記憶體儲存:', error.message);
        }
    }

    // 記憶體儲存
    memoryStore.userData.set(email, userData);
    return userData;
}

/**
 * 遷移用戶數據（從 localStorage）
 */
async function migrateUserData(email, messages) {
    const existingData = await getUserData(email);
    const mergedMessages = [...(existingData.messages || []), ...messages];
    
    return await saveUserData(email, {
        ...existingData,
        messages: mergedMessages
    });
}

module.exports = {
    createUser,
    getUserByEmail,
    verifyPassword,
    updatePassword,
    createSession,
    getSession,
    deleteSession,
    getUserData,
    saveUserData,
    migrateUserData,
    isAvailable
};


