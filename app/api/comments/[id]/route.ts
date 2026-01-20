import { NextRequest, NextResponse } from "next/server"
import { deleteComment, getCommentsByTermId } from "@/lib/models/comment"
import { requireAuth } from "@/lib/middleware/auth"
import { queryOne } from "@/lib/db/connection"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = requireAuth(request)
    const { id } = await params
    const commentId = parseInt(id)

    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: "无效的评论ID" },
        { status: 400 }
      )
    }

    // 检查权限：只有作者可以删除
    const comment = await queryOne<{ author_id: number; term_id: number }>(
      "SELECT author_id, term_id FROM comments WHERE id = ?",
      [commentId]
    )

    if (!comment) {
      return NextResponse.json(
        { error: "评论不存在" },
        { status: 404 }
      )
    }

    if (comment.author_id !== authUser.userId) {
      return NextResponse.json(
        { error: "无权删除此评论" },
        { status: 403 }
      )
    }

    await deleteComment(commentId, comment.term_id)

    return NextResponse.json({
      message: "评论删除成功",
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Delete comment error:", error)
    return NextResponse.json(
      { error: "删除评论失败" },
      { status: 500 }
    )
  }
}

// GET 方法应该通过查询参数获取词条的评论，而不是通过路径参数
// 这个文件只处理 DELETE 操作
