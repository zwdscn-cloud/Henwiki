"use client"

import { useState, useEffect, useRef } from "react"
import { Highlighter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface AnnotationToolbarProps {
  selectedText: string
  position: { top: number; left: number }
  onClose: () => void
  onCreateAnnotation: (data: {
    selectedText: string
    startOffset: number
    endOffset: number
    color: string
    tags: string[]
  }) => void
  containerId?: string
}

const COLORS = [
  { name: "yellow", label: "黄色", bg: "bg-yellow-200", hover: "hover:bg-yellow-300" },
  { name: "green", label: "绿色", bg: "bg-green-200", hover: "hover:bg-green-300" },
  { name: "blue", label: "蓝色", bg: "bg-blue-200", hover: "hover:bg-blue-300" },
  { name: "red", label: "红色", bg: "bg-red-200", hover: "hover:bg-red-300" },
  { name: "purple", label: "紫色", bg: "bg-purple-200", hover: "hover:bg-purple-300" },
]

export function AnnotationToolbar({
  selectedText,
  position,
  onClose,
  onCreateAnnotation,
  containerId,
}: AnnotationToolbarProps) {
  const [selectedColor, setSelectedColor] = useState("yellow")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const toolbarRef = useRef<HTMLDivElement>(null)

  // 计算文本在原始内容中的位置
  const getTextOffsets = (): { startOffset: number; endOffset: number } | null => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return null

    const range = selection.getRangeAt(0)
    const container = containerId ? document.getElementById(containerId) : document.body

    if (!container) return null

    // 获取容器内的纯文本内容
    const containerText = container.innerText || container.textContent || ""
    
    // 计算选中文本在容器文本中的位置
    const preRange = range.cloneRange()
    preRange.selectNodeContents(container)
    preRange.setEnd(range.startContainer, range.startOffset)
    const startOffset = preRange.toString().length

    const endOffset = startOffset + selectedText.length

    return { startOffset, endOffset }
  }

  const handleCreate = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const offsets = getTextOffsets()
    if (!offsets) {
      onClose()
      return
    }

    try {
      await onCreateAnnotation({
        selectedText,
        startOffset: offsets.startOffset,
        endOffset: offsets.endOffset,
        color: selectedColor,
        tags,
      })

      // 成功创建后清除选择
      window.getSelection()?.removeAllRanges()
      onClose()
    } catch (error) {
      console.error("创建标记失败:", error)
      // 失败时不关闭工具栏，让用户重试
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  // 点击外部关闭工具栏 - 使用更宽松的策略
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 如果点击的是工具栏内部，不关闭
      if (toolbarRef.current && toolbarRef.current.contains(event.target as Node)) {
        return
      }

      // 如果点击的是 Popover 内容，不关闭
      const popoverContent = document.querySelector('[data-slot="popover-content"]')
      if (popoverContent && popoverContent.contains(event.target as Node)) {
        return
      }

      // 延迟检查，给用户时间点击工具栏按钮
      setTimeout(() => {
        const selection = window.getSelection()
        // 只有在选择确实被清除时才关闭
        if (!selection || selection.isCollapsed) {
          // 再次确认工具栏没有被点击
          if (toolbarRef.current && !toolbarRef.current.contains(document.activeElement)) {
            onClose()
          }
        }
      }, 100)
    }

    // 使用 click 事件而不是 mousedown，避免过早触发
    document.addEventListener("click", handleClickOutside, true)
    return () => document.removeEventListener("click", handleClickOutside, true)
  }, [onClose])

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[100] bg-card border border-border rounded-lg shadow-lg p-2 flex items-center gap-2"
      style={{
        top: `${Math.max(10, position.top - 10)}px`,
        left: `${position.left}px`,
        transform: "translate(-50%, -100%)",
      }}
      onMouseDown={(e) => {
        // 阻止事件冒泡，防止触发外部点击处理
        e.preventDefault()
        e.stopPropagation()
      }}
      onClick={(e) => {
        // 阻止事件冒泡
        e.stopPropagation()
      }}
    >
      {/* 颜色选择 */}
      <div className="flex items-center gap-1">
        {COLORS.map((color) => (
          <button
            key={color.name}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setSelectedColor(color.name)
            }}
            onMouseDown={(e) => e.preventDefault()}
            className={cn(
              "w-6 h-6 rounded border-2 transition-all cursor-pointer",
              color.bg,
              selectedColor === color.name
                ? "border-foreground scale-110"
                : "border-transparent hover:scale-105"
            )}
            title={color.label}
          />
        ))}
      </div>

      {/* 标签输入 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <Highlighter className="h-3 w-3 mr-1" />
            标签
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="输入标签..."
                className="flex-1 px-2 py-1 text-sm border rounded"
              />
              <Button size="sm" onClick={handleAddTag} className="h-7">
                添加
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* 创建按钮 */}
      <Button 
        size="sm" 
        onClick={handleCreate} 
        className="h-7 text-xs"
        onMouseDown={(e) => e.preventDefault()}
      >
        标记
      </Button>

      {/* 关闭按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onClose()
        }}
        onMouseDown={(e) => e.preventDefault()}
        className="h-7 w-7 p-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
