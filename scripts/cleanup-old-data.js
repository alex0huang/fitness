/**
 * 清理超过指定天数的旧餐食数据
 * 使用方法: node scripts/cleanup-old-data.js [天数，默认60]
 */

const pool = require('../database');

async function cleanupOldMeals(daysToKeep = 60) {
    try {
        console.log(`开始清理超过 ${daysToKeep} 天的旧数据...`);
        
        // 调用数据库函数执行清理
        const result = await pool.query(
            'SELECT * FROM cleanup_old_meals_with_log($1)',
            [daysToKeep]
        );
        
        const { deleted_meals, deleted_items } = result.rows[0];
        
        console.log(`清理完成！`);
        console.log(`- 删除了 ${deleted_meals} 条餐食记录`);
        console.log(`- 删除了 ${deleted_items} 条食物项记录`);
        
        return { deleted_meals, deleted_items };
    } catch (error) {
        console.error('清理数据时出错:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const daysToKeep = parseInt(process.argv[2]) || 60;
    
    cleanupOldMeals(daysToKeep)
        .then(() => {
            console.log('脚本执行完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('脚本执行失败:', error);
            process.exit(1);
        });
}

module.exports = { cleanupOldMeals };

