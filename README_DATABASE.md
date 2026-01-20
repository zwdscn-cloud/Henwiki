# 数据库设置说明

## 1. 安装依赖

```bash
pnpm install
```

## 2. 创建数据库

确保 MySQL 服务正在运行，然后执行以下 SQL 脚本创建数据库和表结构：

```bash
mysql -u root -p < lib/db/migrations/init.sql
```

或者直接在 MySQL 客户端中执行 `lib/db/migrations/init.sql` 文件中的 SQL 语句。

## 3. 配置环境变量

复制 `.env.example` 文件为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，确保数据库配置正确：

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=henwiki
```

## 4. 启动开发服务器

```bash
pnpm dev
```

## 5. API 端点

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 用户相关
- `GET /api/users/[id]` - 获取用户信息
- `PUT /api/users/[id]` - 更新用户信息
- `POST /api/users/[id]/follow` - 关注用户
- `DELETE /api/users/[id]/follow` - 取消关注
- `GET /api/users/[id]/follow` - 检查关注状态
- `POST /api/users/[id]/checkin` - 用户签到

### 词条相关
- `GET /api/terms` - 获取词条列表
- `POST /api/terms` - 创建词条
- `GET /api/terms/[id]` - 获取词条详情
- `PUT /api/terms/[id]` - 更新词条
- `DELETE /api/terms/[id]` - 删除词条
- `POST /api/terms/[id]/like` - 点赞/取消点赞词条
- `GET /api/terms/[id]/like` - 检查点赞状态

### 论文相关
- `GET /api/papers` - 获取论文列表
- `POST /api/papers` - 提交论文
- `GET /api/papers/[id]` - 获取论文详情
- `PUT /api/papers/[id]` - 更新论文
- `POST /api/papers/[id]` - 记录下载
- `POST /api/papers/[id]/like` - 点赞/取消点赞论文

### 评论相关
- `POST /api/comments` - 创建评论
- `DELETE /api/comments/[id]` - 删除评论
- `GET /api/comments/[id]` - 获取词条的评论列表

### 其他
- `GET /api/categories` - 获取分类列表
- `POST /api/upload` - 文件上传

## 6. 创建示例数据

### 方法一：使用完整种子脚本（推荐）

运行以下命令创建完整的测试数据（包括用户、词条、论文、评论、点赞等）：

```bash
pnpm run seed
```

或者：

```bash
npx tsx scripts/seed-database.ts
```

这个脚本会创建：
- 5 个测试用户（密码均为 `123456`）
- 10 个词条（覆盖多个分类）
- 5 篇论文
- 评论和回复
- 点赞数据
- 关注关系
- 通知数据

### 方法二：仅创建测试用户

如果只需要创建用户：

```bash
pnpm run create-test-users
```

### 测试账号

所有测试账号的密码都是 `123456`：

- `admin@gaoneng.wiki` - AI研究员（高级用户）
- `scientist@gaoneng.wiki` - 材料科学家
- `editor@gaoneng.wiki` - 科技编辑
- `demo@gaoneng.wiki` - 演示用户（新用户）
- `quantum@gaoneng.wiki` - 量子物理博士

## 7. 高并发优化

项目已实现以下高并发优化：

1. **数据库连接池**：使用连接池管理数据库连接，默认连接数为 10
2. **索引优化**：所有外键和常用查询字段都添加了索引
3. **组合索引**：为常用查询组合添加了组合索引（如 category_id + created_at）
4. **全文索引**：词条标题和内容添加了全文索引，支持搜索
5. **事务处理**：关键操作使用事务保证数据一致性

## 8. 注意事项

- 生产环境请修改 `JWT_SECRET` 为强随机字符串
- 文件上传目录为 `public/uploads`，请确保有写入权限
- 建议定期备份数据库
- 生产环境建议使用环境变量管理敏感信息
