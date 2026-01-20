import { NextRequest, NextResponse } from "next/server"
import { toggleLike } from "@/lib/models/paper"
import { requireAuth } from "@/lib/middleware/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = requireAuth(request)
    const { id } = await params
    const paperId = parseInt(id)

    if (isNaN(paperId)) {
      return NextResponse.json(
        { error: "无效的论文ID" },
        { status: 400 }
      )
    }

    const result = await toggleLike(paperId, authUser.userId)

    return NextResponse.json({
      message: result.liked ? "点赞成功" : "取消点赞成功",
      liked: result.liked,
      likesCount: result.likesCount,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Toggle like error:", error)
    return NextResponse.json(
      { error: "操作失败" },
      { status: 500 }
    )
  }
}
