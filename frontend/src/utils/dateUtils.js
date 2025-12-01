/**
 * 日期工具函数 - 统一处理时区问题
 */

/**
 * 将UTC时间字符串转换为日期字符串（YYYY-MM-DD）
 * 注意：这里使用UTC日期，因为后端存储的是UTC时间
 * @param {string} utcDateString - UTC时间字符串，如 "2025-11-30T04:44:00.000Z"
 * @returns {string} UTC日期字符串，如 "2025-11-30"
 */
export const getLocalDateString = (utcDateString) => {
    if (!utcDateString) return null;
    
    try {
        const dateObj = new Date(utcDateString);
        
        // 检查日期是否有效
        if (isNaN(dateObj.getTime())) {
            console.error('无效的日期字符串:', utcDateString);
            return null;
        }
        
        // 使用UTC日期，因为后端存储的是UTC时间
        // 这样可以避免时区转换问题
        const year = dateObj.getUTCFullYear();
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getUTCDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('日期转换错误:', error, utcDateString);
        return null;
    }
};

/**
 * 获取当前日期的本地日期字符串（YYYY-MM-DD）
 * @returns {string} 当前本地日期字符串
 */
export const getTodayLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * 检查两个日期字符串是否相同（都是本地日期格式 YYYY-MM-DD）
 * @param {string} date1 - 日期字符串1
 * @param {string} date2 - 日期字符串2
 * @returns {boolean} 是否相同
 */
export const isSameLocalDate = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1 === date2;
};

