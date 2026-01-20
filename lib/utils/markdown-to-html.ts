/**
 * 将 Markdown 格式转换为 HTML 格式（用于富文本编辑器）
 */

export function markdownToHTML(markdown: string): string {
  if (!markdown) return ""

  let html = markdown

  // 转换标题
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>")
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>")
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>")
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>")

  // 转换粗体
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") // 处理嵌套

  // 转换斜体
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>")
  html = html.replace(/_(.+?)_/g, "<em>$1</em>")

  // 转换代码块
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
  html = html.replace(/`(.+?)`/g, "<code>$1</code>")

  // 转换链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // 转换图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')

  // 转换列表 - 需要更精确的处理
  const lines = html.split("\n")
  let inList = false
  let listType: "ul" | "ol" | null = null
  const processedLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const orderedMatch = line.match(/^(\d+)\. (.+)$/)
    const unorderedMatch = line.match(/^[-*] (.+)$/)

    if (orderedMatch) {
      if (!inList || listType !== "ol") {
        if (inList) {
          processedLines.push(`</${listType}>`)
        }
        processedLines.push("<ol>")
        inList = true
        listType = "ol"
      }
      processedLines.push(`<li>${orderedMatch[2]}</li>`)
    } else if (unorderedMatch) {
      if (!inList || listType !== "ul") {
        if (inList) {
          processedLines.push(`</${listType}>`)
        }
        processedLines.push("<ul>")
        inList = true
        listType = "ul"
      }
      processedLines.push(`<li>${unorderedMatch[1]}</li>`)
    } else {
      if (inList) {
        processedLines.push(`</${listType}>`)
        inList = false
        listType = null
      }
      processedLines.push(line)
    }
  }

  if (inList && listType) {
    processedLines.push(`</${listType}>`)
  }

  html = processedLines.join("\n")

  // 转换引用
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")

  // 转换水平线
  html = html.replace(/^---$/gm, "<hr />")
  html = html.replace(/^\*\*\*$/gm, "<hr />")

  // 转换换行：两个换行符转换为段落分隔
  html = html.split("\n\n").map((para) => {
    const trimmed = para.trim()
    if (!trimmed) return ""
    // 如果已经是 HTML 标签，不包装
    if (trimmed.startsWith("<")) {
      return trimmed
    }
    return `<p>${trimmed}</p>`
  }).join("\n")

  // 清理多余的段落标签
  html = html.replace(/<p><(h[1-6]|ul|ol|blockquote|pre)/g, "<$1")
  html = html.replace(/(<\/h[1-6]|<\/ul>|<\/ol>|<\/blockquote>|<\/pre>)<\/p>/g, "$1")

  return html
}
