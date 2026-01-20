import { z } from "zod"

// 用户注册验证
export const registerSchema = z.object({
  name: z.string().min(2, "姓名至少2个字符").max(100, "姓名最多100个字符"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少6个字符").max(100, "密码最多100个字符"),
})

// 用户登录验证
export const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(1, "密码不能为空"),
})

// 词条创建验证
export const createTermSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(255, "标题最多255个字符"),
  categoryId: z.number().int().positive("分类ID必须为正整数"),
  summary: z.string().min(1, "简介不能为空"),
  content: z.string().min(1, "内容不能为空"),
  tags: z.array(z.string()).optional().nullable(),
})

// 词条更新验证
export const updateTermSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  categoryId: z.number().int().positive().optional(),
  summary: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional().nullable(),
})

// 论文创建验证
export const createPaperSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(500, "标题最多500个字符"),
  titleCn: z.string().max(500).optional(),
  abstract: z.string().min(1, "摘要不能为空"),
  abstractCn: z.string().optional(),
  categoryId: z.number().int().positive("分类ID必须为正整数"),
  journal: z.string().max(200).optional(),
  publishDate: z.string().optional(),
  arxivId: z.string().max(50).optional(),
  doi: z.string().max(100).optional(),
  pdfUrl: z.string().url("PDF链接格式不正确").optional().or(z.literal("")),
  authors: z
    .array(
      z.object({
        name: z.string().min(1, "作者姓名不能为空"),
        affiliation: z.string().optional(),
      })
    )
    .min(1, "至少需要一个作者"),
  tags: z.array(z.string()).optional(),
})

// 评论创建验证
export const createCommentSchema = z.object({
  termId: z.number().int().positive("词条ID必须为正整数"),
  content: z.string().min(1, "评论内容不能为空").max(5000, "评论内容最多5000个字符"),
  parentId: z.number().int().positive().optional(),
})

// 用户资料更新验证
export const updateProfileSchema = z.object({
  name: z
    .union([
      z.string().min(2, "用户名至少需要2个字符").max(100, "用户名最多100个字符"),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  bio: z
    .union([
      z.string().max(500, "个人简介最多500个字符"),
      z.literal(""),
    ])
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  avatar: z
    .union([
      z.string().refine(
        (val) => {
          // 允许相对路径（以 / 开头）或绝对URL
          if (val.startsWith("/")) {
            return true
          }
          // 验证绝对URL格式
          try {
            new URL(val)
            return true
          } catch {
            return false
          }
        },
        { message: "头像链接格式不正确" }
      ),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  specialties: z.array(z.string()).optional(),
  wechatQrCode: z
    .union([
      z.string().refine(
        (val) => {
          // 允许相对路径（以 / 开头）或绝对URL
          if (val.startsWith("/")) {
            return true
          }
          // 验证绝对URL格式
          try {
            new URL(val)
            return true
          } catch {
            return false
          }
        },
        { message: "微信收款码链接格式不正确" }
      ),
      z.literal(""),
    ])
    .optional(),
  alipayQrCode: z
    .union([
      z.string().refine(
        (val) => {
          // 允许相对路径（以 / 开头）或绝对URL
          if (val.startsWith("/")) {
            return true
          }
          // 验证绝对URL格式
          try {
            new URL(val)
            return true
          } catch {
            return false
          }
        },
        { message: "支付宝收款码链接格式不正确" }
      ),
      z.literal(""),
    ])
    .optional(),
})
