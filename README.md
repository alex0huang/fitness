# Fitness Tracker

一个使用 React + Express 构建的健身追踪应用。

## 项目结构

- `frontend/` - React 前端应用（使用 Vite）
- `routes/` - Express 后端路由
- `views/` - EJS 模板（保留用于向后兼容）
- `database.js` - 数据库连接配置
- `server.js` - Express 服务器

## 开发环境设置

### 1. 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 2. 初始化数据库

```bash
npm run migrate
```

### 3. 运行开发服务器

**方式一：同时运行前后端（推荐）**
```bash
npm run dev
```

这将同时启动：
- 后端服务器：http://localhost:3000
- 前端开发服务器：http://localhost:5173

**方式二：分别运行**

```bash
# 终端 1：启动后端
npm run devStart

# 终端 2：启动前端
npm run frontend
```

## 技术栈

### 前端
- React 19
- React Router 6
- Vite
- CSS（无框架，纯 CSS）

### 后端
- Express 5
- PostgreSQL
- Express Session（用于认证）
- CORS（支持跨域请求）

## API 端点

### 用户相关
- `POST /users` - 注册新用户
- `POST /users/login` - 用户登录
- `POST /users/logout` - 用户登出
- `GET /users` - 获取用户列表（需要认证）

### 餐食相关（需要认证）
- `GET /meals` - 获取餐食列表
- `GET /meals/:mealId` - 获取餐食详情
- `POST /meals` - 创建新餐食
- `PUT /meals/:mealId` - 更新餐食
- `DELETE /meals/:mealId` - 删除餐食

## 构建生产版本

```bash
npm run frontend:build
```

构建后的文件将位于 `frontend/dist/` 目录。

## 注意事项

- 前端运行在 `http://localhost:5173`（Vite 默认端口）
- 后端运行在 `http://localhost:3000`
- 确保 PostgreSQL 数据库已启动并配置正确
- Session 配置允许跨域请求（开发环境）

