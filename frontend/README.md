# 前端（React + Vite）

这是 Fitness Tracker 的前端项目，基于 React + Vite 构建。

## 开发

在仓库根目录：

```bash
cd frontend
npm install
npm run dev
```

默认开发地址：`http://localhost:5173`

## 构建

```bash
cd frontend
npm run build
```

构建产物会输出到 `frontend/dist/`。

## 环境变量

前端通过 `VITE_API_BASE_URL` 指定后端 API 地址，例如：

```bash
VITE_API_BASE_URL=http://localhost:3000
```
