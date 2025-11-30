/**
 * 日期工具函数 - 统一处理时区问题
 */

/**
 * 将UTC时间字符串转换为本地日期字符串（YYYY-MM-DD）
 * @param {string} utcDateString - UTC时间字符串，如 "2025-11-30T04:44:00.000Z"
 * @returns {string} 本地日期字符串，如 "2025-11-29"
 */
export const getLocalDateString = (utcDateString) => {
    if (!utcDateString) return null;
    
    const dateObj = new Date(utcDateString);
    // 使用本地时间的年、月、日
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

