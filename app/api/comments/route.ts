import { NextRequest, NextResponse } from "next/server"
import { createComment, getCommentsByTermId } from "@/lib/models/comment"
import { requireAuth } from "@/lib/middleware/auth"
import { createCommentSchema } from "@/lib/utils/validation"

export async function POST(request: NextRequest) {
  try {
    const authUser = requireAuth(request)
    const body = await request.json()
    const validated = createCommentSchema.parse(body)

    const commentId = await createComment({
      termId: validated.termId,
      authorId: authUser.userId,
      content: validated.content,
      parentId: validated.parentId,
    })

    return NextResponse.json(
      {
        message: "评论成功",
        commentId,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "数据验证失败", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Create comment error:", error)
    return NextResponse.json(
      { error: "评论失败" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const termId = searchParams.get("termId")
    const userId = searchParams.get("userId")

    if (termId) {
      const termIdNum = parseInt(termId)
      if (isNaN(termIdNum)) {
        return NextResponse.json(
          { error: "无效的词条ID" },
          { status: 400 }
        )
      }

      const comments = await getCommentsByTermId(termIdNum)
      return NextResponse.json({
        comments,
      })
    } else if (userId) {
      const userIdNum = parseInt(userId)
      if (isNaN(userIdNum)) {
        return NextResponse.json(
          { error: "无效的用户ID" },
          { status: 400 }
        )
      }

      const { getCommentsByUserId } = await import("@/lib/models/comment")
      const comments = await getCommentsByUserId(userIdNum)
      return NextResponse.json({
        comments,
      })
    } else {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Get comments error:", error)
    return NextResponse.json(
      { error: "获取评论列表失败" },
      { status: 500 }
    )
  }
}
