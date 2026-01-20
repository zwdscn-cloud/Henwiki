"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface AnnotationNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  annotation: {
    id: number
    selectedText: string
    color: string
    note: string | null
    tags: string[]
  } | null
  onSave: (data: { color: string; note: string; tags: string[] }) => void
  onDelete?: () => void
}

const COLORS = [
  { name: "yellow", label: "黄色", bg: "bg-yellow-200", hover: "hover:bg-yellow-300" },
  { name: "green", label: "绿色", bg: "bg-green-200", hover: "hover:bg-green-300" },
  { name: "blue", label: "蓝色", bg: "bg-blue-200", hover: "hover:bg-blue-300" },
  { name: "red", label: "红色", bg: "bg-red-200", hover: "hover:bg-red-300" },
  { name: "purple", label: "紫色", bg: "bg-purple-200", hover: "hover:bg-purple-300" },
]

export function AnnotationNoteDialog({
  open,
  onOpenChange,
  annotation,
  onSave,
  onDelete,
}: AnnotationNoteDialogProps) {
  const [color, setColor] = useState("yellow")
  const [note, setNote] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    if (annotation) {
      setColor(annotation.color)
      setNote(annotation.note || "")
      setTags(annotation.tags || [])
    } else {
      setColor("yellow")
      setNote("")
      setTags([])
    }
    setTagInput("")
  }, [annotation, open])

  const handleSave = () => {
    onSave({
      color,
      note: note.trim(),
      tags,
    })
    onOpenChange(false)
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

  if (!annotation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑标记和笔记</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 选中的文本预览 */}
          <div>
            <Label className="text-sm font-medium mb-2 block">选中的文本</Label>
            <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
              {annotation.selectedText}
            </div>
          </div>

          {/* 颜色选择 */}
          <div>
            <Label className="text-sm font-medium mb-2 block">标记颜色</Label>
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className={cn(
                    "w-8 h-8 rounded border-2 transition-all",
                    c.bg,
                    color === c.name
                      ? "border-foreground scale-110"
                      : "border-transparent hover:scale-105"
                  )}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* 笔记输入 */}
          <div>
            <Label htmlFor="note" className="text-sm font-medium mb-2 block">
              笔记
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="添加你的笔记..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* 标签管理 */}
          <div>
            <Label className="text-sm font-medium mb-2 block">标签</Label>
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
                  className="flex-1 px-3 py-2 text-sm border rounded-md"
                />
                <Button size="sm" onClick={handleAddTag} type="button">
                  添加
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-md"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          {onDelete && (
            <Button variant="destructive" onClick={onDelete} type="button">
              删除标记
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            取消
          </Button>
          <Button onClick={handleSave} type="button">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
