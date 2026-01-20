import { NextRequest, NextResponse } from "next/server"
import { getUserPublic, getUserBadges, getUserSpecialties, findUserById, updateUser, setUserSpecialties } from "@/lib/models/user"
import { requireAuth } from "@/lib/middleware/auth"
import { updateProfileSchema } from "@/lib/utils/validation"
import { ensurePaymentCodesColumns } from "@/lib/db/connection"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensurePaymentCodesColumns()
    
    const { id } = await params
    const userId = parseInt(id)
    // 检查是否为有效数字、正数，且在安全范围内
    if (isNaN(userId) || userId <= 0 || userId > Number.MAX_SAFE_INTEGER) {
      return NextResponse.json(
        { error: "无效的用户ID" },
        { status: 400 }
      )
    }

    const user = await getUserPublic(userId)
    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      )
    }

    const badges = await getUserBadges(userId)
    const specialties = await getUserSpecialties(userId)

    return NextResponse.json({
      user: {
        ...user,
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
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json(
      { error: "获取用户信息失败" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensurePaymentCodesColumns()
    
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
        { error: "无权修改此用户信息" },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    console.log("[PUT /users/[id]] Received update request for user:", userId)
    console.log("[PUT /users/[id]] Request body:", JSON.stringify(body, null, 2))
    
    let validated
    try {
      validated = updateProfileSchema.parse(body)
      console.log("[PUT /users/[id]] Validation passed:", JSON.stringify(validated, null, 2))
    } catch (validationError: any) {
      console.error("[PUT /users/[id]] Validation error:", validationError)
      throw validationError
    }

    // 更新基本信息
    const updateData: any = {}
    if (validated.name !== undefined && validated.name !== "") {
      updateData.name = validated.name
    }
    if (validated.bio !== undefined) {
      updateData.bio = validated.bio === "" || validated.bio === null ? null : validated.bio
    }
    if (validated.avatar !== undefined && validated.avatar !== "") {
      updateData.avatar = validated.avatar
    }
    if (validated.wechatQrCode !== undefined) {
      updateData.wechat_qr_code = validated.wechatQrCode === "" ? null : validated.wechatQrCode
    }
    if (validated.alipayQrCode !== undefined) {
      updateData.alipay_qr_code = validated.alipayQrCode === "" ? null : validated.alipayQrCode
    }
    
    console.log("[PUT /users/[id]] Update data to save:", JSON.stringify(updateData, null, 2))
    
    try {
      if (Object.keys(updateData).length > 0) {
        await updateUser(userId, updateData)
        console.log("[PUT /users/[id]] User basic info updated successfully")
      }

      // 更新专业领域
      if (validated.specialties !== undefined) {
        await setUserSpecialties(userId, validated.specialties)
        console.log("[PUT /users/[id]] User specialties updated successfully")
      }

      // 如果传入了 points 或 level（用于签到等操作）
      if (body.points !== undefined || body.level !== undefined) {
        await updateUser(userId, {
          points: body.points,
          level: body.level,
        })
        console.log("[PUT /users/[id]] User points/level updated successfully")
      }

      return NextResponse.json({
        message: "更新成功",
      })
    } catch (dbError: any) {
      console.error("[PUT /users/[id]] Database error:", dbError)
      console.error("[PUT /users/[id]] Database error details:", {
        code: dbError.code,
        errno: dbError.errno,
        sqlState: dbError.sqlState,
        sqlMessage: dbError.sqlMessage,
        message: dbError.message,
      })
      
      // 检查是否是数据库字段不存在的错误
      if (dbError.code === "ER_BAD_FIELD_ERROR") {
        return NextResponse.json(
          { 
            error: "数据库字段错误",
            message: `数据库字段不存在: ${dbError.sqlMessage || "未知字段"}`,
            details: dbError.sqlMessage
          },
          { status: 500 }
        )
      }
      
      // 检查是否是其他数据库错误
      if (dbError.code && dbError.code.startsWith("ER_")) {
        return NextResponse.json(
          { 
            error: "数据库操作失败",
            message: dbError.sqlMessage || dbError.message || "数据库操作失败",
            details: dbError.message
          },
          { status: 500 }
        )
      }
      
      throw dbError
    }
  } catch (error: any) {
    console.error("[PUT /users/[id]] Error caught:", error)
    console.error("[PUT /users/[id]] Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
    })
    
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    if (error.name === "ZodError") {
      const errorMessages = error.errors.map((e: any) => {
        const fieldName = e.path[0] || "未知字段"
        const fieldMap: Record<string, string> = {
          name: "用户名",
          bio: "个人简介",
          avatar: "头像",
          specialties: "兴趣领域",
          wechatQrCode: "微信收款码",
          alipayQrCode: "支付宝收款码",
        }
        return {
          path: e.path,
          message: e.message,
          field: fieldMap[fieldName] || fieldName,
        }
      })
      
      // 生成友好的错误提示
      const friendlyMessage = errorMessages.length === 1
        ? `${errorMessages[0].field}: ${errorMessages[0].message}`
        : `以下字段验证失败：\n${errorMessages.map(e => `  • ${e.field}: ${e.message}`).join('\n')}`
      
      return NextResponse.json(
        { 
          error: "数据验证失败", 
          details: errorMessages,
          message: friendlyMessage
        },
        { status: 400 }
      )
    }

    // 处理数据库错误
    if (error.code && error.code.startsWith("ER_")) {
      return NextResponse.json(
        { 
          error: "数据库操作失败",
          message: error.sqlMessage || error.message || "数据库操作失败",
          details: error.message
        },
        { status: 500 }
      )
    }

    console.error("[PUT /users/[id]] Unexpected error:", error)
    return NextResponse.json(
      { 
        error: "更新用户信息失败",
        message: error.message || "更新用户信息失败，请稍后重试"
      },
      { status: 500 }
    )
  }
}
