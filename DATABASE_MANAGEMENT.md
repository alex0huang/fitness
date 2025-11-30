# 数据库管理指南

## 目录
1. [数据库更新/迁移](#数据库更新迁移)
2. [自动清理旧数据](#自动清理旧数据)
3. [手动清理数据](#手动清理数据)
4. [查看清理历史](#查看清理历史)

## 数据库更新/迁移

### 方法1：使用 Neon SQL Editor（推荐）

1. 登录 [Neon Dashboard](https://console.neon.tech)
2. 选择你的项目
3. 点击左侧菜单的 **SQL Editor**
4. 复制迁移文件的内容（例如 `scripts/migrations/002_auto_cleanup_function.sql`）
5. 粘贴到 SQL Editor 中
6. 点击 **Run** 执行

### 方法2：使用命令行脚本

如果你有本地访问数据库的权限：

```bash
# 设置环境变量
export DATABASE_URL="你的数据库连接字符串"

# 运行迁移
node scripts/run-migration.js 002_auto_cleanup_function.sql
```

### 方法3：使用 Render Shell

1. 在 Render Dashboard 中打开你的服务
2. 点击 **Shell** 标签
3. 运行：
```bash
node scripts/run-migration.js 002_auto_cleanup_function.sql
```

## 自动清理旧数据

### 设置自动清理（删除超过60天的数据）

#### 步骤1：运行迁移创建清理函数

在 Neon SQL Editor 中运行 `scripts/migrations/002_auto_cleanup_function.sql`

#### 步骤2：设置定时任务（Render Cron Job）

1. 在 Render Dashboard 中创建新的 **Cron Job**
2. 配置：
   - **Name**: `cleanup-old-meals`
   - **Schedule**: `0 2 * * *` （每天凌晨2点执行）
   - **Command**: `node scripts/cleanup-old-data.js 60`
   - **Environment**: 选择你的后端服务环境

#### 步骤3：设置环境变量

在 Render 的环境变量中添加：
```
ADMIN_CLEANUP_KEY=你的随机密钥（用于API调用时的认证）
```

### 清理函数说明

- **默认保留天数**: 60天（2个月）
- **清理内容**: 删除 `consumed_at` 超过指定天数的餐食记录
- **级联删除**: meal_items 会通过外键约束自动删除
- **日志记录**: 每次清理都会记录到 `cleanup_log` 表

## 手动清理数据

### 方法1：使用命令行脚本

```bash
# 清理超过60天的数据（默认）
node scripts/cleanup-old-data.js

# 清理超过30天的数据
node scripts/cleanup-old-data.js 30

# 清理超过90天的数据
node scripts/cleanup-old-data.js 90
```

### 方法2：使用 API 端点

```bash
curl -X POST https://你的后端URL/admin/cleanup \
  -H "Content-Type: application/json" \
  -H "x-admin-key: 你的ADMIN_CLEANUP_KEY" \
  -d '{"daysToKeep": 60}'
```

### 方法3：直接在数据库中执行

在 Neon SQL Editor 中运行：

```sql
-- 清理超过60天的数据
SELECT * FROM cleanup_old_meals_with_log(60);

-- 清理超过30天的数据
SELECT * FROM cleanup_old_meals_with_log(30);
```

## 查看清理历史

### 方法1：使用 API

```bash
curl https://你的后端URL/admin/cleanup/history \
  -H "x-admin-key: 你的ADMIN_CLEANUP_KEY"
```

### 方法2：直接在数据库中查询

在 Neon SQL Editor 中运行：

```sql
-- 查看最近的清理记录
SELECT * FROM cleanup_log 
ORDER BY cleanup_date DESC 
LIMIT 20;

-- 查看清理统计
SELECT 
    DATE(cleanup_date) as date,
    SUM(deleted_meals) as total_meals_deleted,
    SUM(deleted_items) as total_items_deleted
FROM cleanup_log
GROUP BY DATE(cleanup_date)
ORDER BY date DESC;
```

## 自定义清理规则

### 修改保留天数

编辑 `scripts/cleanup-old-data.js` 或直接传递参数：

```bash
# 保留90天（3个月）
node scripts/cleanup-old-data.js 90

# 保留30天（1个月）
node scripts/cleanup-old-data.js 30
```

### 修改清理条件

如果需要修改清理逻辑（例如基于 `created_at` 而不是 `consumed_at`），编辑 `scripts/migrations/002_auto_cleanup_function.sql` 中的函数定义。

## 注意事项

1. **备份数据**: 在执行清理前，建议先备份重要数据
2. **测试环境**: 先在测试环境验证清理逻辑
3. **监控**: 定期检查清理日志，确保清理正常工作
4. **存储限制**: Neon 免费层有512MB限制，定期清理有助于节省空间
5. **性能**: 清理操作会在数据库上执行，建议在低峰期执行

## 故障排查

### 清理函数不存在

如果遇到 "function cleanup_old_meals does not exist" 错误：
- 确保已运行 `002_auto_cleanup_function.sql` 迁移
- 检查是否在正确的数据库中执行

### 权限错误

如果遇到权限错误：
- 确保数据库用户有足够的权限
- Neon 默认用户应该有所有权限

### 清理没有效果

- 检查数据是否真的超过指定天数
- 查看清理日志确认是否执行成功
- 检查 `consumed_at` 字段的值是否正确

