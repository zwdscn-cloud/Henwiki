import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware/auth"
import { ensureAnnotationsTable } from "@/lib/db/connection"
import { getAnnotationById, updateAnnotation, deleteAnnotation } from "@/lib/models/annotation"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureAnnotationsTable()
    const authUser = requireAuth(request)
    const { id } = await params
    const annotationId = parseInt(id)

    if (isNaN(annotationId)) {
      return NextResponse.json(
        { error: "无效的标记ID" },
        { status: 400 }
      )
    }

    const annotation = await getAnnotationById(annotationId, authUser.userId)

    if (!annotation) {
      return NextResponse.json(
        { error: "标记不存在" },
        { status: 404 }
      )
    }

    return NextResponse.json({ annotation })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Get annotation error:", error)
    return NextResponse.json(
      { error: "获取标记失败" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureAnnotationsTable()
    const authUser = requireAuth(request)
    const { id } = await params
    const annotationId = parseInt(id)

    if (isNaN(annotationId)) {
      return NextResponse.json(
        { error: "无效的标记ID" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { color, note, tags } = body

    // 检查标记是否存在且属于当前用户
    const existing = await getAnnotationById(annotationId, authUser.userId)
    if (!existing) {
      return NextResponse.json(
        { error: "标记不存在" },
        { status: 404 }
      )
    }

    await updateAnnotation(annotationId, authUser.userId, {
      color,
      note,
      tags: Array.isArray(tags) ? tags : undefined,
    })

    return NextResponse.json({
      message: "标记更新成功",
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Update annotation error:", error)
    return NextResponse.json(
      { error: "更新标记失败" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureAnnotationsTable()
    const authUser = requireAuth(request)
    const { id } = await params
    const annotationId = parseInt(id)

    if (isNaN(annotationId)) {
      return NextResponse.json(
        { error: "无效的标记ID" },
        { status: 400 }
      )
    }

    // 检查标记是否存在且属于当前用户
    const existing = await getAnnotationById(annotationId, authUser.userId)
    if (!existing) {
      return NextResponse.json(
        { error: "标记不存在" },
        { status: 404 }
      )
    }

    await deleteAnnotation(annotationId, authUser.userId)

    return NextResponse.json({
      message: "标记删除成功",
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Delete annotation error:", error)
    return NextResponse.json(
      { error: "删除标记失败" },
      { status: 500 }
    )
  }
}
