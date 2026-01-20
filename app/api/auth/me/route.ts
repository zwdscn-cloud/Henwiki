import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware/auth"
import { findUserById, getUserBadges, getUserSpecialties } from "@/lib/models/user"

export async function GET(request: NextRequest) {
  try {
    const authUser = requireAuth(request)

    // 获取用户信息
    const user = await findUserById(authUser.userId)
    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      )
    }

    // 获取用户徽章和专业领域
    const badges = await getUserBadges(user.id)
    const specialties = await getUserSpecialties(user.id)
    
    // 获取用户权限
    const { getUserPermissionCodes } = await import("@/lib/models/permission")
    const permissions = await getUserPermissionCodes(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        points: user.points,
        level: user.level,
        contributions: user.contributions,
        followers_count: user.followers_count,
        following_count: user.following_count,
        streak: user.streak,
        last_check_in: user.last_check_in,
        is_verified: user.is_verified,
        wechat_qr_code: user.wechat_qr_code,
        alipay_qr_code: user.alipay_qr_code,
        role: user.role,
        permissions,
        joined_at: user.joined_at,
        badges: badges.map((b) => ({
          id: b.badge_id,
          name: b.badge_name,
          icon: b.icon,
          description: b.description,
          earnedAt: b.earned_at,
        })),
        specialties,
      },
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Get user error:", error)
    return NextResponse.json(
      { error: "获取用户信息失败" },
      { status: 500 }
    )
  }
}
