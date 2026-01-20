# HTTPS 配置指南

本指南介绍如何为高能百科网站配置 HTTPS 协议支持。

## 方案一：使用 Vercel 部署（推荐，最简单）

Vercel 自动为所有部署提供 HTTPS 证书，无需额外配置。

### 部署步骤：

1. **安装 Vercel CLI**（如果还没有）：
```bash
npm i -g vercel
```

2. **登录 Vercel**：
```bash
vercel login
```

3. **部署项目**：
```bash
vercel
```

4. **生产环境部署**：
```bash
vercel --prod
```

Vercel 会自动：
- 提供免费的 SSL 证书（Let's Encrypt）
- 自动续期证书
- 支持自定义域名
- 提供全球 CDN 加速

### 自定义域名配置：

1. 在 Vercel 控制台添加你的域名
2. 按照提示配置 DNS 记录
3. Vercel 会自动配置 HTTPS

---

## 方案二：使用 Nginx 反向代理（自建服务器）

如果你有自己的服务器，可以使用 Nginx 作为反向代理并配置 SSL 证书。

### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. 安装 Certbot（Let's Encrypt 证书工具）

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

### 3. 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/henwiki`：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 重定向 HTTP 到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 证书配置（Certbot 会自动填充）
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 代理到 Next.js 应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. 启用配置

```bash
sudo ln -s /etc/nginx/sites-available/henwiki /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl reload nginx
```

### 5. 获取 SSL 证书

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot 会自动：
- 获取 SSL 证书
- 配置 Nginx
- 设置自动续期

### 6. 验证自动续期

```bash
sudo certbot renew --dry-run
```

---

## 方案三：使用 Docker + Nginx

### 1. 创建 Docker Compose 配置

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./:/app
      - /app/node_modules
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

### 2. 创建 Nginx 配置

创建 `nginx.conf`：

```nginx
events {
    worker_connections 1024;
}

http {
    upstream nextjs {
        server app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        location / {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 3. 创建 Dockerfile

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm
RUN pnpm build

# 生产镜像
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 4. 更新 Next.js 配置

更新 `next.config.mjs` 以支持 standalone 输出：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // 添加这行
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
```

---

## 方案四：本地开发 HTTPS

### 1. 安装 mkcert（用于生成本地证书）

```bash
# macOS
brew install mkcert

# Ubuntu/Debian
sudo apt install libnss3-tools
wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert-v1.4.4-linux-amd64
sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert
```

### 2. 安装本地 CA

```bash
mkcert -install
```

### 3. 生成证书

```bash
mkcert localhost 127.0.0.1 ::1
```

这会生成 `localhost+2.pem` 和 `localhost+2-key.pem`

### 4. 创建自定义服务器

创建 `server.js`：

```javascript
const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const httpsOptions = {
  key: fs.readFileSync('./localhost+2-key.pem'),
  cert: fs.readFileSync('./localhost+2.pem'),
}

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on https://${hostname}:${port}`)
  })
})
```

### 5. 更新 package.json

```json
{
  "scripts": {
    "dev:https": "node server.js"
  }
}
```

### 6. 运行

```bash
pnpm dev:https
```

---

## 方案五：使用 Cloudflare（免费 CDN + HTTPS）

1. 注册 Cloudflare 账号
2. 添加你的域名到 Cloudflare
3. 更新 DNS 记录指向 Cloudflare
4. 在 Cloudflare 中启用 SSL/TLS
5. 选择 "Full" 或 "Full (strict)" 模式

Cloudflare 会自动提供：
- 免费 SSL 证书
- DDoS 防护
- CDN 加速
- 自动 HTTPS 重定向

---

## 安全建议

无论使用哪种方案，建议配置以下安全头：

### 在 Next.js 中配置（使用 next.config.mjs）

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}
```

---

## 验证 HTTPS 配置

使用以下工具验证你的 HTTPS 配置：

1. **SSL Labs SSL Test**: https://www.ssllabs.com/ssltest/
2. **Security Headers**: https://securityheaders.com/
3. **Mozilla Observatory**: https://observatory.mozilla.org/

---

## 常见问题

### Q: 证书过期怎么办？
A: 如果使用 Let's Encrypt，Certbot 会自动续期。确保 cron 任务正常运行：
```bash
sudo systemctl status certbot.timer
```

### Q: 如何强制 HTTPS 重定向？
A: 在 Nginx 配置中添加 HTTP 到 HTTPS 的重定向（见方案二）

### Q: 混合内容警告？
A: 确保所有资源（图片、脚本、样式）都使用 HTTPS URL

### Q: Next.js 中如何检测协议？
A: 使用环境变量或请求头：
```javascript
const protocol = process.env.NODE_ENV === 'production' 
  ? 'https' 
  : 'http'
```

---

## 推荐方案

- **开发环境**: 使用方案四（本地 HTTPS）
- **生产环境（快速部署）**: 使用方案一（Vercel）
- **生产环境（自建服务器）**: 使用方案二（Nginx + Let's Encrypt）
- **需要 CDN 和防护**: 使用方案五（Cloudflare）
