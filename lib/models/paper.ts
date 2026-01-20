import { query, queryOne, execute, transaction } from "@/lib/db/connection"

export interface Paper {
  id: number
  title: string
  title_cn: string | null
  abstract: string | null
  abstract_cn: string | null
  category_id: number
  journal: string | null
  publish_date: string | null
  arxiv_id: string | null
  doi: string | null
  pdf_url: string | null
  pdf_file_path: string | null
  citations: number
  views: number
  downloads: number
  likes_count: number
  is_highlighted: boolean
  status: "draft" | "pending" | "published"
  created_at: string
  updated_at: string
}

export interface PaperAuthor {
  id: number
  paper_id: number
  name: string
  affiliation: string | null
  order_index: number
}

export interface PaperWithRelations extends Paper {
  category: {
    id: number
    slug: string
    label: string
  }
  authors: PaperAuthor[]
  tags: string[]
}

/**
 * 获取论文列表
 */
export async function getPapers(params: {
  categoryId?: number
  status?: string
  page?: number
  pageSize?: number
  orderBy?: "created_at" | "publish_date" | "views" | "citations"
}): Promise<PaperWithRelations[]> {
  const {
    categoryId,
    authorId,
    status = "published",
    page = 1,
    pageSize = 20,
    orderBy = "created_at",
  } = params

  const offset = (page - 1) * pageSize
  const conditions: string[] = ["p.status = ?"]
  const values: any[] = [status]

  if (categoryId) {
    conditions.push("p.category_id = ?")
    values.push(categoryId)
  }

  if (authorId) {
    conditions.push("p.author_id = ?")
    values.push(authorId)
  }

  const orderByField = orderBy === "publish_date" ? "p.publish_date" : `p.${orderBy}`

  // 如果指定了 authorId，需要通过 paper_authors 表关联（查找用户作为作者的论文）
  // 注意：论文表没有 author_id 字段，暂时不支持按 authorId 筛选
  // 如果需要此功能，需要在 papers 表中添加 author_id 字段或创建 paper_submissions 表
  if (authorId) {
    // 暂时忽略 authorId，因为论文表结构不支持
    // 可以后续通过 paper_authors 表查找，但需要知道用户姓名
  }

  const sql = `
    SELECT 
      p.*,
      c.id as category_id,
      c.slug as category_slug,
      c.label as category_label
    FROM papers p
    INNER JOIN categories c ON p.category_id = c.id
    WHERE ${conditions.join(" AND ")}
    ORDER BY ${orderByField} DESC
    LIMIT ? OFFSET ?
  `

  values.push(pageSize, offset)
  const papers = await query<any>(sql, values)

  // 获取每个论文的作者和标签
  const paperIds = papers.map((p: any) => p.id)
  const authorsMap = new Map<number, PaperAuthor[]>()
  const tagsMap = new Map<number, string[]>()

  if (paperIds.length > 0) {
    // 获取作者
    const authors = await query<PaperAuthor>(
      `SELECT * FROM paper_authors WHERE paper_id IN (${paperIds.map(() => "?").join(",")}) ORDER BY order_index`,
      paperIds
    )
    authors.forEach((author) => {
      if (!authorsMap.has(author.paper_id)) {
        authorsMap.set(author.paper_id, [])
      }
      authorsMap.get(author.paper_id)!.push(author)
    })

    // 获取标签
    const tags = await query<{ paper_id: number; tag_name: string }>(
      `SELECT paper_id, tag_name FROM paper_tags WHERE paper_id IN (${paperIds.map(() => "?").join(",")})`,
      paperIds
    )
    tags.forEach((tag) => {
      if (!tagsMap.has(tag.paper_id)) {
        tagsMap.set(tag.paper_id, [])
      }
      tagsMap.get(tag.paper_id)!.push(tag.tag_name)
    })
  }

  return papers.map((paper: any) => ({
    ...paper,
    category: {
      id: paper.category_id,
      slug: paper.category_slug,
      label: paper.category_label,
    },
    authors: authorsMap.get(paper.id) || [],
    tags: tagsMap.get(paper.id) || [],
  }))
}

/**
 * 根据ID获取论文详情
 */
export async function getPaperById(id: number): Promise<PaperWithRelations | null> {
  const paper = await queryOne<any>(
    `SELECT 
      p.*,
      c.id as category_id,
      c.slug as category_slug,
      c.label as category_label
    FROM papers p
    INNER JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?`,
    [id]
  )

  if (!paper) return null

  const authors = await query<PaperAuthor>(
    "SELECT * FROM paper_authors WHERE paper_id = ? ORDER BY order_index",
    [id]
  )

  const tags = await query<{ tag_name: string }>(
    "SELECT tag_name FROM paper_tags WHERE paper_id = ?",
    [id]
  )

  return {
    ...paper,
    category: {
      id: paper.category_id,
      slug: paper.category_slug,
      label: paper.category_label,
    },
    authors,
    tags: tags.map((t) => t.tag_name),
  }
}

