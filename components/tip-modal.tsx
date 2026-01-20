"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Heart, Coffee, Gift, Sparkles, X, Check, Loader2, QrCode, MessageCircle, Wallet } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiGet } from "@/lib/utils/api"

interface TipModalProps {
  isOpen: boolean
  onClose: () => void
  author: {
    id: string
    name: string
    avatar: string
    bio?: string
  }
  termTitle?: string
}

const tipAmounts = [
  { value: 5, label: "5元", icon: Coffee, desc: "一杯咖啡" },
  { value: 10, label: "10元", icon: Heart, desc: "小小心意" },
  { value: 20, label: "20元", icon: Gift, desc: "感谢支持" },
  { value: 50, label: "50元", icon: Sparkles, desc: "大力支持" },
]

export function TipModal({ isOpen, onClose, author, termTitle }: TipModalProps) {
  const [authorInfo, setAuthorInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"wechat" | "alipay">("wechat")

  useEffect(() => {
    if (isOpen && author.id) {
      fetchAuthorInfo()
    }
  }, [isOpen, author.id])

  const fetchAuthorInfo = async () => {
    setIsLoading(true)
    try {
      const response = await apiGet<{ user: any }>(`/users/${author.id}`)
      if (response.data) {
        console.log("[TipModal] Fetched author info:", response.data.user)
        console.log("[TipModal] WeChat QR code:", response.data.user.wechat_qr_code)
        console.log("[TipModal] Alipay QR code:", response.data.user.alipay_qr_code)
        setAuthorInfo(response.data.user)
        // 根据收款码可用性设置默认标签页
        if (response.data.user.wechat_qr_code && response.data.user.alipay_qr_code) {
          setActiveTab("wechat")
        } else if (response.data.user.alipay_qr_code) {
          setActiveTab("alipay")
        } else if (response.data.user.wechat_qr_code) {
          setActiveTab("wechat")
        }
      }
    } catch (err) {
      console.error("Fetch author info error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const hasWechatCode = authorInfo?.wechat_qr_code && authorInfo.wechat_qr_code.trim() !== ""
  const hasAlipayCode = authorInfo?.alipay_qr_code && authorInfo.alipay_qr_code.trim() !== ""
  const hasAnyCode = hasWechatCode || hasAlipayCode
  const hasBothCodes = hasWechatCode && hasAlipayCode

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            打赏作者
          </DialogTitle>
          <DialogDescription>
            扫码支付，直接打赏给作者
          </DialogDescription>
        </DialogHeader>

        {/* Author Info */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="w-12 h-12 rounded-full bg-muted overflow-hidden relative shrink-0">
            <Image
              src={author.avatar || "/placeholder.svg"}
              alt={author.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{author.name}</p>
            {termTitle && (
              <p className="text-sm text-muted-foreground truncate">
                感谢创作「{termTitle}」
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !hasAnyCode ? (
          <div className="py-8 text-center">
            <QrCode className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">作者暂未设置收款码</p>
            <p className="text-sm text-muted-foreground/70">
              请提醒作者在设置中上传收款码
            </p>
          </div>
        ) : hasBothCodes ? (
          // 两个收款码都有，显示标签页选择
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "wechat" | "alipay")} className="w-full">
            <TabsContent value="wechat" className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-64 h-64 bg-white rounded-lg border-2 border-border p-4 flex items-center justify-center">
                  <Image
                    src={authorInfo.wechat_qr_code}
                    alt="微信收款码"
                    fill
                    className="object-contain rounded"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  使用微信扫一扫，向作者打赏
                </p>
              </div>
            </TabsContent>

            <TabsContent value="alipay" className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-64 h-64 bg-white rounded-lg border-2 border-border p-4 flex items-center justify-center">
                  <Image
                    src={authorInfo.alipay_qr_code}
                    alt="支付宝收款码"
                    fill
                    className="object-contain rounded"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  使用支付宝扫一扫，向作者打赏
                </p>
              </div>
            </TabsContent>

            <TabsList className="grid w-full grid-cols-2 mt-4">
              <TabsTrigger value="wechat" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                微信打赏
              </TabsTrigger>
              <TabsTrigger value="alipay" className="gap-2">
                <Wallet className="h-4 w-4" />
                支付宝打赏
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          // 只有一个收款码，直接显示
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-64 h-64 bg-white rounded-lg border-2 border-border p-4 flex items-center justify-center">
                <Image
                  src={hasWechatCode ? authorInfo.wechat_qr_code : authorInfo.alipay_qr_code}
                  alt={hasWechatCode ? "微信收款码" : "支付宝收款码"}
                  fill
                  className="object-contain rounded"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                使用{hasWechatCode ? "微信" : "支付宝"}扫一扫，向作者打赏
              </p>
            </div>
          </div>
        )}

        {/* Note */}
        <p className="text-xs text-center text-muted-foreground mt-4">
          打赏金额将直接转入作者账户，请确认收款方信息
        </p>

        {/* Close Button */}
        <Button variant="outline" className="w-full bg-transparent" onClick={onClose}>
          关闭
        </Button>
      </DialogContent>
    </Dialog>
  )
}

// 打赏按钮组件，可以在词条卡片或详情页使用
interface TipButtonProps {
  author: {
    id: string
    name: string
    avatar: string
  }
  termTitle?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function TipButton({
  author,
  termTitle,
  variant = "outline",
  size = "sm",
  className = "",
}: TipButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`gap-1 ${className} ${variant === "outline" ? "bg-transparent" : ""}`}
        onClick={() => setIsModalOpen(true)}
      >
        <Heart className="h-4 w-4" />
        打赏
      </Button>
      <TipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        author={author}
        termTitle={termTitle}
      />
    </>
  )
}
