"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
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
  TrendingUp,
  Clock,
  Bookmark,
  Plus,
  FileText,
  Upload,
  Users,
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
  ChevronDown,
  ChevronRight,
  FolderOpen,
  MoreHorizontal,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { apiGet, apiPost, apiDelete, apiPut } from "@/lib/utils/api"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

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

const quickLinks = [
  { label: "热门词条", href: "/trending", icon: TrendingUp },
  { label: "最新收录", href: "/latest", icon: Clock },
  { label: "关注动态", href: "/following", icon: Users },
]

const paperLinks = [
  { label: "论文库", href: "/papers", icon: FileText },
  { label: "提交论文", href: "/papers/submit", icon: Upload },
]

export function LeftSidebar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [followedCategories, setFollowedCategories] = useState<any[]>([])
  const [bookmarkFolders, setBookmarkFolders] = useState<any[]>([])
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<any>(null)
  const [renameFolderName, setRenameFolderName] = useState("")
  const [isRenamingFolder, setIsRenamingFolder] = useState(false)
  const [isDeletingFolder, setIsDeletingFolder] = useState(false)

  useEffect(() => {
    if (user) {
      fetchFollowedCategories()
      fetchBookmarkFolders()
    }
  }, [user, user?.specialties])

  // 如果当前在收藏页面，自动展开收藏夹菜单
  useEffect(() => {
    if (pathname === "/bookmarks") {
      setIsBookmarksOpen(true)
    }
  }, [pathname])

  const fetchFollowedCategories = async () => {
    if (!user || !user.specialties || user.specialties.length === 0) {
      setFollowedCategories([])
      return
    }

    try {
      const response = await apiGet<{ categories: any[] }>("/categories")
      if (response.data) {
        const followed = response.data.categories
          .filter((cat) => user.specialties.includes(cat.slug))
          .map((cat) => ({
            label: cat.label,
            href: `/category/${cat.slug}`,
            icon: iconMap[cat.slug] || Sparkles,
            count: cat.count || 0,
          }))
        setFollowedCategories(followed)
      }
    } catch (err) {
      console.error("Fetch followed categories error:", err)
    }
  }

  const fetchBookmarkFolders = async () => {
    if (!user) return

    try {
      const response = await apiGet<{ folders: any[] }>("/bookmarks/folders")
      if (response.data) {
        const folders = response.data.folders || []
        let totalCount = folders.reduce((sum, f) => sum + f.count, 0)
        setBookmarkFolders([
          { id: "all", name: "全部收藏", count: totalCount },
          ...folders,
        ])
      }
    } catch (err) {
      console.error("Fetch bookmark folders error:", err)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "请输入收藏夹名称",
        variant: "destructive",
      })
      return
    }

    setIsCreatingFolder(true)
    try {
      const response = await apiPost<{ folder: any }>("/bookmarks/folders", {
        folderName: newFolderName.trim(),
      })

      if (response.data) {
        toast({
          title: "收藏夹创建成功",
        })
        setNewFolderName("")
        setCreateFolderDialogOpen(false)
        fetchBookmarkFolders()
      } else if (response.error) {
        toast({
          title: "创建失败",
          description: response.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "创建失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const handleRenameFolder = (folder: any) => {
    if (folder.id === "all" || folder.id === "default") {
      toast({
        title: "不能重命名默认收藏夹",
        variant: "destructive",
      })
      return
    }
    setSelectedFolder(folder)
    setRenameFolderName(folder.name)
    setRenameDialogOpen(true)
  }

  const handleConfirmRenameFolder = async () => {
    if (!selectedFolder || !renameFolderName.trim()) {
      toast({
        title: "请输入收藏夹名称",
        variant: "destructive",
      })
      return
    }

    setIsRenamingFolder(true)
    try {
      const response = await apiPut<{ message: string }>("/bookmarks/folders", {
        oldFolderName: selectedFolder.id,
        newFolderName: renameFolderName.trim(),
      })

      if (response.data || !response.error) {
        toast({
          title: "重命名成功",
        })
        setRenameDialogOpen(false)
        setSelectedFolder(null)
        setRenameFolderName("")
        fetchBookmarkFolders()
      } else {
        toast({
          title: "重命名失败",
          description: response.error || "操作失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "重命名失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsRenamingFolder(false)
    }
  }

  const handleDeleteFolder = (folder: any) => {
    if (folder.id === "all" || folder.id === "default") {
      toast({
        title: "不能删除默认收藏夹",
        variant: "destructive",
      })
      return
    }
    setSelectedFolder(folder)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDeleteFolder = async () => {
    if (!selectedFolder) return

    setIsDeletingFolder(true)
    try {
      const response = await apiDelete<{ message: string }>(
        `/bookmarks/folders?folderName=${encodeURIComponent(selectedFolder.id)}`
      )

      if (response.data || !response.error) {
        toast({
          title: "收藏夹已删除",
          description: "收藏已移动到默认收藏夹",
        })
        setDeleteDialogOpen(false)
        setSelectedFolder(null)
        fetchBookmarkFolders()
      } else {
        toast({
          title: "删除失败",
          description: response.error || "操作失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "删除失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsDeletingFolder(false)
    }
  }

  const getBookmarkFolderHref = (folderId: string) => {
    if (folderId === "all") {
      return "/bookmarks"
    }
    return `/bookmarks?folder=${encodeURIComponent(folderId)}`
  }

  const currentFolder = searchParams?.get("folder") || "all"

  return (
    <div className="sticky top-20 space-y-6">
      {/* Quick Links */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="space-y-1">
          {quickLinks.map((item) => {
            const IconComponent = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <IconComponent className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}

          {/* 我的收藏 - 可展开 */}
          {user && (
            <Collapsible open={isBookmarksOpen} onOpenChange={setIsBookmarksOpen}>
              <CollapsibleTrigger className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                <Bookmark className="h-4 w-4" />
                <span className="flex-1 text-left">我的收藏</span>
                {isBookmarksOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1 ml-7 space-y-1">
                  {bookmarkFolders.length > 0 ? (
                    bookmarkFolders.map((folder) => {
                      const isActive = currentFolder === folder.id || (currentFolder === "all" && folder.id === "all")
                      return (
                        <div
                          key={folder.id}
                          className={`group relative flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          <Link
                            href={getBookmarkFolderHref(folder.id)}
                            className="flex-1 flex items-center justify-between min-w-0"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate text-xs">{folder.name}</span>
                            </span>
                            <span className="text-xs ml-2 shrink-0">{folder.count}</span>
                          </Link>
                          {folder.id !== "all" && folder.id !== "default" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity ${
                                    isActive ? "text-primary hover:bg-primary/20" : ""
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleRenameFolder(folder)}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  重命名
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteFolder(folder)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  删除收藏夹
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">暂无收藏夹</div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setCreateFolderDialogOpen(true)
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    新建收藏夹
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* 未登录时显示我的收藏链接 */}
          {!user && (
            <Link
              href="/bookmarks"
              className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <Bookmark className="h-4 w-4" />
              我的收藏
            </Link>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-foreground">学术论文</h3>
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-1">
          {paperLinks.map((item) => {
            const IconComponent = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <IconComponent className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-foreground">领域分类</h3>
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-1">
          {user ? (
            followedCategories.length > 0 ? (
              followedCategories.map((item) => {
                const IconComponent = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors group"
                  >
                    <span className="flex items-center gap-3">
                      <IconComponent className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground/60">{item.count}</span>
                  </Link>
                )
              })
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                还没有关注的领域
              </div>
            )
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              请先登录
            </div>
          )}
        </div>
        {user && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-muted-foreground"
            asChild
          >
            <Link href="/categories">
              <Plus className="h-4 w-4 mr-2" />
              关注更多领域
            </Link>
          </Button>
        )}
      </div>

      {/* Footer Links */}
      <div className="px-4 text-xs text-muted-foreground/60 space-y-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link href="/about" className="hover:text-muted-foreground">
            关于
          </Link>
          <Link href="/terms-of-service" className="hover:text-muted-foreground">
            条款
          </Link>
          <Link href="/privacy" className="hover:text-muted-foreground">
            隐私
          </Link>
          <Link href="/help" className="hover:text-muted-foreground">
            帮助
          </Link>
        </div>
        <p>© 2026 高能百科</p>
      </div>

      {/* 创建收藏夹对话框 */}
      <Dialog open={createFolderDialogOpen} onOpenChange={(open) => {
        setCreateFolderDialogOpen(open)
        if (!open) {
          setNewFolderName("")
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建收藏夹</DialogTitle>
            <DialogDescription>为你的收藏创建一个新的分类</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="输入收藏夹名称"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFolderName.trim()) {
                  handleCreateFolder()
                }
              }}
              autoFocus
              maxLength={50}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCreateFolderDialogOpen(false)
                setNewFolderName("")
              }}
            >
              取消
            </Button>
            <Button 
              onClick={handleCreateFolder} 
              disabled={isCreatingFolder || !newFolderName.trim()}
            >
              {isCreatingFolder ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重命名收藏夹对话框 */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>重命名收藏夹</DialogTitle>
            <DialogDescription>输入新的收藏夹名称</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="输入收藏夹名称"
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirmRenameFolder()
                }
              }}
              autoFocus
              maxLength={50}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmRenameFolder} disabled={isRenamingFolder || !renameFolderName.trim()}>
              {isRenamingFolder ? "重命名中..." : "确定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除收藏夹确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>删除收藏夹</DialogTitle>
            <DialogDescription>
              确定要删除收藏夹 "{selectedFolder?.name}" 吗？该收藏夹中的所有收藏将移动到默认收藏夹。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteFolder} disabled={isDeletingFolder}>
              {isDeletingFolder ? "删除中..." : "删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
