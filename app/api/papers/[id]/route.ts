import { NextRequest, NextResponse } from "next/server"
import {
  getPaperById,
  updatePaper,
  incrementViews,
  incrementDownloads,
} from "@/lib/models/paper"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const paperId = parseInt(id)
    if (isNaN(paperId)) {
      return NextResponse.json(
        { error: "无效的论文ID" },
        { status: 400 }
      )
    }

    const paper = await getPaperById(paperId)
    if (!paper) {
      return NextResponse.json(
        { error: "论文不存在" },
        { status: 404 }
      )
    }

    // 增加浏览量
    await incrementViews(paperId)

    return NextResponse.json({ paper })
  } catch (error) {
    console.error("Get paper error:", error)
    return NextResponse.json(
      { error: "获取论文详情失败" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const paperId = parseInt(id)

    if (isNaN(paperId)) {
      return NextResponse.json(
        { error: "无效的论文ID" },
        { status: 400 }
      )
    }

    const body = await request.json()
    await updatePaper(paperId, body)

    return NextResponse.json({
      message: "论文更新成功",
    })
  } catch (error) {
    console.error("Update paper error:", error)
    return NextResponse.json(
      { error: "更新论文失败" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const paperId = parseInt(id)
    if (isNaN(paperId)) {
      return NextResponse.json(
        { error: "无效的论文ID" },
        { status: 400 }
      )
    }

    // 增加下载量
    await incrementDownloads(paperId)

    return NextResponse.json({
      message: "下载记录成功",
    })
  } catch (error) {
    console.error("Record download error:", error)
    return NextResponse.json(
      { error: "记录下载失败" },
      { status: 500 }
    )
  }
}
