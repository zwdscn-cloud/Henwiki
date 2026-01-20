import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware/auth"
import { query, execute, ensureBookmarksTable } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    // 确保 bookmarks 表存在
    await ensureBookmarksTable()
    const authUser = requireAuth(request)
    const searchParams = request.nextUrl.searchParams
    const folderName = searchParams.get("folder") || "default"
    const targetType = searchParams.get("type") as "term" | "paper" | null

    let conditions: string[] = ["user_id = ?"]
    let params: any[] = [authUser.userId]

    if (folderName !== "all") {
      conditions.push("folder_name = ?")
      params.push(folderName)
    }

    if (targetType) {
      conditions.push("target_type = ?")
      params.push(targetType)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const bookmarks = await query<any>(
      `SELECT 
        b.id,
        b.target_type,
        b.target_id,
        b.folder_name,
        b.created_at
      FROM bookmarks b
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT 100`,
      params
    )

    // 获取词条和论文详情
    const termIds: number[] = []
    const paperIds: number[] = []

    bookmarks.forEach((b: any) => {
      if (b.target_type === "term") {
        termIds.push(b.target_id)
      } else if (b.target_type === "paper") {
        paperIds.push(b.target_id)
      }
    })

    const terms: any[] = []
    const papers: any[] = []

    if (termIds.length > 0) {
      const termResults = await query<any>(
        `SELECT 
          t.id,
          t.title,
          t.summary,
          t.views,
          t.likes_count,
          t.comments_count,
          t.is_verified,
          t.created_at,
          c.slug as category_slug,
          c.label as category_label,
          u.id as author_id,
          u.name as author_name,
          u.avatar as author_avatar
        FROM terms t
        INNER JOIN categories c ON t.category_id = c.id
        INNER JOIN users u ON t.author_id = u.id
        WHERE t.id IN (${termIds.map(() => "?").join(",")})
        AND t.status = 'published'`,
        termIds
      )
      
      // 获取每个词条的标签
      const tagsMap = new Map<number, string[]>()
      if (termIds.length > 0) {
        const placeholders = termIds.map(() => "?").join(",")
        const tags = await query<{ term_id: number; tag_name: string }>(
          `SELECT term_id, tag_name FROM term_tags WHERE term_id IN (${placeholders})`,
          termIds
        )

        tags.forEach((tag) => {
          if (!tagsMap.has(tag.term_id)) {
            tagsMap.set(tag.term_id, [])
          }
          tagsMap.get(tag.term_id)!.push(tag.tag_name)
        })
      }
      
      // 将标签添加到词条数据中
      termResults.forEach((term: any) => {
        term.tags = tagsMap.get(term.id) || []
        term.is_verified = term.is_verified || false
      })
      
      terms.push(...termResults)
    }

    if (paperIds.length > 0) {
      const paperResults = await query<any>(
        `SELECT 
          p.id,
          p.title,
          p.title_cn,
          p.abstract,
          p.views,
          p.likes_count,
          p.citations,
          p.publish_date,
          c.slug as category_slug,
          c.label as category_label
        FROM papers p
        INNER JOIN categories c ON p.category_id = c.id
        WHERE p.id IN (${paperIds.map(() => "?").join(",")})
        AND p.status = 'published'`,
        paperIds
      )
      papers.push(...paperResults)
    }

    // 组合结果
    const items = bookmarks.map((b: any) => {
      if (b.target_type === "term") {
        const term = terms.find((t) => t.id === b.target_id)
        if (term) {
          return {
            id: b.id,
            type: "term",
            term: {
              id: term.id.toString(),
              title: term.title,
              summary: term.summary,
              category: term.category_label,
              categorySlug: term.category_slug,
              stats: {
                views: term.views,
                likes: term.likes_count,
                comments: term.comments_count,
              },
              author: {
                id: term.author_id.toString(),
                name: term.author_name,
                avatar: term.author_avatar || "/placeholder.svg",
              },
              tags: term.tags || [],
              createdAt: term.created_at,
              isVerified: term.is_verified || false,
            },
            folder: b.folder_name,
            createdAt: b.created_at,
          }
        }
      } else if (b.target_type === "paper") {
        const paper = papers.find((p) => p.id === b.target_id)
        if (paper) {
          return {
            id: b.id,
            type: "paper",
            paper: {
              id: paper.id.toString(),
              title: paper.title,
              titleCn: paper.title_cn,
              abstract: paper.abstract,
              category: paper.category_label,
              categorySlug: paper.category_slug,
              stats: {
                views: paper.views,
                likes: paper.likes_count,
                citations: paper.citations,
              },
              publishDate: paper.publish_date,
            },
            folder: b.folder_name,
            createdAt: b.created_at,
          }
        }
      }
      return null
    }).filter((item: any) => item !== null)

    // 获取收藏夹列表
    const folders = await query<{ folder_name: string; count: number }>(
      `SELECT 
        folder_name,
        COUNT(*) as count
      FROM bookmarks
      WHERE user_id = ?
      GROUP BY folder_name
      ORDER BY folder_name`,
      [authUser.userId]
    )

    return NextResponse.json({
      items,
      folders: folders.map((f) => ({
        id: f.folder_name,
        name: f.folder_name === "default" ? "全部收藏" : f.folder_name,
        count: f.count,
      })),
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Get bookmarks error:", error)
    return NextResponse.json(
      { error: "获取收藏列表失败" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 确保 bookmarks 表存在
    await ensureBookmarksTable()
    const authUser = requireAuth(request)
    const body = await request.json()
    const { targetType, targetId, folderName = "default" } = body

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      )
    }

    if (!["term", "paper"].includes(targetType)) {
      return NextResponse.json(
        { error: "无效的目标类型" },
        { status: 400 }
      )
    }

    // 检查是否已收藏
    const existing = await query<any>(
      "SELECT id FROM bookmarks WHERE user_id = ? AND target_type = ? AND target_id = ?",
      [authUser.userId, targetType, targetId]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "已收藏" },
        { status: 400 }
      )
    }

    await execute(
      "INSERT INTO bookmarks (user_id, target_type, target_id, folder_name) VALUES (?, ?, ?, ?)",
      [authUser.userId, targetType, targetId, folderName]
    )

    return NextResponse.json({
      message: "收藏成功",
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Add bookmark error:", error)
    return NextResponse.json(
      { error: "收藏失败" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = requireAuth(request)
    const searchParams = request.nextUrl.searchParams
    const bookmarkId = searchParams.get("id")
    const targetType = searchParams.get("targetType")
    const targetId = searchParams.get("targetId")

    if (bookmarkId) {
      // 通过收藏ID删除
      const result = await execute(
        "DELETE FROM bookmarks WHERE id = ? AND user_id = ?",
        [bookmarkId, authUser.userId]
      )

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: "收藏不存在" },
          { status: 404 }
        )
      }
    } else if (targetType && targetId) {
      // 通过目标类型和ID删除
      const result = await execute(
        "DELETE FROM bookmarks WHERE user_id = ? AND target_type = ? AND target_id = ?",
        [authUser.userId, targetType, targetId]
      )

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: "收藏不存在" },
          { status: 404 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: "取消收藏成功",
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Delete bookmark error:", error)
    return NextResponse.json(
      { error: "取消收藏失败" },
      { status: 500 }
    )
  }
}
