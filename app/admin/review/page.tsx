"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, Clock, FileText, BookOpen, Eye, AlertTriangle, Loader2 } from "lucide-react"
import { apiGet, apiPost } from "@/lib/utils/api"
import { useRouter, useSearchParams } from "next/navigation"

interface PendingItem {
  id: string
  type: "term" | "paper"
  title: string
  summary?: string
  content?: string
  journal?: string
  category: string
  author: {
    name: string
    avatar: string
  }
  submittedAt: string
  wordCount?: number
}

function AdminReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("terms")
  const [statusFilter, setStatusFilter] = useState<"pending" | "rejected">("pending")
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    // 从 URL 参数中读取 type 和 view
    const typeParam = searchParams.get("type")
    if (typeParam === "terms" || typeParam === "papers") {
      setActiveTab(typeParam)
    }
  }, [searchParams])

  useEffect(() => {
    fetchPendingItems()
  }, [activeTab, statusFilter])

  // 当数据加载完成后，检查是否需要自动打开预览
  useEffect(() => {
    if (!isLoading && pendingItems.length > 0) {
      const viewId = searchParams.get("view")
      if (viewId) {
        const item = pendingItems.find((item) => item.id === viewId)
        if (item) {
          setSelectedItem(item)
          setPreviewOpen(true)
          // 清除 URL 参数
          router.replace("/admin/review", { scroll: false })
        }
      }
    }
  }, [isLoading, pendingItems, searchParams, router])

  const fetchPendingItems = async () => {
    setIsLoading(true)
    try {
      const type = activeTab === "terms" ? "term" : activeTab === "papers" ? "paper" : "all"
      const response = await apiGet<{ items: PendingItem[] }>(`/admin/review?type=${type}&status=${statusFilter}&limit=50`)

      if (response.error) {
        console.error("Failed to fetch items:", response.error)
      } else if (response.data) {
        setPendingItems(response.data.items)
      }
    } catch (err) {
      console.error("Failed to fetch items:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (item: PendingItem) => {
    try {
      const response = await apiPost("/admin/review", {
        id: item.id,
        type: item.type,
        action: "approve",
      })

      if (response.error) {
        console.error("Failed to approve:", response.error)
        alert("审核失败：" + response.error)
      } else {
        fetchPendingItems()
      }
    } catch (err) {
      console.error("Failed to approve:", err)
      alert("审核失败")
    }
  }

  const handleReject = async (item: PendingItem) => {
    if (!rejectReason.trim()) {
      alert("请填写拒绝原因")
      return
    }

    try {
      const response = await apiPost("/admin/review", {
        id: item.id,
        type: item.type,
        action: "reject",
        reason: rejectReason,
      })

      if (response.error) {
        console.error("Failed to reject:", response.error)
        alert("拒绝失败：" + response.error)
      } else {
        setRejectOpen(false)
        setRejectReason("")
        fetchPendingItems()
      }
    } catch (err) {
      console.error("Failed to reject:", err)
      alert("拒绝失败")
    }
  }

  const terms = pendingItems.filter((item) => item.type === "term")
  const papers = pendingItems.filter((item) => item.type === "paper")

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">审核中心</h1>
          <p className="text-muted-foreground">审核用户提交的词条和论文</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <Button
          variant={statusFilter === "pending" ? "default" : "outline"}
          onClick={() => setStatusFilter("pending")}
        >
          <Clock className="mr-2 h-4 w-4" />
          待审核
        </Button>
        <Button
          variant={statusFilter === "rejected" ? "default" : "outline"}
          onClick={() => setStatusFilter("rejected")}
        >
          <XCircle className="mr-2 h-4 w-4" />
          已拒绝
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`rounded-lg p-2.5 ${statusFilter === "pending" ? "bg-yellow-500/10" : "bg-red-500/10"}`}>
              {statusFilter === "pending" ? (
                <Clock className={`h-5 w-5 ${statusFilter === "pending" ? "text-yellow-500" : "text-red-500"}`} />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingItems.length}</p>
              <p className="text-sm text-muted-foreground">{statusFilter === "pending" ? "待审核总数" : "已拒绝总数"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{terms.length}</p>
              <p className="text-sm text-muted-foreground">{statusFilter === "pending" ? "待审核词条" : "已拒绝词条"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-green-500/10 p-2.5">
              <BookOpen className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{papers.length}</p>
              <p className="text-sm text-muted-foreground">{statusFilter === "pending" ? "待审核论文" : "已拒绝论文"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Queue */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="terms" className="gap-2">
            <FileText className="h-4 w-4" />
            词条
            <Badge variant="secondary">{terms.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="papers" className="gap-2">
            <BookOpen className="h-4 w-4" />
            论文
            <Badge variant="secondary">{papers.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terms" className="mt-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : terms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {statusFilter === "pending" ? "暂无待审核词条" : "暂无已拒绝词条"}
            </div>
          ) : (
            terms.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={item.author.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{item.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <Badge variant="outline">{item.category}</Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{item.author.name}</span>
                        <span>·</span>
                        <span>{item.submittedAt}</span>
                        <span>·</span>
                        <span>{item.wordCount} 字</span>
                      </div>
                      <p className="mt-3 text-muted-foreground line-clamp-2">{item.summary}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item)
                        setPreviewOpen(true)
                      }}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      预览
                    </Button>
                    {statusFilter === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(item)}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          通过
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 bg-transparent"
                          onClick={() => {
                            setSelectedItem(item)
                            setRejectOpen(true)
                          }}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          拒绝
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="papers" className="mt-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : papers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {statusFilter === "pending" ? "暂无待审核论文" : "暂无已拒绝论文"}
            </div>
          ) : (
            papers.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={item.author.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{item.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <Badge variant="outline">{item.category}</Badge>
                        <Badge variant="secondary">{item.journal}</Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{item.author.name}</span>
                        <span>·</span>
                        <span>{item.submittedAt}</span>
                      </div>
                      <p className="mt-3 text-muted-foreground line-clamp-2">{item.summary}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item)
                        setPreviewOpen(true)
                      }}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      查看
                    </Button>
                    {statusFilter === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(item)}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          通过
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 bg-transparent"
                          onClick={() => {
                            setSelectedItem(item)
                            setRejectOpen(true)
                          }}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          拒绝
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {selectedItem?.type === "term" ? "词条详情" : "论文详情"}
            </DialogTitle>
            <DialogDescription>
              查看待审核内容的完整信息
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedItem.author.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{selectedItem.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold">{selectedItem.title}</h2>
                      <Badge variant="outline">{selectedItem.category}</Badge>
                      {selectedItem.journal && (
                        <Badge variant="secondary">{selectedItem.journal}</Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <span>作者：{selectedItem.author.name}</span>
                      <span>·</span>
                      <span>提交时间：{selectedItem.submittedAt}</span>
                      {selectedItem.wordCount && (
                        <>
                          <span>·</span>
                          <span>{selectedItem.wordCount} 字</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 摘要 */}
              {selectedItem.summary && (
                <div className="space-y-2">
                  <h3 className="font-semibold">摘要</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedItem.summary}</p>
                </div>
              )}

              {/* 内容 */}
              {selectedItem.content && (
                <div className="space-y-2">
                  <h3 className="font-semibold">内容</h3>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    <div className="whitespace-pre-wrap">{selectedItem.content}</div>
                  </div>
                </div>
              )}

              {/* 论文摘要 */}
              {selectedItem.type === "paper" && selectedItem.summary && !selectedItem.content && (
                <div className="space-y-2">
                  <h3 className="font-semibold">摘要</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedItem.summary}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:gap-0">
            {statusFilter === "pending" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedItem) {
                      setPreviewOpen(false)
                      setSelectedItem(selectedItem)
                      setRejectOpen(true)
                    }
                  }}
                  className="flex-1 sm:flex-initial"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  拒绝审核
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial"
                  onClick={() => {
                    if (selectedItem) {
                      setPreviewOpen(false)
                      handleApprove(selectedItem)
                    }
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  通过审核
                </Button>
              </>
            )}
            {statusFilter === "rejected" && (
              <Button
                variant="outline"
                onClick={() => setPreviewOpen(false)}
                className="flex-1 sm:flex-initial"
              >
                关闭
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              拒绝审核
            </DialogTitle>
            <DialogDescription>请填写拒绝原因，该内容将退回给作者修改。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">拒绝原因</label>
              <Textarea
                className="mt-1.5"
                placeholder="请详细说明拒绝的原因，以便作者了解如何改进..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectReason("内容质量不达标，缺乏专业性和准确性")}>
                质量不达标
              </Button>
              <Button variant="outline" size="sm" onClick={() => setRejectReason("内容与现有词条重复")}>
                内容重复
              </Button>
              <Button variant="outline" size="sm" onClick={() => setRejectReason("缺少必要的参考文献和引用来源")}>
                缺少引用
              </Button>
              <Button variant="outline" size="sm" onClick={() => setRejectReason("格式不规范，请按照词条模板重新编辑")}>
                格式问题
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedItem) {
                  handleReject(selectedItem)
                }
              }}
            >
              确认拒绝
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 包装组件以支持 Suspense
export default function AdminReviewPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4">加载中...</div>}>
      <AdminReviewPage />
    </Suspense>
  )
}
