-- ========================================
-- AI Pastor - Supabase 資料庫架構
-- ========================================
-- 
-- 使用說明：
-- 1. 在 Supabase Dashboard 中開啟 SQL Editor
-- 2. 複製並執行此 SQL 腳本
-- 3. 確保啟用 Row Level Security (RLS)
--
-- ========================================

-- ========================================
-- 1. 用戶表 (users)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    nickname TEXT NOT NULL,
    password TEXT NOT NULL, -- bcrypt 加密後的密碼
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 2. Session 表 (sessions)
-- ========================================
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 自動清理過期 session 的函數（可選）
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 3. 用戶數據表 (user_data)
-- ========================================
CREATE TABLE IF NOT EXISTS user_data (
    email TEXT PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
    messages JSONB DEFAULT '[]'::jsonb,
    profile JSONB DEFAULT '{}'::jsonb,
    spiritual_growth JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_user_data_email ON user_data(email);
CREATE INDEX IF NOT EXISTS idx_user_data_updated_at ON user_data(updated_at);
-- GIN 索引用於 JSONB 查詢
CREATE INDEX IF NOT EXISTS idx_user_data_messages ON user_data USING GIN (messages);
CREATE INDEX IF NOT EXISTS idx_user_data_profile ON user_data USING GIN (profile);

-- 更新時間觸發器
CREATE TRIGGER update_user_data_updated_at BEFORE UPDATE ON user_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. Row Level Security (RLS) 設定
-- ========================================

-- 啟用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Users 表：只有用戶自己可以讀取自己的資料（管理員除外）
CREATE POLICY "Users can read own data" ON users
    FOR SELECT
    USING (auth.uid()::text = email OR current_setting('app.settings.is_admin', true)::boolean = true);

-- Sessions 表：只有對應的用戶可以訪問自己的 session
CREATE POLICY "Users can access own sessions" ON sessions
    FOR ALL
    USING (email = current_setting('app.settings.user_email', true)::text);

-- User_data 表：只有用戶自己可以訪問自己的數據
CREATE POLICY "Users can access own data" ON user_data
    FOR ALL
    USING (email = current_setting('app.settings.user_email', true)::text);

-- ========================================
-- 5. 輔助函數
-- ========================================

-- 獲取用戶統計（管理員用）
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
    total_users BIGINT,
    total_sessions BIGINT,
    total_user_data BIGINT,
    timestamp TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM users)::BIGINT,
        (SELECT COUNT(*) FROM sessions)::BIGINT,
        (SELECT COUNT(*) FROM user_data)::BIGINT,
        NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 完成訊息
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '✅ Supabase 資料庫架構創建完成！';
    RAISE NOTICE '📝 請確保在 Supabase Dashboard 中設定環境變數：';
    RAISE NOTICE '   - SUPABASE_URL';
    RAISE NOTICE '   - SUPABASE_ANON_KEY (或 SUPABASE_SERVICE_ROLE_KEY)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  注意：RLS 策略可能需要根據您的需求調整';
END $$;


