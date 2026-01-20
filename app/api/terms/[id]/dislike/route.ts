import { NextRequest, NextResponse } from "next/server"
import { toggleDislike, isDisliked } from "@/lib/models/term"
import { requireAuth } from "@/lib/middleware/auth"
import { ensureDislikesTable } from "@/lib/db/connection"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 确保 dislikes 表和字段存在
    await ensureDislikesTable()
    
    const authUser = requireAuth(request)
    const { id } = await params
    const termId = parseInt(id)

    if (isNaN(termId)) {
      return NextResponse.json(
        { error: "无效的词条ID" },
        { status: 400 }
      )
    }

    const result = await toggleDislike(termId, authUser.userId)

    return NextResponse.json({
      message: result.disliked ? "已踩" : "已取消踩",
      disliked: result.disliked,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Toggle dislike error:", error)
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
    // 确保 dislikes 表和字段存在
    await ensureDislikesTable()
    
    const authUser = requireAuth(request)
    const { id } = await params
    const termId = parseInt(id)

    if (isNaN(termId)) {
      return NextResponse.json(
        { error: "无效的词条ID" },
        { status: 400 }
      )
    }

    const disliked = await isDisliked(termId, authUser.userId)

    return NextResponse.json({
      disliked,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Check dislike status error:", error)
    return NextResponse.json(
      { error: "检查踩状态失败" },
      { status: 500 }
    )
  }
}
