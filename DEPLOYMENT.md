# 免费部署指南

本指南将帮助你免费部署 Fitness Tracker 应用。

## 推荐方案

### 数据库（PostgreSQL）
- **Neon** ⭐ 推荐 - 免费层：512MB 存储，无时间限制
- **Supabase** - 免费层：500MB 存储，2个数据库
- **Railway** - 免费层：$5/月额度

### 后端（Node.js/Express）
- **Render** ⭐ 推荐 - 免费层：512MB RAM，自动部署
- **Railway** - 免费层：$5/月额度
- **Fly.io** - 免费层：3个共享CPU实例

### 前端（React/Vite）
- **Vercel** ⭐ 推荐 - 免费层：无限带宽，自动部署
- **Netlify** - 免费层：100GB 带宽/月

## 部署步骤

### 第一步：设置数据库（Neon）

1. 访问 [Neon](https://neon.tech) 并注册账号
2. 创建新项目，选择 PostgreSQL
3. 复制数据库连接字符串（格式：`postgresql://user:password@host/database?sslmode=require`）
4. 在 Neon Dashboard 的 SQL Editor 中运行 `database.sql` 创建表结构

### 第二步：部署后端（Render）

1. 访问 [Render](https://render.com) 并注册账号
2. 创建新的 Web Service
3. 连接你的 GitHub 仓库
4. 配置设置：
   - **Name**: `fitness-api`（或你喜欢的名字）
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. 添加环境变量（两种方式任选其一）：

   **方式1：使用连接字符串（推荐）**
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
   FRONTEND_URL=https://你的前端域名.vercel.app
   SESSION_SECRET=生成一个随机字符串（用于session加密）
   NODE_ENV=production
   ```

   **方式2：使用单独的环境变量**
   ```
   DB_USER=你的数据库用户名
   DB_HOST=你的数据库主机
   DB_NAME=你的数据库名
   DB_PASSWORD=你的数据库密码
   DB_PORT=5432
   FRONTEND_URL=https://你的前端域名.vercel.app
   SESSION_SECRET=生成一个随机字符串（用于session加密）
   NODE_ENV=production
   ```

   **提示**：如果使用 `render.yaml` 文件，Render 会自动读取配置，你只需要在 Dashboard 中设置 `DATABASE_URL` 和 `FRONTEND_URL`。

6. 部署完成后，复制你的后端URL（例如：`https://fitness-api.onrender.com`）

### 第三步：部署前端（Vercel）

1. 访问 [Vercel](https://vercel.com) 并注册账号
2. 导入你的 GitHub 仓库
3. 配置设置：
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. 添加环境变量：
   ```
   VITE_API_BASE_URL=你的后端URL（例如：https://fitness-api.onrender.com）
   ```

5. 部署完成后，你会获得一个前端URL（例如：`https://fitness-tracker.vercel.app`）

### 第四步：更新后端 CORS 配置

部署前端后，需要更新后端的 CORS 设置以允许前端域名访问。

## 需要修改的文件

### 1. 更新 `server.js` 的 CORS 配置

```javascript
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
```

### 2. 更新 `frontend/src/services/api.js`

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
```

### 3. 更新 `server.js` 的 session cookie 配置（生产环境）

```javascript
cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS时设为true
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    httpOnly: true,
    path: '/'
}
```

### 4. 更新 `database.js` 支持连接字符串

Neon 提供的是完整的连接字符串，需要更新数据库配置以支持它。

## 环境变量清单

### 后端（Render）
**方式1：使用连接字符串（推荐）**
- `DATABASE_URL` - 完整的PostgreSQL连接字符串（Neon提供）
- `FRONTEND_URL` - 前端部署URL（用于CORS）
- `SESSION_SECRET` - Session加密密钥（随机字符串）
- `NODE_ENV` - 设置为 `production`

**方式2：使用单独的环境变量**
- `DB_USER` - 数据库用户名
- `DB_HOST` - 数据库主机
- `DB_NAME` - 数据库名
- `DB_PASSWORD` - 数据库密码
- `DB_PORT` - 数据库端口（通常为5432）
- `FRONTEND_URL` - 前端部署URL（用于CORS）
- `SESSION_SECRET` - Session加密密钥（随机字符串）
- `NODE_ENV` - 设置为 `production`

### 前端（Vercel）
- `VITE_API_BASE_URL` - 后端API的URL

## 注意事项

1. **免费层限制**：
   - Render 免费层在15分钟无活动后会休眠，首次访问可能需要等待唤醒（约30秒）
   - Neon 免费层有512MB存储限制，对于小型应用足够

2. **数据库迁移**：
   - 首次部署需要在 Neon SQL Editor 中运行 `database.sql`
   - 或者创建一个初始化脚本在应用启动时运行
   - 可以在 Render 的 Shell 中运行：`npm run migrate`（如果配置了该脚本）
   - **更新数据库**：在 Neon SQL Editor 中运行新的迁移文件（见 `DATABASE_MANAGEMENT.md`）

3. **自动清理旧数据**（节省存储空间）：
   - 默认设置：自动删除超过60天（2个月）的餐食记录
   - 设置步骤：
     1. 在 Neon SQL Editor 中运行 `scripts/migrations/002_auto_cleanup_function.sql`
     2. 在 Render 创建 Cron Job，每天执行清理任务
     3. 详细说明见 `DATABASE_MANAGEMENT.md`

4. **使用 render.yaml**：
   - 项目根目录已包含 `render.yaml` 配置文件
   - 在 Render Dashboard 中选择 "New Blueprint" 可以自动读取配置
   - 你只需要手动设置 `DATABASE_URL` 和 `FRONTEND_URL`

5. **Session 存储**：
   - 当前使用内存存储session，多实例部署会有问题
   - 建议使用 Redis（Redis Cloud 有免费层）或数据库存储session

6. **HTTPS**：
   - Vercel 和 Render 都自动提供 HTTPS
   - 确保生产环境的 cookie `secure` 选项设置为 `true`

## 故障排查

1. **CORS 错误**：检查后端 CORS 配置中的 `FRONTEND_URL` 是否正确
2. **数据库连接失败**：检查环境变量是否正确设置，特别是密码中的特殊字符
3. **Session 失效**：确保前后端使用相同的域名或正确配置了 cookie 的 `sameSite` 选项

