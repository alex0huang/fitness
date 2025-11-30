# 部署检查清单

使用此清单确保部署成功。

## ✅ 数据库设置（Neon）

- [ ] 在 Neon 创建了项目
- [ ] 复制了数据库连接字符串
- [ ] 在 Neon SQL Editor 中运行了 `database.sql`
- [ ] 验证表已创建（users, meals, meal_items）

## ✅ 后端部署（Render）

- [ ] 在 Render 创建了 Web Service
- [ ] 连接了 GitHub 仓库
- [ ] 设置了环境变量：
  - [ ] `DATABASE_URL` 或 `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`
  - [ ] `FRONTEND_URL`（先设置为临时值，部署前端后更新）
  - [ ] `SESSION_SECRET`（随机字符串）
  - [ ] `NODE_ENV=production`
- [ ] 部署成功，后端URL可访问
- [ ] 测试后端API：访问 `https://你的后端URL/` 应该返回 JSON

## ✅ 前端部署（Vercel）

- [ ] 在 Vercel 导入了 GitHub 仓库
- [ ] 设置了根目录为 `frontend`
- [ ] 设置了环境变量：
  - [ ] `VITE_API_BASE_URL` = 你的后端URL
- [ ] 部署成功，前端URL可访问
- [ ] 更新后端的 `FRONTEND_URL` 环境变量为前端URL

## ✅ 最终验证

- [ ] 访问前端URL，页面正常加载
- [ ] 可以注册新账号
- [ ] 可以登录
- [ ] 可以添加餐食记录
- [ ] 可以查看餐食列表
- [ ] 可以编辑和删除餐食
- [ ] 可以设置营养目标

## 🔧 常见问题

### CORS 错误
- 检查后端的 `FRONTEND_URL` 是否设置为正确的前端URL
- 确保前端URL包含协议（https://）

### 数据库连接失败
- 检查 `DATABASE_URL` 是否正确
- 如果使用单独的环境变量，确保所有变量都设置了
- 检查数据库是否允许外部连接（Neon默认允许）

### Session 不工作
- 确保前后端都使用 HTTPS（生产环境）
- 检查 cookie 的 `secure` 选项是否正确设置
- 检查浏览器的开发者工具中是否有 cookie

### 前端无法连接后端
- 检查 `VITE_API_BASE_URL` 是否正确
- 确保后端URL可以访问（在浏览器中打开）
- 检查后端日志是否有错误

