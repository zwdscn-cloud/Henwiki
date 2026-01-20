import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware/auth"
import { updateUser, findUserById, addUserBadge } from "@/lib/models/user"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = requireAuth(request)
    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "无效的用户ID" },
        { status: 400 }
      )
    }

    if (authUser.userId !== userId) {
      return NextResponse.json(
        { error: "无权操作" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { points, streak } = body

    const user = await findUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      )
    }

    const today = new Date().toISOString().split("T")[0]

    // 更新用户信息
    await updateUser(userId, {
      points: user.points + points,
      streak,
      last_check_in: today,
    })

    // 检查是否获得新徽章
    if (streak >= 7) {
      const badges = await import("@/lib/models/user").then((m) => m.getUserBadges(userId))
      const hasBadge = badges.some((b) => b.badge_id === "b2")
      if (!hasBadge) {
        await addUserBadge(
          userId,
          "b2",
          "活跃达人",
          "🔥",
          "连续签到7天"
        )
      }
    }

    return NextResponse.json({
      message: "签到成功",
      points,
      streak,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Check in error:", error)
    return NextResponse.json(
      { error: "签到失败" },
      { status: 500 }
    )
  }
}
