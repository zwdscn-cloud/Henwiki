"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Camera, Save, Loader2, QrCode, Upload, X } from "lucide-react"
import Image from "next/image"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/lib/auth-context"
import { apiPut, apiGet, uploadFile } from "@/lib/utils/api"

export default function SettingsPage() {
  const { user, isLoading, updateProfile } = useAuth()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    email: "",
    specialties: [] as string[],
    emailNotifications: true,
    weeklyDigest: true,
    wechatQrCode: "",
    alipayQrCode: "",
  })
  const [categories, setCategories] = useState<any[]>([])
  const [uploadingWechat, setUploadingWechat] = useState(false)
  const [uploadingAlipay, setUploadingAlipay] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

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

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    } else if (user) {
      // 获取完整的用户信息（包含收款码）
      const fetchUserData = async () => {
        try {
          const userResponse = await apiGet<{ user: any }>(`/users/${user.id}`)
          if (userResponse.data && userResponse.data.user) {
            setFormData({
              name: userResponse.data.user.name || user.name,
              bio: userResponse.data.user.bio || user.bio || "",
              email: user.email,
              specialties: userResponse.data.user.specialties || user.specialties || [],
              emailNotifications: true,
              weeklyDigest: true,
              wechatQrCode: userResponse.data.user.wechat_qr_code || "",
              alipayQrCode: userResponse.data.user.alipay_qr_code || "",
            })
          } else {
            setFormData({
              name: user.name,
              bio: user.bio || "",
              email: user.email,
              specialties: user.specialties || [],
              emailNotifications: true,
              weeklyDigest: true,
              wechatQrCode: "",
              alipayQrCode: "",
            })
          }
        } catch (err) {
          console.error("Fetch user data error:", err)
          setFormData({
            name: user.name,
            bio: user.bio || "",
            email: user.email,
            specialties: user.specialties || [],
            emailNotifications: true,
            weeklyDigest: true,
            wechatQrCode: "",
            alipayQrCode: "",
          })
        }
      }
      fetchUserData()
    }
  }, [user, isLoading, router])

  const handleSave = async () => {
    if (!user) {
      console.error("[Settings] No user found")
      return
    }
    
    // 前端验证用户名
    const trimmedName = formData.name.trim()
    if (!trimmedName || trimmedName.length < 2) {
      alert("用户名至少需要2个字符")
      return
    }
    
    setIsSaving(true)
    try {
      const payload: any = {
        name: trimmedName,
        specialties: formData.specialties || [],
      }
      
      // 处理个人简介：空字符串转为 null
      if (formData.bio && formData.bio.trim()) {
        payload.bio = formData.bio.trim()
      } else {
        payload.bio = null
      }
      
      // 处理收款码：支持相对路径（以 / 开头）或绝对URL
      if (formData.wechatQrCode && formData.wechatQrCode.trim()) {
        const trimmed = formData.wechatQrCode.trim()
        // 相对路径（以 / 开头）直接使用
        if (trimmed.startsWith("/")) {
          payload.wechatQrCode = trimmed
        } else {
          // 验证绝对URL格式
          try {
            new URL(trimmed)
            payload.wechatQrCode = trimmed
          } catch {
            // 如果不是有效URL，发送空字符串（让后端验证处理）
            payload.wechatQrCode = ""
          }
        }
      } else {
        payload.wechatQrCode = ""
      }
      
      if (formData.alipayQrCode && formData.alipayQrCode.trim()) {
        const trimmed = formData.alipayQrCode.trim()
        // 相对路径（以 / 开头）直接使用
        if (trimmed.startsWith("/")) {
          payload.alipayQrCode = trimmed
        } else {
          // 验证绝对URL格式
          try {
            new URL(trimmed)
            payload.alipayQrCode = trimmed
          } catch {
            // 如果不是有效URL，发送空字符串（让后端验证处理）
            payload.alipayQrCode = ""
          }
        }
      } else {
        payload.alipayQrCode = ""
      }
      
      console.log("[Settings] Sending update request:", payload)
      
      const response = await apiPut(`/users/${user.id}`, payload)
      
      console.log("[Settings] Update response:", response)
      
      if (response.error) {
        // 显示友好的错误信息
        const errorMessage = response.message || response.error || "保存失败，请检查输入内容"
        console.error("[Settings] Save failed:", errorMessage)
        alert(errorMessage)
        return
      }
      
      // 保存成功
      console.log("[Settings] Save successful, updating profile")
      updateProfile({
        name: trimmedName,
        bio: formData.bio.trim() || null,
        specialties: formData.specialties,
      })
      alert("保存成功")
      
      // 刷新用户数据
      try {
        const userResponse = await apiGet<{ user: any }>(`/users/${user.id}`)
        if (userResponse.data && userResponse.data.user) {
          setFormData((prev) => ({
            ...prev,
            wechatQrCode: userResponse.data.user.wechat_qr_code || "",
            alipayQrCode: userResponse.data.user.alipay_qr_code || "",
          }))
        }
      } catch (refreshError) {
        console.error("[Settings] Failed to refresh user data:", refreshError)
        // 不阻止用户，只是记录错误
      }
    } catch (err: any) {
      console.error("[Settings] Save error:", err)
      console.error("[Settings] Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
        response: err.response,
      })
      
      // 处理不同类型的错误
      let errorMessage = "保存失败，请稍后重试"
      
      if (err.response?.data) {
        const errorData = err.response.data
        errorMessage = errorData.message || errorData.error || errorMessage
      } else if (err.message) {
        errorMessage = err.message
      }
      
      alert(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUploadAvatar = async (file: File) => {
    if (!user) {
      console.error("[Settings] No user found for avatar upload")
      return
    }
    
    setUploadingAvatar(true)
    try {
      console.log("[Settings] Starting avatar upload, file:", file.name, file.size, file.type)
      
      // 使用 uploadFile 工具函数上传
      const uploadResponse = await uploadFile(file)
      
      console.log("[Settings] Upload response:", uploadResponse)
      
      if (uploadResponse.error) {
        console.error("[Settings] Upload failed:", uploadResponse.error)
        alert(uploadResponse.error || "上传失败")
        return
      }
      
      if (uploadResponse.data?.url) {
        console.log("[Settings] Upload successful, updating avatar:", uploadResponse.data.url)
        
        // 更新用户头像
        const updateResponse = await apiPut(`/users/${user.id}`, {
          avatar: uploadResponse.data.url,
        })
        
        console.log("[Settings] Avatar update response:", updateResponse)
        
        if (updateResponse.error) {
          console.error("[Settings] Avatar update failed:", updateResponse.error)
          alert(updateResponse.message || updateResponse.error || "更新头像失败")
        } else {
          // 更新本地用户信息
          updateProfile({
            avatar: uploadResponse.data.url,
          })
          alert("头像上传成功")
        }
      } else {
        console.error("[Settings] Upload response missing URL")
        alert("上传失败：未收到文件URL")
      }
    } catch (err: any) {
      console.error("[Settings] Upload avatar error:", err)
      console.error("[Settings] Upload error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
      })
      alert(err.message || "上传失败，请稍后重试")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleUploadQrCode = async (type: "wechat" | "alipay", file: File) => {
    if (type === "wechat") {
      setUploadingWechat(true)
    } else {
      setUploadingAlipay(true)
    }

    try {
      console.log(`[Settings] Starting ${type} QR code upload, file:`, file.name, file.size, file.type)
      
      const formDataToUpload = new FormData()
      formDataToUpload.append("file", file)

      const token = localStorage.getItem("gaoneng_token")
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToUpload,
      })

      console.log(`[Settings] ${type} QR code upload response status:`, response.status)

      const data = await response.json()
      console.log(`[Settings] ${type} QR code upload response data:`, data)

      if (!response.ok) {
        const errorMessage = data.message || data.error || `上传失败 (${response.status})`
        console.error(`[Settings] ${type} QR code upload failed:`, errorMessage)
        alert(errorMessage)
        return
      }

      if (data.error) {
        console.error(`[Settings] ${type} QR code upload error:`, data.error)
        alert(data.error)
      } else if (data.url) {
        console.log(`[Settings] ${type} QR code upload successful:`, data.url)
        if (type === "wechat") {
          setFormData((prev) => ({ ...prev, wechatQrCode: data.url }))
        } else {
          setFormData((prev) => ({ ...prev, alipayQrCode: data.url }))
        }
      } else {
        console.error(`[Settings] ${type} QR code upload response missing URL`)
        alert("上传失败：未收到文件URL")
      }
    } catch (err: any) {
      console.error(`[Settings] ${type} QR code upload error:`, err)
      console.error(`[Settings] Upload error details:`, {
        name: err.name,
        message: err.message,
        stack: err.stack,
      })
      alert(err.message || "上传失败，请稍后重试")
    } finally {
      if (type === "wechat") {
        setUploadingWechat(false)
      } else {
        setUploadingAlipay(false)
      }
    }
  }

  const toggleSpecialty = (slug: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(slug)
        ? prev.specialties.filter((s) => s !== slug)
        : [...prev.specialties, slug],
    }))
  }

  if (isLoading || !user) {
    return (
      <PageLayout showRightSidebar={false}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout showRightSidebar={false}>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">账号设置</h1>
          <p className="text-muted-foreground mt-1">管理你的个人信息和偏好设置</p>
        </div>

        {/* Avatar Section */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">头像</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">{user.name[0]}</AvatarFallback>
              </Avatar>
              {uploadingAvatar ? (
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                </div>
              ) : (
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                </label>
              )}
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml,image/tiff,image/heic,image/heif,image/avif"
                className="hidden"
                id="avatar-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // 验证文件大小（2MB）
                    if (file.size > 2 * 1024 * 1024) {
                      alert("文件大小超过限制（最大 2MB）")
                      return
                    }
                    // 验证文件类型 - 支持更多格式
                    const allowedImageTypes = /^image\/(jpeg|jpg|png|gif|webp|bmp|svg\+xml|tiff|heic|heif|avif)$/i
                    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|tif|heic|heif|avif)$/i
                    
                    if (!file.type.match(allowedImageTypes) && !file.name.match(allowedExtensions)) {
                      alert("不支持的图片格式。支持：JPG、PNG、GIF、WebP、BMP、SVG、TIFF、HEIC、HEIF、AVIF")
                      return
                    }
                    handleUploadAvatar(file)
                  }
                }}
              />
            </div>
            <div>
              <label htmlFor="avatar-upload">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent cursor-pointer"
                  disabled={uploadingAvatar}
                  asChild
                >
                  <span>
                    {uploadingAvatar ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        上传中...
                      </>
                    ) : (
                      "上传新头像"
                    )}
                  </span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-2">支持 JPG、PNG、GIF、WebP、BMP、SVG、TIFF、HEIC、HEIF、AVIF 等格式，最大 2MB</p>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="font-semibold text-foreground">基本信息</h2>

          <div className="space-y-2">
            <Label htmlFor="name">用户名</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" type="email" value={formData.email} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">邮箱地址不可修改</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">个人简介</Label>
            <Textarea
              id="bio"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="介绍一下自己..."
            />
          </div>
        </div>

        {/* Interests Section */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="font-semibold text-foreground">兴趣领域</h2>
          <p className="text-sm text-muted-foreground">选择你感兴趣的领域，我们将为你推荐相关内容</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = formData.specialties.includes(cat.slug)
              return (
                <Badge
                  key={cat.slug}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${isSelected ? "" : "bg-transparent hover:bg-muted"}`}
                  onClick={() => toggleSpecialty(cat.slug)}
                >
                  {cat.label}
                </Badge>
              )
            })}
          </div>
        </div>

        {/* Payment QR Codes Section */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          <div>
            <h2 className="font-semibold text-foreground flex items-center gap-2 mb-1">
              <QrCode className="h-5 w-5" />
              收款码设置
            </h2>
            <p className="text-sm text-muted-foreground">
              上传你的收款码，让读者可以直接打赏给你
            </p>
          </div>

          {/* WeChat QR Code */}
          <div className="space-y-3">
            <Label>微信收款码</Label>
            {formData.wechatQrCode ? (
              <div className="relative inline-block">
                <div className="relative w-48 h-48 bg-white rounded-lg border-2 border-border p-2">
                  <Image
                    src={formData.wechatQrCode}
                    alt="微信收款码"
                    fill
                    className="object-contain rounded"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-8 w-8 bg-background/90 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                  onClick={() => setFormData((prev) => ({ ...prev, wechatQrCode: "" }))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="wechat-qr-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleUploadQrCode("wechat", file)
                    }
                  }}
                />
                <label
                  htmlFor="wechat-qr-upload"
                  className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {uploadingWechat ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">上传微信收款码</span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Alipay QR Code */}
          <div className="space-y-3">
            <Label>支付宝收款码</Label>
            {formData.alipayQrCode ? (
              <div className="relative inline-block">
                <div className="relative w-48 h-48 bg-white rounded-lg border-2 border-border p-2">
                  <Image
                    src={formData.alipayQrCode}
                    alt="支付宝收款码"
                    fill
                    className="object-contain rounded"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-8 w-8 bg-background/90 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                  onClick={() => setFormData((prev) => ({ ...prev, alipayQrCode: "" }))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="alipay-qr-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleUploadQrCode("alipay", file)
                    }
                  }}
                />
                <label
                  htmlFor="alipay-qr-upload"
                  className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {uploadingAlipay ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">上传支付宝收款码</span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="font-semibold text-foreground">通知设置</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">邮件通知</p>
              <p className="text-sm text-muted-foreground">接收评论、关注等通知邮件</p>
            </div>
            <Switch
              checked={formData.emailNotifications}
              onCheckedChange={(c) => setFormData((prev) => ({ ...prev, emailNotifications: c }))}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <p className="font-medium text-foreground">每周精选</p>
              <p className="text-sm text-muted-foreground">每周接收热门词条和论文推荐</p>
            </div>
            <Switch
              checked={formData.weeklyDigest}
              onCheckedChange={(c) => setFormData((prev) => ({ ...prev, weeklyDigest: c }))}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                保存设置
              </>
            )}
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}
