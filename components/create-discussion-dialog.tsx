"use client"

import { useState, useEffect } from "react"
import { MessageSquare, X, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiGet, apiPost } from "@/lib/utils/api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface CreateDiscussionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateDiscussionDialog({ open, onOpenChange }: CreateDiscussionDialogProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [open])

  const fetchCategories = async () => {
    setIsLoadingCategories(true)
    try {
      const response = await apiGet<{ categories: any[] }>("/categories")
      if (response.data) {
        setCategories(response.data.categories)
      }
    } catch (err) {
      console.error("Fetch categories error:", err)
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      router.push("/login?redirect=/community")
      return
    }

    if (!title.trim()) {
      toast({
        title: "请输入标题",
        variant: "destructive",
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "请输入内容",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await apiPost<{ discussionId: number }>("/discussions", {
        title: title.trim(),
        content: content.trim(),
        categoryId: (categoryId && categoryId !== "none") ? categoryId : undefined,
        tags: tags,
      })

      if (response.data) {
        toast({
          title: "讨论创建成功",
        })
        // 重置表单
        setTitle("")
        setContent("")
        setCategoryId("")
        setTags([])
        setTagInput("")
        onOpenChange(false)
        // 刷新页面或跳转到新讨论
        router.push(`/community/discussion/${response.data.discussionId}`)
        router.refresh()
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
      setIsLoading(false)
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            发起讨论
          </DialogTitle>
          <DialogDescription>分享你的想法，与社区成员交流前沿科技话题</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 标题 */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">标题 *</label>
            <Input
              placeholder="输入讨论标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">{title.length}/200</p>
          </div>

          {/* 分类 */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">分类（可选）</label>
            <Select value={categoryId || undefined} onValueChange={setCategoryId} disabled={isLoadingCategories}>
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不选择分类</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 内容 */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">内容 *</label>
            <Textarea
              placeholder="详细描述你的问题或观点..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] resize-none"
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground mt-1">{content.length}/5000</p>
          </div>

          {/* 标签 */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">标签（可选，最多5个）</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="输入标签后按回车添加"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                maxLength={20}
                disabled={tags.length >= 5}
              />
              <Button type="button" variant="outline" onClick={handleAddTag} disabled={tags.length >= 5}>
                添加
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !title.trim() || !content.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                发布中...
              </>
            ) : (
              "发布讨论"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
