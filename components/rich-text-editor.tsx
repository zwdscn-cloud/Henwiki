"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import TiptapImage from "@tiptap/extension-image"
import TiptapLink from "@tiptap/extension-link"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Highlight from "@tiptap/extension-highlight"
import { TaskList } from "@tiptap/extension-task-list"
import { TaskItem } from "@tiptap/extension-task-item"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { common, createLowlight } from "lowlight"
import { useState, useCallback, useEffect } from "react"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Minus,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Image as ImageIconLucide,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  FileCode,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  Plus,
  Trash2,
  TableCellsMerge,
  TableCellsSplit,
  RowsIcon,
  Columns,
  Type,
  Edit,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

const lowlight = createLowlight(common)

interface TOCItem {
  id: string
  level: number
  text: string
}

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder = "开始编辑内容..." }: RichTextEditorProps) {
  const [showTOC, setShowTOC] = useState(true)
  const [tocItems, setTocItems] = useState<TOCItem[]>([])
  const [activeTocId, setActiveTocId] = useState<string | null>(null)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [tocEditDialogOpen, setTocEditDialogOpen] = useState(false)
  const [editingTocItem, setEditingTocItem] = useState<TOCItem | null>(null)
  const [newTocText, setNewTocText] = useState("")
  const [newTocLevel, setNewTocLevel] = useState(1)
  const [linkUrl, setLinkUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3, 4],
          HTMLAttributes: {
            class: 'toc-heading',
          },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TiptapImage.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full mx-auto my-4",
        },
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2 hover:text-primary/80",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full my-4",
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-border p-2 min-w-[100px]",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-border p-2 bg-muted font-semibold",
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: "bg-muted rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono",
        },
      }),
    ],
    content,
    immediatelyRender: false, // 避免 SSR hydration 错误
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      updateTOC()
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4",
      },
    },
  })

  // 生成标题的 slug ID（更稳定，不依赖位置）
  const generateHeadingId = (text: string, index: number): string => {
    // 将中文和文本转换为 slug
    const slug = text
      .toLowerCase()
      .trim()
      .replace(/[\s\u3000]+/g, '-') // 替换空格和全角空格为连字符
      .replace(/[^\w\u4e00-\u9fa5-]/g, '') // 保留中文、英文、数字和连字符
      .replace(/-+/g, '-') // 多个连字符合并为一个
      .replace(/^-|-$/g, '') // 移除首尾连字符
    
    // 如果 slug 为空，使用索引
    return slug || `heading-${index}`
  }

  const updateTOC = useCallback(() => {
    if (!editor) return

    const headings: TOCItem[] = []
    const doc = editor.state.doc
    let headingIndex = 0
    const usedIds = new Set<string>()

    // 遍历文档，提取标题并设置 ID
    doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        const text = node.textContent
        let id = generateHeadingId(text, headingIndex)
        
        // 确保 ID 唯一性
        let uniqueId = id
        let counter = 1
        while (usedIds.has(uniqueId)) {
          uniqueId = `${id}-${counter}`
          counter++
        }
        usedIds.add(uniqueId)
        
        headings.push({
          id: uniqueId,
          level: node.attrs.level,
          text: text,
        })
        
        headingIndex++
      }
    })

    setTocItems(headings)
    
    // 在下一个渲染周期为所有标题元素设置 ID 属性
    requestAnimationFrame(() => {
      if (!editor) return
      
      const editorDom = editor.view.dom as HTMLElement
      const headingElements = editorDom.querySelectorAll('h1, h2, h3, h4, h5, h6')
      
      headingElements.forEach((element, index) => {
        const heading = headings[index]
        if (heading && element instanceof HTMLElement) {
          element.id = heading.id
        }
      })
    })
  }, [editor])

  useEffect(() => {
    if (editor) {
      updateTOC()
    }
  }, [editor, updateTOC])

  // 当 content prop 变化时，更新编辑器内容并重新生成目录
  useEffect(() => {
    if (!editor) return
    
    const currentContent = editor.getHTML()
    // 只有当内容真正变化时才更新，避免不必要的重新渲染
    if (currentContent !== content) {
      editor.commands.setContent(content || '', false)
      // 延迟更新目录，确保 DOM 已更新
      // 使用多个延迟确保 TipTap 内部状态已更新
      setTimeout(() => {
        updateTOC()
      }, 50)
      setTimeout(() => {
        updateTOC()
      }, 200)
      setTimeout(() => {
        updateTOC()
      }, 500)
    }
  }, [content, editor, updateTOC])

  // 当 activeTocId 变化时，更新标题高亮
  useEffect(() => {
    if (!editor || !activeTocId) {
      // 清除所有标题的选中高亮
      const editorDom = editor?.view.dom as HTMLElement
      if (editorDom) {
        const allHeadings = editorDom.querySelectorAll('h1, h2, h3, h4, h5, h6')
        allHeadings.forEach((heading) => {
          heading.classList.remove("toc-active")
        })
      }
      return
    }

    // 延迟执行，确保标题 ID 已经设置
    const timeoutId = setTimeout(() => {
      const editorDom = editor.view.dom as HTMLElement
      // 清除所有标题的选中高亮
      const allHeadings = editorDom.querySelectorAll('h1, h2, h3, h4, h5, h6')
      allHeadings.forEach((heading) => {
        heading.classList.remove("toc-active")
      })

      // 给当前选中的标题添加高亮
      const headingElement = editorDom.querySelector(`#${activeTocId}`) as HTMLElement
      if (headingElement) {
        headingElement.classList.add("toc-active")
      } else {
        // 如果找不到，尝试再次查找（可能 ID 还没设置）
        requestAnimationFrame(() => {
          const headingElement = editorDom.querySelector(`#${activeTocId}`) as HTMLElement
          if (headingElement) {
            headingElement.classList.add("toc-active")
          }
        })
      }
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [activeTocId, editor])

  const scrollToHeading = (id: string) => {
    if (!editor) return
    
    // 设置当前选中的目录项
    setActiveTocId(id)
    
    // 延迟应用高亮，确保标题 ID 已设置
    setTimeout(() => {
      const editorDom = editor.view.dom as HTMLElement
      const headingElement = editorDom.querySelector(`#${id}`) as HTMLElement
      
      if (headingElement) {
        // 清除所有标题的选中高亮
        const allHeadings = editorDom.querySelectorAll('h1, h2, h3, h4, h5, h6')
        allHeadings.forEach((heading) => {
          heading.classList.remove("toc-active")
        })
        
        // 添加持久的高亮效果
        headingElement.classList.add("toc-active")
        
        // 平滑滚动到标题位置
        headingElement.scrollIntoView({ behavior: "smooth", block: "start" })
        
        // 添加临时的高亮动画效果
        headingElement.classList.add("toc-highlight")
        setTimeout(() => {
          headingElement.classList.remove("toc-highlight")
        }, 2000)
        
        // 同时设置编辑器焦点到该位置
        const pos = editor.view.posAtDOM(headingElement, 0)
        if (pos !== null && pos !== undefined) {
          editor.chain().focus().setTextSelection(pos).run()
        }
        return
      }
      
      // 如果找不到，尝试方法2
      const tocItem = tocItems.find(item => item.id === id)
      if (tocItem) {
        const doc = editor.state.doc
        doc.descendants((node, pos) => {
          if (node.type.name === "heading" && node.textContent === tocItem.text) {
            editor.chain().focus().setTextSelection(pos).run()
            
            // 等待 DOM 更新后滚动
            setTimeout(() => {
              const domAtPos = editor.view.domAtPos(pos)
              if (domAtPos && domAtPos.node) {
                let targetNode = domAtPos.node as HTMLElement
                if (targetNode.nodeType === Node.TEXT_NODE) {
                  targetNode = targetNode.parentElement as HTMLElement
                }
                
                while (targetNode && !targetNode.matches?.("h1, h2, h3, h4, h5, h6")) {
                  targetNode = targetNode.parentElement as HTMLElement
                }
                
                if (targetNode) {
                  // 清除所有标题的选中高亮
                  const allHeadings = editorDom.querySelectorAll('h1, h2, h3, h4, h5, h6')
                  allHeadings.forEach((heading) => {
                    heading.classList.remove("toc-active")
                  })
                  
                  targetNode.scrollIntoView({ behavior: "smooth", block: "start" })
                  // 添加持久的高亮效果（选中状态）
                  targetNode.classList.add("toc-active")
                  // 添加临时的高亮动画效果
                  targetNode.classList.add("toc-highlight")
                  setTimeout(() => {
                    targetNode.classList.remove("toc-highlight")
                  }, 2000)
                }
              }
            }, 50)
          }
        })
      }
    }, 100)
  }

  const setLink = useCallback(() => {
    if (linkUrl) {
      editor?.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run()
    }
    setLinkDialogOpen(false)
    setLinkUrl("")
  }, [editor, linkUrl])

  // 插入标题到编辑器
  const insertHeading = useCallback((text: string, level: number) => {
    if (!editor || !text.trim()) return
    
    editor.chain().focus().setHeading({ level: level as 1 | 2 | 3 | 4 }).insertContent(text).run()
    // 触发更新
    setTimeout(() => {
      updateTOC()
    }, 100)
  }, [editor, updateTOC])

  // 更新目录项对应的标题
  const updateHeading = useCallback((itemId: string, newText: string, newLevel: number) => {
    if (!editor) return
    
    const editorDom = editor.view.dom as HTMLElement
    const headingElement = editorDom.querySelector(`#${itemId}`) as HTMLElement
    
    if (headingElement) {
      const pos = editor.view.posAtDOM(headingElement, 0)
      if (pos !== null && pos !== undefined) {
        const node = editor.state.doc.nodeAt(pos)
        if (node && node.type.name === "heading") {
          // 更新标题文本和层级
          editor.chain()
            .focus()
            .setTextSelection({ from: pos, to: pos + node.nodeSize })
            .setHeading({ level: newLevel as 1 | 2 | 3 | 4 })
            .insertContent(newText)
            .run()
          
          setTimeout(() => {
            updateTOC()
          }, 100)
        }
      }
    }
  }, [editor, updateTOC])

  // 删除目录项对应的标题
  const deleteHeading = useCallback((itemId: string) => {
    if (!editor) return
    
    const editorDom = editor.view.dom as HTMLElement
    const headingElement = editorDom.querySelector(`#${itemId}`) as HTMLElement
    
    if (headingElement) {
      const pos = editor.view.posAtDOM(headingElement, 0)
      if (pos !== null && pos !== undefined) {
        const node = editor.state.doc.nodeAt(pos)
        if (node && node.type.name === "heading") {
          // 删除标题节点
          editor.chain()
            .focus()
            .setTextSelection({ from: pos - 1, to: pos + node.nodeSize })
            .deleteSelection()
            .run()
          
          setTimeout(() => {
            updateTOC()
          }, 100)
        }
      }
    }
  }, [editor, updateTOC])

  // 添加新目录项
  const handleAddTocItem = useCallback(() => {
    if (!newTocText.trim()) return
    
    insertHeading(newTocText, newTocLevel)
    setNewTocText("")
    setNewTocLevel(1)
  }, [newTocText, newTocLevel, insertHeading])

  // 保存编辑的目录项
  const handleSaveTocItem = useCallback(() => {
    if (!editingTocItem || !newTocText.trim()) return
    
    updateHeading(editingTocItem.id, newTocText, newTocLevel)
    setEditingTocItem(null)
    setNewTocText("")
    setNewTocLevel(1)
  }, [editingTocItem, newTocText, newTocLevel, updateHeading])

  // 开始编辑目录项
  const handleEditTocItem = useCallback((item: TOCItem) => {
    setEditingTocItem(item)
    setNewTocText(item.text)
    setNewTocLevel(item.level)
  }, [])

  // 删除目录项
  const handleDeleteTocItem = useCallback((itemId: string) => {
    if (confirm("确定要删除这个目录项吗？对应的标题也会被删除。")) {
      deleteHeading(itemId)
    }
  }, [deleteHeading])

  const addImage = useCallback(() => {
    if (imageUrl) {
      editor?.chain().focus().setImage({ src: imageUrl }).run()
    }
    setImageDialogOpen(false)
    setImageUrl("")
  }, [editor, imageUrl])

  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  if (!editor) {
    return (
      <div className="border border-border rounded-lg p-4 min-h-[500px] flex items-center justify-center">
        <div className="text-muted-foreground">加载编辑器中...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col border-0 bg-card">
      {/* Toolbar */}
      <div className="border-b border-border bg-muted/30 p-2 flex flex-wrap items-center gap-1">
        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
              <Type className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">目录与段落</span>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
              <Type className="h-4 w-4 mr-2" />
              正文
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
              <Heading1 className="h-4 w-4 mr-2" />
              一级标题
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Heading2 className="h-4 w-4 mr-2" />
              二级标题
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <Heading3 className="h-4 w-4 mr-2" />
              三级标题
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text Formatting */}
        <div className="flex items-center gap-0.5">
          <Toggle
            size="sm"
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("underline")}
            onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Underline"
            className="h-8 w-8 p-0"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("strike")}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Strikethrough"
            className="h-8 w-8 p-0"
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("highlight")}
            onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
            aria-label="Highlight"
            className="h-8 w-8 p-0"
          >
            <Highlighter className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("code")}
            onPressedChange={() => editor.chain().focus().toggleCode().run()}
            aria-label="Inline Code"
            className="h-8 w-8 p-0"
          >
            <Code className="h-4 w-4" />
          </Toggle>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <div className="flex items-center gap-0.5">
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "left" })}
            onPressedChange={() => editor.chain().focus().setTextAlign("left").run()}
            aria-label="Align Left"
            className="h-8 w-8 p-0"
          >
            <AlignLeft className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "center" })}
            onPressedChange={() => editor.chain().focus().setTextAlign("center").run()}
            aria-label="Align Center"
            className="h-8 w-8 p-0"
          >
            <AlignCenter className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "right" })}
            onPressedChange={() => editor.chain().focus().setTextAlign("right").run()}
            aria-label="Align Right"
            className="h-8 w-8 p-0"
          >
            <AlignRight className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "justify" })}
            onPressedChange={() => editor.chain().focus().setTextAlign("justify").run()}
            aria-label="Justify"
            className="h-8 w-8 p-0"
          >
            <AlignJustify className="h-4 w-4" />
          </Toggle>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <div className="flex items-center gap-0.5">
          <Toggle
            size="sm"
            pressed={editor.isActive("bulletList")}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet List"
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("orderedList")}
            onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Ordered List"
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("taskList")}
            onPressedChange={() => editor.chain().focus().toggleTaskList().run()}
            aria-label="Task List"
            className="h-8 w-8 p-0"
          >
            <ListChecks className="h-4 w-4" />
          </Toggle>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Blocks */}
        <div className="flex items-center gap-0.5">
          <Toggle
            size="sm"
            pressed={editor.isActive("blockquote")}
            onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
            aria-label="Blockquote"
            className="h-8 w-8 p-0"
          >
            <Quote className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("codeBlock")}
            onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
            aria-label="Code Block"
            className="h-8 w-8 p-0"
          >
            <FileCode className="h-4 w-4" />
          </Toggle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Links & Media */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", editor.isActive("link") && "bg-accent")}
            onClick={() => {
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run()
              } else {
                setLinkDialogOpen(true)
              }
            }}
          >
            {editor.isActive("link") ? <Unlink className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setImageDialogOpen(true)}
          >
            <ImageIconLucide className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Table */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive("table") && "bg-accent")}>
              <TableIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={insertTable}>
              <Plus className="h-4 w-4 mr-2" />
              插入表格
            </DropdownMenuItem>
            {editor.isActive("table") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>
                  <RowsIcon className="h-4 w-4 mr-2" />
                  上方插入行
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                  <RowsIcon className="h-4 w-4 mr-2" />
                  下方插入行
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
                  <Columns className="h-4 w-4 mr-2" />
                  左侧插入列
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                  <Columns className="h-4 w-4 mr-2" />
                  右侧插入列
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除当前行
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除当前列
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除表格
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().mergeCells().run()}>
                  <TableCellsMerge className="h-4 w-4 mr-2" />
                  合并单元格
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().splitCell().run()}>
                  <TableCellsSplit className="h-4 w-4 mr-2" />
                  拆分单元格
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Spacer */}
        <div className="flex-1" />

        {/* TOC Toggle & Edit */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
            onClick={() => setShowTOC(!showTOC)}
          >
            {showTOC ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            <span className="text-xs hidden sm:inline">目录</span>
          </Button>
          {showTOC && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTocEditDialogOpen(true)}
              title="编辑目录"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Editor Area with TOC */}
      <div className="flex flex-1 overflow-hidden">
        {/* TOC Sidebar */}
        {showTOC && (
          <div className="w-56 border-r border-border bg-muted/20 shrink-0 hidden md:block flex flex-col">
            <div className="p-3 border-b border-border shrink-0">
              <h3 className="text-sm font-medium">目录</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {tocItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">添加标题后将自动生成目录</p>
                ) : (
                  <nav className="space-y-1">
                    {tocItems.map((item) => (
                      <button
                        key={item.id}
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
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 min-h-full">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Word Count */}
      <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground flex items-center justify-between bg-muted/20">
        <span>
          {editor.storage.characterCount?.characters?.() || editor.getText().length} 字符
          {" / "}
          {editor.storage.characterCount?.words?.() || editor.getText().split(/\s+/).filter(Boolean).length} 词
        </span>
        <span>按 Tab 键可缩进列表</span>
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>插入链接</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">链接地址</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={setLink}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>插入图片</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">图片地址</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                支持 PNG、JPG、GIF、WebP 格式
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={addImage}>插入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TOC Edit Dialog */}
      <Dialog open={tocEditDialogOpen} onOpenChange={setTocEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>编辑目录</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* 添加新目录项 */}
            <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/20">
              <h4 className="text-sm font-medium">
                {editingTocItem ? "编辑目录项" : "添加新目录项"}
              </h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="toc-text">标题文本</Label>
                  <Input
                    id="toc-text"
                    placeholder="输入标题文本"
                    value={newTocText}
                    onChange={(e) => setNewTocText(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toc-level">标题层级</Label>
                  <Select
                    value={newTocLevel.toString()}
                    onValueChange={(v) => setNewTocLevel(parseInt(v))}
                  >
                    <SelectTrigger id="toc-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">一级标题 (H1)</SelectItem>
                      <SelectItem value="2">二级标题 (H2)</SelectItem>
                      <SelectItem value="3">三级标题 (H3)</SelectItem>
                      <SelectItem value="4">四级标题 (H4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  {editingTocItem ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTocItem(null)
                          setNewTocText("")
                          setNewTocLevel(1)
                        }}
                      >
                        取消
                      </Button>
                      <Button size="sm" onClick={handleSaveTocItem}>
                        保存
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={handleAddTocItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      添加
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* 现有目录项列表 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">现有目录项</h4>
              {tocItems.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">
                  暂无目录项，添加标题后将自动生成
                </p>
              ) : (
                <div className="space-y-2">
                  {tocItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-3 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground min-w-[40px]">
                            H{item.level}
                          </span>
                          <span className="text-sm flex-1">{item.text || "无标题"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            handleEditTocItem(item)
                            scrollToHeading(item.id)
                          }}
                          title="编辑并跳转"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteTocItem(item.id)}
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setTocEditDialogOpen(false)
              setEditingTocItem(null)
              setNewTocText("")
              setNewTocLevel(1)
            }}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
