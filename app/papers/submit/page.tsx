"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Plus, X, Upload, LinkIcon, Check, File, Trash2 } from "lucide-react"
import { apiPost, uploadFile, apiGet } from "@/lib/utils/api"

interface Author {
  name: string
  affiliation: string
}

export default function SubmitPaperPage() {
  const [title, setTitle] = useState("")
  const [titleCn, setTitleCn] = useState("")
  const [authors, setAuthors] = useState<Author[]>([{ name: "", affiliation: "" }])
  const [abstract, setAbstract] = useState("")
  const [abstractCn, setAbstractCn] = useState("")
  const [category, setCategory] = useState("")
  const [journal, setJournal] = useState("")
  const [publishDate, setPublishDate] = useState("")
  const [arxivId, setArxivId] = useState("")
  const [doi, setDoi] = useState("")
  const [pdfUrl, setPdfUrl] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [uploadMethod, setUploadMethod] = useState<"upload" | "link">("upload")
  const [uploadError, setUploadError] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [journals, setJournals] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const categoriesResponse = await apiGet<{ categories: any[] }>("/categories")
      if (categoriesResponse.data) {
        setCategories(categoriesResponse.data.categories)
      }
    } catch (err) {
      console.error("Fetch data error:", err)
    }
  }

  const addAuthor = () => {
    setAuthors([...authors, { name: "", affiliation: "" }])
  }

  const removeAuthor = (index: number) => {
    if (authors.length > 1) {
      setAuthors(authors.filter((_, i) => i !== index))
    }
  }

  const updateAuthor = (index: number, field: keyof Author, value: string) => {
    const newAuthors = [...authors]
    newAuthors[index][field] = value
    setAuthors(newAuthors)
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (file.type !== "application/pdf") {
      setUploadError("请上传 PDF 格式的文件")
      return
    }

    // 验证文件大小 (最大 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      setUploadError("文件大小不能超过 50MB")
      return
    }

    setPdfFile(file)
    setUploadError("")
    // 切换为上传模式时清空链接
    if (uploadMethod === "link") {
      setPdfUrl("")
    }
  }

  const removeFile = () => {
    setPdfFile(null)
    setUploadError("")
  }

  const handleUploadMethodChange = (method: "upload" | "link") => {
    setUploadMethod(method)
    if (method === "upload") {
      setPdfUrl("")
    } else {
      setPdfFile(null)
      setUploadError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证 PDF 文件或链接
    if (uploadMethod === "upload" && !pdfFile) {
      setUploadError("请上传 PDF 文件")
      return
    }
    if (uploadMethod === "link" && !pdfUrl.trim()) {
      setUploadError("请输入 PDF 链接")
      return
    }

    setIsSubmitting(true)
    setUploadError("")
    
    try {
      // 先上传文件（如果有）
      let uploadedPdfUrl = pdfUrl
      if (pdfFile) {
        const uploadResponse = await uploadFile(pdfFile)
        if (uploadResponse.error) {
          setUploadError(uploadResponse.error)
          setIsSubmitting(false)
          return
        }
        uploadedPdfUrl = uploadResponse.data?.url || ""
      }

      // 提交论文数据
      const response = await apiPost("/papers", {
        title,
        titleCn,
        abstract,
        abstractCn,
        categoryId: parseInt(category),
        journal,
        publishDate: publishDate || null,
        arxivId: arxivId || null,
        doi: doi || null,
        pdfUrl: uploadedPdfUrl || null,
        authors: authors.filter((a) => a.name.trim()),
        tags,
      })

      if (response.error) {
        setUploadError(response.error)
      } else {
        setIsSubmitted(true)
      }
    } catch (err) {
      console.error("Submit error:", err)
      setUploadError("提交失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">提交成功！</h1>
          <p className="text-muted-foreground mb-6">您的论文已提交审核，我们会在 1-3 个工作日内完成审核。</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setIsSubmitted(false)}>继续提交</Button>
            <Button variant="outline" asChild>
              <a href="/papers">返回论文库</a>
            </Button>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout showRightSidebar={false}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">提交论文</h1>
            <p className="text-muted-foreground text-sm">将优秀的学术论文收录到高能百科</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <section className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h2 className="font-semibold text-foreground">基本信息</h2>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                论文标题 (英文) <span className="text-destructive">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter the paper title in English"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">论文标题 (中文)</label>
              <Input
                value={titleCn}
                onChange={(e) => setTitleCn(e.target.value)}
                placeholder="输入论文中文标题（可选）"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  所属领域 <span className="text-destructive">*</span>
                </label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="选择领域" />
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
                <label className="text-sm font-medium text-foreground block mb-2">
                  期刊/会议 <span className="text-destructive">*</span>
                </label>
                <Select value={journal} onValueChange={setJournal} required>
                  <SelectTrigger>
                    <SelectValue placeholder="选择来源" />
                  </SelectTrigger>
                  <SelectContent>
                    {journals.map((j) => (
                      <SelectItem key={j.name} value={j.name}>
                        {j.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                发布日期 <span className="text-destructive">*</span>
              </label>
              <Input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} required />
            </div>
          </section>

          {/* Authors */}
          <section className="bg-card rounded-lg border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">作者信息</h2>
              <Button type="button" variant="outline" size="sm" onClick={addAuthor}>
                <Plus className="h-4 w-4 mr-1" /> 添加作者
              </Button>
            </div>

            {authors.map((author, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <Input
                    placeholder="作者姓名"
                    value={author.name}
                    onChange={(e) => updateAuthor(index, "name", e.target.value)}
                    required
                  />
                  <Input
                    placeholder="所属机构"
                    value={author.affiliation}
                    onChange={(e) => updateAuthor(index, "affiliation", e.target.value)}
                    required
                  />
                </div>
                {authors.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAuthor(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </section>

          {/* Abstract */}
          <section className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h2 className="font-semibold text-foreground">摘要</h2>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                英文摘要 <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Enter the paper abstract in English"
                rows={5}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">中文摘要</label>
              <Textarea
                value={abstractCn}
                onChange={(e) => setAbstractCn(e.target.value)}
                placeholder="输入论文中文摘要（可选）"
                rows={5}
              />
            </div>
          </section>

          {/* Links */}
          <section className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <LinkIcon className="h-4 w-4" /> 链接信息
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">arXiv ID</label>
                <Input value={arxivId} onChange={(e) => setArxivId(e.target.value)} placeholder="例如: 1706.03762" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">DOI</label>
                <Input value={doi} onChange={(e) => setDoi(e.target.value)} placeholder="例如: 10.1038/nature12373" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">PDF 文件</label>
              
              {/* 上传方式选择 */}
              <div className="flex gap-2 mb-3">
                <Button
                  type="button"
                  variant={uploadMethod === "upload" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleUploadMethodChange("upload")}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  上传文件
                </Button>
                <Button
                  type="button"
                  variant={uploadMethod === "link" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleUploadMethodChange("link")}
                  className="flex-1"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  输入链接
                </Button>
              </div>

              {/* 文件上传区域 */}
              {uploadMethod === "upload" && (
                <div className="space-y-2">
                  {pdfFile ? (
                    <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-muted/30">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <File className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{pdfFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeFile}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-foreground mb-1">
                          <span className="font-semibold">点击上传</span> 或拖拽文件到此处
                        </p>
                        <p className="text-xs text-muted-foreground">支持 PDF 格式，最大 50MB</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                  {uploadError && (
                    <p className="text-sm text-destructive">{uploadError}</p>
                  )}
                </div>
              )}

              {/* 链接输入区域 */}
              {uploadMethod === "link" && (
                <div className="space-y-2">
                  <Input
                    value={pdfUrl}
                    onChange={(e) => {
                      setPdfUrl(e.target.value)
                      setUploadError("")
                    }}
                    placeholder="https://example.com/paper.pdf"
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground">
                    请输入完整的 PDF 文件链接地址
                  </p>
                  {uploadError && (
                    <p className="text-sm text-destructive">{uploadError}</p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Tags */}
          <section className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h2 className="font-semibold text-foreground">标签</h2>

            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="输入标签"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                添加
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </section>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <a href="/papers">取消</a>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>提交中...</>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> 提交论文
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  )
}
