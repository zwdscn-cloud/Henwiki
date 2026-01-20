"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, CheckCircle, XCircle, Flag, MessageSquare, AlertTriangle, Trash2, Eye, Loader2 } from "lucide-react"
import { apiGet, apiDelete } from "@/lib/utils/api"
import { useRouter } from "next/navigation"

interface Comment {
  id: number
  content: string
  likes_count: number
  created_at: string
  updated_at: string
  term_id: number | null
  author_id: number
  author_name: string
  author_avatar: string | null
  term_title: string | null
}

export function CommentsContent() {
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchComments()
  }, [page, searchQuery])

  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await apiGet<{ comments: Comment[]; pagination: { total: number } }>(
        `/admin/comments?${params.toString()}`
      )

      if (response.error) {
        console.error("Failed to fetch comments:", response.error)
      } else if (response.data) {
        setComments(response.data.comments)
        setTotal(response.data.pagination.total)
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这条评论吗？")) return

    try {
      const response = await apiDelete(`/admin/comments?id=${id}`)
      if (response.error) {
        console.error("Failed to delete comment:", response.error)
      } else {
        fetchComments()
      }
    } catch (err) {
      console.error("Failed to delete comment:", err)
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else {
      return `${days}天前`
    }
  }

  const filteredComments = comments

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">评论管理</h1>
          <p className="text-muted-foreground">审核和管理用户评论，处理举报</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{total.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">总评论数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-yellow-500/10 p-2.5">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">待审核</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-orange-500/10 p-2.5">
              <Flag className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">被举报</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-red-500/10 p-2.5">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">已拒绝</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索评论内容、用户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="内容类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="term">词条评论</SelectItem>
                <SelectItem value="paper">论文评论</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="pending">待审核</TabsTrigger>
          <TabsTrigger value="reported">被举报</TabsTrigger>
          <TabsTrigger value="approved">已通过</TabsTrigger>
          <TabsTrigger value="rejected">已拒绝</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">暂无评论数据</div>
            ) : (
              filteredComments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={comment.author_avatar || "/placeholder-user.jpg"} />
                          <AvatarFallback>{comment.author_name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{comment.author_name}</span>
                            <Badge className="bg-green-500/10 text-green-600">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              已通过
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            评论于 <span className="font-medium text-foreground">{comment.term_title || "未知词条"}</span> ·{" "}
                            {formatRelativeTime(comment.created_at)}
                          </p>
                          <p className="mt-2">{comment.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => router.push(`/term/${comment.term_id}`)}>
                          <Eye className="mr-1 h-4 w-4" />
                          查看
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-red-50 bg-transparent"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          删除
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
