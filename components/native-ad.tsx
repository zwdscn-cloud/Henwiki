"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { X, ExternalLink, Sparkles, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiGet } from "@/lib/utils/api"

interface NativeAdProps {
  variant?: "feed" | "sidebar" | "banner" | "inline"
  className?: string
  adIndex?: number // 用于稳定选择广告，避免 hydration 错误
}

interface Ad {
  id: number
  title: string
  description: string | null
  image: string
  url: string
  sponsor: string
  cta: string
  tag: string
  variant: string
  type: string
  gradient: string
}

// 模拟广告数据（作为后备）
const mockAds = {
  feed: [
    {
      id: "ad1",
      type: "course",
      title: "AI大模型实战训练营",
      description: "从零到一掌握大语言模型开发，含GPT、Claude、LLaMA等主流模型实战",
      image: "/ai-researcher-avatar.jpg",
      sponsor: "极客时间",
      cta: "立即报名",
      url: "#",
      tag: "热门课程",
    },
    {
      id: "ad2",
      type: "product",
      title: "GPU云服务器 首月5折",
      description: "A100/H100算力资源，弹性扩展，按需付费，助力AI研发",
      image: "/tech-editor-avatar.jpg",
      sponsor: "阿里云",
      cta: "了解详情",
      url: "#",
      tag: "限时优惠",
    },
  ],
  sidebar: [
    {
      id: "ad3",
      type: "event",
      title: "2024全球AI开发者大会",
      description: "1月20日 北京·国家会议中心",
      image: "/material-scientist-avatar.jpg",
      sponsor: "CSDN",
      cta: "免费报名",
      url: "#",
    },
  ],
  banner: [
    {
      id: "ad4",
      type: "brand",
      title: "探索知识的边界",
      description: "高能百科Pro会员，解锁全部高级功能",
      sponsor: "高能百科",
      cta: "立即升级",
      url: "/pro",
      gradient: "from-primary to-primary/80",
    },
  ],
}

export function NativeAd({ variant = "feed", className = "", adIndex = 0 }: NativeAdProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 从API获取广告数据
    const fetchAds = async () => {
      try {
        const response = await apiGet<{ ads: Ad[] }>(`/ads?variant=${variant}&limit=10`)
        if (response.data && response.data.ads && response.data.ads.length > 0) {
          setAds(response.data.ads)
        }
      } catch (err) {
        console.error("Failed to fetch ads:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAds()
  }, [variant])

  if (!isVisible) return null

  // 信息流广告
  if (variant === "feed") {
    // 优先使用数据库中的广告，如果没有则使用模拟数据
    let ad: any
    if (ads.length > 0) {
      ad = ads[adIndex % ads.length]
    } else {
      ad = mockAds.feed[adIndex % mockAds.feed.length]
    }
    
    // 如果广告数据不完整，使用模拟数据
    if (!ad || !ad.title) {
      ad = mockAds.feed[adIndex % mockAds.feed.length]
    }
    return (
      <div
        className={`bg-card border border-border rounded-xl p-4 relative group ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start gap-4">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
            <Image src={ad.image || "/placeholder.svg"} alt={ad.title} fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                广告
              </Badge>
              {ad.tag && (
                <Badge variant="secondary" className="text-xs">
                  {ad.tag}
                </Badge>
              )}
            </div>
            <h3 className="font-medium text-foreground mb-1 line-clamp-1">{ad.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ad.description || ""}</p>
            <div className="flex items-center justify-between">
              {ad.sponsor && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {ad.sponsor} 赞助
                </span>
              )}
              <Link href={ad.url || "#"}>
                <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent">
                  {ad.cta || "了解详情"}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {isHovered && (
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 p-1 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    )
  }

  // 侧边栏广告
  if (variant === "sidebar") {
    let ad: any
    if (ads.length > 0) {
      ad = ads[0]
    } else {
      ad = mockAds.sidebar[0]
    }
    
    if (!ad || !ad.title) {
      ad = mockAds.sidebar[0]
    }
    
    return (
      <div className={`bg-card border border-border rounded-xl overflow-hidden ${className}`}>
        <div className="relative h-32 bg-muted">
          <Image src={ad.image || "/placeholder.svg"} alt={ad.title} fill className="object-cover" />
          <Badge variant="outline" className="absolute top-2 left-2 text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
            广告
          </Badge>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-foreground mb-1">{ad.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{ad.description || ""}</p>
          <Link href={ad.url || "#"} className="block">
            <Button size="sm" className="w-full">
              {ad.cta || "了解详情"}
            </Button>
          </Link>
          {ad.sponsor && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {ad.sponsor} 赞助
            </p>
          )}
        </div>
      </div>
    )
  }

  // 横幅广告
  if (variant === "banner") {
    let ad: any
    if (ads.length > 0) {
      ad = ads[0]
    } else {
      ad = mockAds.banner[0]
    }
    
    if (!ad || !ad.title) {
      ad = mockAds.banner[0]
    }
    
    return (
      <div
        className={`relative rounded-xl overflow-hidden bg-gradient-to-r ${ad.gradient || "from-primary to-primary/80"} text-primary-foreground p-6 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{ad.title}</h3>
              <p className="text-sm opacity-90">{ad.description || ""}</p>
            </div>
          </div>
          <Link href={ad.url || "#"}>
            <Button variant="secondary" size="sm">
              {ad.cta || "了解详情"}
            </Button>
          </Link>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/30"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // 文章内嵌广告
  if (variant === "inline") {
    return (
      <div className={`my-6 p-4 bg-muted/50 rounded-lg border border-border ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
            推广
          </Badge>
          <span className="text-xs text-muted-foreground">相关推荐</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-1">想深入了解这个领域？</h4>
            <p className="text-xs text-muted-foreground">
              加入高能百科Pro，获取专家深度解读和独家内容
            </p>
          </div>
          <Link href="/pro">
            <Button size="sm" variant="outline" className="bg-transparent shrink-0">
              了解Pro
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return null
}

// 广告插入组件 - 用于信息流中
export function AdSlot({ index }: { index: number }) {
  // 每5条内容后插入一个广告
  if ((index + 1) % 5 === 0) {
    // 传递 adIndex 确保服务器端和客户端选择相同的广告
    return <NativeAd variant="feed" className="my-4" adIndex={Math.floor(index / 5)} />
  }
  return null
}
