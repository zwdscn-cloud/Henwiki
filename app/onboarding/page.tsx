"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Zap, ChevronRight, ChevronLeft, Check, Sparkles, BookOpen, Users, Bell, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { apiGet } from "@/lib/utils/api"

const steps = [
  {
    id: "welcome",
    title: "欢迎加入高能百科！",
    description: "让我们花 1 分钟完成初始设置，定制你的知识探索之旅",
  },
  {
    id: "interests",
    title: "选择你感兴趣的领域",
    description: "我们将根据你的兴趣推荐相关词条和论文",
  },
  {
    id: "features",
    title: "了解核心功能",
    description: "这些功能将帮助你更高效地探索知识",
  },
  {
    id: "complete",
    title: "设置完成！",
    description: "开始你的知识探索之旅吧",
  },
]

const features = [
  {
    icon: BookOpen,
    title: "词条浏览",
    description: "海量前沿科技词条，覆盖 AI、量子计算、生物科技等领域",
  },
  {
    icon: Users,
    title: "社区讨论",
    description: "与专家学者交流观点，参与热门话题讨论",
  },
  {
    icon: Bell,
    title: "智能推送",
    description: "根据你的兴趣，推送最新收录的词条和论文",
  },
  {
    icon: Trophy,
    title: "积分激励",
    description: "贡献内容、参与讨论获得积分，解锁专属徽章",
  },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const router = useRouter()
  const { user, updateProfile } = useAuth()

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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    if (user) {
      updateProfile({ specialties: selectedInterests })
    }
    router.push("/")
  }

  const toggleInterest = (slug: string) => {
    setSelectedInterests((prev) => (prev.includes(slug) ? prev.filter((i) => i !== slug) : [...prev, slug]))
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">高能百科</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            跳过
          </Button>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-card border-b border-border px-6 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index < currentStep
                      ? "bg-primary text-primary-foreground"
                      : index === currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 ${index < currentStep ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Step 0: Welcome */}
          {currentStep === 0 && (
            <div className="text-center space-y-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-4">{steps[0].title}</h1>
                <p className="text-lg text-muted-foreground">{steps[0].description}</p>
              </div>
              {user && (
                <div className="inline-flex items-center gap-3 px-6 py-4 bg-card border border-border rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                    {user.name[0]}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      已获得 <span className="text-primary font-medium">100</span> 注册积分
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Interests */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground mb-2">{steps[1].title}</h1>
                <p className="text-muted-foreground">{steps[1].description}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((category) => {
                  const isSelected = selectedInterests.includes(category.slug)
                  return (
                    <button
                      key={category.slug}
                      onClick={() => toggleInterest(category.slug)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-3 h-3 rounded-full ${category.color}`} />
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <h3 className="font-medium text-foreground">{category.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{category.description}</p>
                    </button>
                  )
                })}
              </div>
              {selectedInterests.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="text-sm text-muted-foreground">已选择：</span>
                  {selectedInterests.map((slug) => {
                    const cat = categories.find((c) => c.slug === slug)
                    return (
                      <Badge key={slug} variant="secondary">
                        {cat?.label}
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Features */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground mb-2">{steps[2].title}</h1>
                <p className="text-muted-foreground">{steps[2].description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature) => {
                  const IconComponent = feature.icon
                  return (
                    <div key={feature.title} className="p-6 rounded-xl border border-border bg-card">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-medium text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {currentStep === 3 && (
            <div className="text-center space-y-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-green-500/10 mb-4">
                <Check className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-4">{steps[3].title}</h1>
                <p className="text-lg text-muted-foreground">{steps[3].description}</p>
              </div>
              <div className="inline-flex flex-col gap-4 p-6 bg-card border border-border rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">获得「新手上路」徽章</p>
                    <p className="text-sm text-muted-foreground">欢迎加入高能百科</p>
                  </div>
                </div>
                {selectedInterests.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">已关注 {selectedInterests.length} 个领域</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedInterests.map((slug) => {
                        const cat = categories.find((c) => c.slug === slug)
                        return (
                          <Badge key={slug} variant="secondary">
                            {cat?.label}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            上一步
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              className="gap-2"
              disabled={currentStep === 1 && selectedInterests.length === 0}
            >
              下一步
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleComplete} className="gap-2">
              开始探索
              <Sparkles className="h-4 w-4" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
