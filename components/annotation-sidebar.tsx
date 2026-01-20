"use client"

import { useState } from "react"
import { BookOpen, Edit, Trash2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AnnotationNoteDialog } from "./annotation-note-dialog"

interface Annotation {
  id: number
  selectedText: string
  color: string
  note: string | null
  tags: string[]
  created_at: string
}

interface AnnotationSidebarProps {
  annotations: Annotation[]
  onEdit: (id: number, data: { color: string; note: string; tags: string[] }) => void
  onDelete: (id: number) => void
  onJumpToAnnotation: (id: number) => void
}

const colorClasses: Record<string, string> = {
  yellow: "bg-yellow-200 dark:bg-yellow-900/30 border-yellow-300",
  green: "bg-green-200 dark:bg-green-900/30 border-green-300",
  blue: "bg-blue-200 dark:bg-blue-900/30 border-blue-300",
  red: "bg-red-200 dark:bg-red-900/30 border-red-300",
  purple: "bg-purple-200 dark:bg-purple-900/30 border-purple-300",
}

export function AnnotationSidebar({
  annotations,
  onEdit,
  onDelete,
  onJumpToAnnotation,
}: AnnotationSidebarProps) {
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleEdit = (annotation: Annotation) => {
    setEditingAnnotation(annotation)
    setDialogOpen(true)
  }

  const handleSave = (data: { color: string; note: string; tags: string[] }) => {
    if (editingAnnotation) {
      onEdit(editingAnnotation.id, data)
      setDialogOpen(false)
      setEditingAnnotation(null)
    }
  }

  const handleDelete = () => {
    if (editingAnnotation) {
      onDelete(editingAnnotation.id)
      setDialogOpen(false)
      setEditingAnnotation(null)
    }
  }

  if (annotations.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂无标记</p>
          <p className="text-xs mt-1">选中文本后可以创建标记</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-3">
          {annotations.map((annotation) => (
            <div
              key={annotation.id}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                colorClasses[annotation.color] || colorClasses.yellow
              )}
              onClick={() => onJumpToAnnotation(annotation.id)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium line-clamp-2 flex-1">
                  {annotation.selectedText}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(annotation)
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(annotation.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {annotation.note && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {annotation.note}
                </p>
              )}

              {annotation.tags && annotation.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {annotation.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end mt-2">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {editingAnnotation && (
        <AnnotationNoteDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          annotation={editingAnnotation}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
