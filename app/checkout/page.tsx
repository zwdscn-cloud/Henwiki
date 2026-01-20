"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import {
  Zap,
  ArrowLeft,
  Check,
  CreditCard,
  Smartphone,
  Shield,
  Lock,
  Crown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { membershipPlans } from "@/lib/membership-context"

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get("plan") || "pro"
  const isYearly = searchParams.get("yearly") === "true"
  
  const [paymentMethod, setPaymentMethod] = useState("wechat")
  const [isProcessing, setIsProcessing] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [couponApplied, setCouponApplied] = useState(false)
  const [discount, setDiscount] = useState(0)
  
  const plan = membershipPlans.find((p) => p.id === planId) || membershipPlans[1]
  const basePrice = isYearly ? plan.price.yearly : plan.price.monthly
  const finalPrice = basePrice - discount
  
  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === "WELCOME20") {
      setDiscount(Math.round(basePrice * 0.2))
      setCouponApplied(true)
    } else if (couponCode.toUpperCase() === "VIP50") {
      setDiscount(50)
      setCouponApplied(true)
    }
  }
  
  const handlePayment = async () => {
    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    const now = new Date()
    const endDate = new Date(now)
    if (isYearly) {
      endDate.setFullYear(endDate.getFullYear() + 1)
    } else {
      endDate.setMonth(endDate.getMonth() + 1)
    }
    
    localStorage.setItem(
      "gaoneng_membership",
      JSON.stringify({
        tier: plan.tier,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        isYearly,
        autoRenew: true,
      })
    )
    
    router.push("/checkout/success")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/pro" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">高能百科</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            安全支付
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">订单信息</h2>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {isYearly ? "年付方案" : "月付方案"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">¥{basePrice}</p>
                  <p className="text-sm text-muted-foreground">
                    {isYearly ? "/年" : "/月"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">优惠券</h2>
              <div className="flex gap-2">
                <Input
                  placeholder="输入优惠码"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={couponApplied}
                />
                <Button
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={couponApplied || !couponCode}
                >
                  {couponApplied ? "已使用" : "使用"}
                </Button>
              </div>
              {couponApplied && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  优惠券已生效，立减 ¥{discount}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                试试：WELCOME20（首单8折）或 VIP50（立减50元）
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">选择支付方式</h2>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-3">
                  <Label
                    htmlFor="wechat"
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                      paymentMethod === "wechat"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="wechat" id="wechat" />
                      <Smartphone className="h-5 w-5 text-green-500" />
                      <span>微信支付</span>
                    </div>
                    <Badge variant="secondary">推荐</Badge>
                  </Label>
                  
                  <Label
                    htmlFor="alipay"
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                      paymentMethod === "alipay"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="alipay" id="alipay" />
                      <Smartphone className="h-5 w-5 text-blue-500" />
                      <span>支付宝</span>
                    </div>
                  </Label>
                  
                  <Label
                    htmlFor="card"
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="card" id="card" />
                      <CreditCard className="h-5 w-5 text-slate-500" />
                      <span>银行卡支付</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-20">
              <h2 className="text-lg font-semibold mb-4">订单摘要</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{plan.name}</span>
                  <span>¥{basePrice}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>优惠券折扣</span>
                    <span>-¥{discount}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>应付金额</span>
                  <span className="text-primary">¥{finalPrice}</span>
                </div>
              </div>

              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? "处理中..." : `确认支付 ¥${finalPrice}`}
              </Button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>支付安全由高能百科保障</span>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <p className="text-sm font-medium">包含权益：</p>
                <ul className="space-y-1">
                  {plan.features.slice(0, 5).map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/30" />}>
      <CheckoutContent />
    </Suspense>
  )
}
