import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware/auth"
import { query, execute } from "@/lib/db/connection"
import { ensureDiscussionsTable } from "@/lib/db/connection"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDiscussionsTable()

    const authUser = requireAuth(request)
    const { id } = await params
    const discussionId = parseInt(id)

    if (isNaN(discussionId)) {
      return NextResponse.json({ error: "无效的讨论ID" }, { status: 400 })
    }

    // 检查是否已点赞
    const [existing] = await query<{ id: number }>(
      `SELECT id FROM likes 
       WHERE user_id = ? AND target_type = 'discussion' AND target_id = ?`,
      [authUser.userId, discussionId]
    )

    if (existing) {
      // 取消点赞
      await execute(
        `DELETE FROM likes 
         WHERE user_id = ? AND target_type = 'discussion' AND target_id = ?`,
        [authUser.userId, discussionId]
      )
      await execute(`UPDATE discussions SET likes_count = likes_count - 1 WHERE id = ?`, [
        discussionId,
      ])

      return NextResponse.json({ liked: false, likesCount: 0 })
    } else {
      // 添加点赞
      await execute(
        `INSERT INTO likes (user_id, target_type, target_id) VALUES (?, 'discussion', ?)`,
        [authUser.userId, discussionId]
      )
      await execute(`UPDATE discussions SET likes_count = likes_count + 1 WHERE id = ?`, [
        discussionId,
      ])

      const [discussion] = await query<{ likes_count: number }>(
        `SELECT likes_count FROM discussions WHERE id = ?`,
        [discussionId]
      )

      return NextResponse.json({ liked: true, likesCount: discussion?.likes_count || 0 })
    }
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "未授权，请先登录" }, { status: 401 })
    }

    console.error("Toggle like error:", error)
    return NextResponse.json({ error: "操作失败" }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDiscussionsTable()

    const authUser = requireAuth(request)
    const { id } = await params
    const discussionId = parseInt(id)

    if (isNaN(discussionId)) {
      return NextResponse.json({ error: "无效的讨论ID" }, { status: 400 })
    }

    const [like] = await query<{ id: number }>(
      `SELECT id FROM likes 
       WHERE user_id = ? AND target_type = 'discussion' AND target_id = ?`,
      [authUser.userId, discussionId]
    )

    return NextResponse.json({ liked: !!like })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "未授权，请先登录" }, { status: 401 })
    }

    console.error("Check like status error:", error)
    return NextResponse.json({ error: "检查失败" }, { status: 500 })
  }
}