/**
 * 创建论文
 */
export async function createPaper(
  data: {
    title: string
    titleCn?: string
    abstract: string
    abstractCn?: string
    categoryId: number
    journal?: string
    publishDate?: string
    arxivId?: string
    doi?: string
    pdfUrl?: string
    pdfFilePath?: string
    authors: Array<{ name: string; affiliation?: string }>
    tags?: string[]
  }
): Promise<number> {
  return transaction(async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO papers 
       (title, title_cn, abstract, abstract_cn, category_id, journal, publish_date, arxiv_id, doi, pdf_url, pdf_file_path, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        data.title,
        data.titleCn || null,
        data.abstract,
        data.abstractCn || null,
        data.categoryId,
        data.journal || null,
        data.publishDate || null,
        data.arxivId || null,
        data.doi || null,
        data.pdfUrl || null,
        data.pdfFilePath || null,
      ]
    )

    const paperId = (result as any).insertId

    // 插入作者
    if (data.authors.length > 0) {
      const authorValues = data.authors
        .map((author, index) => "(?, ?, ?, ?)")
        .join(", ")
      const authorParams = data.authors.flatMap((author, index) => [
        paperId,
        author.name,
        author.affiliation || null,
        index,
      ])
      await conn.execute(
        `INSERT INTO paper_authors (paper_id, name, affiliation, order_index) VALUES ${authorValues}`,
        authorParams
      )
    }

    // 插入标签
    if (data.tags && data.tags.length > 0) {
      const tagValues = data.tags.map(() => "(?, ?)").join(", ")
      const tagParams = data.tags.flatMap((tag) => [paperId, tag])
      await conn.execute(
        `INSERT INTO paper_tags (paper_id, tag_name) VALUES ${tagValues}`,
        tagParams
      )
    }

    return paperId
  })
}

/**
 * 更新论文
 */
export async function updatePaper(
  id: number,
  data: Partial<{
    title: string
    titleCn: string
    abstract: string
    abstractCn: string
    categoryId: number
    journal: string
    publishDate: string
    arxivId: string
    doi: string
    pdfUrl: string
    pdfFilePath: string
    status: string
  }>
): Promise<void> {
  await transaction(async (conn) => {
    const fields: string[] = []
    const values: any[] = []

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase()
        fields.push(`${dbKey} = ?`)
        values.push(value)
      }
    })

    if (fields.length > 0) {
      values.push(id)
      await conn.execute(
        `UPDATE papers SET ${fields.join(", ")} WHERE id = ?`,
        values
      )
    }
  })
}

/**
 * 增加浏览量
 */
export async function incrementViews(id: number): Promise<void> {
  await execute("UPDATE papers SET views = views + 1 WHERE id = ?", [id])
}

/**
 * 增加下载量
 */
export async function incrementDownloads(id: number): Promise<void> {
  await execute("UPDATE papers SET downloads = downloads + 1 WHERE id = ?", [id])
}

/**
 * 切换点赞状态
 */
export async function toggleLike(
  paperId: number,
  userId: number
): Promise<{ liked: boolean; likesCount: number }> {
  return transaction(async (conn) => {
    const [existing] = await conn.execute(
      "SELECT id FROM likes WHERE user_id = ? AND target_type = 'paper' AND target_id = ?",
      [userId, paperId]
    )

    const rows = existing as any[]
    const isLiked = rows.length > 0

    if (isLiked) {
      await conn.execute(
        "DELETE FROM likes WHERE user_id = ? AND target_type = 'paper' AND target_id = ?",
        [userId, paperId]
      )
      await conn.execute(
        "UPDATE papers SET likes_count = likes_count - 1 WHERE id = ?",
        [paperId]
      )
    } else {
      await conn.execute(
        "INSERT INTO likes (user_id, target_type, target_id) VALUES (?, 'paper', ?)",
        [userId, paperId]
      )
      await conn.execute(
        "UPDATE papers SET likes_count = likes_count + 1 WHERE id = ?",
        [paperId]
      )
    }

    const paper = await queryOne<{ likes_count: number }>(
      "SELECT likes_count FROM papers WHERE id = ?",
      [paperId]
    )

    return {
      liked: !isLiked,
      likesCount: paper?.likes_count || 0,
    }
  })
}
