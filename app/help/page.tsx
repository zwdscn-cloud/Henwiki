import Link from "next/link"
import { HelpCircle, ChevronRight, Search, BookOpen, PenSquare, Users, MessageCircle } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqCategories = [
  {
    title: "入门指南",
    icon: BookOpen,
    faqs: [
      {
        q: "什么是高能百科？",
        a: "高能百科是一个专注于前沿科技和高新术语的知识平台，汇集了人工智能、量子计算、生物科技等多个领域的专业词条。",
      },
      {
        q: "如何搜索词条？",
        a: "你可以使用顶部搜索栏输入关键词进行搜索，也可以通过分类浏览或标签筛选找到感兴趣的内容。",
      },
      {
        q: "如何关注感兴趣的领域？",
        a: "进入任意领域页面，点击「关注领域」按钮即可。你将在首页收到该领域的最新更新。",
      },
    ],
  },
  {
    title: "创建内容",
    icon: PenSquare,
    faqs: [
      {
        q: "如何创建新词条？",
        a: "登录后点击「创建词条」按钮，填写词条名称、所属领域、简介和详细内容。提交后将由专家审核。",
      },
      { q: "词条审核需要多长时间？", a: "一般情况下，审核会在 24-48 小时内完成。复杂的专业词条可能需要更长时间。" },
      { q: "如何编辑已有词条？", a: "在词条详情页点击「编辑」按钮，提交修改建议。修改同样需要经过审核。" },
    ],
  },
  {
    title: "社区互动",
    icon: Users,
    faqs: [
      { q: "如何关注其他用户？", a: "访问用户主页，点击「关注」按钮即可。你将在动态中看到他们的最新贡献。" },
      { q: "如何参与词条讨论？", a: "在词条详情页底部的讨论区发表评论，与其他用户交流观点。" },
      { q: "如何成为认证专家？", a: "在个人设置中提交认证申请，提供相关资质证明。审核通过后将获得认证标识。" },
    ],
  },
]

export default function HelpPage() {
  return (
    <PageLayout showRightSidebar={false}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            首页
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">帮助中心</span>
        </nav>

        {/* Header */}
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">帮助中心</h1>
          <p className="text-muted-foreground mb-6">有问题？在这里找到答案</p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="搜索帮助文章..." className="pl-9" />
          </div>
        </div>

        {/* FAQ Categories */}
        {faqCategories.map((category) => (
          <div key={category.title} className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <category.icon className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">{category.title}</h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {category.faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-sm">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}

        {/* Contact */}
        <div className="bg-card rounded-lg border border-border p-6 text-center">
          <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-2">还有问题？</h3>
          <p className="text-sm text-muted-foreground mb-4">联系我们的支持团队获取帮助</p>
          <Link href="mailto:support@gaoneng.wiki" className="text-primary hover:underline text-sm">
            support@gaoneng.wiki
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}
