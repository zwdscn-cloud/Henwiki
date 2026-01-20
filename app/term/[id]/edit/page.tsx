"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { PenSquare, ChevronRight, Info, Plus, X, Eye, Save, Send, Loader2, Maximize2, Minimize2 } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiGet, apiPut } from "@/lib/utils/api"
import { RichTextEditor } from "@/components/rich-text-editor"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { markdownToHTML } from "@/lib/utils/markdown-to-html"

export default function EditTermPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params.id as string
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [summary, setSummary] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [fullWidthMode, setFullWidthMode] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/term/${id}/edit`)}`)
      return
    }
    const loadData = async () => {
      await fetchCategories()
      await fetchTerm()
    }
    loadData()
  }, [id, user])

  const fetchTerm = async () => {
    try {
      const response = await apiGet<{ term: any }>(`/terms/${id}`)
      if (response.data) {
        const term = response.data.term
        // 检查权限
        if (term.author_id.toString() !== user?.id) {
          alert("无权编辑此词条")
          router.push(`/term/${id}`)
          return
        }
        setTitle(term.title)
        // category是对象，包含slug
        if (term.category && term.category.slug) {
          setCategory(term.category.slug)
        } else if (categories.length > 0) {
          // 如果没有category对象，从categories中查找
          const categoryObj = categories.find((c) => c.id === term.category_id)
          if (categoryObj) {
            setCategory(categoryObj.slug)
          }
        }
        setSummary(term.summary || "")
        // 将 Markdown 转换为 HTML 以便编辑器正确解析
        const contentHTML = term.content ? markdownToHTML(term.content) : ""
        setContent(contentHTML)
        setTags(term.tags || [])
      }
    } catch (error) {
      console.error("Fetch term error:", error)
      router.push(`/term/${id}`)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await apiGet<{ categories: any[] }>("/categories")
      if (response.data) {
        setCategories(response.data.categories)
      }
    } catch (err) {
      console.error("Fetch categories error:", err)
    }
  }

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput) && tags.length < 5) {
      setTags([...tags, tagInput])
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSave = async () => {
    if (!title || !category || !summary || !content) {
      alert("请填写所有必填字段")
      return
    }

    setIsSaving(true)
    try {
      const categoryObj = categories.find((c) => c.slug === category)
      if (!categoryObj) {
        alert("请选择有效的分类")
        return
      }

      const response = await apiPut(`/terms/${id}`, {
        title,
        categoryId: categoryObj.id,
        summary,
        content,
        tags,
      })

      if (response.error) {
        alert(response.error)
      } else {
        alert("更新成功！")
        router.push(`/term/${id}`)
      }
    } catch (err) {
      console.error("Update error:", err)
      alert("更新失败")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <PageLayout showRightSidebar={false}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout showRightSidebar={false}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            首页
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/term/${id}`} className="hover:text-foreground">
            词条详情
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">编辑词条</span>
        </nav>

        {/* Page Header */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <PenSquare className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">编辑词条</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent"
              onClick={() => setFullWidthMode(true)}
              title="全页宽编辑模式"
            >
              <Maximize2 className="h-4 w-4" />
              <span className="hidden sm:inline">全页宽编辑</span>
            </Button>
          </div>
          <p className="text-muted-foreground">修改词条内容，更新后需要重新审核</p>
        </div>

        {/* Guidelines */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>修改后的词条将重新进入审核流程。请确保内容准确、客观。</AlertDescription>
        </Alert>

        {/* Form */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">词条名称 *</Label>
            <Input
              id="title"
              placeholder="输入词条名称"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>所属领域 *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="选择一个领域" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">简介 *</Label>
            <Textarea
              id="summary"
              placeholder="用一两句话简要介绍这个概念..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">{summary.length}/200 字符</p>
          </div>

          {/* Content - Rich Text Editor */}
          <div className="space-y-2">
            <Label>详细内容 *</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="开始编写词条内容..."
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>标签（最多5个）</Label>
            <div className="flex gap-2">
              <Input
                placeholder="输入标签后按回车"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                添加
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={() => router.push(`/term/${id}`)}>
              取消
            </Button>
            <Button className="gap-2" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  保存修改
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Full Width Edit Mode */}
      {fullWidthMode && (
        <div className="fixed inset-0 z-50 bg-background">
          {/* Header Bar */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* 左侧：标题 */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold truncate text-foreground">
                  {title || "编辑词条"}
                </h2>
              </div>
              
              {/* 右侧：操作按钮 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2 text-foreground"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">保存中...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span className="hidden sm:inline">保存</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/term/${id}`)}
                  className="gap-2 text-foreground"
                >
                  <span className="hidden sm:inline">取消</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFullWidthMode(false)}
                  className="gap-2 text-foreground"
                >
                  <Minimize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">退出全屏</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex h-[calc(100vh-60px)] overflow-hidden">
            {/* Left Sidebar - Basic Info */}
            <div className="w-80 border-r border-border bg-muted/20 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullwidth-title" className="text-sm font-medium mb-2 block">
                    词条名称 *
                  </Label>
                  <Input
                    id="fullwidth-title"
                    placeholder="输入词条名称"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">所属领域 *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择一个领域" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.slug} value={cat.slug}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="fullwidth-summary" className="text-sm font-medium mb-2 block">
                    简介 *
                  </Label>
                  <Textarea
                    id="fullwidth-summary"
                    placeholder="用一两句话简要介绍这个概念..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{summary.length}/200 字符</p>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">标签（最多5个）</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="输入标签后按回车"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTag}>
                      添加
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                          #{tag}
                          <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
                <Label className="text-sm font-medium">详细内容 *</Label>
              </div>
              <div className="flex-1 overflow-hidden">
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="开始编写词条内容..."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
