"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Zap,
  Code,
  Key,
  Book,
  BarChart3,
  Shield,
  Rocket,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  FileJson,
  Cpu,
  Globe,
  Clock,
  Users,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

const apiPlans = [
  {
    id: "starter",
    name: "入门版",
    price: 0,
    calls: "1,000",
    rateLimit: "10次/分钟",
    features: ["基础词条查询", "搜索API", "社区支持"],
    cta: "免费开始",
    popular: false,
  },
  {
    id: "pro",
    name: "专业版",
    price: 999,
    calls: "100,000",
    rateLimit: "100次/分钟",
    features: ["全部词条访问", "批量查询", "论文API", "高级搜索", "优先支持"],
    cta: "立即订阅",
    popular: true,
  },
  {
    id: "enterprise",
    name: "企业版",
    price: 4999,
    calls: "无限制",
    rateLimit: "1000次/分钟",
    features: ["所有Pro功能", "私有部署", "自定义字段", "SLA保障", "专属对接"],
    cta: "联系销售",
    popular: false,
  },
]

const codeExamples = {
  curl: `curl -X GET "https://api.gaoneng.wiki/v1/terms/gpt-5" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
  
  python: `import requests

response = requests.get(
    "https://api.gaoneng.wiki/v1/terms/gpt-5",
    headers={
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    }
)

data = response.json()
print(data["title"])  # GPT-5`,
  
  javascript: `const response = await fetch(
  "https://api.gaoneng.wiki/v1/terms/gpt-5",
  {
    headers: {
      "Authorization": "Bearer YOUR_API_KEY",
      "Content-Type": "application/json"
    }
  }
);

const data = await response.json();
console.log(data.title);  // GPT-5`,
}

const endpoints = [
  { method: "GET", path: "/v1/terms", desc: "获取词条列表" },
  { method: "GET", path: "/v1/terms/:id", desc: "获取词条详情" },
  { method: "GET", path: "/v1/search", desc: "搜索词条" },
  { method: "GET", path: "/v1/categories", desc: "获取分类列表" },
  { method: "GET", path: "/v1/papers", desc: "获取论文列表" },
  { method: "GET", path: "/v1/papers/:id", desc: "获取论文详情" },
  { method: "GET", path: "/v1/trending", desc: "获取热门词条" },
  { method: "GET", path: "/v1/related/:id", desc: "获取相关词条" },
]

export default function ApiPlatformPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState("")

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">高能百科</span>
            <Badge variant="secondary">API</Badge>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/api-platform/docs" className="text-sm text-muted-foreground hover:text-foreground">
              文档
            </Link>
            <Link href="/login">
              <Button size="sm">获取API密钥</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto px-4 py-20 relative">
          <div className="max-w-3xl">
            <Badge className="mb-4 gap-1">
              <Code className="h-3 w-3" />
              开发者平台
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              将前沿知识集成到你的应用
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              通过高能百科 API，获取实时更新的前沿科技词条、论文数据和知识图谱，构建智能应用
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gap-2">
                <Key className="h-5 w-5" />
                免费获取 API 密钥
              </Button>
              <Link href="/api-platform/docs">
                <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                  <Book className="h-5 w-5" />
                  查看文档
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {[
              { icon: FileJson, value: "50,000+", label: "词条数据" },
              { icon: Cpu, value: "99.9%", label: "API可用性" },
              { icon: Clock, value: "<100ms", label: "平均响应" },
              { icon: Users, value: "10,000+", label: "开发者" },
            ].map((stat) => {
              const IconComponent = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  <IconComponent className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">简单易用的 RESTful API</h2>
            <p className="text-muted-foreground">几行代码即可获取高能百科的全部数据</p>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Tabs defaultValue="curl">
              <div className="border-b border-border px-4 py-2 bg-muted/50 flex items-center justify-between">
                <TabsList className="bg-transparent">
                  <TabsTrigger value="curl" className="gap-2">
                    <Terminal className="h-4 w-4" />
                    cURL
                  </TabsTrigger>
                  <TabsTrigger value="python" className="gap-2">
                    Python
                  </TabsTrigger>
                  <TabsTrigger value="javascript" className="gap-2">
                    JavaScript
                  </TabsTrigger>
                </TabsList>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => copyToClipboard(codeExamples.curl, "code")}
                >
                  {copiedCode === "code" ? (
                    <>
                      <Check className="h-4 w-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      复制
                    </>
                  )}
                </Button>
              </div>
              {Object.entries(codeExamples).map(([lang, code]) => (
                <TabsContent key={lang} value={lang} className="m-0">
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="text-foreground">{code}</code>
                  </pre>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Response Example */}
          <div className="mt-6 bg-card rounded-xl border border-border overflow-hidden">
            <div className="border-b border-border px-4 py-2 bg-muted/50 flex items-center justify-between">
              <span className="text-sm font-medium">响应示例</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                200 OK
              </Badge>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code className="text-foreground">{`{
  "id": "gpt-5",
  "title": "GPT-5",
  "category": "人工智能",
  "summary": "GPT-5 是 OpenAI 预计于 2024-2025 年发布的下一代大型语言模型...",
  "tags": ["AGI", "大语言模型", "OpenAI"],
  "stats": {
    "views": 125000,
    "likes": 8560
  },
  "updated_at": "2024-01-15T10:30:00Z"
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">API 端点</h2>
            <p className="text-muted-foreground">完整的 RESTful API，覆盖所有数据访问需求</p>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-sm font-medium">方法</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">端点</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">描述</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((endpoint, index) => (
                  <tr key={index} className="border-b border-border last:border-0">
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          endpoint.method === "GET"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }
                      >
                        {endpoint.method}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">{endpoint.path}</td>
                    <td className="px-6 py-4 text-muted-foreground">{endpoint.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-8">
            <Link href="/api-platform/docs">
              <Button variant="outline" className="gap-2 bg-transparent">
                查看完整 API 文档
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">灵活的定价方案</h2>
            <p className="text-muted-foreground">从免费开始，按需扩展</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {apiPlans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-card rounded-xl border p-6 ${
                  plan.popular ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
              >
                {plan.popular && (
                  <Badge className="mb-4">最受欢迎</Badge>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">
                    {plan.price === 0 ? "免费" : `¥${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-muted-foreground">/月</span>}
                </div>
                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.calls} 次调用/月</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.rateLimit}</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">为开发者打造</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                title: "全球 CDN 加速",
                desc: "全球多节点部署，确保低延迟访问",
              },
              {
                icon: Shield,
                title: "安全可靠",
                desc: "OAuth 2.0 认证，HTTPS 加密传输",
              },
              {
                icon: Rocket,
                title: "实时更新",
                desc: "词条数据实时同步，获取最新内容",
              },
            ].map((feature) => {
              const IconComponent = feature.icon
              return (
                <div key={feature.title} className="bg-card rounded-xl border border-border p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>
          <p className="text-muted-foreground mb-8">
            注册即可获得免费 API 密钥，每月 1,000 次调用额度
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Input
              placeholder="输入你的邮箱"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1"
            />
            <Button className="gap-2">
              获取 API 密钥
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>高能百科 API Platform &copy; 2026</p>
        </div>
      </footer>
    </div>
  )
}
