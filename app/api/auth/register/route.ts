import { NextRequest, NextResponse } from "next/server"
import { registerSchema } from "@/lib/utils/validation"
import { hashPassword } from "@/lib/utils/password"
import { generateToken } from "@/lib/utils/jwt"
import { createUser, findUserByEmail, addUserBadge } from "@/lib/models/user"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = registerSchema.parse(body)

    // 检查邮箱是否已存在
    const existingUser = await findUserByEmail(validated.email)
    if (existingUser) {
      return NextResponse.json(
        { error: "邮箱已被注册" },
        { status: 400 }
      )
    }

    // 加密密码
    const passwordHash = await hashPassword(validated.password)

    // 创建用户
    const userId = await createUser(validated.email, passwordHash, validated.name)

    // 添加新手上路徽章
    await addUserBadge(
      userId,
      "b0",
      "新手上路",
      "🌱",
      "欢迎加入高能百科"
    )

    // 生成 Token
    const token = generateToken({
      userId,
      email: validated.email,
    })

    return NextResponse.json(
      {
        message: "注册成功",
        token,
        user: {
          id: userId,
          email: validated.email,
          name: validated.name,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "数据验证失败", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Register error:", error)
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    )
  }
}
