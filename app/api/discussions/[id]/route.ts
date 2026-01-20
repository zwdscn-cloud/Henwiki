import { NextRequest, NextResponse } from "next/server"
import { getDiscussionById } from "@/lib/models/discussion"
import { ensureDiscussionsTable } from "@/lib/db/connection"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDiscussionsTable()

    const { id } = await params
    const discussionId = parseInt(id)

    if (isNaN(discussionId)) {
      return NextResponse.json({ error: "无效的讨论ID" }, { status: 400 })
    }

    const discussion = await getDiscussionById(discussionId)

    if (!discussion) {
      return NextResponse.json({ error: "讨论不存在" }, { status: 404 })
    }

    return NextResponse.json({ discussion })
  } catch (error: any) {
    console.error("Get discussion error:", error)
    return NextResponse.json({ error: "获取讨论失败" }, { status: 500 })
  }
}
