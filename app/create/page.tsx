"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiPost, apiGet } from "@/lib/utils/api"
import Link from "next/link"
import { PenSquare, ChevronRight, Info, Plus, X, Eye, Save, Send } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export default function CreateTermPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [summary, setSummary] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [references, setReferences] = useState<{ title: string; url: string }[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setIsLoadingCategories(true)
    try {
      const response = await apiGet<{ categories: any[] }>("/categories")
      console.log("[Create] Categories response:", response)
      
      if (response.error) {
        console.error("[Create] API returned error:", response.error)
        return
      }
      
      if (response.data && response.data.categories) {
        console.log("[Create] Categories loaded:", response.data.categories.length, response.data.categories)
        if (Array.isArray(response.data.categories) && response.data.categories.length > 0) {
          setCategories(response.data.categories)
        } else {
          console.warn("[Create] Categories array is empty")
        }
      } else {
        console.error("[Create] No categories in response data:", response)
      }
    } catch (err) {
      console.error("[Create] Fetch categories error:", err)
    } finally {
      setIsLoadingCategories(false)
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

  const addReference = () => {
    setReferences([...references, { title: "", url: "" }])
  }

  const updateReference = (index: number, field: "title" | "url", value: string) => {
    const newRefs = [...references]
    newRefs[index][field] = value
    setReferences(newRefs)
  }

  const removeReference = (index: number) => {
    setReferences(references.filter((_, i) => i !== index))
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
          <span className="text-foreground">创建词条</span>
        </nav>

        {/* Page Header */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <PenSquare className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">创建新词条</h1>
          </div>
          <p className="text-muted-foreground">分享你的专业知识，帮助更多人了解前沿科技</p>
        </div>

        {/* Guidelines */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>词条内容将经过审核后发布。请确保内容准确、客观，并注明参考来源。</AlertDescription>
        </Alert>

        {/* Form */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">词条名称 *</Label>
            <Input
              id="title"
              placeholder="输入词条名称，如：量子纠缠"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>所属领域 *</Label>
            {isLoadingCategories ? (
              <div className="text-sm text-muted-foreground">加载分类中...</div>
            ) : categories.length === 0 ? (
              <div className="text-sm text-destructive">暂无可用分类，请稍后重试</div>
            ) : (
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="w-full justify-between"
                    disabled={categories.length === 0}
                  >
                    {category
                      ? categories.find((cat) => cat.id.toString() === category)?.label
                      : "选择一个领域..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="搜索领域..." />
                    <CommandList>
                      <CommandEmpty>未找到相关领域</CommandEmpty>
                      <CommandGroup>
                        {categories.map((cat) => (
                          <CommandItem
                            key={cat.id}
                            value={cat.label}
                            onSelect={() => {
                              setCategory(cat.id.toString())
                              setCategoryOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                category === cat.id.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {cat.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
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
              placeholder="开始编写词条内容...&#10;&#10;提示：使用标题组织内容结构，左侧将自动生成目录导航"
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

          {/* References */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>参考资料</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addReference}>
                <Plus className="h-4 w-4 mr-1" />
                添加来源
              </Button>
            </div>
            {references.map((ref, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="来源标题"
                  value={ref.title}
                  onChange={(e) => updateReference(index, "title", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="URL"
                  value={ref.url}
                  onChange={(e) => updateReference(index, "url", e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeReference(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Eye className="h-4 w-4" />
              预览
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Save className="h-4 w-4" />
              保存草稿
            </Button>
            <Button
              className="gap-2"
              disabled={isSubmitting}
              onClick={async () => {
                if (!title || !category || !summary || !content) {
                  alert("请填写所有必填字段")
                  return
                }
                setIsSubmitting(true)
                try {
                  const response = await apiPost<{ termId: number; message: string }>("/terms", {
                    title,
                    categoryId: parseInt(category),
                    summary,
                    content,
                    tags,
                  })
                  if (response.error) {
                    alert(response.error)
                  } else {
                    // 显示成功提示，并提供查看链接
                    const termId = response.data?.termId
                    if (termId) {
                      const shouldView = confirm("提交成功！等待审核。\n\n是否前往个人资料页查看您创建的词条？")
                      if (shouldView) {
                        router.push("/profile")
                      }
                    } else {
                      alert("提交成功！等待审核")
                    }
                    // 重置表单
                    setTitle("")
                    setCategory("")
                    setSummary("")
                    setContent("")
                    setTags([])
                    setReferences([])
                  }
                } catch (err) {
                  console.error("Submit error:", err)
                  alert("提交失败")
                } finally {
                  setIsSubmitting(false)
                }
              }}
            >
              <Send className="h-4 w-4" />
              提交审核
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
