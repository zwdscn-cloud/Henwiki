"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Search, Filter, MoreHorizontal, Eye, Edit, Trash2, CheckCircle, Download, Plus, Loader2 } from "lucide-react"
import { apiGet, apiPut, apiDelete } from "@/lib/utils/api"
import { useRouter } from "next/navigation"

interface Term {
  id: number
  title: string
  summary: string | null
  status: string
  views: number
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
  category_label: string
  category_slug: string
  author_id: number
  author_name: string
  author_avatar: string | null
}

export function TermsContent() {
  const router = useRouter()
  const [terms, setTerms] = useState<Term[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedTerms, setSelectedTerms] = useState<string[]>([])
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
    fetchTerms()
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

  const fetchTerms = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
        status: statusFilter,
        ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await apiGet<{ terms: Term[]; pagination: { total: number } }>(
        `/admin/terms?${params.toString()}`
      )

      if (response.error) {
        console.error("Failed to fetch terms:", response.error)
      } else if (response.data) {
        setTerms(response.data.terms)
        setTotal(response.data.pagination.total)
      }
    } catch (err) {
      console.error("Failed to fetch terms:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const response = await apiPut("/admin/terms", { id, status })
      if (response.error) {
        console.error("Failed to update status:", response.error)
      } else {
        fetchTerms()
      }
    } catch (err) {
      console.error("Failed to update status:", err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个词条吗？")) return

    try {
      const response = await apiDelete(`/admin/terms?id=${id}`)
      if (response.error) {
        console.error("Failed to delete term:", response.error)
      } else {
        fetchTerms()
      }
    } catch (err) {
      console.error("Failed to delete term:", err)
    }
  }

  const toggleSelectAll = () => {
    if (selectedTerms.length === terms.length) {
      setSelectedTerms([])
    } else {
      setSelectedTerms(terms.map((t) => t.id.toString()))
    }
  }

  const toggleSelect = (id: number) => {
    const idStr = id.toString()
    if (selectedTerms.includes(idStr)) {
      setSelectedTerms(selectedTerms.filter((i) => i !== idStr))
    } else {
      setSelectedTerms([...selectedTerms, idStr])
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string, isVerified: boolean) => {
    if (status === "published") {
      return (
        <Badge className={isVerified ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600"}>
          {isVerified ? "已发布(认证)" : "已发布"}
        </Badge>
      )
    } else if (status === "pending") {
      return <Badge variant="secondary">待审核</Badge>
    } else if (status === "rejected") {
      return <Badge className="bg-red-500/10 text-red-600">已拒绝</Badge>
    } else {
      return <Badge variant="outline">草稿</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">词条管理</h1>
          <p className="text-muted-foreground">管理所有百科词条，审核、编辑、删除</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新建词条
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索词条标题、作者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="published">已发布</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
              </SelectContent>
            </Select>
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

      {/* Batch Actions */}
      {selectedTerms.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center justify-between p-4">
            <span className="text-sm">
              已选择 <strong>{selectedTerms.length}</strong> 个词条
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                批量发布
              </Button>
              <Button size="sm" variant="outline" className="text-destructive bg-transparent">
                批量删除
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedTerms([])}>
                取消选择
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Terms Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={selectedTerms.length === terms.length && terms.length > 0} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead>词条</TableHead>
                <TableHead>作者</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>数据</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : terms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    暂无词条数据
                  </TableCell>
                </TableRow>
              ) : (
                terms.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell>
                      <Checkbox checked={selectedTerms.includes(term.id.toString())} onCheckedChange={() => toggleSelect(term.id)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{term.title}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">{term.summary || "无简介"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={term.author_avatar || "/placeholder-user.jpg"} />
                          <AvatarFallback>{term.author_name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{term.author_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{term.category_label}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(term.status, false)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{term.views.toLocaleString()} 浏览</span>
                        <span>{term.likes_count} 赞</span>
                        <span>{term.comments_count} 评论</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(term.updated_at)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/term/${term.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            查看
                          </DropdownMenuItem>
                          {term.status === "pending" && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(term.id, "published")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                通过审核
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(term.id, "rejected")}>
                                拒绝审核
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(term.id)}>
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
          共 {total} 条词条，第 {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} 条
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
