"use client"

import { useState, useEffect } from "react"
import { FolderPlus, Loader2, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiGet, apiPost } from "@/lib/utils/api"
import { useToast } from "@/hooks/use-toast"

interface Folder {
  id: string
  name: string
  count: number
}

interface BookmarkFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (folderName: string) => void
  currentFolder?: string
}

export function BookmarkFolderDialog({
  open,
  onOpenChange,
  onSelect,
  currentFolder = "default",
}: BookmarkFolderDialogProps) {
  const { toast } = useToast()
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [showCreateInput, setShowCreateInput] = useState(false)

  useEffect(() => {
    if (open) {
      fetchFolders()
    }
  }, [open])

  const fetchFolders = async () => {
    setIsLoading(true)
    try {
      const response = await apiGet<{ folders: Folder[] }>("/bookmarks/folders")
      if (response.data) {
        setFolders(response.data.folders || [])
      }
    } catch (error) {
      console.error("Fetch folders error:", error)
    } finally {
      setIsLoading(false)
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

    setIsCreating(true)
    try {
      const response = await apiPost<{ folder: Folder }>("/bookmarks/folders", {
        folderName: newFolderName.trim(),
      })

      if (response.data) {
        // 将新创建的收藏夹添加到列表（即使它还没有收藏记录）
        const newFolder = response.data.folder
        const updatedFolders = [...folders, newFolder].sort((a, b) => {
          // 默认收藏夹排在第一位
          if (a.id === "default") return -1
          if (b.id === "default") return 1
          return a.name.localeCompare(b.name)
        })
        setFolders(updatedFolders)
        setNewFolderName("")
        setShowCreateInput(false)
        toast({
          title: "收藏夹创建成功",
        })
        // 自动选择新创建的收藏夹
        setTimeout(() => {
          handleSelectFolder(newFolder.id)
        }, 100)
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
      setIsCreating(false)
    }
  }

  const handleSelectFolder = (folderId: string) => {
    // 处理"全部收藏"的情况
    let folderName = folderId
    if (folderId === "all" || folderId === "default") {
      folderName = "default"
    }
    onSelect(folderName)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>选择收藏夹</DialogTitle>
          <DialogDescription>选择要将内容添加到的收藏夹</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 创建新收藏夹 */}
          {showCreateInput ? (
            <div className="flex gap-2">
              <Input
                placeholder="输入收藏夹名称"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateFolder()
                  } else if (e.key === "Escape") {
                    setShowCreateInput(false)
                    setNewFolderName("")
                  }
                }}
                autoFocus
                maxLength={50}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateInput(false)
                  setNewFolderName("")
                }}
              >
                取消
              </Button>
              <Button onClick={handleCreateFolder} disabled={isCreating || !newFolderName.trim()}>
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "创建"}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowCreateInput(true)}
            >
              <FolderPlus className="h-4 w-4" />
              新建收藏夹
            </Button>
          )}

          {/* 收藏夹列表 */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {folders.map((folder) => {
                  const isSelected = currentFolder === folder.id || 
                    (currentFolder === "default" && folder.id === "default") ||
                    (!currentFolder && folder.id === "default")
                  
                  return (
                    <button
                      key={folder.id}
                      onClick={() => handleSelectFolder(folder.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{folder.name}</span>
                        <span className={`text-xs ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          ({folder.count})
                        </span>
                      </div>
                      {isSelected && <Check className="h-4 w-4" />}
                    </button>
                  )
                })}
                {folders.length === 0 && !isLoading && !showCreateInput && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    暂无收藏夹，请先创建一个
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
