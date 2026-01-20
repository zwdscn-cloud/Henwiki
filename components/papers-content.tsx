"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { PaperCard } from "@/components/paper-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, SlidersHorizontal, FileText, TrendingUp, Clock, Quote, Star, X, Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { apiGet } from "@/lib/utils/api"
import { transformPaper } from "@/lib/utils/data-transform"

type SortOption = "latest" | "citations" | "views" | "likes"

export function PapersContent() {
  const searchParams = useSearchParams()
  const initialTag = searchParams.get("tag") || ""
  const initialCategory = searchParams.get("category") || ""

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedJournal, setSelectedJournal] = useState("")
  const [selectedTag, setSelectedTag] = useState(initialTag)
  const [sortBy, setSortBy] = useState<SortOption>("latest")
  const [showFilters, setShowFilters] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [papers, setPapers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [journals, setJournals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)

  useEffect(() => {
    fetchCategories()
    fetchJournals()
  }, [])

  useEffect(() => {
    if (categories.length > 0) {
      fetchPapers()
    }
  }, [selectedCategory, sortBy, categories])

  const fetchCategories = async () => {
    try {
      const response = await apiGet<{ categories: any[] }>("/categories")
      if (response.data) {
        setCategories(response.data.categories)
        if (selectedCategory) {
          const category = response.data.categories.find((c) => c.slug === selectedCategory)
          if (category) {
            setCategoryId(category.id)
          }
        }
      }
    } catch (error) {
      console.error("Fetch categories error:", error)
    }
  }

  const fetchJournals = async () => {
    // 期刊数据可以从数据库获取，暂时使用空数组
    setJournals([])
  }

  const fetchPapers = async () => {
    setIsLoading(true)
    try {
      let orderBy: "created_at" | "publish_date" | "views" | "citations" = "created_at"
      if (sortBy === "citations") orderBy = "citations"
      else if (sortBy === "views") orderBy = "views"
      else if (sortBy === "latest") orderBy = "publish_date"

      const categoryIdParam = selectedCategory && selectedCategory !== "all" ? categoryId : undefined
      const url = `/papers?status=published&page=1&pageSize=50&orderBy=${orderBy}${
        categoryIdParam ? `&categoryId=${categoryIdParam}` : ""
      }`

      const response = await apiGet<{ papers: any[] }>(url)
      if (response.data) {
        let transformedPapers = response.data.papers.map(transformPaper)

        // 客户端筛选
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          transformedPapers = transformedPapers.filter(
            (paper) =>
              paper.title.toLowerCase().includes(query) ||
              paper.titleCn?.toLowerCase().includes(query) ||
              paper.abstract.toLowerCase().includes(query) ||
              paper.authors.some((a: any) => a.name.toLowerCase().includes(query))
          )
        }

        if (selectedJournal && selectedJournal !== "all") {
          transformedPapers = transformedPapers.filter((paper) => paper.journal === selectedJournal)
        }

        if (selectedTag && selectedTag !== "all") {
          transformedPapers = transformedPapers.filter((paper) => paper.tags.includes(selectedTag))
        }

        setPapers(transformedPapers)
      }
    } catch (error) {
      console.error("Fetch papers error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    papers.forEach((paper) => paper.tags.forEach((tag: string) => tags.add(tag)))
    return Array.from(tags)
  }, [papers])

  const filteredPapers = useMemo(() => {
    return papers
  }, [papers, searchQuery, selectedJournal, selectedTag])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("")
    setSelectedJournal("")
    setSelectedTag("")
    setSortBy("latest")
    setCategoryId(undefined)
  }

  useEffect(() => {
    if (selectedCategory && selectedCategory !== "all") {
      const category = categories.find((c) => c.slug === selectedCategory)
      if (category) {
        setCategoryId(category.id)
      }
    } else {
      setCategoryId(undefined)
    }
  }, [selectedCategory, categories])

  const hasActiveFilters =
    (selectedCategory && selectedCategory !== "all") ||
    (selectedJournal && selectedJournal !== "all") ||
    (selectedTag && selectedTag !== "all")

  const FilterContent = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">领域分类</label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="全部领域" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部领域</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">期刊/会议</label>
        <Select value={selectedJournal} onValueChange={setSelectedJournal}>
          <SelectTrigger>
            <SelectValue placeholder="全部来源" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部来源</SelectItem>
            {journals.map((journal) => (
              <SelectItem key={journal.name} value={journal.name}>
                {journal.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">标签</label>
        <Select value={selectedTag} onValueChange={setSelectedTag}>
          <SelectTrigger>
            <SelectValue placeholder="全部标签" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部标签</SelectItem>
            {allTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">排序</label>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> 最新发布
              </span>
            </SelectItem>
            <SelectItem value="citations">
              <span className="flex items-center gap-2">
                <Quote className="h-4 w-4" /> 引用最多
              </span>
            </SelectItem>
            <SelectItem value="views">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> 热门浏览
              </span>
            </SelectItem>
            <SelectItem value="likes">
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4" /> 最受欢迎
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full bg-transparent">
          清除全部筛选
        </Button>
      )}
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            学术论文库
          </h1>
          <p className="text-sm text-muted-foreground mt-1">收录 {papers.length} 篇前沿领域学术论文</p>
        </div>

        <div className="hidden sm:block">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="bg-transparent">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            筛选
          </Button>
        </div>
        <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="sm:hidden bg-transparent relative">
              <SlidersHorizontal className="h-4 w-4" />
              {hasActiveFilters && <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <SheetHeader>
              <SheetTitle>筛选论文</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索论文标题、作者或关键词..."
          className="pl-9 h-10 sm:h-11 text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Desktop Filters */}
      {showFilters && (
        <div className="hidden sm:block bg-card rounded-lg border border-border p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">领域分类</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="全部领域" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部领域</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">期刊/会议</label>
              <Select value={selectedJournal} onValueChange={setSelectedJournal}>
                <SelectTrigger>
                  <SelectValue placeholder="全部来源" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部来源</SelectItem>
                  {journals.map((journal) => (
                    <SelectItem key={journal.name} value={journal.name}>
                      {journal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">标签</label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger>
                  <SelectValue placeholder="全部标签" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部标签</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">排序</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> 最新发布
                    </span>
                  </SelectItem>
                  <SelectItem value="citations">
                    <span className="flex items-center gap-2">
                      <Quote className="h-4 w-4" /> 引用最多
                    </span>
                  </SelectItem>
                  <SelectItem value="views">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> 热门浏览
                    </span>
                  </SelectItem>
                  <SelectItem value="likes">
                    <span className="flex items-center gap-2">
                      <Star className="h-4 w-4" /> 最受欢迎
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex items-center gap-2 pt-2 border-t border-border flex-wrap">
              <span className="text-sm text-muted-foreground">已选筛选：</span>
              {selectedCategory && selectedCategory !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {categories.find((c) => c.slug === selectedCategory)?.label}
                  <button onClick={() => setSelectedCategory("")} className="ml-1 hover:text-foreground">
                    ×
                  </button>
                </Badge>
              )}
              {selectedJournal && selectedJournal !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {selectedJournal}
                  <button onClick={() => setSelectedJournal("")} className="ml-1 hover:text-foreground">
                    ×
                  </button>
                </Badge>
              )}
              {selectedTag && selectedTag !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {selectedTag}
                  <button onClick={() => setSelectedTag("")} className="ml-1 hover:text-foreground">
                    ×
                  </button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                清除全部
              </Button>
            </div>
          )}
        </div>
      )}

      {hasActiveFilters && (
        <div className="sm:hidden flex items-center gap-2 flex-wrap">
          {selectedCategory && selectedCategory !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {categories.find((c) => c.slug === selectedCategory)?.label}
              <button onClick={() => setSelectedCategory("")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedJournal && selectedJournal !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {selectedJournal}
              <button onClick={() => setSelectedJournal("")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedTag && selectedTag !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {selectedTag}
              <button onClick={() => setSelectedTag("")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="text-xs sm:text-sm text-muted-foreground">共找到 {filteredPapers.length} 篇论文</div>

          {/* Paper List */}
          <div className="space-y-3 sm:space-y-4">
            {filteredPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </div>
        </>
      )}

      {filteredPapers.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">未找到相关论文</h3>
          <p className="text-sm text-muted-foreground">请尝试调整筛选条件或搜索关键词</p>
        </div>
      )}
    </div>
  )
}
