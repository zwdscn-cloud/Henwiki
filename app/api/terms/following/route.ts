import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware/auth"
import { query } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    const authUser = requireAuth(request)
    const searchParams = request.nextUrl.searchParams
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1
    const pageSize = searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : 20

    const offset = (page - 1) * pageSize

    // 一次性获取所有关注用户创建的词条
    const terms = await query<any>(
      `SELECT 
        t.id,
        t.title,
        t.summary,
        t.content,
        t.views,
        t.likes_count,
        t.comments_count,
        t.is_verified,
        t.status,
        t.created_at,
        t.updated_at,
        c.id as category_id,
        c.slug as category_slug,
        c.label as category_label,
        u.id as author_id,
        u.name as author_name,
        u.avatar as author_avatar
      FROM terms t
      INNER JOIN follows f ON t.author_id = f.following_id
      INNER JOIN categories c ON t.category_id = c.id
      INNER JOIN users u ON t.author_id = u.id
      WHERE f.follower_id = ? AND t.status = 'published'
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?`,
      [authUser.userId, pageSize, offset]
    )

    // 获取每个词条的标签
    const termIds = terms.map((t: any) => t.id)
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

    // 获取总数
    const [totalResult] = await query<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM terms t
       INNER JOIN follows f ON t.author_id = f.following_id
       WHERE f.follower_id = ? AND t.status = 'published'`,
      [authUser.userId]
    )

    const transformedTerms = terms.map((term: any) => ({
      id: term.id,
      title: term.title,
      category_id: term.category_id,
      summary: term.summary,
      content: term.content,
      author_id: term.author_id,
      views: term.views,
      likes_count: term.likes_count,
      comments_count: term.comments_count,
      is_verified: term.is_verified,
      status: term.status,
      created_at: term.created_at,
      updated_at: term.updated_at,
      category: {
        id: term.category_id,
        slug: term.category_slug,
        label: term.category_label,
      },
      author: {
        id: term.author_id,
        name: term.author_name,
        avatar: term.author_avatar || "/placeholder-user.jpg",
      },
      tags: tagsMap.get(term.id) || [],
    }))

    return NextResponse.json({
      terms: transformedTerms,
      pagination: {
        page,
        pageSize,
        total: totalResult?.count || 0,
      },
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Get following terms error:", error)
    return NextResponse.json(
      { error: "获取关注动态失败" },
      { status: 500 }
    )
  }
}
