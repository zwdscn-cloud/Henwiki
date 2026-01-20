import { query, execute } from "@/lib/db/connection"

export interface Discussion {
  id: number
  title: string
  content: string
  author_id: number
  category_id?: number
  views: number
  likes_count: number
  replies_count: number
  is_pinned: boolean
  is_locked: boolean
  is_featured: boolean
  status: "draft" | "published" | "deleted"
  created_at: string
  updated_at: string
  last_reply_at?: string
}

export interface DiscussionWithRelations extends Discussion {
  author: {
    id: number
    name: string
    avatar: string
    isVerified: boolean
  }
  category?: {
    id: number
    slug: string
    label: string
  }
  tags: string[]
}

export interface DiscussionReply {
  id: number
  discussion_id: number
  author_id: number
  content: string
  parent_id?: number
  likes_count: number
  is_accepted: boolean
  created_at: string
  updated_at: string
}

export interface DiscussionReplyWithAuthor extends DiscussionReply {
  author: {
    id: number
    name: string
    avatar: string
    isVerified: boolean
  }
  parent_author?: {
    id: number
    name: string
    avatar: string
    isVerified: boolean
  }
  replies?: DiscussionReplyWithAuthor[]
}

/**
 * 创建讨论
 */
export async function createDiscussion(params: {
  title: string
  content: string
  authorId: number
  categoryId?: number
  tags?: string[]
}): Promise<number> {
  const { title, content, authorId, categoryId, tags } = params

  const result = await execute(
    `INSERT INTO discussions (title, content, author_id, category_id, status) 
     VALUES (?, ?, ?, ?, 'published')`,
    [title, content, authorId, categoryId || null]
  )

  const discussionId = result.insertId

  // 添加标签
  if (tags && tags.length > 0) {
    const tagValues = tags.map((tag) => [discussionId, tag])
    const placeholders = tagValues.map(() => "(?, ?)").join(", ")
    const tagParams = tagValues.flat()

    await execute(
      `INSERT INTO discussion_tags (discussion_id, tag_name) VALUES ${placeholders}`,
      tagParams
    )
  }

  return discussionId
}

/**
 * 获取讨论列表
 */
