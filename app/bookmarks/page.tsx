"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Bookmark, FolderPlus, MoreHorizontal, Trash2, Loader2 } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { TermCard } from "@/components/term-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BookmarkFolderDialog } from "@/components/bookmark-folder-dialog"
import { apiGet, apiDelete, apiPost } from "@/lib/utils/api"
import { transformTerm } from "@/lib/utils/data-transform"
import { useToast } from "@/hooks/use-toast"

export default function BookmarksPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [activeFolder, setActiveFolder] = useState("all")
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [selectedBookmark, setSelectedBookmark] = useState<any>(null)

  // 从URL参数读取当前收藏夹
  useEffect(() => {
    const folder = searchParams?.get("folder") || "all"
    setActiveFolder(folder)
  }, [searchParams])

  useEffect(() => {
    if (activeFolder) {
      fetchBookmarks()
    }
  }, [activeFolder])

  const fetchBookmarks = async () => {
    setIsLoading(true)
    try {
      // 获取收藏列表
      const params = new URLSearchParams()
      if (activeFolder !== "all") {
        params.append("folder", activeFolder)
      }

      const response = await apiGet<{ items: any[] }>(`/bookmarks?${params.toString()}`)
      if (response.data) {
        setBookmarks(response.data.items || [])
      }
    } catch (err) {
      console.error("Fetch bookmarks error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBookmark = async (bookmarkId: string, targetType: string, targetId: string) => {
    try {
      await apiDelete(`/bookmarks?id=${bookmarkId}`)
      setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId))
      toast({
        title: "已取消收藏",
      })
      // 刷新收藏列表
      fetchBookmarks()
    } catch (err) {
      console.error("Delete bookmark error:", err)
      toast({
        title: "操作失败",
        description: "取消收藏失败",
        variant: "destructive",
      })
    }
  }

  const handleMoveToFolder = (bookmark: any) => {
    setSelectedBookmark(bookmark)
    setMoveDialogOpen(true)
  }

  const handleSelectMoveFolder = async (folderName: string) => {
    if (!selectedBookmark) return

    try {
      // 先删除原收藏
      await apiDelete(`/bookmarks?id=${selectedBookmark.id}`)
      // 添加到新收藏夹
      const response = await apiPost(`/bookmarks`, {
        targetType: selectedBookmark.type,
        targetId: selectedBookmark.term?.id || selectedBookmark.paper?.id,
        folderName: folderName,
      })

      if (response.data || !response.error) {
        toast({
          title: "移动成功",
        })
        setMoveDialogOpen(false)
        setSelectedBookmark(null)
        // 刷新收藏列表
        fetchBookmarks()
      } else {
        toast({
          title: "移动失败",
          description: response.error || "操作失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "移动失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    }
  }


  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Bookmark className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">我的收藏</h1>
          </div>
          <p className="text-muted-foreground">在左侧导航栏中选择收藏夹查看内容</p>
        </div>

        {/* Bookmarks List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bookmarks.length > 0 ? (
            bookmarks
              .filter((item) => item.type === "term")
              .map((item) => (
                <div key={item.id} className="relative">
                  <TermCard term={item.term} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleMoveToFolder(item)}>
                        <FolderPlus className="h-4 w-4 mr-2" />
                        移动到收藏夹
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteBookmark(item.id, item.type, item.term.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        取消收藏
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
          ) : (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <Bookmark className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">暂无收藏</h3>
              <p className="text-sm text-muted-foreground">浏览词条时点击收藏按钮添加到这里</p>
            </div>
          )}
        </div>
      </div>

      {/* 移动收藏对话框 */}
      <BookmarkFolderDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        onSelect={handleSelectMoveFolder}
        currentFolder={selectedBookmark?.folder || "default"}
      />
    </PageLayout>
  )
}
