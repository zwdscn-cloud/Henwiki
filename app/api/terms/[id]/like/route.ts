import { NextRequest, NextResponse } from "next/server"
import { toggleLike, isLiked } from "@/lib/models/term"
import { requireAuth } from "@/lib/middleware/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = requireAuth(request)
    const { id } = await params
    const termId = parseInt(id)

    if (isNaN(termId)) {
      return NextResponse.json(
        { error: "无效的词条ID" },
        { status: 400 }
      )
    }

    const result = await toggleLike(termId, authUser.userId)

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = requireAuth(request)
    const { id } = await params
    const termId = parseInt(id)

    if (isNaN(termId)) {
      return NextResponse.json(
        { error: "无效的词条ID" },
        { status: 400 }
      )
    }

    const liked = await isLiked(termId, authUser.userId)

    return NextResponse.json({
      liked,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Check like status error:", error)
    return NextResponse.json(
      { error: "检查点赞状态失败" },
      { status: 500 }
    )
  }
}
