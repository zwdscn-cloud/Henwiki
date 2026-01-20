"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Zap,
  Check,
  X,
  Crown,
  Sparkles,
  Download,
  Bell,
  Search,
  FileText,
  Users,
  Shield,
  Rocket,
  Star,
  ArrowRight,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

const plans = [
  {
    id: "free",
    name: "免费版",
    price: 0,
    period: "forever",
    description: "适合个人学习和轻度使用",
    features: [
      { name: "浏览所有公开词条", included: true },
      { name: "每日搜索 20 次", included: true },
      { name: "收藏最多 50 个词条", included: true },
      { name: "参与社区讨论", included: true },
      { name: "高级搜索和筛选", included: false },
      { name: "导出词条 PDF", included: false },
      { name: "API 访问", included: false },
      { name: "优先客服支持", included: false },
    ],
    cta: "当前方案",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 29, yearly: 199 },
    period: "month",
    description: "适合专业研究者和重度用户",
    features: [
      { name: "浏览所有公开词条", included: true },
      { name: "无限搜索次数", included: true },
      { name: "无限收藏词条", included: true },
      { name: "参与社区讨论", included: true },
      { name: "高级搜索和筛选", included: true },
      { name: "导出词条 PDF", included: true },
      { name: "API 访问 (5000次/月)", included: true },
      { name: "优先客服支持", included: true },
    ],
    cta: "升级 Pro",
    popular: true,
  },
  {
    id: "enterprise",
    name: "企业版",
    price: "定制",
    period: "",
    description: "适合团队和企业级应用",
    features: [
      { name: "Pro 版所有功能", included: true },
      { name: "团队协作空间", included: true },
      { name: "自定义知识库", included: true },
      { name: "SSO 单点登录", included: true },
      { name: "无限 API 访问", included: true },
      { name: "专属客户经理", included: true },
      { name: "数据导出和备份", included: true },
      { name: "SLA 服务保障", included: true },
    ],
    cta: "联系我们",
    popular: false,
  },
]

const proFeatures = [
  {
    icon: Search,
    title: "高级搜索",
    description: "使用布尔运算符、时间范围、领域筛选等高级搜索功能，精准定位所需知识",
  },
  {
    icon: Download,
    title: "PDF 导出",
    description: "将词条导出为精美的 PDF 文档，方便离线阅读和分享",
  },
  {
    icon: Bell,
    title: "智能推送",
    description: "根据你的兴趣领域，第一时间推送最新收录的词条和重大更新",
  },
  {
    icon: FileText,
    title: "API 访问",
    description: "通过 RESTful API 将高能百科知识集成到你的应用或工作流中",
  },
  {
    icon: Users,
    title: "专家咨询",
    description: "直接向领域专家提问，获得专业解答和深度见解",
  },
  {
    icon: Shield,
    title: "优先支持",
    description: "专属客服通道，问题优先处理，24小时内响应",
  },
]

const testimonials = [
  {
    name: "张博士",
    role: "AI 研究员 @清华大学",
    avatar: "/ai-researcher-avatar.jpg",
    content: "高能百科 Pro 的 API 功能帮助我们团队快速构建了内部知识库，大大提升了研究效率。",
  },
  {
    name: "李经理",
    role: "产品总监 @某科技公司",
    avatar: "/material-scientist-avatar.jpg",
    content: "PDF 导出功能非常实用，我经常将热门词条分享给团队成员，方便大家快速了解新技术。",
  },
  {
    name: "王老师",
    role: "计算机系教授",
    avatar: "/tech-editor-avatar.jpg",
    content: "高级搜索功能让我能够快速找到授课所需的前沿概念，学生们也非常喜欢这个平台。",
  },
]

const faqs = [
  {
    question: "Pro 会员和免费版有什么区别？",
    answer: "Pro 会员可以享受无限搜索、无限收藏、高级筛选、PDF 导出、API 访问等高级功能，同时享有优先客服支持。",
  },
  {
    question: "如何升级到 Pro 会员？",
    answer: "点击「升级 Pro」按钮，选择月付或年付方案，完成支付后即可立即享受 Pro 特权。",
  },
  {
    question: "支持哪些支付方式？",
    answer: "我们支持微信支付、支付宝、信用卡等多种支付方式。企业用户可以选择对公转账。",
  },
  {
    question: "可以随时取消订阅吗？",
    answer: "可以。你可以随时在账号设置中取消订阅，取消后可继续使用至当前计费周期结束。",
  },
  {
    question: "年付方案有什么优惠？",
    answer: "年付方案相当于 10 个月的价格享受 12 个月服务，节省约 17%。",
  },
]

export default function ProPage() {
  const [isYearly, setIsYearly] = useState(true)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

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
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              返回首页
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm" className="bg-transparent">
                登录
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 py-20 relative">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 gap-1">
              <Sparkles className="h-3 w-3" />
              Pro 会员
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">解锁知识探索的全部潜能</h1>
            <p className="text-xl text-muted-foreground mb-8">
              升级 Pro 会员，享受无限搜索、高级筛选、API 访问等专业功能，让知识触手可及
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="gap-2">
                <Crown className="h-5 w-5" />
                立即升级
              </Button>
              <Button variant="outline" size="lg" className="gap-2 bg-transparent">
                了解更多
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Toggle */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm ${!isYearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>月付</span>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} />
          <span className={`text-sm ${isYearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            年付
            <Badge variant="secondary" className="ml-2">
              省 17%
            </Badge>
          </span>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-card rounded-xl border p-6 ${
                plan.popular ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gap-1">
                    <Star className="h-3 w-3" />
                    最受欢迎
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                {typeof plan.price === "number" ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">¥{plan.price}</span>
                    <span className="text-muted-foreground">/永久</span>
                  </div>
                ) : typeof plan.price === "object" ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      ¥{isYearly ? plan.price.yearly : plan.price.monthly}
                    </span>
                    <span className="text-muted-foreground">/{isYearly ? "年" : "月"}</span>
                  </div>
                ) : (
                  <div className="text-4xl font-bold text-foreground">{plan.price}</div>
                )}
                {typeof plan.price === "object" && isYearly && (
                  <p className="text-sm text-muted-foreground mt-1">相当于 ¥{Math.round(plan.price.yearly / 12)}/月</p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    )}
                    <span className={feature.included ? "text-foreground" : "text-muted-foreground/50"}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${plan.popular ? "" : "bg-transparent"}`}
                variant={plan.popular ? "default" : "outline"}
                disabled={plan.id === "free"}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Pro 专属功能</h2>
            <p className="text-muted-foreground">解锁更多高级功能，提升知识探索效率</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proFeatures.map((feature) => {
              const IconComponent = feature.icon
              return (
                <div key={feature.title} className="bg-card rounded-xl border border-border p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">用户好评</h2>
            <p className="text-muted-foreground">来自各领域专业用户的真实反馈</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10" />
                  <div>
                    <p className="font-medium text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground">&ldquo;{testimonial.content}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">常见问题</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-card rounded-lg border border-border overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <span className="font-medium text-foreground">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      expandedFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-4 pb-4">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-12 text-primary-foreground">
            <Rocket className="h-12 w-12 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">准备好提升你的知识探索体验了吗？</h2>
            <p className="text-lg opacity-90 mb-8">立即升级 Pro，解锁全部高级功能</p>
            <Button size="lg" variant="secondary" className="gap-2">
              <Crown className="h-5 w-5" />
              立即升级 Pro
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 高能百科. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
