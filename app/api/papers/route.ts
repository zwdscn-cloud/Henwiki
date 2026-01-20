import { NextRequest, NextResponse } from "next/server"
import { getPapers, createPaper } from "@/lib/models/paper"
import { requireAuth } from "@/lib/middleware/auth"
import { createPaperSchema } from "@/lib/utils/validation"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get("categoryId")
      ? parseInt(searchParams.get("categoryId")!)
      : undefined
    const authorId = searchParams.get("authorId")
      ? parseInt(searchParams.get("authorId")!)
      : undefined
    const status = searchParams.get("status") || "published"
    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page")!)
      : 1
    const pageSize = searchParams.get("pageSize")
      ? parseInt(searchParams.get("pageSize")!)
      : 20
    const orderBy =
      (searchParams.get("orderBy") as
        | "created_at"
        | "publish_date"
        | "views"
        | "citations") || "created_at"

    const papers = await getPapers({
      categoryId,
      authorId,
      status,
      page,
      pageSize,
      orderBy,
    })

    return NextResponse.json({
      papers,
      pagination: {
        page,
        pageSize,
        total: papers.length,
      },
    })
  } catch (error) {
    console.error("Get papers error:", error)
    return NextResponse.json(
      { error: "获取论文列表失败" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = requireAuth(request)
    const body = await request.json()
    const validated = createPaperSchema.parse(body)

    const paperId = await createPaper({
      title: validated.title,
      titleCn: validated.titleCn,
      abstract: validated.abstract,
      abstractCn: validated.abstractCn,
      categoryId: validated.categoryId,
      journal: validated.journal,
      publishDate: validated.publishDate,
      arxivId: validated.arxivId,
      doi: validated.doi,
      pdfUrl: validated.pdfUrl || undefined,
      authors: validated.authors,
      tags: validated.tags,
    })

    return NextResponse.json(
      {
        message: "论文提交成功，等待审核",
        paperId,
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

    console.error("Create paper error:", error)
    return NextResponse.json(
      { error: "提交论文失败" },
      { status: 500 }
    )
  }
}
