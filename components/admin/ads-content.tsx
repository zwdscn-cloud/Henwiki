"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Plus, Loader2, Image as ImageIcon, Upload, X as XIcon } from "lucide-react"
import { apiGet, apiPut, apiPost, apiDelete, uploadFile } from "@/lib/utils/api"
import Image from "next/image"

interface Ad {
  id: number
  title: string
  description: string | null
  image: string
  url: string
  sponsor: string
  cta: string
  tag: string
  variant: "feed" | "sidebar" | "banner" | "inline"
  type: string
  gradient: string
  status: "active" | "inactive" | "draft"
  priority: number
  start_date: string | null
  end_date: string | null
  click_count: number
  view_count: number
  created_at: string
  updated_at: string
  creator_id: number | null
  creator_name: string | null
}

export function AdsContent() {
  const [ads, setAds] = useState<Ad[]>([])
  const [selectedAds, setSelectedAds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [variantFilter, setVariantFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    url: "",
    sponsor: "",
    cta: "了解详情",
    tag: "",
    variant: "feed" as "feed" | "sidebar" | "banner" | "inline",
    type: "",
    gradient: "",
    status: "draft" as "active" | "inactive" | "draft",
    priority: 0,
    start_date: "",
    end_date: "",
  })

  useEffect(() => {
    fetchAds()
  }, [page, statusFilter, variantFilter, searchQuery])

  const fetchAds = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
        status: statusFilter,
        variant: variantFilter,
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await apiGet<{ ads: Ad[]; pagination: { total: number } }>(
        `/admin/ads?${params.toString()}`
      )

      if (response.error) {
        console.error("Failed to fetch ads:", response.error)
      } else if (response.data) {
        setAds(response.data.ads)
        setTotal(response.data.pagination.total)
      }
    } catch (err) {
      console.error("Failed to fetch ads:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingAd(null)
    setFormData({
      title: "",
      description: "",
      image: "",
      url: "",
      sponsor: "",
      cta: "了解详情",
      tag: "",
      variant: "feed",
      type: "",
      gradient: "",
      status: "draft",
      priority: 0,
      start_date: "",
      end_date: "",
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad)
    setFormData({
      title: ad.title,
      description: ad.description || "",
      image: ad.image || "",
      url: ad.url,
      sponsor: ad.sponsor || "",
      cta: ad.cta || "了解详情",
      tag: ad.tag || "",
      variant: ad.variant,
      type: ad.type || "",
      gradient: ad.gradient || "",
      status: ad.status,
      priority: ad.priority || 0,
      start_date: ad.start_date ? ad.start_date.split("T")[0] + "T" + ad.start_date.split("T")[1]?.slice(0, 5) : "",
      end_date: ad.end_date ? ad.end_date.split("T")[0] + "T" + ad.end_date.split("T")[1]?.slice(0, 5) : "",
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.url) {
      alert("请填写标题和链接")
      return
    }

    try {
      if (editingAd) {
        const response = await apiPut("/admin/ads", { id: editingAd.id, ...formData })
        if (response.error) {
          alert("更新失败：" + response.error)
        } else {
          setIsDialogOpen(false)
          fetchAds()
        }
      } else {
        const response = await apiPost("/admin/ads", formData)
        if (response.error) {
          alert("创建失败：" + response.error)
        } else {
          setIsDialogOpen(false)
          fetchAds()
        }
      }
    } catch (err) {
      console.error("Failed to save ad:", err)
      alert("保存失败")
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("请上传图片文件")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("图片大小不能超过 5MB")
      return
    }

    setUploadingImage(true)
    try {
      const response = await uploadFile(file)
      if (response.error) {
        alert("上传失败：" + response.error)
      } else if (response.data) {
        setFormData({ ...formData, image: response.data.url })
      }
    } catch (err) {
      console.error("Failed to upload image:", err)
      alert("上传失败")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个广告吗？")) return

    try {
      const response = await apiDelete(`/admin/ads?id=${id}`)
      if (response.error) {
        alert("删除失败：" + response.error)
      } else {
        fetchAds()
      }
    } catch (err) {
      console.error("Failed to delete ad:", err)
      alert("删除失败")
    }
  }

  // 预设渐变样式
  const gradientPresets = [
    { name: "默认（主色）", value: "from-primary to-primary/80", preview: "bg-gradient-to-r from-primary to-primary/80" },
    { name: "蓝色", value: "from-blue-500 to-blue-600", preview: "bg-gradient-to-r from-blue-500 to-blue-600" },
    { name: "紫色", value: "from-purple-500 to-purple-600", preview: "bg-gradient-to-r from-purple-500 to-purple-600" },
    { name: "粉色", value: "from-pink-500 to-pink-600", preview: "bg-gradient-to-r from-pink-500 to-pink-600" },
    { name: "绿色", value: "from-green-500 to-green-600", preview: "bg-gradient-to-r from-green-500 to-green-600" },
    { name: "橙色", value: "from-orange-500 to-orange-600", preview: "bg-gradient-to-r from-orange-500 to-orange-600" },
    { name: "红色", value: "from-red-500 to-red-600", preview: "bg-gradient-to-r from-red-500 to-red-600" },
    { name: "青色", value: "from-cyan-500 to-cyan-600", preview: "bg-gradient-to-r from-cyan-500 to-cyan-600" },
    { name: "蓝紫渐变", value: "from-blue-500 to-purple-600", preview: "bg-gradient-to-r from-blue-500 to-purple-600" },
    { name: "粉紫渐变", value: "from-pink-500 to-purple-600", preview: "bg-gradient-to-r from-pink-500 to-purple-600" },
    { name: "橙红渐变", value: "from-orange-500 to-red-600", preview: "bg-gradient-to-r from-orange-500 to-red-600" },
    { name: "青蓝渐变", value: "from-cyan-500 to-blue-600", preview: "bg-gradient-to-r from-cyan-500 to-blue-600" },
  ]

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const ad = ads.find((a) => a.id === id)
      if (!ad) return

      const response = await apiPut("/admin/ads", { id, ...ad, status })
      if (response.error) {
        alert("更新状态失败：" + response.error)
      } else {
        fetchAds()
      }
    } catch (err) {
      console.error("Failed to update status:", err)
      alert("更新状态失败")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return <Badge className="bg-green-500/10 text-green-600">启用</Badge>
    } else if (status === "inactive") {
      return <Badge variant="secondary">禁用</Badge>
    } else {
      return <Badge variant="outline">草稿</Badge>
    }
  }

  const getVariantBadge = (variant: string) => {
    const variants: Record<string, string> = {
      feed: "信息流",
      sidebar: "侧边栏",
      banner: "横幅",
      inline: "内嵌",
    }
    return <Badge variant="outline">{variants[variant] || variant}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">广告管理</h1>
          <p className="text-muted-foreground">管理所有广告内容，创建、编辑、删除广告</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新建广告
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索广告标题、描述、赞助商..."
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
                <SelectItem value="active">启用</SelectItem>
                <SelectItem value="inactive">禁用</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
              </SelectContent>
            </Select>
            <Select value={variantFilter} onValueChange={setVariantFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="feed">信息流</SelectItem>
                <SelectItem value="sidebar">侧边栏</SelectItem>
                <SelectItem value="banner">横幅</SelectItem>
                <SelectItem value="inline">内嵌</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ads Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedAds.length === ads.length && ads.length > 0}
                    onCheckedChange={() => {
                      if (selectedAds.length === ads.length) {
                        setSelectedAds([])
                      } else {
                        setSelectedAds(ads.map((a) => a.id.toString()))
                      }
                    }}
                  />
                </TableHead>
                <TableHead>广告</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>数据</TableHead>
                <TableHead>创建时间</TableHead>
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
              ) : ads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    暂无广告数据
                  </TableCell>
                </TableRow>
              ) : (
                ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAds.includes(ad.id.toString())}
                        onCheckedChange={() => {
                          const idStr = ad.id.toString()
                          if (selectedAds.includes(idStr)) {
                            setSelectedAds(selectedAds.filter((i) => i !== idStr))
                          } else {
                            setSelectedAds([...selectedAds, idStr])
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {ad.image && (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                            <Image
                              src={ad.image}
                              alt={ad.title}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium">{ad.title}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">
                            {ad.description || "无描述"}
                          </span>
                          {ad.sponsor && (
                            <span className="text-xs text-muted-foreground">赞助商：{ad.sponsor}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getVariantBadge(ad.variant)}</TableCell>
                    <TableCell>{getStatusBadge(ad.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm">{ad.priority}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{ad.view_count} 展示</span>
                        <span>{ad.click_count} 点击</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(ad.created_at)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(ad)}>
                            <Edit className="mr-2 h-4 w-4" />
                            编辑
                          </DropdownMenuItem>
                          {ad.status === "active" ? (
                            <DropdownMenuItem onClick={() => handleStatusChange(ad.id, "inactive")}>
                              禁用
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleStatusChange(ad.id, "active")}>
                              启用
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(ad.id)}>
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
          共 {total} 条广告，第 {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} 条
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAd ? "编辑广告" : "新建广告"}</DialogTitle>
            <DialogDescription>填写广告信息，所有带 * 的字段为必填项</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  标题 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="广告标题"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">
                  链接 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="广告描述"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>广告图片</Label>
                <div className="space-y-2">
                  {formData.image ? (
                    <div className="relative">
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border bg-muted">
                        <Image
                          src={formData.image}
                          alt="广告预览"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 bg-background/80 hover:bg-background"
                        onClick={() => setFormData({ ...formData, image: "" })}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadingImage ? (
                          <Loader2 className="h-8 w-8 text-muted-foreground mb-2 animate-spin" />
                        ) : (
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        )}
                        <p className="text-sm text-foreground mb-1">
                          <span className="font-semibold">点击上传</span> 或拖拽图片到此处
                        </p>
                        <p className="text-xs text-muted-foreground">支持 JPG、PNG、GIF、WebP，最大 5MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageUpload(file)
                          }
                        }}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                  {formData.image && (
                    <Input
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="或手动输入图片URL"
                      className="text-xs"
                    />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sponsor">赞助商</Label>
                <Input
                  id="sponsor"
                  value={formData.sponsor}
                  onChange={(e) => setFormData({ ...formData, sponsor: e.target.value })}
                  placeholder="赞助商名称"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="variant">
                  类型 <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.variant} onValueChange={(v: any) => setFormData({ ...formData, variant: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feed">信息流</SelectItem>
                    <SelectItem value="sidebar">侧边栏</SelectItem>
                    <SelectItem value="banner">横幅</SelectItem>
                    <SelectItem value="inline">内嵌</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="active">启用</SelectItem>
                    <SelectItem value="inactive">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">优先级</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cta">按钮文字</Label>
                <Input
                  id="cta"
                  value={formData.cta}
                  onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                  placeholder="了解详情"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag">标签</Label>
                <Input
                  id="tag"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  placeholder="热门课程、限时优惠等"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">广告分类</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="course, product, event, brand等"
              />
            </div>
            {formData.variant === "banner" && (
              <div className="space-y-2">
                <Label>渐变样式（仅横幅广告）</Label>
                <div className="grid grid-cols-4 gap-2">
                  {gradientPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, gradient: preset.value })}
                      className={`relative h-16 rounded-lg border-2 transition-all ${
                        formData.gradient === preset.value
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`w-full h-full rounded ${preset.preview}`} />
                      <span className="absolute bottom-0 left-0 right-0 text-[10px] text-white bg-black/50 px-1 py-0.5 rounded-b-lg truncate">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
                {formData.gradient && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
                    当前选择：{gradientPresets.find(p => p.value === formData.gradient)?.name || formData.gradient}
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">开始时间</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">结束时间</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
