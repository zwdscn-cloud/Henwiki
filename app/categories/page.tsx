"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Cpu,
  Dna,
  Atom,
  Brain,
  Rocket,
  Leaf,
  Globe,
  Wallet,
  Shield,
  Sparkles,
  Search,
  Loader2,
  Bot,
  Car,
  HeartPulse,
  TreePine,
  BarChart3,
  Cloud,
  Network,
  Radio,
  Signal,
  Microscope,
  Plane,
  Waves,
  Sprout,
  DollarSign,
  Stethoscope,
  GraduationCap,
  Utensils,
  Shirt,
  Trophy,
  Building,
} from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiGet } from "@/lib/utils/api"

const iconMap: Record<string, any> = {
  // 原有分类
  ai: Brain,
  biotech: Dna,
  quantum: Atom,
  space: Rocket,
  energy: Leaf,
  semiconductor: Cpu,
  metaverse: Globe,
  blockchain: Wallet,
  security: Shield,
  materials: Sparkles,
  // 新增分类
  robotics: Bot,
  autonomous: Car,
  biomedical: HeartPulse,
  environment: TreePine,
  "data-science": BarChart3,
  "cloud-computing": Cloud,
  "edge-computing": Network,
  iot: Radio,
  telecom: Signal,
  nanotech: Microscope,
  aerospace: Plane,
  marine: Waves,
  agriculture: Sprout,
  fintech: DollarSign,
  healthtech: Stethoscope,
  edtech: GraduationCap,
  foodtech: Utensils,
  fashiontech: Shirt,
  sportstech: Trophy,
  architech: Building,
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [filteredCategories, setFilteredCategories] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCategories(categories)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredCategories(
        categories.filter(
          (cat) =>
            cat.label.toLowerCase().includes(query) ||
            cat.description?.toLowerCase().includes(query) ||
            cat.slug.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, categories])

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const response = await apiGet<{ categories: any[] }>("/categories")
      if (response.data) {
        const mappedCategories = response.data.categories.map((cat) => ({
          ...cat,
          icon: iconMap[cat.slug] || Sparkles,
        }))
        setCategories(mappedCategories)
        setFilteredCategories(mappedCategories)
      }
    } catch (err) {
      console.error("Fetch categories error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageLayout showRightSidebar={false}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">领域分类</h1>
          </div>
          <p className="text-muted-foreground">
            探索所有前沿科技领域，发现你感兴趣的知识领域
          </p>
        </div>

        {/* Search */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索领域..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category) => {
              const IconComponent = category.icon
              return (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}?from=discover`}
                  className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl ${category.color || "bg-primary"} flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      <IconComponent className="h-7 w-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {category.label}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {category.count || 0}
                        </Badge>
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {category.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{category.count || 0} 词条</span>
                        <span>·</span>
                        <span className="group-hover:text-primary transition-colors">
                          查看详情 →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">未找到相关领域</p>
            {searchQuery && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                清除搜索
              </Button>
            )}
          </div>
        )}

        {/* Stats */}
        {!isLoading && categories.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {categories.length}
                </div>
                <div className="text-sm text-muted-foreground">领域总数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {categories.reduce((sum, cat) => sum + (cat.count || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">词条总数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {categories.filter((cat) => (cat.count || 0) > 0).length}
                </div>
                <div className="text-sm text-muted-foreground">活跃领域</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {Math.round(
                    categories.reduce((sum, cat) => sum + (cat.count || 0), 0) /
                      categories.length
                  )}
                </div>
                <div className="text-sm text-muted-foreground">平均词条数</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
