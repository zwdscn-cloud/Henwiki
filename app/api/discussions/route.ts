import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware/auth"
import { createDiscussion, getDiscussions } from "@/lib/models/discussion"
import { ensureDiscussionsTable } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    await ensureDiscussionsTable()

    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get("categoryId")
      ? parseInt(searchParams.get("categoryId")!)
      : undefined
    const authorId = searchParams.get("authorId")
      ? parseInt(searchParams.get("authorId")!)
      : undefined
    const status = searchParams.get("status") || "published"
    const sortBy =
      (searchParams.get("sortBy") as
        | "created_at"
        | "last_reply_at"
        | "replies_count"
        | "likes_count"
        | "views") || "last_reply_at"
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1
    const pageSize = searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : 20
    const search = searchParams.get("search") || undefined

    const discussions = await getDiscussions({
      categoryId,
      authorId,
      status,
      sortBy,
      page,
      pageSize,
      search,
    })

    return NextResponse.json({
      discussions,
      pagination: {
        page,
        pageSize,
        total: discussions.length,
      },
    })
  } catch (error: any) {
    console.error("Get discussions error:", error)
    return NextResponse.json(
      {
        error: "获取讨论列表失败",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDiscussionsTable()

    const authUser = requireAuth(request)
    const body = await request.json()

    if (!body.title || !body.content) {
      return NextResponse.json({ error: "标题和内容不能为空" }, { status: 400 })
    }

    const discussionId = await createDiscussion({
      title: body.title.trim(),
      content: body.content.trim(),
      authorId: authUser.userId,
      categoryId: body.categoryId ? parseInt(body.categoryId) : undefined,
      tags: body.tags || [],
    })

    return NextResponse.json(
      {
        message: "讨论创建成功",
        discussionId,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "未授权，请先登录" }, { status: 401 })
    }

    console.error("Create discussion error:", error)
    return NextResponse.json({ error: "创建讨论失败" }, { status: 500 })
  }
}
