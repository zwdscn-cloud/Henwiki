"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Zap, Check, Crown, ArrowRight, Gift, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function CheckoutSuccessPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">高能百科</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
              <Check className="h-8 w-8 text-white" />
            </div>
          </div>
          <Badge className="gap-1 mb-4">
            <Crown className="h-3 w-3" />
            Pro 会员
          </Badge>
          <h1 className="text-3xl font-bold mb-2">恭喜！升级成功</h1>
          <p className="text-muted-foreground">
            你已成功升级为 Pro 会员，现在可以享受全部高级功能
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 mb-8 text-left">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            你已解锁以下权益
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              "无限搜索次数",
              "AI 智能问答 100次/天",
              "无限收藏词条",
              "PDF 导出功能",
              "API 访问权限",
              "高级筛选功能",
              "无广告体验",
              "优先客服支持",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 mb-8 text-left">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">新会员专属礼包</h3>
              <p className="text-sm text-muted-foreground mb-3">
                感谢你成为 Pro 会员！我们为你准备了专属福利
              </p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  +500 积分已发放到账户
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  解锁「Pro先锋」专属徽章
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  1张50元续费优惠券
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="gap-2">
              开始探索
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/profile">
            <Button size="lg" variant="outline">
              查看我的会员
            </Button>
          </Link>
        </div>

        {mounted && (
          <div className="mt-12 text-sm text-muted-foreground">
            <p>订单编号：GN{Date.now()}</p>
            <p className="mt-1">
              如有问题，请联系客服：
              <a href="mailto:support@gaoneng.wiki" className="text-primary hover:underline">
                support@gaoneng.wiki
              </a>
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
