/**
 * 在文本内容中应用标记高亮
 */

export interface AnnotationHighlight {
  id: number
  startOffset: number
  endOffset: number
  color: string
  selectedText: string
}

/**
 * 将纯文本内容转换为带高亮的 HTML
 */
export function applyHighlights(
  text: string,
  annotations: AnnotationHighlight[]
): string {
  if (annotations.length === 0) {
    return text
  }

  // 按起始位置排序，确保按顺序处理
  const sortedAnnotations = [...annotations].sort((a, b) => a.startOffset - b.startOffset)

  // 检查是否有重叠的标记
  for (let i = 1; i < sortedAnnotations.length; i++) {
    if (sortedAnnotations[i].startOffset < sortedAnnotations[i - 1].endOffset) {
      // 如果有重叠，调整后续标记的位置
      const overlap = sortedAnnotations[i - 1].endOffset - sortedAnnotations[i].startOffset
      sortedAnnotations[i].startOffset += overlap
      sortedAnnotations[i].endOffset += overlap
    }
  }

  // 从后往前插入，避免位置偏移问题
  let result = text
  const colorClasses: Record<string, string> = {
    yellow: "bg-yellow-200 dark:bg-yellow-900/30",
    green: "bg-green-200 dark:bg-green-900/30",
    blue: "bg-blue-200 dark:bg-blue-900/30",
    red: "bg-red-200 dark:bg-red-900/30",
    purple: "bg-purple-200 dark:bg-purple-900/30",
  }

  for (let i = sortedAnnotations.length - 1; i >= 0; i--) {
    const annotation = sortedAnnotations[i]
    const start = annotation.startOffset
    const end = annotation.endOffset

    if (start >= 0 && end <= result.length && start < end) {
      const before = result.substring(0, start)
      const selected = result.substring(start, end)
      const after = result.substring(end)

      const colorClass = colorClasses[annotation.color] || colorClasses.yellow
      const highlight = `<mark class="annotation-highlight ${colorClass}" data-annotation-id="${annotation.id}">${selected}</mark>`

      result = before + highlight + after
    }
  }

  return result
}

/**
 * 从 HTML 内容中提取纯文本并计算偏移量
 */
export function getTextContent(html: string): string {
  if (typeof document === "undefined") {
    // 服务端渲染时，使用简单的正则表达式移除 HTML 标签
    return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
  }
  // 创建一个临时 DOM 元素来提取纯文本
  const temp = document.createElement("div")
  temp.innerHTML = html
  return temp.textContent || temp.innerText || ""
}

/**
 * 在 HTML 内容中应用标记高亮
 * 这个方法会先提取纯文本，应用标记，然后尝试保持 HTML 结构
 */
export function applyHighlightsToHTML(
  html: string,
  annotations: AnnotationHighlight[]
): string {
  if (annotations.length === 0) {
    return html
  }

  // 提取纯文本内容
  const textContent = getTextContent(html)

  // 应用高亮到纯文本
  const highlightedText = applyHighlights(textContent, annotations)

  // 如果 HTML 和纯文本相同，直接返回高亮后的文本
  if (html === textContent) {
    return highlightedText
  }

  // 否则，需要更复杂的处理：在 HTML 结构中插入高亮
  // 这里使用一个简化的方法：找到文本位置并插入标记
  let result = html
  const sortedAnnotations = [...annotations].sort((a, b) => b.startOffset - a.startOffset)

  const colorClasses: Record<string, string> = {
    yellow: "bg-yellow-200 dark:bg-yellow-900/30",
    green: "bg-green-200 dark:bg-green-900/30",
    blue: "bg-blue-200 dark:bg-blue-900/30",
    red: "bg-red-200 dark:bg-red-900/30",
    purple: "bg-purple-200 dark:bg-purple-900/30",
  }

  // 创建一个临时 DOM 来解析 HTML
  const temp = document.createElement("div")
  temp.innerHTML = html

  // 获取所有文本节点
  const walker = document.createTreeWalker(
    temp,
    NodeFilter.SHOW_TEXT,
    null
  )

  const textNodes: { node: Text; start: number; end: number }[] = []
  let currentOffset = 0

  let node
  while ((node = walker.nextNode())) {
    const textNode = node as Text
    const text = textNode.textContent || ""
    const start = currentOffset
    const end = currentOffset + text.length

    textNodes.push({ node: textNode, start, end })
    currentOffset = end
  }

  // 从后往前处理标记，避免位置偏移
  for (const annotation of sortedAnnotations) {
    const { startOffset, endOffset, color, id } = annotation
    const colorClass = colorClasses[color] || colorClasses.yellow

    // 找到包含这个标记的文本节点
    for (const textNodeInfo of textNodes) {
      const { node: textNode, start, end } = textNodeInfo

      if (startOffset >= start && endOffset <= end) {
        // 标记完全在这个文本节点内
        const nodeText = textNode.textContent || ""
        const relativeStart = startOffset - start
        const relativeEnd = endOffset - start

        const before = nodeText.substring(0, relativeStart)
        const selected = nodeText.substring(relativeStart, relativeEnd)
        const after = nodeText.substring(relativeEnd)

        // 创建高亮标记
        const mark = document.createElement("mark")
        mark.className = `annotation-highlight ${colorClass}`
        mark.setAttribute("data-annotation-id", id.toString())
        mark.textContent = selected

        // 替换文本节点
        if (before) {
          textNode.parentNode?.insertBefore(document.createTextNode(before), textNode)
        }
        textNode.parentNode?.insertBefore(mark, textNode)
        if (after) {
          textNode.parentNode?.insertBefore(document.createTextNode(after), textNode)
        }
        textNode.remove()

        break
      } else if (startOffset < end && endOffset > start) {
        // 标记跨越多个节点，需要更复杂的处理
        // 简化处理：只处理完全在节点内的情况
        // 对于跨节点的情况，可以扩展这个函数
        break
      }
    }
  }

  return temp.innerHTML
}
