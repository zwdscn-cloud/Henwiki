import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware/auth"
import { query, ensureBookmarksTable } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    // 确保 bookmarks 表存在
    await ensureBookmarksTable()
    const authUser = requireAuth(request)
    const searchParams = request.nextUrl.searchParams
    const targetType = searchParams.get("targetType")
    const targetId = searchParams.get("targetId")

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

    const result = await query<any>(
      "SELECT id, folder_name FROM bookmarks WHERE user_id = ? AND target_type = ? AND target_id = ?",
      [authUser.userId, targetType, targetId]
    )

    return NextResponse.json({
      isBookmarked: result.length > 0,
      folderName: result.length > 0 ? result[0].folder_name : null,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Check bookmark error:", error)
    return NextResponse.json(
      { error: "检查收藏状态失败" },
      { status: 500 }
    )
  }
}
