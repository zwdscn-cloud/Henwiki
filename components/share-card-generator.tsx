"use client"
import { useState, useRef, useCallback } from "react"
import { Download, Copy, Check, Zap, QrCode, MessageCircle, Video, BookOpen } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ShareCardGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  term: {
    id: string
    title: string
    category: string
    summary: string
    author: {
      name: string
      avatar: string
    }
    stats: {
      views: number
      likes: number
    }
    tags: string[]
  }
}

const themes = [
  { id: "light", name: "浅色", bg: "bg-white", text: "text-gray-900", accent: "text-red-600" },
  { id: "dark", name: "深色", bg: "bg-gray-900", text: "text-white", accent: "text-red-400" },
  {
    id: "gradient",
    name: "渐变",
    bg: "bg-gradient-to-br from-red-600 to-orange-500",
    text: "text-white",
    accent: "text-white",
  },
  {
    id: "blue",
    name: "科技蓝",
    bg: "bg-gradient-to-br from-blue-600 to-cyan-500",
    text: "text-white",
    accent: "text-cyan-200",
  },
]

export function ShareCardGenerator({ open, onOpenChange, term }: ShareCardGeneratorProps) {
  const [selectedTheme, setSelectedTheme] = useState("blue")
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/term/${term.id}` : ""

  const theme = themes.find((t) => t.id === selectedTheme) || themes[0]

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/term/${term.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [term.id])

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) {
      console.error("卡片引用不存在")
      alert("无法生成图片，请刷新页面重试")
      return
    }

    setIsDownloading(true)

    try {
      // 等待一小段时间确保内容完全渲染，特别是二维码
      await new Promise(resolve => setTimeout(resolve, 500))

      // 使用 html-to-image，它对现代 CSS（包括 lab()/oklch() 等颜色函数）支持更好
      const { toPng } = await import("html-to-image")
      
      // 根据主题动态设置背景色
      // 渐变主题（gradient, blue）使用透明背景，让卡片本身的渐变背景显示
      // 纯色主题（light, dark）使用对应的背景色，确保与卡片背景一致
      const getBackgroundColor = () => {
        if (selectedTheme === "light") {
          return "#ffffff" // 白色
        } else if (selectedTheme === "dark") {
          return "#111827" // 深灰色
        } else {
          // gradient 和 blue 主题使用透明背景
          return null
        }
      }

      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: getBackgroundColor(),
        cacheBust: true,
        includeQueryParams: true,
      })

      // 创建下载链接
      const link = document.createElement("a")
      link.download = `高能百科-${term.title}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setIsDownloading(false)
    } catch (error) {
      console.error("下载失败:", error)
      alert(`下载失败: ${error instanceof Error ? error.message : "未知错误"}，请检查控制台获取详细信息`)
      setIsDownloading(false)
    }
  }, [term.title, selectedTheme])

  const shareToWechat = async () => {
    const url = `${window.location.origin}/term/${term.id}`
    const text = `【${term.title}】${term.summary.slice(0, 80)}... 来自高能百科\n${url}`
    
    try {
      await navigator.clipboard.writeText(text)
      alert("链接已复制到剪贴板！\n请打开微信，粘贴链接分享给好友或朋友圈。")
    } catch (error) {
      // 降级方案：使用传统方法
      const textarea = document.createElement("textarea")
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand("copy")
        alert("链接已复制到剪贴板！\n请打开微信，粘贴链接分享给好友或朋友圈。")
      } catch (e) {
        alert(`请复制以下链接到微信分享：\n${url}`)
      }
      document.body.removeChild(textarea)
    }
  }

  const shareToDouyin = async () => {
    const url = `${window.location.origin}/term/${term.id}`
    const text = `【${term.title}】${term.summary.slice(0, 80)}... 来自高能百科\n${url}`
    
    try {
      await navigator.clipboard.writeText(text)
      alert("链接已复制到剪贴板！\n请打开抖音，粘贴链接分享。")
    } catch (error) {
      // 降级方案
      const textarea = document.createElement("textarea")
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand("copy")
        alert("链接已复制到剪贴板！\n请打开抖音，粘贴链接分享。")
      } catch (e) {
        alert(`请复制以下链接到抖音分享：\n${url}`)
      }
      document.body.removeChild(textarea)
    }
  }

  const shareToZhihu = async () => {
    const url = `${window.location.origin}/term/${term.id}`
    const text = `【${term.title}】${term.summary.slice(0, 80)}... 来自高能百科\n${url}`
    
    try {
      await navigator.clipboard.writeText(text)
      alert("链接已复制到剪贴板！\n请打开知乎，粘贴链接分享。")
    } catch (error) {
      // 降级方案
      const textarea = document.createElement("textarea")
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand("copy")
        alert("链接已复制到剪贴板！\n请打开知乎，粘贴链接分享。")
      } catch (e) {
        alert(`请复制以下链接到知乎分享：\n${url}`)
      }
      document.body.removeChild(textarea)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>分享词条</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Theme Selection */}
          <div className="space-y-3">
            <Label>选择样式</Label>
            <RadioGroup value={selectedTheme} onValueChange={setSelectedTheme} className="flex gap-3">
              {themes.map((t) => (
                <div key={t.id} className="flex items-center">
                  <RadioGroupItem value={t.id} id={t.id} className="peer sr-only" />
                  <Label
                    htmlFor={t.id}
                    className={`cursor-pointer rounded-lg border-2 p-3 transition-all peer-data-[state=checked]:border-primary ${
                      selectedTheme === t.id ? "border-primary" : "border-border"
                    }`}
                  >
                    <div className={`w-16 h-10 rounded ${t.bg}`} />
                    <span className="text-xs text-center block mt-1">{t.name}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Card Preview */}
          <div className="space-y-3">
            <Label>预览</Label>
            <div className="flex justify-center items-center w-full p-4 bg-muted/30 rounded-lg">
              <div
                ref={cardRef}
                data-card-ref
                className={`w-[400px] p-6 rounded-xl shadow-xl ${theme.bg} ${theme.text}`}
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                {/* Card Header */}
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-md ${selectedTheme === "light" ? "bg-red-600" : "bg-white/20"}`}
                  >
                    <Zap className={`h-5 w-5 ${selectedTheme === "light" ? "text-white" : ""}`} />
                  </div>
                  <span className="font-bold">高能百科</span>
                </div>

                {/* Category Badge */}
                <div
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                    selectedTheme === "light" ? "bg-red-100 text-red-700" : "bg-white/20"
                  }`}
                >
                  {term.category}
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold mb-3 leading-tight">{term.title}</h2>

                {/* Summary */}
                <p
                  className={`text-sm leading-relaxed mb-4 ${selectedTheme === "light" ? "text-gray-600" : "opacity-90"}`}
                >
                  {term.summary.length > 120 ? term.summary.slice(0, 120) + "..." : term.summary}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {term.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className={`text-xs ${theme.accent}`}>
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className={`pt-4 border-t ${selectedTheme === "light" ? "border-gray-200" : "border-white/20"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={term.author.avatar || "/placeholder-user.jpg"} />
                        <AvatarFallback className={`text-xs ${selectedTheme === "light" ? "bg-gray-200 text-gray-600" : "bg-white/20 text-white"}`}>
                          {term.author.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{term.author.name}</span>
                    </div>
                    {showQR && shareUrl ? (
                      <div className="w-16 h-16 bg-white rounded p-1 flex items-center justify-center shrink-0">
                        <QRCodeSVG
                          value={shareUrl}
                          size={60}
                          level="H"
                          includeMargin={false}
                          fgColor="#000000"
                          bgColor="#ffffff"
                          style={{ display: 'block' }}
                        />
                      </div>
                    ) : (
                      <span className={`text-xs ${selectedTheme === "light" ? "text-gray-400" : "opacity-60"}`}>
                        扫码阅读全文
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Toggle */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQR(!showQR)}
              className={`gap-2 bg-transparent ${showQR ? "border-primary text-primary" : ""}`}
            >
              <QrCode className="h-4 w-4" />
              {showQR ? "隐藏二维码" : "显示二维码"}
            </Button>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button 
                onClick={handleDownload} 
                disabled={isDownloading}
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? "生成中..." : "下载图片"}
              </Button>
              <Button variant="outline" onClick={handleCopyLink} className="flex-1 gap-2 bg-transparent">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "已复制" : "复制链接"}
              </Button>
            </div>

            {/* Social Share */}
            <div className="space-y-2">
              <Label>分享到社交平台</Label>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareToWechat}
                  className="flex-1 gap-2 bg-transparent hover:bg-[#07C160] hover:text-white hover:border-[#07C160]"
                >
                  <MessageCircle className="h-4 w-4" />
                  微信
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareToDouyin}
                  className="flex-1 gap-2 bg-transparent hover:bg-[#000000] hover:text-white hover:border-[#000000]"
                >
                  <Video className="h-4 w-4" />
                  抖音
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareToZhihu}
                  className="flex-1 gap-2 bg-transparent hover:bg-[#0084FF] hover:text-white hover:border-[#0084FF]"
                >
                  <BookOpen className="h-4 w-4" />
                  知乎
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
