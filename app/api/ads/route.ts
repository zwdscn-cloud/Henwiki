import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const variant = searchParams.get("variant") || "feed"
    const limit = parseInt(searchParams.get("limit") || "10")

    // 获取启用的广告，按优先级排序
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const ads = await query<any>(
      `SELECT 
        id,
        title,
        description,
        image,
        url,
        sponsor,
        cta,
        tag,
        variant,
        type,
        gradient,
        priority
      FROM ads
      WHERE variant = ? 
        AND status = 'active'
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
      ORDER BY priority DESC, RAND()
      LIMIT ?`,
      [variant, limit]
    )

    return NextResponse.json({
      ads,
    })
  } catch (error: any) {
    console.error("Get ads error:", error)
    return NextResponse.json(
      { error: "获取广告失败", ads: [] },
      { status: 500 }
    )
  }
}
