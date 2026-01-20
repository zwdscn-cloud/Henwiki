# 高能百科 (HenWiki)

> 汇聚各领域前沿知识、高新名词的专业百科平台，快速收录最新科技、学术、行业前沿概念

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8)](https://tailwindcss.com/)

## 📖 项目简介

高能百科是一个现代化的知识分享平台，专注于前沿科技、学术研究和行业新概念。平台提供词条管理、论文分享、社区讨论等功能，帮助用户快速了解和学习最新知识。

### 核心特性

- 📚 **词条管理** - 创建、编辑、浏览专业词条，支持 Markdown 格式
- 📄 **论文库** - 收录学术论文，支持分类浏览和搜索
- 💬 **社区讨论** - 发起和参与技术讨论，与专家交流
- 🔍 **智能搜索** - 全文搜索词条、论文和讨论
- 👥 **用户系统** - 积分、等级、徽章等激励机制
- 📊 **数据分析** - 后台数据统计和分析功能
- 🎨 **主题切换** - 支持明暗主题切换
- 📱 **响应式设计** - 完美适配桌面和移动设备

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (推荐) 或 npm/yarn
- MySQL >= 8.0
- TypeScript >= 5.0

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd henwiki
```

2. **安装依赖**

```bash
pnpm install
```

3. **配置环境变量**

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=henwiki

# JWT 密钥（生产环境请使用强随机字符串）
JWT_SECRET=your-secret-key-here

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **创建数据库**

```bash
mysql -u root -p < lib/db/migrations/init.sql
```

或者直接在 MySQL 客户端中执行 `lib/db/migrations/init.sql` 文件。

5. **初始化数据（可选）**

创建测试用户和示例数据：

```bash
# 创建测试用户
pnpm run create-test-users

# 创建完整测试数据（包括词条、论文、评论等）
pnpm run seed
```

6. **启动开发服务器**

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📁 项目结构

```
henwiki/
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   ├── admin/             # 管理后台
│   ├── term/              # 词条相关页面
│   ├── papers/            # 论文相关页面
│   ├── community/         # 社区页面
│   └── ...
├── components/            # React 组件
│   ├── ui/               # UI 基础组件
│   └── ...
├── lib/                  # 工具库和配置
│   ├── db/               # 数据库相关
│   ├── models/           # 数据模型
│   └── utils/            # 工具函数
├── public/               # 静态资源
├── scripts/              # 脚本文件
└── styles/               # 样式文件
```

## 🛠️ 技术栈

### 前端

- **框架**: Next.js 16.0 (App Router)
- **UI 库**: React 19.2
- **样式**: Tailwind CSS 4.1
- **组件库**: Radix UI
- **富文本编辑器**: Tiptap
- **图表**: Recharts
- **图标**: Lucide React

### 后端

- **运行时**: Node.js
- **数据库**: MySQL 8.0
- **ORM**: 原生 MySQL2
- **认证**: JWT (jsonwebtoken)
- **文件上传**: Multer

### 开发工具

- **语言**: TypeScript 5.0
- **包管理**: pnpm
- **代码格式化**: ESLint
- **构建工具**: Next.js

## 📝 可用脚本

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器
pnpm lint             # 代码检查

# 数据库
pnpm run init-db      # 初始化数据库
pnpm run seed         # 创建测试数据
pnpm run create-test-users  # 创建测试用户
pnpm run add-categories     # 添加分类
pnpm run add-test-data      # 添加更多测试数据
```

## 🔐 测试账号

运行 `pnpm run create-test-users` 后，可以使用以下账号登录：

| 邮箱 | 密码 | 角色 | 说明 |
|------|------|------|------|
| admin@gaoneng.wiki | 123456 | 管理员 | 可访问后台管理 |
| scientist@gaoneng.wiki | 123456 | 用户 | 材料科学家 |
| editor@gaoneng.wiki | 123456 | 用户 | 科技编辑 |
| demo@gaoneng.wiki | 123456 | 用户 | 演示账号 |

> ⚠️ **注意**: 所有测试账号密码均为 `123456`，仅用于开发测试！

## 📚 功能模块

### 词条系统

- ✅ 创建和编辑词条
- ✅ 词条分类管理
- ✅ 词条搜索和筛选
- ✅ 词条点赞和收藏
- ✅ 词条评论系统
- ✅ 全页宽阅读模式
- ✅ 词条标注功能

### 论文系统

- ✅ 论文提交和审核
- ✅ 论文分类浏览
- ✅ 论文搜索
- ✅ PDF 下载记录
- ✅ 论文点赞

### 社区功能

- ✅ 讨论区
- ✅ 话题分类
- ✅ 回复和点赞
- ✅ 专家推荐
- ✅ 排行榜

### 用户系统

- ✅ 用户注册/登录
- ✅ 个人资料管理
- ✅ 积分和等级系统
- ✅ 徽章系统
- ✅ 关注/粉丝
- ✅ 收藏夹管理
- ✅ 签到功能

### 管理后台

- ✅ 词条审核
- ✅ 论文审核
- ✅ 用户管理
- ✅ 角色权限管理
- ✅ 数据分析
- ✅ 广告管理
- ✅ 系统设置

## 🔌 API 文档

### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 词条相关

- `GET /api/terms` - 获取词条列表
- `POST /api/terms` - 创建词条
- `GET /api/terms/[id]` - 获取词条详情
- `PUT /api/terms/[id]` - 更新词条
- `DELETE /api/terms/[id]` - 删除词条
- `POST /api/terms/[id]/like` - 点赞/取消点赞

### 论文相关

- `GET /api/papers` - 获取论文列表
- `POST /api/papers` - 提交论文
- `GET /api/papers/[id]` - 获取论文详情
- `PUT /api/papers/[id]` - 更新论文

### 其他

- `GET /api/categories` - 获取分类列表
- `POST /api/upload` - 文件上传
- `GET /api/discussions` - 获取讨论列表
- `POST /api/discussions` - 创建讨论

更多 API 文档请参考 [README_DATABASE.md](./README_DATABASE.md)

## 🎨 主题定制

项目支持明暗主题切换，主题配置在 `components/theme-provider.tsx` 中。

### 自定义主题

编辑 `app/globals.css` 中的 CSS 变量：

```css
:root {
  --primary: oklch(0.55 0.2 15);
  --background: oklch(0.98 0 0);
  /* ... */
}

.dark {
  --primary: oklch(0.65 0.2 15);
  --background: oklch(0.12 0 0);
  /* ... */
}
```

## 🚢 部署

### Vercel 部署（推荐）

1. 安装 Vercel CLI:
```bash
npm i -g vercel
```

2. 部署:
```bash
vercel --prod
```

Vercel 会自动提供 HTTPS 证书。

### 自建服务器

参考 [HTTPS_SETUP.md](./HTTPS_SETUP.md) 了解详细的部署配置。

### Docker 部署

```bash
docker build -t henwiki .
docker run -p 3000:3000 henwiki
```

## 🔒 安全配置

### 生产环境检查清单

- [ ] 修改 `JWT_SECRET` 为强随机字符串
- [ ] 配置 HTTPS（参考 [HTTPS_SETUP.md](./HTTPS_SETUP.md)）
- [ ] 设置强密码策略
- [ ] 配置数据库访问权限
- [ ] 启用 CORS 保护
- [ ] 配置文件上传大小限制
- [ ] 设置环境变量保护敏感信息

## 📖 相关文档

- [数据库设置说明](./README_DATABASE.md) - 数据库配置和 API 文档
- [测试用户说明](./README_TEST_USERS.md) - 测试账号信息
- [HTTPS 配置指南](./HTTPS_SETUP.md) - HTTPS 部署配置

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详情请查看 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Radix UI](https://www.radix-ui.com/) - 无样式组件库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Tiptap](https://tiptap.dev/) - 富文本编辑器
- [Recharts](https://recharts.org/) - 图表库

## 📧 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件

---

**高能百科** - 让前沿知识触手可及 ⚡
