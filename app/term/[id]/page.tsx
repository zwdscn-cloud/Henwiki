"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import Link from "next/link"
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Bookmark,
  Share2,
  BadgeCheck,
  Clock,
  Eye,
  Edit,
  Flag,
  ChevronRight,
  ExternalLink,
  Reply,
  Loader2,
  PanelLeft,
  Maximize2,
  Minimize2,
  Type,
  Moon,
  Sun,
  Settings,
} from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ShareCardGenerator } from "@/components/share-card-generator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/utils/api"
import { transformTerm, transformComment } from "@/lib/utils/data-transform"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { AnnotationToolbar } from "@/components/annotation-toolbar"
import { AnnotationSidebar } from "@/components/annotation-sidebar"
import { applyHighlightsToHTML, getTextContent } from "@/lib/utils/annotation-highlight"

function formatNumber(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + "万"
  if (num >= 1000) return (num / 1000).toFixed(1) + "k"
  return num.toString()
}

export default function TermDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const id = params.id as string
  const [term, setTerm] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [relatedTerms, setRelatedTerms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isTogglingFollow, setIsTogglingFollow] = useState(false)
  const [commentContent, setCommentContent] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [tocItems, setTocItems] = useState<Array<{ id: string; level: number; text: string }>>([])
  const [showTOC, setShowTOC] = useState(false)
  const [fullWidthMode, setFullWidthMode] = useState(false)
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg" | "xl">("base")
  const [lineHeight, setLineHeight] = useState<"normal" | "relaxed" | "loose">("relaxed")
  const [activeTocId, setActiveTocId] = useState<string | null>(null)
  const [tocWidth, setTocWidth] = useState(280) // 默认 280px
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  
  // 标记相关状态
  const [annotations, setAnnotations] = useState<any[]>([])
  const [showAnnotations, setShowAnnotations] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null)
  const [highlightedContent, setHighlightedContent] = useState("")

  // 从 localStorage 加载保存的宽度
  useEffect(() => {
    const savedWidth = localStorage.getItem('toc-width')
    if (savedWidth) {
      const width = parseInt(savedWidth, 10)
      if (width >= 200 && width <= 600) {
        setTocWidth(width)
      }
    }
  }, [])

  // 处理拖拽调整宽度
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      // 计算新的宽度：鼠标位置 - 起始位置 + 起始宽度
      const deltaX = e.clientX - resizeStartX
      const newWidth = resizeStartWidth + deltaX
      // 限制宽度范围：200px - 600px
      const clampedWidth = Math.max(200, Math.min(600, newWidth))
      setTocWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false)
        // 保存宽度到 localStorage
        localStorage.setItem('toc-width', tocWidth.toString())
      }
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, resizeStartX, resizeStartWidth, tocWidth])

  useEffect(() => {
    if (id) {
      fetchTerm()
      fetchComments()
      checkLikeStatus()
      checkDislikeStatus()
      if (user) {
        fetchAnnotations()
      }
    }
  }, [id, user])

  useEffect(() => {
    if (term && user) {
      checkFollowStatus()
    }
  }, [term, user])

  // 全页宽模式下，如果有目录项，默认显示目录
  useEffect(() => {
    if (fullWidthMode && tocItems.length > 0) {
      setShowTOC(true)
    }
  }, [fullWidthMode, tocItems.length])

  // 加载标记
  const fetchAnnotations = async () => {
    if (!user || !id) return
    try {
      const response = await apiGet<{ annotations: any[] }>(`/annotations?termId=${id}`)
      if (response.data) {
        setAnnotations(response.data.annotations)
        // 应用高亮
        if (term?.content) {
          applyAnnotationHighlights(term.content, response.data.annotations)
        }
      }
    } catch (error) {
      console.error("Fetch annotations error:", error)
    }
  }

  // 应用标记高亮
  const applyAnnotationHighlights = (content: string, annotations: any[]) => {
    if (annotations.length === 0) {
      setHighlightedContent("")
      return
    }

    // 将内容转换为HTML并应用高亮
    let html = content
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/(<li>.*?<\/li>\n?)+/g, "<ul>$&</ul>")

    // 获取纯文本内容来计算偏移
    const textContent = getTextContent(html)
    
    // 应用高亮
    const highlighted = applyHighlightsToHTML(html, annotations.map(a => ({
      id: a.id,
      startOffset: a.start_offset,
      endOffset: a.end_offset,
      color: a.color,
      selectedText: a.selected_text,
    })))

    setHighlightedContent(highlighted)
  }

  // 文本选择处理
  useEffect(() => {
    if (!user) return

    let selectionTimeout: NodeJS.Timeout | null = null

    const handleTextSelection = (e: MouseEvent) => {
      // 清除之前的超时
      if (selectionTimeout) {
        clearTimeout(selectionTimeout)
      }

      // 延迟执行，确保选择已经完成
      selectionTimeout = setTimeout(() => {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed) {
          // 如果已经有工具栏显示，保持显示（让用户有时间点击）
          // 只有在没有工具栏时才清除
          if (!toolbarPosition) {
            setSelectedText("")
          }
          return
        }

        const selectedText = selection.toString().trim()
        if (selectedText.length === 0) {
          if (!toolbarPosition) {
            setToolbarPosition(null)
          }
          return
        }

        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        // 检查选择是否在内容容器内
        const contentContainer = document.getElementById('content-scroll-container')
        if (contentContainer) {
          const containerRect = contentContainer.getBoundingClientRect()
          // 如果选择在容器内，使用相对于容器的位置
          if (
            rect.top >= containerRect.top &&
            rect.bottom <= containerRect.bottom &&
            rect.left >= containerRect.left &&
            rect.right <= containerRect.right
          ) {
            setSelectedText(selectedText)
            setToolbarPosition({
              top: rect.top + window.scrollY,
              left: rect.left + rect.width / 2 + window.scrollX,
            })
            return
          }
        }

        // 如果不在容器内，使用全局位置
        setSelectedText(selectedText)
        setToolbarPosition({
          top: rect.top + window.scrollY,
          left: rect.left + rect.width / 2 + window.scrollX,
        })
      }, 50) // 增加延迟，确保选择稳定
    }

    // 同时监听 mouseup 和 touchend（移动端支持）
    document.addEventListener("mouseup", handleTextSelection)
    document.addEventListener("touchend", handleTextSelection as any)
    
    return () => {
      if (selectionTimeout) {
        clearTimeout(selectionTimeout)
      }
      document.removeEventListener("mouseup", handleTextSelection)
      document.removeEventListener("touchend", handleTextSelection as any)
    }
  }, [user])

  // 当内容或标记变化时，重新应用高亮
  useEffect(() => {
    if (term?.content && annotations.length > 0) {
      applyAnnotationHighlights(term.content, annotations)
    } else if (term?.content) {
      setHighlightedContent("")
    }
  }, [term?.content, annotations])

  // 创建标记
  const handleCreateAnnotation = async (data: {
    selectedText: string
    startOffset: number
    endOffset: number
    color: string
    tags: string[]
  }) => {
    if (!user || !id) {
      throw new Error("用户未登录或词条ID无效")
    }

    const response = await apiPost<{ annotationId: number }>("/annotations", {
      termId: id,
      targetType: "term",
      ...data,
    })

    if (response.data) {
      toast({
        title: "标记创建成功",
      })
      await fetchAnnotations()
    } else if (response.error) {
      throw new Error(response.error)
    }
  }

  // 编辑标记
  const handleEditAnnotation = async (
    annotationId: number,
    data: { color: string; note: string; tags: string[] }
  ) => {
    try {
      const response = await apiPut<{ message: string }>(`/annotations/${annotationId}`, data)
      if (response.data || !response.error) {
        toast({
          title: "标记更新成功",
        })
        await fetchAnnotations()
      }
    } catch (error: any) {
      toast({
        title: "更新标记失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      })
    }
  }

  // 删除标记
  const handleDeleteAnnotation = async (annotationId: number) => {
    try {
      const response = await apiDelete<{ message: string }>(`/annotations/${annotationId}`)
      if (response.data || !response.error) {
        toast({
          title: "标记删除成功",
        })
        await fetchAnnotations()
      }
    } catch (error: any) {
      toast({
        title: "删除标记失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      })
    }
  }

  // 跳转到标记位置
  const handleJumpToAnnotation = (annotationId: number) => {
    const element = document.querySelector(`[data-annotation-id="${annotationId}"]`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      // 添加临时高亮效果
      element.classList.add("ring-2", "ring-primary", "ring-offset-2")
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-primary", "ring-offset-2")
      }, 2000)
    }
  }

  // 生成标题ID的slug
  const generateHeadingId = (text: string, index: number): string => {
    const slug = text
      .toLowerCase()
      .trim()
      .replace(/[\s\u3000]+/g, '-')
      .replace(/[^\w\u4e00-\u9fa5-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    return slug || `heading-${index}`
  }

  // 解析内容并生成目录
  useEffect(() => {
    if (term?.content) {
      // 先处理markdown格式转换为HTML
      let html = term.content
        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
        .replace(/^### (.+)$/gm, "<h3>$1</h3>")
        .replace(/^- (.+)$/gm, "<li>$1</li>")
        .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n\n/g, "</p><p>")
        .replace(/(<li>.*?<\/li>\n?)+/g, "<ul>$&</ul>")
      
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const headings: Array<{ id: string; level: number; text: string }> = []
      const usedIds = new Set<string>()
      let headingIndex = 0

      // 查找所有标题
      const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
      headingElements.forEach((element) => {
        const text = element.textContent || ''
        const level = parseInt(element.tagName.charAt(1))
        let id = generateHeadingId(text, headingIndex)
        
        // 确保ID唯一
        let uniqueId = id
        let counter = 1
        while (usedIds.has(uniqueId)) {
          uniqueId = `${id}-${counter}`
          counter++
        }
        usedIds.add(uniqueId)
        
        headings.push({ id: uniqueId, level, text })
        headingIndex++
      })

      setTocItems(headings)
    }
  }, [term?.content])

  // 处理内容，为标题添加ID
  const processContentWithIds = (content: string): string => {
    // 先处理markdown格式转换为HTML
    let html = content
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/(<li>.*?<\/li>\n?)+/g, "<ul>$&</ul>")
    
    // 如果内容已经是HTML格式，直接使用
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const usedIds = new Set<string>()
    let headingIndex = 0

    const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
    headingElements.forEach((element) => {
      const text = element.textContent || ''
      let id = generateHeadingId(text, headingIndex)
      
      // 确保ID唯一
      let uniqueId = id
      let counter = 1
      while (usedIds.has(uniqueId)) {
        uniqueId = `${id}-${counter}`
        counter++
      }
      usedIds.add(uniqueId)
      
      element.id = uniqueId
      headingIndex++
    })

    return doc.body.innerHTML
  }

  // 在内容渲染后，确保标题元素有ID
  useEffect(() => {
    if (term?.content && tocItems.length > 0) {
      // 等待DOM更新后，为标题元素设置ID
      const setHeadingIds = () => {
        const contentContainer = document.getElementById('content-scroll-container')
        const fullWidthContainer = document.getElementById('fullwidth-content-scroll-container')
        const container = contentContainer || fullWidthContainer
        
        if (container) {
          const headingElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
          
          // 通过文本内容匹配标题和tocItems，而不是索引
          headingElements.forEach((element) => {
            if (!element.id) {
              const elementText = element.textContent?.trim() || ''
              // 查找匹配的tocItem
              const matchedTocItem = tocItems.find(item => {
                // 精确匹配或文本相似度匹配
                return item.text === elementText || 
                       item.text.includes(elementText) || 
                       elementText.includes(item.text)
              })
              
              if (matchedTocItem) {
                element.id = matchedTocItem.id
              }
            }
          })
        }
      }
      
      // 立即执行一次
      setHeadingIds()
      
      // 延迟执行，确保DOM完全渲染
      const timer1 = setTimeout(setHeadingIds, 200)
      const timer2 = setTimeout(setHeadingIds, 500)
      
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    }
  }, [term?.content, tocItems])

  // 跳转到标题（在内容区域内滚动）
  const scrollToHeading = (id: string) => {
    // 更新选中的目录项
    setActiveTocId(id)
    
    // 添加高亮效果的函数（独立出来，确保即使滚动失败也能应用）
    const applyHighlight = (element: HTMLElement) => {
      element.classList.add('toc-highlight')
      setTimeout(() => {
        element.classList.remove('toc-highlight')
      }, 2000)
    }
    
    // 重试查找元素和滚动（最多3次）
    let retryCount = 0
    const maxRetries = 3
    const retryDelay = 200
    
    const attemptScroll = () => {
      // 优先在滚动容器内查找元素
      const fullWidthContainer = document.getElementById('fullwidth-content-scroll-container')
      const contentContainer = document.getElementById('content-scroll-container')
      const container = fullWidthContainer || contentContainer
      
      let element: HTMLElement | null = null
      
      // 先在容器内查找
      if (container) {
        element = container.querySelector(`#${id}`) as HTMLElement
      }
      
      // 如果容器内找不到，尝试全局查找
      if (!element) {
        element = document.getElementById(id)
      }
      
      if (element) {
        // 找到元素，执行滚动
        performScroll(element)
        // 应用高亮效果
        applyHighlight(element)
      } else if (retryCount < maxRetries) {
        // 没找到元素，重试
        retryCount++
        setTimeout(attemptScroll, retryDelay)
      } else {
        // 达到最大重试次数，尝试通过文本内容查找
        if (container) {
          const tocItem = tocItems.find(item => item.id === id)
          if (tocItem) {
            const headingElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
            for (const heading of Array.from(headingElements)) {
              const headingText = heading.textContent?.trim() || ''
              if (headingText === tocItem.text || 
                  headingText.includes(tocItem.text) || 
                  tocItem.text.includes(headingText)) {
                const headingEl = heading as HTMLElement
                // 设置ID以便后续使用
                headingEl.id = id
                performScroll(headingEl)
                applyHighlight(headingEl)
                break
              }
            }
          }
        }
      }
    }
    
    function performScroll(targetElement: HTMLElement) {
      // 优先查找全页宽模式的滚动容器
      const fullWidthContainer = document.getElementById('fullwidth-content-scroll-container')
      if (fullWidthContainer) {
        // 检查元素是否在容器内（通过遍历父节点）
        let isInContainer = false
        let parent: HTMLElement | null = targetElement.parentElement
        while (parent) {
          if (parent === fullWidthContainer) {
            isInContainer = true
            break
          }
          parent = parent.parentElement
        }
        
        if (isInContainer) {
          const containerRect = fullWidthContainer.getBoundingClientRect()
          const elementRect = targetElement.getBoundingClientRect()
          // 计算元素相对于滚动容器顶部的位置
          const relativeTop = elementRect.top - containerRect.top + fullWidthContainer.scrollTop
          
          fullWidthContainer.scrollTo({
            top: Math.max(0, relativeTop - 20),
            behavior: 'smooth'
          })
          return
        }
      }
      
      // 查找普通模式的滚动容器
      const contentContainer = document.getElementById('content-scroll-container')
      if (contentContainer) {
        // 检查元素是否在容器内
        let isInContainer = false
        let parent: HTMLElement | null = targetElement.parentElement
        while (parent) {
          if (parent === contentContainer) {
            isInContainer = true
            break
          }
          parent = parent.parentElement
        }
        
        if (isInContainer) {
          const containerRect = contentContainer.getBoundingClientRect()
          const elementRect = targetElement.getBoundingClientRect()
          // 计算元素相对于滚动容器顶部的位置
          const relativeTop = elementRect.top - containerRect.top + contentContainer.scrollTop
          
          contentContainer.scrollTo({
            top: Math.max(0, relativeTop - 20),
            behavior: 'smooth'
          })
          return
        }
      }
      
      // 降级方案：如果找不到容器或元素不在容器内，使用scrollIntoView
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    
    // 开始尝试滚动
    attemptScroll()

    // 滚动目录侧边栏到当前选中的目录项
    setTimeout(() => {
      const tocButton = document.querySelector(`button[data-toc-id="${id}"]`) as HTMLElement
      if (tocButton) {
        // 查找包含该按钮的 ScrollArea
        const scrollArea = tocButton.closest('[data-scroll-area]') as HTMLElement
        if (scrollArea) {
          // 查找 ScrollArea 的 viewport（使用 data-slot 属性）
          let scrollContainer = scrollArea.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
          if (!scrollContainer) {
            // 降级方案：尝试查找其他可能的滚动容器
            scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
          }
          if (!scrollContainer) {
            // 如果还是找不到，尝试查找有滚动能力的元素
            const allChildren = scrollArea.querySelectorAll('*')
            for (const child of Array.from(allChildren)) {
              const el = child as HTMLElement
              if (el.scrollHeight > el.clientHeight) {
                scrollContainer = el
                break
              }
            }
          }
          
          if (scrollContainer) {
            const buttonRect = tocButton.getBoundingClientRect()
            const containerRect = scrollContainer.getBoundingClientRect()
            
            // 计算按钮相对于滚动容器的位置
            const buttonTop = buttonRect.top - containerRect.top + scrollContainer.scrollTop
            const buttonBottom = buttonTop + buttonRect.height
            const containerHeight = containerRect.height
            
            // 如果按钮不在可视区域内，滚动到按钮位置
            const currentScrollTop = scrollContainer.scrollTop
            const isAboveView = buttonTop < currentScrollTop
            const isBelowView = buttonBottom > currentScrollTop + containerHeight
            
            if (isAboveView || isBelowView) {
              // 计算目标滚动位置，让按钮居中显示
              const targetScrollTop = buttonTop - containerHeight / 2 + buttonRect.height / 2
              scrollContainer.scrollTo({
                top: Math.max(0, targetScrollTop),
                behavior: 'smooth'
              })
            }
          }
        }
      }
    }, 100)
  }

  const fetchTerm = async () => {
    try {
      const response = await apiGet<{ term: any }>(`/terms/${id}`)
      if (response.data) {
        const transformedTerm = transformTerm(response.data.term)
        setTerm(transformedTerm)
        fetchRelatedTerms(transformedTerm.categorySlug, transformedTerm.id)
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("Fetch term error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await apiGet<{ comments: any[] }>(`/comments?termId=${id}`)
      if (response.data) {
        const transformedComments = response.data.comments.map(transformComment)
        setComments(transformedComments)
      }
    } catch (error) {
      console.error("Fetch comments error:", error)
    }
  }

  const fetchRelatedTerms = async (categorySlug: string, excludeId: string) => {
    try {
      // 获取分类ID
      const categoriesRes = await apiGet<{ categories: any[] }>("/categories")
      if (categoriesRes.data) {
        const category = categoriesRes.data.categories.find((c) => c.slug === categorySlug)
        if (category) {
          const termsRes = await apiGet<{ terms: any[] }>(
            `/terms?categoryId=${category.id}&status=published&pageSize=4`
          )
          if (termsRes.data) {
            const filtered = termsRes.data.terms
              .filter((t) => t.id.toString() !== excludeId)
              .slice(0, 3)
              .map(transformTerm)
            setRelatedTerms(filtered)
          }
        }
      }
    } catch (error) {
      console.error("Fetch related terms error:", error)
    }
  }

  const checkLikeStatus = async () => {
    if (!user) return
    try {
      const response = await apiGet<{ liked: boolean }>(`/terms/${id}/like`)
      if (response.data) {
        setIsLiked(response.data.liked)
      }
    } catch (error) {
      console.error("Check like status error:", error)
    }
  }

  const checkDislikeStatus = async () => {
    if (!user) return
    try {
      const response = await apiGet<{ disliked: boolean }>(`/terms/${id}/dislike`)
      if (response.data) {
        setIsDisliked(response.data.disliked)
      }
    } catch (error) {
      console.error("Check dislike status error:", error)
    }
  }

  const checkFollowStatus = async () => {
    if (!user || !term) return
    try {
      const response = await apiGet<{ isFollowing: boolean }>(`/users/${term.author.id}/follow`)
      if (response.data) {
        setIsFollowing(response.data.isFollowing)
      }
    } catch (error) {
      console.error("Check follow status error:", error)
    }
  }

  const handleToggleFollow = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    if (!term) return

    // 不能关注自己
    if (user.id === term.author.id) {
      return
    }

    setIsTogglingFollow(true)
    try {
      if (isFollowing) {
        // 取消关注
        const response = await apiDelete<{ message: string }>(`/users/${term.author.id}/follow`)
        if (response.data || !response.error) {
          setIsFollowing(false)
        } else {
          console.error("Unfollow error:", response.error)
        }
      } else {
        // 关注
        const response = await apiPost<{ message: string }>(`/users/${term.author.id}/follow`)
        if (response.data || !response.error) {
          setIsFollowing(true)
        } else {
          console.error("Follow error:", response.error)
        }
      }
    } catch (error) {
      console.error("Toggle follow error:", error)
    } finally {
      setIsTogglingFollow(false)
    }
  }

  const handleLike = async () => {
    if (!user) {
      router.push("/login")
      return
    }
    try {
      const response = await apiPost<{ liked: boolean; likesCount: number }>(`/terms/${id}/like`)
      if (response.data) {
        setIsLiked(response.data.liked)
        // 如果点赞了，取消踩
        if (response.data.liked && isDisliked) {
          setIsDisliked(false)
          await apiPost<{ disliked: boolean }>(`/terms/${id}/dislike`)
        }
        if (term) {
          setTerm({ ...term, stats: { ...term.stats, likes: response.data.likesCount } })
        }
      }
    } catch (error) {
      console.error("Like error:", error)
    }
  }

  const handleDislike = async () => {
    if (!user) {
      router.push("/login")
      return
    }
    try {
      const response = await apiPost<{ disliked: boolean }>(`/terms/${id}/dislike`)
      if (response.data) {
        setIsDisliked(response.data.disliked)
        // 如果踩了，取消点赞
        if (response.data.disliked && isLiked) {
          setIsLiked(false)
          const likeResponse = await apiPost<{ liked: boolean; likesCount: number }>(`/terms/${id}/like`)
          // 更新点赞数
          if (likeResponse.data && term) {
            setTerm({ ...term, stats: { ...term.stats, likes: likeResponse.data.likesCount } })
          }
        }
      } else if (response.error) {
        toast({
          title: "操作失败",
          description: response.error,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Dislike error:", error)
      toast({
        title: "操作失败",
        description: error.message || "网络错误，请稍后重试",
        variant: "destructive",
      })
    }
  }

  const handleSubmitComment = async () => {
    if (!user) {
      router.push("/login")
      return
    }
    if (!commentContent.trim()) return

    setIsSubmittingComment(true)
    try {
      const response = await apiPost<{ commentId: number }>("/comments", {
        termId: parseInt(id),
        content: commentContent,
      })
      if (response.data) {
        setCommentContent("")
        fetchComments()
        if (term) {
          setTerm({ ...term, stats: { ...term.stats, comments: term.stats.comments + 1 } })
        }
      }
    } catch (error) {
      console.error("Submit comment error:", error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  if (isLoading) {
    return (
      <PageLayout showRightSidebar={false}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    )
  }

  if (!term) {
    return (
      <PageLayout showRightSidebar={false}>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">词条不存在</p>
          <Button onClick={() => router.push("/")} variant="outline">
            返回首页
          </Button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout showRightSidebar={false} showLeftSidebar={false}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <nav className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-foreground">
            首页
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/category/${term.categorySlug}`} className="hover:text-foreground">
            {term.category}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{term.title}</span>
        </nav>

        {/* Main Article */}
        <article className="bg-card rounded-lg border border-border">
          <div className="p-4 sm:p-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2 mb-2">
                  {term.title}
                  {term.isVerified && <BadgeCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {term.category}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    更新于 {term.updatedAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    {formatNumber(term.stats.views)} 阅读
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                    onClick={() => setShowAnnotations(!showAnnotations)}
                    title="标记管理"
                  >
                    <Bookmark className="h-4 w-4" />
                    <span className="hidden sm:inline">标记</span>
                    {annotations.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {annotations.length}
                      </Badge>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={() => setFullWidthMode(true)}
                  title="全页宽阅读模式"
                >
                  <Maximize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">全页宽阅读</span>
                </Button>
                {user && term.author.id === user.id && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-transparent hidden sm:flex"
                      asChild
                    >
                      <Link href={`/term/${id}/edit`}>
                        <Edit className="h-4 w-4" />
                        编辑
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 sm:hidden bg-transparent"
                      asChild
                    >
                      <Link href={`/term/${id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {term.tags.map((tag: string) => (
                <Link key={tag} href={`/tag/${tag}`} className="text-xs sm:text-sm text-primary hover:underline">
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          <Separator />

          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarImage src={term.author.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary">{term.author.name[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <Link
                  href={`/user/${term.author.id}`}
                  className="font-medium text-foreground hover:text-primary text-sm sm:text-base"
                >
                  {term.author.name}
                </Link>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{term.author.bio}</p>
              </div>
            </div>
            {user && user.id !== term.author.id && (
              <Button
                variant={isFollowing ? "default" : "outline"}
                size="sm"
                className={`w-full sm:w-auto ${isFollowing ? "" : "bg-transparent"}`}
                onClick={handleToggleFollow}
                disabled={isTogglingFollow}
              >
                {isTogglingFollow ? "处理中..." : isFollowing ? "已关注" : "关注"}
              </Button>
            )}
          </div>

          <Separator />

          <div className="flex gap-6">
            {/* TOC Sidebar */}
            {showTOC && tocItems.length > 0 && (
              <div className="flex shrink-0 hidden xl:flex sticky top-4 self-start" style={{ width: `${tocWidth}px` }}>
                <div className="border-r border-border bg-muted/20 w-full">
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <h3 className="text-sm font-medium">目录</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowTOC(false)}
                    >
                      <PanelLeft className="h-4 w-4" />
                    </Button>
                  </div>
                  <ScrollArea className="h-[calc(100vh-200px)]" data-scroll-area>
                    <div className="p-2">
                      <nav className="space-y-1">
                        {tocItems.map((item) => (
                          <button
                            key={item.id}
                            data-toc-id={item.id}
                            onClick={() => scrollToHeading(item.id)}
                            className={cn(
                              "block w-full text-left text-sm py-1 px-2 rounded truncate transition-colors",
                              "hover:bg-primary hover:text-white",
                              activeTocId === item.id && "bg-primary text-white",
                              item.level === 1 && "font-medium",
                              item.level === 2 && !(activeTocId === item.id) && "pl-4 text-muted-foreground",
                              item.level === 3 && !(activeTocId === item.id) && "pl-6 text-muted-foreground text-xs",
                              item.level === 4 && !(activeTocId === item.id) && "pl-8 text-muted-foreground text-xs"
                            )}
                          >
                            {item.text || "无标题"}
                          </button>
                        ))}
                      </nav>
                    </div>
                  </ScrollArea>
                </div>
                {/* 拖拽分隔条 */}
                <div
                  className="relative group"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    // 获取 TOC 容器的位置和当前宽度
                    const tocContainer = e.currentTarget.parentElement
                    if (tocContainer) {
                      const rect = tocContainer.getBoundingClientRect()
                      setResizeStartX(e.clientX)
                      setResizeStartWidth(rect.width)
                      setIsResizing(true)
                    }
                  }}
                >
                  {/* 超细竖线 - 始终显示为 1px */}
                  <div className={cn(
                    "absolute inset-y-0 left-0 w-px bg-border transition-colors",
                    isResizing ? "bg-primary" : "group-hover:bg-primary"
                  )} />
                  {/* 增加可点击区域，使拖拽更容易（透明，不影响视觉效果） */}
                  <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 min-w-0 max-w-4xl">
              <div 
                id="content-scroll-container"
                className="h-[calc(100vh-200px)] overflow-y-auto"
              >
                <div className="p-4 sm:p-6 prose prose-neutral dark:prose-invert max-w-none">
                {!showTOC && tocItems.length > 0 && (
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTOC(true)}
                      className="gap-2"
                    >
                      <PanelLeft className="h-4 w-4" />
                      显示目录
                    </Button>
                  </div>
                )}
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4 sm:mb-6">{term.summary}</p>
                <div
                  id="content-scroll-container"
                  className="text-sm sm:text-base [&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-6 sm:[&_h2]:mt-8 [&_h2]:mb-3 sm:[&_h2]:mb-4 [&_h3]:text-base sm:[&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-foreground [&_h3]:mt-4 sm:[&_h3]:mt-6 [&_h3]:mb-2 sm:[&_h3]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-3 sm:[&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 sm:[&_ul]:pl-6 [&_ul]:mb-3 sm:[&_ul]:mb-4 [&_li]:text-muted-foreground [&_li]:mb-1.5 sm:[&_li]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 sm:[&_ol]:pl-6 [&_ol]:mb-3 sm:[&_ol]:mb-4 [&_strong]:text-foreground [&_h1]:scroll-mt-4 [&_h2]:scroll-mt-4 [&_h3]:scroll-mt-4 [&_h4]:scroll-mt-4 [&_mark]:rounded [&_mark]:px-0.5"
                  dangerouslySetInnerHTML={{
                    __html: highlightedContent || processContentWithIds(
                      term.content
                        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
                        .replace(/^### (.+)$/gm, "<h3>$1</h3>")
                        .replace(/^- (.+)$/gm, "<li>$1</li>")
                        .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
                        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\n\n/g, "</p><p>")
                        .replace(/(<li>.*?<\/li>\n?)+/g, "<ul>$&</ul>")
                    ),
                  }}
                />
                
                {/* References */}
                {term.references && term.references.length > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div className="px-4 sm:px-6">
                      <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">参考资料</h3>
                      <ul className="space-y-2">
                        {term.references.map((ref: any, index: number) => (
                          <li key={index}>
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              {ref.title}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                className={`gap-1.5 sm:gap-2 flex-1 sm:flex-none ${
                  isLiked ? "" : "bg-transparent"
                }`}
                onClick={handleLike}
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="text-xs sm:text-sm">有帮助 ({formatNumber(term.stats.likes)})</span>
              </Button>
              <Button
                variant={isDisliked ? "default" : "ghost"}
                size="sm"
                className={`gap-2 ${isDisliked ? "" : "text-muted-foreground"}`}
                onClick={handleDislike}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center sm:justify-end gap-2">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground flex-1 sm:flex-none">
                <Bookmark className="h-4 w-4" />
                <span className="text-xs sm:text-sm">收藏</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground flex-1 sm:flex-none"
                onClick={() => setShareDialogOpen(true)}
              >
                <Share2 className="h-4 w-4" />
                <span className="text-xs sm:text-sm">分享</span>
              </Button>
            </div>
          </div>
        </article>

        {relatedTerms.length > 0 && (
          <div className="mt-4 sm:mt-6">
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">相关词条</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {relatedTerms.map((t) => (
                <Link
                  key={t.id}
                  href={`/term/${t.id}`}
                  className="bg-card rounded-lg border border-border p-3 sm:p-4 hover:border-primary/50 transition-colors"
                >
                  <h4 className="font-medium text-foreground mb-1 sm:mb-2 text-sm sm:text-base">{t.title}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{t.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 sm:mt-6 bg-card rounded-lg border border-border p-4 sm:p-6">
          <h3 className="font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            讨论 ({term.stats.comments})
          </h3>

          {/* Comment Input */}
          <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                {user?.name?.[0] || "用"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder={user ? "分享你的见解..." : "请先登录"}
                className="min-h-[60px] sm:min-h-[80px] resize-none mb-2 text-sm"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                disabled={!user || isSubmittingComment}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={handleSubmitComment}
                  disabled={!user || !commentContent.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? "提交中..." : "发表评论"}
                </Button>
              </div>
            </div>
          </div>

          <Separator className="mb-4 sm:mb-6" />

          {/* Comments List */}
          <div className="space-y-4 sm:space-y-6">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">暂无评论</div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="space-y-3 sm:space-y-4">
                <div className="flex gap-2 sm:gap-3">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                    <AvatarImage src={comment.author.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                      {comment.author.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-foreground text-xs sm:text-sm">{comment.author.name}</span>
                      <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">{comment.content}</p>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        <span className="text-xs">{comment.likes}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground gap-1">
                        <Reply className="h-3 w-3" />
                        <span className="text-xs">回复</span>
                      </Button>
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 sm:mt-4 pl-3 sm:pl-4 border-l-2 border-border space-y-3 sm:space-y-4">
                        {comment.replies.map((reply: any) => (
                          <div key={reply.id} className="flex gap-2 sm:gap-3">
                            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 shrink-0">
                              <AvatarImage src={reply.author.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {reply.author.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-medium text-foreground text-xs sm:text-sm">
                                  {reply.author.name}
                                </span>
                                <span className="text-xs text-muted-foreground">{reply.createdAt}</span>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ShareCardGenerator open={shareDialogOpen} onOpenChange={setShareDialogOpen} term={term} />

      {/* Annotation Toolbar */}
      {user && toolbarPosition && selectedText && (
        <AnnotationToolbar
          selectedText={selectedText}
          position={toolbarPosition}
          onClose={() => {
            setToolbarPosition(null)
            setSelectedText("")
          }}
          onCreateAnnotation={handleCreateAnnotation}
          containerId="content-scroll-container"
        />
      )}

      {/* Full Width Reading Mode */}
      {fullWidthMode && (
        <div className={cn("fixed inset-0 z-50 bg-background", theme === "dark" && "dark")}>
          {/* Header Bar */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* 左侧：阅读控制按钮 */}
              <div className="hidden md:flex items-center gap-2 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFontSize(fontSize === "sm" ? "base" : fontSize === "base" ? "lg" : fontSize === "lg" ? "xl" : "sm")}
                  className="gap-2 text-foreground"
                >
                  <Type className="h-4 w-4" />
                  <span className="text-xs text-foreground">
                    {fontSize === "sm" ? "小" : fontSize === "base" ? "标准" : fontSize === "lg" ? "大" : "特大"}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLineHeight(lineHeight === "normal" ? "relaxed" : lineHeight === "relaxed" ? "loose" : "normal")}
                  className="gap-2 text-foreground"
                >
                  <span className="text-xs text-foreground">
                    {lineHeight === "normal" ? "紧凑" : lineHeight === "relaxed" ? "舒适" : "宽松"}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="gap-2 text-foreground"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span className="text-xs hidden sm:inline text-foreground">{theme === "dark" ? "浅色" : "深色"}</span>
                </Button>
              </div>
              
              {/* 中间：标题 */}
              <div className="flex-1 flex justify-center">
                <h2 className="text-lg font-semibold truncate max-w-md text-center text-foreground">{term.title}</h2>
              </div>
              
              {/* 右侧：目录和退出按钮 */}
              <div className="flex items-center gap-2 flex-1 justify-end">
                {tocItems.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTOC(!showTOC)}
                    className="gap-2 text-foreground"
                  >
                    <PanelLeft className="h-4 w-4" />
                    <span className="hidden sm:inline text-foreground">目录</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFullWidthMode(false)}
                  className="gap-2 text-foreground"
                >
                  <Minimize2 className="h-4 w-4" />
                  <span className="hidden sm:inline text-foreground">退出全屏</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex h-[calc(100vh-60px)]">
            {/* TOC Sidebar */}
            {showTOC && tocItems.length > 0 && (
              <div className="flex shrink-0 hidden lg:flex" style={{ width: `${tocWidth}px` }}>
                <div className="border-r border-border bg-muted/20 w-full">
                  <div className="p-3 border-b border-border">
                    <h3 className="text-sm font-medium text-foreground">目录</h3>
                  </div>
                  <ScrollArea className="h-[calc(100vh-120px)]" data-scroll-area>
                    <div className="p-2">
                      <nav className="space-y-1">
                        {tocItems.map((item) => (
                          <button
                            key={item.id}
                            data-toc-id={item.id}
                            onClick={() => scrollToHeading(item.id)}
                            className={cn(
                              "block w-full text-left text-sm py-1 px-2 rounded truncate transition-colors",
                              "hover:bg-primary hover:text-white",
                              activeTocId === item.id && "bg-primary text-white",
                              item.level === 1 && "font-medium",
                              item.level === 2 && !(activeTocId === item.id) && "pl-4 text-muted-foreground",
                              item.level === 3 && !(activeTocId === item.id) && "pl-6 text-muted-foreground text-xs",
                              item.level === 4 && !(activeTocId === item.id) && "pl-8 text-muted-foreground text-xs"
                            )}
                          >
                            {item.text || "无标题"}
                          </button>
                        ))}
                      </nav>
                    </div>
                  </ScrollArea>
                </div>
                {/* 拖拽分隔条 */}
                <div
                  className="relative group"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    // 获取 TOC 容器的位置和当前宽度
                    const tocContainer = e.currentTarget.parentElement
                    if (tocContainer) {
                      const rect = tocContainer.getBoundingClientRect()
                      setResizeStartX(e.clientX)
                      setResizeStartWidth(rect.width)
                      setIsResizing(true)
                    }
                  }}
                >
                  {/* 超细竖线 - 始终显示为 1px */}
                  <div className={cn(
                    "absolute inset-y-0 left-0 w-px bg-border transition-colors",
                    isResizing ? "bg-primary" : "group-hover:bg-primary"
                  )} />
                  {/* 增加可点击区域，使拖拽更容易（透明，不影响视觉效果） */}
                  <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
                </div>
              </div>
            )}

            {/* Main Content */}
            <div 
              id="fullwidth-content-scroll-container"
              className="flex-1 overflow-y-auto"
            >
              <div 
                className={cn(
                  "max-w-4xl mx-auto px-6 py-8",
                  fontSize === "sm" && "text-sm",
                  fontSize === "base" && "text-base",
                  fontSize === "lg" && "text-lg",
                  fontSize === "xl" && "text-xl",
                  lineHeight === "normal" && "leading-normal",
                  lineHeight === "relaxed" && "leading-relaxed",
                  lineHeight === "loose" && "leading-loose"
                )}
              >
                <div className={cn(
                  "prose prose-neutral dark:prose-invert max-w-none",
                  fontSize === "sm" && "prose-sm",
                  fontSize === "base" && "prose-base",
                  fontSize === "lg" && "prose-lg",
                  fontSize === "xl" && "prose-xl"
                )}>
                  <p className={cn(
                    "text-muted-foreground mb-6",
                    fontSize === "sm" && "text-sm",
                    fontSize === "base" && "text-base",
                    fontSize === "lg" && "text-lg",
                    fontSize === "xl" && "text-xl"
                  )}>
                    {term.summary}
                  </p>
                  <div
                    className={cn(
                      "[&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-4",
                      "[&_h3]:font-medium [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-3",
                      "[&_p]:text-foreground [&_p]:mb-4",
                      "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4",
                      "[&_li]:text-foreground [&_li]:mb-2",
                      "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4",
                      "[&_strong]:text-foreground",
                      "[&_h1]:scroll-mt-4 [&_h2]:scroll-mt-4 [&_h3]:scroll-mt-4 [&_h4]:scroll-mt-4"
                    )}
                    dangerouslySetInnerHTML={{
                      __html: processContentWithIds(
                        term.content
                          .replace(/^## (.+)$/gm, "<h2>$1</h2>")
                          .replace(/^### (.+)$/gm, "<h3>$1</h3>")
                          .replace(/^- (.+)$/gm, "<li>$1</li>")
                          .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
                          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\n\n/g, "</p><p>")
                          .replace(/(<li>.*?<\/li>\n?)+/g, "<ul>$&</ul>")
                      ),
                    }}
                  />
                  
                  {/* References */}
                  {term.references && term.references.length > 0 && (
                    <>
                      <Separator className="my-8" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-4">参考资料</h3>
                        <ul className="space-y-2">
                          {term.references.map((ref: any, index: number) => (
                            <li key={index}>
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                {ref.title}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
