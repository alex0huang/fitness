# 🏋️ Fitness Tracker

一个简洁、专注的健身与饮食追踪应用，帮助你记录每一次餐饮，放大每一分努力。

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-19.2.0-blue.svg)

## ✨ 功能特性

- 📝 **餐食记录** - 记录早餐、午餐、晚餐和其他餐食
- 🍎 **营养追踪** - 追踪卡路里、蛋白质、碳水化合物和脂肪摄入
- 📊 **数据统计** - 每日营养摄入统计和进度条显示
- 🎯 **目标设置** - 设置每日营养目标，跟踪完成进度
- 📅 **日期筛选** - 查看不同日期的餐食记录
- 🔐 **用户认证** - 安全的用户注册和登录系统
- 📱 **响应式设计** - 完美支持桌面和移动设备

## 🚀 在线体验

- **前端地址**: [https://fitness-eight-mocha.vercel.app](https://fitness-eight-mocha.vercel.app)
- **后端 API**: [https://fitness-yhc9.onrender.com](https://fitness-yhc9.onrender.com)

## 🛠️ 技术栈

### 前端
- **React 19** - 现代化的 UI 框架
- **React Router 6** - 单页应用路由
- **Vite** - 快速的构建工具
- **纯 CSS** - 无框架依赖，轻量级样式

### 后端
- **Express 5** - Node.js Web 框架
- **PostgreSQL** - 关系型数据库
- **JWT** - JSON Web Token 认证
- **bcrypt** - 密码加密

### 部署
- **Vercel** - 前端部署
- **Render** - 后端部署
- **Neon** - PostgreSQL 云数据库

## 📦 项目结构

```
fitness/
├── frontend/              # React 前端应用
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   └── utils/         # 工具函数
│   └── package.json
├── routes/                # Express 路由
│   ├── users.js          # 用户相关路由
│   ├── meals.js          # 餐食相关路由
│   └── admin.js          # 管理路由
├── scripts/               # 数据库脚本
│   ├── migrations/       # 数据库迁移文件
│   └── cleanup-old-data.js
├── database.js           # 数据库连接配置
├── server.js             # Express 服务器入口
└── package.json
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 12.0
- npm 或 yarn

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/alex0huang/fitness.git
cd fitness
```

2. **安装依赖**

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

3. **配置环境变量**

创建 `.env` 文件（参考 `env.example.txt`）：

```env
# 数据库配置（方式1：使用连接字符串）
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# 或使用单独的环境变量（方式2）
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=fitness
DB_PASSWORD=your_db_password
DB_PORT=5432

# 应用配置
NODE_ENV=development
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:5173
```

4. **初始化数据库**

```bash
npm run migrate
```

5. **启动开发服务器**

```bash
# 同时启动前后端（推荐）
npm run dev
```

这将启动：
- 后端服务器：http://localhost:3000
- 前端开发服务器：http://localhost:5173

**或分别启动：**

```bash
# 终端 1：启动后端
npm run devStart

# 终端 2：启动前端
npm run frontend
```

## 📚 API 文档

### 认证

所有需要认证的 API 请求都需要在请求头中包含 JWT token：

```
Authorization: Bearer <your-jwt-token>
```

### 用户相关

- `POST /users` - 注册新用户
  ```json
  {
    "firstname": "用户名",
    "password": "密码"
  }
  ```

- `POST /users/login` - 用户登录
  ```json
  {
    "firstname": "用户名",
    "password": "密码"
  }
  ```
  返回：`{ "token": "jwt-token", "user": {...} }`

- `GET /users/me` - 获取当前用户信息（需要认证）

- `PUT /users/me/goals` - 更新用户营养目标（需要认证）
  ```json
  {
    "daily_calorie_limit": 2600,
    "daily_protein_limit": 160,
    "daily_carbs_limit": 310,
    "daily_fat_limit": 80
  }
  ```

- `POST /users/logout` - 用户登出

### 餐食相关（需要认证）

- `GET /meals?date=2025-11-30` - 获取餐食列表（可选日期筛选）

- `GET /meals/:mealId` - 获取餐食详情

- `POST /meals` - 创建新餐食
  ```json
  {
    "title": "晚餐",
    "consumed_at": "2025-11-30T20:00:00",
    "notes": "备注信息",
    "items": [
      {
        "food_name": "米饭",
        "calories": 200,
        "protein_grams": 5,
        "carbs_grams": 45,
        "fat_grams": 0.5
      }
    ]
  }
  ```

- `PUT /meals/:mealId` - 更新餐食

- `DELETE /meals/:mealId` - 删除餐食

## 🏗️ 构建生产版本

```bash
npm run frontend:build
```

构建后的文件将位于 `frontend/dist/` 目录。

## 🌐 部署

### 免费部署方案

本项目已配置好免费部署方案，详见 [DEPLOYMENT.md](./DEPLOYMENT.md)

**推荐配置：**
- **数据库**: Neon (PostgreSQL)
- **后端**: Render
- **前端**: Vercel

### 部署步骤

1. **设置数据库**（Neon）
   - 创建 Neon 项目
   - 运行 `database.sql` 初始化表结构

2. **部署后端**（Render）
   - 连接 GitHub 仓库
   - 设置环境变量
   - 部署 Web Service

3. **部署前端**（Vercel）
   - 导入 GitHub 仓库
   - 设置根目录为 `frontend`
   - 配置环境变量 `VITE_API_BASE_URL`

详细部署说明请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📝 数据库管理

数据库迁移和管理脚本位于 `scripts/` 目录：

- `scripts/init-db.js` - 初始化数据库表结构
- `scripts/run-migration.js` - 运行数据库迁移
- `scripts/cleanup-old-data.js` - 清理旧数据

详细说明请参考 [DATABASE_MANAGEMENT.md](./DATABASE_MANAGEMENT.md)

## 🧪 开发

### 可用脚本

```bash
# 开发
npm run dev              # 同时启动前后端
npm run devStart         # 仅启动后端
npm run frontend         # 仅启动前端

# 数据库
npm run migrate          # 初始化数据库
npm run migrate:cleanup  # 运行清理迁移
npm run cleanup         # 清理旧数据

# 构建
npm run frontend:build   # 构建前端生产版本
```

### 代码规范

项目使用 ESLint 进行代码检查：

```bash
cd frontend
npm run lint
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

ISC License

## 👤 作者

**alex0huang**

- GitHub: [@alex0huang](https://github.com/alex0huang)

## 🙏 致谢

感谢所有开源项目的贡献者！

---

⭐ 如果这个项目对你有帮助，请给个 Star！
