import { NextRequest, NextResponse } from "next/server"
import {
  getTermById,
  updateTerm,
  deleteTerm,
  incrementViews,
} from "@/lib/models/term"
import { requireAuth } from "@/lib/middleware/auth"
import { updateTermSchema } from "@/lib/utils/validation"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const termId = parseInt(id)
    // 检查是否为有效数字、正数，且在安全范围内（避免超大数字导致问题）
    if (isNaN(termId) || termId <= 0 || termId > Number.MAX_SAFE_INTEGER) {
      return NextResponse.json(
        { error: "无效的词条ID" },
        { status: 400 }
      )
    }

    const term = await getTermById(termId)
    if (!term) {
      return NextResponse.json(
        { error: "词条不存在" },
        { status: 404 }
      )
    }

    // 增加浏览量
    await incrementViews(termId)

    return NextResponse.json({ term })
  } catch (error) {
    console.error("Get term error:", error)
    return NextResponse.json(
      { error: "获取词条详情失败" },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    // 检查权限：只有作者可以更新
    const term = await getTermById(termId)
    if (!term) {
      return NextResponse.json(
        { error: "词条不存在" },
        { status: 404 }
      )
    }

    if (term.author_id !== authUser.userId) {
      return NextResponse.json(
        { error: "无权修改此词条" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = updateTermSchema.parse(body)

    await updateTerm(termId, {
      title: validated.title,
      categoryId: validated.categoryId,
      summary: validated.summary,
      content: validated.content,
      tags: validated.tags,
      status: validated.status as any,
    })

    return NextResponse.json({
      message: "词条更新成功",
    })
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

    console.error("Update term error:", error)
    return NextResponse.json(
      { error: "更新词条失败" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // 检查权限：只有作者可以删除
    const term = await getTermById(termId)
    if (!term) {
      return NextResponse.json(
        { error: "词条不存在" },
        { status: 404 }
      )
    }

    if (term.author_id !== authUser.userId) {
      return NextResponse.json(
        { error: "无权删除此词条" },
        { status: 403 }
      )
    }

    await deleteTerm(termId)

    return NextResponse.json({
      message: "词条删除成功",
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Delete term error:", error)
    return NextResponse.json(
      { error: "删除词条失败" },
      { status: 500 }
    )
  }
}
