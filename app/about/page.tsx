import Link from "next/link"
import { Zap, Target, Users, BookOpen, ChevronRight } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <PageLayout showRightSidebar={false}>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            首页
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">关于我们</span>
        </nav>

        {/* Hero */}
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
              <Zap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">高能百科</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            汇聚各领域前沿知识的专业百科平台，让每个人都能轻松了解最新的科技进展和行业术语。
          </p>
        </div>

        {/* Mission */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">我们的使命</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            在信息爆炸的时代，新概念、新技术层出不穷。高能百科致力于成为连接前沿知识与大众的桥梁，
            通过专业且易懂的内容，帮助每个人理解和把握科技发展的脉搏。
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg border border-border p-6">
            <BookOpen className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold text-foreground mb-2">专业内容</h3>
            <p className="text-sm text-muted-foreground">由各领域专家审核把关，确保每个词条的准确性和权威性</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <Users className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold text-foreground mb-2">社区驱动</h3>
            <p className="text-sm text-muted-foreground">开放的协作模式，让每个人都能贡献自己的专业知识</p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">平台数据</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">5,000+</p>
              <p className="text-sm text-muted-foreground">收录词条</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">1,200+</p>
              <p className="text-sm text-muted-foreground">贡献者</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">50万+</p>
              <p className="text-sm text-muted-foreground">月访问量</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20 p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">加入我们</h2>
          <p className="text-muted-foreground mb-4">成为贡献者，分享你的专业知识</p>
          <Button asChild>
            <Link href="/create">开始创建词条</Link>
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}
