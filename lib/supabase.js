/**
 * Supabase 客戶端配置
 * 用於連接 Supabase 資料庫
 */

const { createClient } = require('@supabase/supabase-js');

// 從環境變數獲取 Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase 環境變數未設定。將使用記憶體儲存作為備用方案。');
    console.warn('   請在環境變數中設定 SUPABASE_URL 和 SUPABASE_ANON_KEY');
}

// 創建 Supabase 客戶端
const supabase = supabaseUrl && supabaseKey 
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// 檢查 Supabase 連接
async function checkConnection() {
    if (!supabase) {
        return { connected: false, error: 'Supabase 未配置' };
    }
    
    try {
        // 簡單查詢測試連接
        const { error } = await supabase.from('users').select('count').limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 表示表不存在，但連接正常
            return { connected: false, error: error.message };
        }
        return { connected: true };
    } catch (error) {
        return { connected: false, error: error.message };
    }
}

module.exports = {
    supabase,
    checkConnection,
    isAvailable: () => supabase !== null
};


