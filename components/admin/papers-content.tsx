"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Download, Plus, ExternalLink, Star, Loader2 } from "lucide-react"
import { apiGet, apiPut, apiDelete } from "@/lib/utils/api"
import { useRouter } from "next/navigation"

interface Paper {
  id: number
  title: string
  title_cn: string | null
  abstract: string | null
  status: string
  views: number
  downloads: number
  likes_count: number
  citations: number
  journal: string | null
  publish_date: string | null
  created_at: string
  updated_at: string
  category_label: string
  category_slug: string
  author_id: number
  author_name: string
  author_avatar: string | null
  authors: Array<{ name: string; affiliation: string | null }>
  is_highlighted?: boolean
}

export function PapersContent() {
  const router = useRouter()
  const [papers, setPapers] = useState<Paper[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedPapers, setSelectedPapers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchPapers()
  }, [page, statusFilter, categoryFilter, searchQuery])

  const fetchCategories = async () => {
    try {
      const response = await apiGet<{ categories: any[] }>("/categories")
      if (response.data) {
        setCategories(response.data.categories)
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err)
    }
  }

  const fetchPapers = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
        status: statusFilter,
        ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await apiGet<{ papers: Paper[]; pagination: { total: number } }>(
        `/admin/papers?${params.toString()}`
      )

      if (response.error) {
        console.error("Failed to fetch papers:", response.error)
      } else if (response.data) {
        setPapers(response.data.papers)
        setTotal(response.data.pagination.total)
      }
    } catch (err) {
      console.error("Failed to fetch papers:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const response = await apiPut("/admin/papers", { id, status })
      if (response.error) {
        console.error("Failed to update status:", response.error)
      } else {
        fetchPapers()
      }
    } catch (err) {
      console.error("Failed to update status:", err)
    }
  }

  const handleHighlight = async (id: number, isHighlighted: boolean) => {
    try {
      const response = await apiPut("/admin/papers", { id, isHighlighted })
      if (response.error) {
        console.error("Failed to update highlight:", response.error)
      } else {
        fetchPapers()
      }
    } catch (err) {
      console.error("Failed to update highlight:", err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这篇论文吗？")) return

    try {
      const response = await apiDelete(`/admin/papers?id=${id}`)
      if (response.error) {
        console.error("Failed to delete paper:", response.error)
      } else {
        fetchPapers()
      }
    } catch (err) {
      console.error("Failed to delete paper:", err)
    }
  }

  const toggleSelectAll = () => {
    if (selectedPapers.length === papers.length) {
      setSelectedPapers([])
    } else {
      setSelectedPapers(papers.map((p) => p.id.toString()))
    }
  }

  const toggleSelect = (id: number) => {
    const idStr = id.toString()
    if (selectedPapers.includes(idStr)) {
      setSelectedPapers(selectedPapers.filter((i) => i !== idStr))
    } else {
      setSelectedPapers([...selectedPapers, idStr])
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "未设置"
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">论文管理</h1>
          <p className="text-muted-foreground">管理所有学术论文，审核、编辑、推荐</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          添加论文
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索论文标题、作者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="published">已发布</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="期刊" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部期刊</SelectItem>
                <SelectItem value="nature">Nature</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="neurips">NeurIPS</SelectItem>
                <SelectItem value="arxiv">arXiv</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              导出
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Papers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={selectedPapers.length === papers.length && papers.length > 0} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead>论文</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>期刊</TableHead>
                <TableHead>数据</TableHead>
                <TableHead>发布日期</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : papers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    暂无论文数据
                  </TableCell>
                </TableRow>
              ) : (
                papers.map((paper) => (
                <TableRow key={paper.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPapers.includes(paper.id.toString())}
                        onCheckedChange={() => toggleSelect(paper.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium line-clamp-1 max-w-[350px]">{paper.title}</span>
                          {paper.is_highlighted && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {paper.authors
                            .slice(0, 3)
                            .map((a) => a.name)
                            .join(", ")}
                          {paper.authors.length > 3 && ` 等 ${paper.authors.length} 人`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{paper.category_label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{paper.journal || "未设置"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{paper.citations.toLocaleString()} 引用</span>
                        <span>{paper.views.toLocaleString()} 浏览</span>
                        <span>{paper.downloads.toLocaleString()} 下载</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(paper.publish_date)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/papers/${paper.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            查看详情
                          </DropdownMenuItem>
                          {paper.status === "pending" && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(paper.id, "published")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                通过审核
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(paper.id, "rejected")}>
                                拒绝审核
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => handleHighlight(paper.id, !paper.is_highlighted)}>
                            <Star className="mr-2 h-4 w-4" />
                            {paper.is_highlighted ? "取消推荐" : "设为推荐"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(paper.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 {total} 篇论文，第 {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} 篇
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            上一页
          </Button>
          {Array.from({ length: Math.ceil(total / 20) }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === Math.ceil(total / 20) || Math.abs(p - page) <= 1)
            .map((p, idx, arr) => (
              <div key={p} className="flex items-center gap-2">
                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-muted-foreground">...</span>}
                <Button
                  variant="outline"
                  size="sm"
                  className={p === page ? "bg-primary text-primary-foreground" : ""}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              </div>
            ))}
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}
