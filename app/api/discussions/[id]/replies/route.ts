import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware/auth"
import { createReply, getDiscussionReplies } from "@/lib/models/discussion"
import { ensureDiscussionsTable } from "@/lib/db/connection"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDiscussionsTable()

    const { id } = await params
    const discussionId = parseInt(id)

    if (isNaN(discussionId)) {
      return NextResponse.json({ error: "无效的讨论ID" }, { status: 400 })
    }

    const replies = await getDiscussionReplies(discussionId)

    return NextResponse.json({ replies })
  } catch (error: any) {
    console.error("Get replies error:", error)
    return NextResponse.json({ error: "获取回复失败" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDiscussionsTable()

    const authUser = requireAuth(request)
    const { id } = await params
    const discussionId = parseInt(id)
    const body = await request.json()

    if (isNaN(discussionId)) {
      return NextResponse.json({ error: "无效的讨论ID" }, { status: 400 })
    }

    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ error: "回复内容不能为空" }, { status: 400 })
    }

    const replyId = await createReply({
      discussionId,
      authorId: authUser.userId,
      content: body.content.trim(),
      parentId: body.parentId ? parseInt(body.parentId) : undefined,
    })

    return NextResponse.json(
      {
        message: "回复成功",
        replyId,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "未授权，请先登录" }, { status: 401 })
    }

    console.error("Create reply error:", error)
    return NextResponse.json({ error: "回复失败" }, { status: 500 })
  }
}