export async function getDiscussions(params: {
  categoryId?: number
  authorId?: number
  status?: string
  sortBy?: "created_at" | "last_reply_at" | "replies_count" | "likes_count" | "views"
  page?: number
  pageSize?: number
  search?: string
}): Promise<DiscussionWithRelations[]> {
  const {
    categoryId,
    authorId,
    status = "published",
    sortBy = "last_reply_at",
    page = 1,
    pageSize = 20,
    search,
  } = params

  const offset = (page - 1) * pageSize
  const conditions: string[] = []
  const values: any[] = []

  if (status) {
    conditions.push("d.status = ?")
    values.push(status)
  }

  if (categoryId) {
    conditions.push("d.category_id = ?")
    values.push(categoryId)
  }

  if (authorId) {
    conditions.push("d.author_id = ?")
    values.push(authorId)
  }

  if (search) {
    conditions.push("(d.title LIKE ? OR d.content LIKE ?)")
    values.push(`%${search}%`, `%${search}%`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  // 验证 sortBy
  const allowedSortBy = ["created_at", "last_reply_at", "replies_count", "likes_count", "views"]
  const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : "last_reply_at"

  // 排序：置顶优先，然后按选择的排序方式
  const orderBy = `ORDER BY d.is_pinned DESC, d.${safeSortBy} DESC`

  const sql = `
    SELECT 
      d.id,
      d.title,
      d.content,
      d.author_id,
      d.category_id,
      d.views,
      d.likes_count,
      d.replies_count,
      d.is_pinned,
      d.is_locked,
      d.is_featured,
      d.status,
      d.created_at,
      d.updated_at,
      d.last_reply_at,
      u.id as user_id,
      u.name as author_name,
      u.avatar as author_avatar,
      u.is_verified as author_is_verified,
      c.id as cat_id,
      c.slug as category_slug,
      c.label as category_label
    FROM discussions d
    INNER JOIN users u ON d.author_id = u.id
    LEFT JOIN categories c ON d.category_id = c.id
    ${whereClause}
    ${orderBy}
    LIMIT ? OFFSET ?
  `

  values.push(pageSize, offset)
  const discussions = await query<any>(sql, values)

  // 获取每个讨论的标签
  const discussionIds = discussions.map((d: any) => d.id)
  const tagsMap = new Map<number, string[]>()

  if (discussionIds.length > 0) {
    const placeholders = discussionIds.map(() => "?").join(",")
    const tags = await query<{ discussion_id: number; tag_name: string }>(
      `SELECT discussion_id, tag_name FROM discussion_tags WHERE discussion_id IN (${placeholders})`,
      discussionIds
    )

    tags.forEach((tag) => {
      if (!tagsMap.has(tag.discussion_id)) {
        tagsMap.set(tag.discussion_id, [])
      }
      tagsMap.get(tag.discussion_id)!.push(tag.tag_name)
    })
  }

  return discussions.map((d: any) => ({
    id: d.id,
    title: d.title,
    content: d.content,
    author_id: d.author_id,
    category_id: d.category_id,
    views: d.views,
    likes_count: d.likes_count,
    replies_count: d.replies_count,
    is_pinned: d.is_pinned,
    is_locked: d.is_locked,
    is_featured: d.is_featured,
    status: d.status,
    created_at: d.created_at,
    updated_at: d.updated_at,
    last_reply_at: d.last_reply_at,
    author: {
      id: d.user_id,
      name: d.author_name,
      avatar: d.author_avatar || "/placeholder.svg",
      isVerified: d.author_is_verified || false,
    },
    category: d.cat_id
      ? {
          id: d.cat_id,
          slug: d.category_slug,
          label: d.category_label,
        }
      : undefined,
    tags: tagsMap.get(d.id) || [],
  }))
}

/**
 * 获取讨论详情
 */
export async function getDiscussionById(id: number): Promise<DiscussionWithRelations | null> {
  const [discussion] = await query<any>(
    `SELECT 
      d.id,
      d.title,
      d.content,
      d.author_id,
      d.category_id,
      d.views,
      d.likes_count,
      d.replies_count,
      d.is_pinned,
      d.is_locked,
      d.is_featured,
      d.status,
      d.created_at,
      d.updated_at,
      d.last_reply_at,
      u.id as user_id,
      u.name as author_name,
      u.avatar as author_avatar,
      u.is_verified as author_is_verified,
      c.id as cat_id,
      c.slug as category_slug,
      c.label as category_label
    FROM discussions d
    INNER JOIN users u ON d.author_id = u.id
    LEFT JOIN categories c ON d.category_id = c.id
    WHERE d.id = ? AND d.status = 'published'`,
    [id]
  )

  if (!discussion) return null

  // 增加浏览量
  await execute(`UPDATE discussions SET views = views + 1 WHERE id = ?`, [id])

  // 获取标签
  const tags = await query<{ tag_name: string }>(
    `SELECT tag_name FROM discussion_tags WHERE discussion_id = ?`,
    [id]
  )

  return {
    id: discussion.id,
    title: discussion.title,
    content: discussion.content,
    author_id: discussion.author_id,
    category_id: discussion.category_id,
    views: discussion.views + 1, // 返回更新后的浏览量
    likes_count: discussion.likes_count,
    replies_count: discussion.replies_count,
    is_pinned: discussion.is_pinned,
    is_locked: discussion.is_locked,
    is_featured: discussion.is_featured,
    status: discussion.status,
    created_at: discussion.created_at,
    updated_at: discussion.updated_at,
    last_reply_at: discussion.last_reply_at,
    author: {
      id: discussion.user_id,
      name: discussion.author_name,
      avatar: discussion.author_avatar || "/placeholder.svg",
      isVerified: discussion.author_is_verified || false,
    },
    category: discussion.cat_id
      ? {
          id: discussion.cat_id,
          slug: discussion.category_slug,
          label: discussion.category_label,
        }
      : undefined,
    tags: tags.map((t) => t.tag_name),
  }
}

/**
 * 创建回复
 */
export async function createReply(params: {
  discussionId: number
  authorId: number
  content: string
  parentId?: number
}): Promise<number> {
  const { discussionId, authorId, content, parentId } = params

  const result = await execute(
    `INSERT INTO discussion_replies (discussion_id, author_id, content, parent_id) 
     VALUES (?, ?, ?, ?)`,
    [discussionId, authorId, content, parentId || null]
  )

  // 更新讨论的回复数和最后回复时间
  await execute(
    `UPDATE discussions 
     SET replies_count = replies_count + 1, 
         last_reply_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [discussionId]
  )

  return result.insertId
}

/**
 * 获取讨论的回复列表
 */
export async function getDiscussionReplies(
  discussionId: number
): Promise<DiscussionReplyWithAuthor[]> {
  const replies = await query<any>(
    `SELECT 
      r.id,
      r.discussion_id,
      r.author_id,
      r.content,
      r.parent_id,
      r.likes_count,
      r.is_accepted,
      r.created_at,
      r.updated_at,
      u.id as user_id,
      u.name as author_name,
      u.avatar as author_avatar,
      u.is_verified as author_is_verified,
      pu.id as parent_user_id,
      pu.name as parent_author_name,
      pu.avatar as parent_author_avatar,
      pu.is_verified as parent_author_is_verified
    FROM discussion_replies r
    INNER JOIN users u ON r.author_id = u.id
    LEFT JOIN discussion_replies pr ON r.parent_id = pr.id
    LEFT JOIN users pu ON pr.author_id = pu.id
    WHERE r.discussion_id = ?
    ORDER BY r.is_accepted DESC, r.created_at ASC`,
    [discussionId]
  )

  // 构建回复树结构
  const replyMap = new Map<number, DiscussionReplyWithAuthor>()
  const rootReplies: DiscussionReplyWithAuthor[] = []

  replies.forEach((r: any) => {
    const reply: DiscussionReplyWithAuthor = {
      id: r.id,
      discussion_id: r.discussion_id,
      author_id: r.author_id,
      content: r.content,
      parent_id: r.parent_id,
      likes_count: r.likes_count,
      is_accepted: r.is_accepted,
      created_at: r.created_at,
      updated_at: r.updated_at,
      author: {
        id: r.user_id,
        name: r.author_name,
        avatar: r.author_avatar || "/placeholder.svg",
        isVerified: r.author_is_verified || false,
      },
      parent_author: r.parent_user_id
        ? {
            id: r.parent_user_id,
            name: r.parent_author_name,
            avatar: r.parent_author_avatar || "/placeholder.svg",
            isVerified: r.parent_author_is_verified || false,
          }
        : undefined,
      replies: [],
    }

    replyMap.set(reply.id, reply)

    if (r.parent_id) {
      const parent = replyMap.get(r.parent_id)
      if (parent) {
        if (!parent.replies) parent.replies = []
        parent.replies.push(reply)
      }
    } else {
      rootReplies.push(reply)
    }
  })

  return rootReplies
}
