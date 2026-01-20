import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware/auth"
import { ensureAnnotationsTable } from "@/lib/db/connection"
import { getAnnotations, createAnnotation } from "@/lib/models/annotation"

export async function GET(request: NextRequest) {
  try {
    await ensureAnnotationsTable()
    const authUser = requireAuth(request)
    const searchParams = request.nextUrl.searchParams
    const termId = searchParams.get("termId")
    const targetType = searchParams.get("targetType") as "term" | "paper" | null

    const annotations = await getAnnotations({
      userId: authUser.userId,
      termId: termId ? parseInt(termId) : undefined,
      targetType: targetType || undefined,
    })

    return NextResponse.json({ annotations })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Get annotations error:", error)
    return NextResponse.json(
      { error: "获取标记失败" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureAnnotationsTable()
    const authUser = requireAuth(request)
    const body = await request.json()

    const {
      termId,
      targetType = "term",
      selectedText,
      startOffset,
      endOffset,
      color = "yellow",
      note,
      tags = [],
    } = body

    if (!termId || !selectedText || startOffset === undefined || endOffset === undefined) {
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

    const annotationId = await createAnnotation({
      userId: authUser.userId,
      termId: parseInt(termId),
      targetType,
      selectedText,
      startOffset: parseInt(startOffset),
      endOffset: parseInt(endOffset),
      color,
      note: note || null,
      tags: Array.isArray(tags) ? tags : [],
    })

    return NextResponse.json({
      message: "标记创建成功",
      annotationId,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Create annotation error:", error)
    return NextResponse.json(
      { error: "创建标记失败" },
      { status: 500 }
    )
  }
}
