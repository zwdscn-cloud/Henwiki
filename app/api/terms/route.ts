import { NextRequest, NextResponse } from "next/server"
import { getTerms, createTerm } from "@/lib/models/term"
import { requireAuth } from "@/lib/middleware/auth"
import { createTermSchema } from "@/lib/utils/validation"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get("categoryId")
      ? parseInt(searchParams.get("categoryId")!)
      : undefined
    const authorId = searchParams.get("authorId")
      ? parseInt(searchParams.get("authorId")!)
      : undefined
    const tag = searchParams.get("tag") || undefined
    const statusParam = searchParams.get("status")
    // 如果传了 status=all 或者是作者查看自己的词条，允许查看所有状态
    const status = statusParam === "all" ? undefined : (statusParam || "published")
    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page")!)
      : 1
    const pageSize = searchParams.get("pageSize")
      ? parseInt(searchParams.get("pageSize")!)
      : 20
    const orderBy =
      (searchParams.get("orderBy") as "created_at" | "views" | "likes_count" | "recommended" | "trending") ||
      "created_at"

    // 尝试获取当前用户ID（如果已登录）
    let userId: number | null = null
    try {
      const authHeader = request.headers.get("Authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const { verifyToken } = await import("@/lib/utils/jwt")
        const token = authHeader.split(" ")[1]
        const payload = verifyToken(token)
        if (payload) {
          userId = payload.userId
        }
      }
    } catch {
      // 忽略认证错误，继续使用 null
    }

    const terms = await getTerms({
      categoryId,
      authorId,
      tag,
      status,
      page,
      pageSize,
      orderBy,
      userId,
    })

    return NextResponse.json({
      terms,
      pagination: {
        page,
        pageSize,
        total: terms.length,
      },
    })
  } catch (error: any) {
    console.error("Get terms error:", error)
    return NextResponse.json(
      { 
        error: "获取词条列表失败",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = requireAuth(request)
    const body = await request.json()
    const validated = createTermSchema.parse(body)

    const termId = await createTerm({
      title: validated.title,
      categoryId: validated.categoryId,
      summary: validated.summary,
      content: validated.content,
      authorId: authUser.userId,
      tags: validated.tags,
    })

    return NextResponse.json(
      {
        message: "词条创建成功，等待审核",
        termId,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "数据验证失败", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Create term error:", error)
    return NextResponse.json(
      { error: "创建词条失败" },
      { status: 500 }
    )
  }
}
