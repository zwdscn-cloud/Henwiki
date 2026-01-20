import { NextRequest, NextResponse } from "next/server"
import { loginSchema } from "@/lib/utils/validation"
import { verifyPassword } from "@/lib/utils/password"
import { generateToken } from "@/lib/utils/jwt"
import { findUserByEmail, getUserBadges, getUserSpecialties } from "@/lib/models/user"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = loginSchema.parse(body)

    // 查找用户
    const user = await findUserByEmail(validated.email)
    if (!user) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      )
    }

    // 验证密码
    const isValid = await verifyPassword(validated.password, user.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      )
    }

    // 获取用户徽章和专业领域
    const badges = await getUserBadges(user.id)
    const specialties = await getUserSpecialties(user.id)

    // 生成 Token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    // 返回用户信息（不包含密码）
    return NextResponse.json({
      message: "登录成功",
      token,
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
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "数据验证失败", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Login error:", error)
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    )
  }
}
