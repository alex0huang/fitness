/**
 * 管理路由 - 用于数据库维护操作
 * 注意：在生产环境中应该添加额外的认证和授权检查
 */

const express = require('express');
const router = express.Router();
const pool = require('../database');
const { cleanupOldMeals } = require('../scripts/cleanup-old-data');

// 清理旧数据的API端点
// 在生产环境中，应该添加管理员认证
router.post('/cleanup', async (req, res) => {
    try {
        // 检查是否有管理员密钥（简单示例，生产环境应该使用更安全的认证）
        const adminKey = req.headers['x-admin-key'];
        const expectedKey = process.env.ADMIN_CLEANUP_KEY || 'change-this-in-production';
        
        if (adminKey !== expectedKey) {
            return res.status(401).json({ error: '未授权' });
        }
        
        const daysToKeep = parseInt(req.body.daysToKeep) || 60;
        
        const result = await cleanupOldMeals(daysToKeep);
        
        res.json({
            success: true,
            message: `成功清理超过 ${daysToKeep} 天的旧数据`,
            ...result
        });
    } catch (error) {
        console.error('清理数据失败:', error);
        res.status(500).json({ error: '清理数据失败', details: error.message });
    }
});

// 获取清理历史记录
router.get('/cleanup/history', async (req, res) => {
    try {
        const adminKey = req.headers['x-admin-key'];
        const expectedKey = process.env.ADMIN_CLEANUP_KEY || 'change-this-in-production';
        
        if (adminKey !== expectedKey) {
            return res.status(401).json({ error: '未授权' });
        }
        
        const result = await pool.query(
            'SELECT * FROM cleanup_log ORDER BY cleanup_date DESC LIMIT 50'
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('获取清理历史失败:', error);
        res.status(500).json({ error: '获取清理历史失败', details: error.message });
    }
});

module.exports = router;

