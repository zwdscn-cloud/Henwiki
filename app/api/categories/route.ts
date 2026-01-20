import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    // 实时计算每个分类下已发布的词条数量
    const categories = await query<{
      id: number
      slug: string
      label: string
      description: string | null
      color: string
      count: number
    }>(
      `SELECT 
        c.id,
        c.slug,
        c.label,
        c.description,
        c.color,
        COALESCE(COUNT(t.id), 0) as count
      FROM categories c
      LEFT JOIN terms t ON c.id = t.category_id AND t.status = 'published'
      GROUP BY c.id, c.slug, c.label, c.description, c.color
      ORDER BY count DESC, c.id ASC`
    )

    return NextResponse.json({
      categories: categories.map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        label: cat.label,
        description: cat.description,
        color: cat.color,
        count: Number(cat.count), // 确保是数字类型
      })),
    })
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json(
      { error: "获取分类列表失败" },
      { status: 500 }
    )
  }
}
