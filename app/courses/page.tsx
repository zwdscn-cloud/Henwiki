"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import {
  Zap,
  Play,
  Clock,
  Users,
  Star,
  BookOpen,
  Video,
  FileText,
  Award,
  Filter,
  Search,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const courses = [
  {
    id: "c1",
    title: "大语言模型原理与实战",
    description: "从Transformer到GPT，深入理解大语言模型的核心原理，并动手实践",
    instructor: { name: "李明博士", avatar: "/ai-researcher-avatar.jpg", title: "前OpenAI研究员" },
    price: 299,
    originalPrice: 599,
    duration: "32课时",
    students: 12560,
    rating: 4.9,
    reviews: 2341,
    category: "人工智能",
    level: "进阶",
    tags: ["LLM", "Transformer", "GPT"],
    image: "/ai-researcher-avatar.jpg",
    isBestseller: true,
    isNew: false,
  },
  {
    id: "c2",
    title: "量子计算入门到精通",
    description: "零基础学习量子计算，从量子比特到量子算法，配套Qiskit实战项目",
    instructor: { name: "张量子", avatar: "/quantum-physicist-avatar.jpg", title: "中科大量子信息教授" },
    price: 399,
    originalPrice: 799,
    duration: "48课时",
    students: 5670,
    rating: 4.8,
    reviews: 890,
    category: "量子计算",
    level: "入门",
    tags: ["量子比特", "Qiskit", "量子算法"],
    image: "/quantum-physicist-avatar.jpg",
    isBestseller: false,
    isNew: true,
  },
  {
    id: "c3",
    title: "CRISPR基因编辑技术详解",
    description: "生物科技最前沿技术深度解读，包含实验设计和伦理讨论",
    instructor: { name: "王基因", avatar: "/biologist-avatar.jpg", title: "北大生命科学院副教授" },
    price: 199,
    originalPrice: 399,
    duration: "24课时",
    students: 8900,
    rating: 4.7,
    reviews: 1560,
    category: "生物科技",
    level: "进阶",
    tags: ["CRISPR", "基因编辑", "合成生物学"],
    image: "/biologist-avatar.jpg",
    isBestseller: true,
    isNew: false,
  },
  {
    id: "c4",
    title: "神经形态芯片设计基础",
    description: "类脑计算芯片的设计原理，从脉冲神经网络到硬件实现",
    instructor: { name: "陈芯片", avatar: "/chip-engineer-avatar.jpg", title: "华为海思资深工程师" },
    price: 499,
    originalPrice: 999,
    duration: "40课时",
    students: 3450,
    rating: 4.9,
    reviews: 670,
    category: "芯片半导体",
    level: "高级",
    tags: ["神经形态", "SNN", "芯片设计"],
    image: "/chip-engineer-avatar.jpg",
    isBestseller: false,
    isNew: true,
  },
]

const expertInsights = [
  {
    id: "i1",
    title: "GPT-5会带来什么？深度预测与分析",
    author: { name: "AI研究员", avatar: "/ai-researcher-avatar.jpg" },
    price: 9.9,
    reads: 45000,
    category: "人工智能",
  },
  {
    id: "i2",
    title: "室温超导：希望还是炒作？科学视角解读",
    author: { name: "材料科学家", avatar: "/material-scientist-avatar.jpg" },
    price: 12.9,
    reads: 32000,
    category: "材料科学",
  },
  {
    id: "i3",
    title: "Sora技术架构深度拆解",
    author: { name: "科技编辑", avatar: "/tech-editor-avatar.jpg" },
    price: 19.9,
    reads: 28000,
    category: "人工智能",
  },
]

const Loading = () => null;

export default function CoursesPage() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const searchParams = useSearchParams();

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
            <Badge variant="secondary">学堂</Badge>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              返回首页
            </Link>
            <Link href="/profile">
              <Button size="sm" variant="outline" className="bg-transparent">
                我的课程
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">高能学堂</h1>
          <p className="text-muted-foreground mb-6 max-w-2xl">
            跟随顶尖专家学习前沿科技，从理论到实战，系统掌握各领域核心知识
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索课程或专栏..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              筛选
            </Button>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Expert Insights */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">专家深度解读</h2>
              <p className="text-muted-foreground text-sm">热门词条的专业解析，付费独享</p>
            </div>
            <Link href="/courses/insights">
              <Button variant="ghost" className="gap-1">
                查看全部
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {expertInsights.map((insight) => (
              <Link href={`/courses/insights/${insight.id}`} key={insight.id}>
                <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                  <Badge variant="secondary" className="mb-2">
                    {insight.category}
                  </Badge>
                  <h3 className="font-medium mb-2 line-clamp-2">{insight.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted overflow-hidden relative">
                        <Image src={insight.author.avatar || "/placeholder.svg"} alt={insight.author.name} fill className="object-cover" />
                      </div>
                      <span className="text-sm text-muted-foreground">{insight.author.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-primary font-semibold">¥{insight.price}</span>
                      <p className="text-xs text-muted-foreground">{(insight.reads / 1000).toFixed(1)}k 已读</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Course Categories */}
        <div className="mb-6">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 gap-4">
              {["all", "人工智能", "量子计算", "生物科技", "芯片半导体"].map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3"
                >
                  {cat === "all" ? "全部课程" : cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses
            .filter((c) => activeCategory === "all" || c.category === activeCategory)
            .map((course) => (
              <Link href={`/courses/${course.id}`} key={course.id}>
                <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="relative h-48 bg-muted">
                    <Image src={course.image || "/placeholder.svg"} alt={course.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="h-8 w-8 text-primary ml-1" />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 flex gap-2">
                      {course.isBestseller && (
                        <Badge className="bg-orange-500">畅销</Badge>
                      )}
                      {course.isNew && (
                        <Badge className="bg-green-500">新课</Badge>
                      )}
                    </div>
                    <Badge variant="secondary" className="absolute top-3 right-3">
                      {course.level}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{course.category}</Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    
                    {/* Instructor */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-muted overflow-hidden relative">
                        <Image src={course.instructor.avatar || "/placeholder.svg"} alt={course.instructor.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{course.instructor.name}</p>
                        <p className="text-xs text-muted-foreground">{course.instructor.title}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {(course.students / 1000).toFixed(1)}k
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {course.rating}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary">¥{course.price}</span>
                        <span className="text-sm text-muted-foreground line-through">¥{course.originalPrice}</span>
                      </div>
                      <Button size="sm">立即学习</Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
        </div>

        {/* Features */}
        <section className="mt-16 py-12 bg-muted/30 -mx-4 px-4 rounded-xl">
          <h2 className="text-2xl font-bold text-center mb-8">为什么选择高能学堂？</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Award, title: "顶尖讲师", desc: "行业专家亲授" },
              { icon: Video, title: "高清视频", desc: "支持离线观看" },
              { icon: FileText, title: "配套资料", desc: "代码+课件下载" },
              { icon: BookOpen, title: "终身学习", desc: "一次购买永久有效" },
            ].map((item) => {
              const IconComponent = item.icon
              return (
                <div key={item.title} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>高能学堂 &copy; 2026 高能百科</p>
        </div>
      </footer>
    </div>
  )
}

export { Loading };
