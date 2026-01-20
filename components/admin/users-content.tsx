"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, MoreHorizontal, Eye, Edit, Ban, Shield, Mail, Users, UserCheck, UserX, Crown, Loader2 } from "lucide-react"
import { apiGet, apiPut } from "@/lib/utils/api"
import { useRouter } from "next/navigation"

interface User {
  id: number
  name: string
  email: string
  avatar: string | null
  bio: string | null
  points: number
  level: number
  contributions: number
  followers_count: number
  following_count: number
  is_verified: boolean
  joined_at: string
  created_at: string
  updated_at: string
}

export function UsersContent() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [page, searchQuery])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await apiGet<{ users: User[]; pagination: { total: number } }>(
        `/admin/users?${params.toString()}`
      )

      if (response.error) {
        console.error("Failed to fetch users:", response.error)
      } else if (response.data) {
        setUsers(response.data.users)
        setTotal(response.data.pagination.total)
      }
    } catch (err) {
      console.error("Failed to fetch users:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (id: number, isVerified: boolean) => {
    try {
      const response = await apiPut("/admin/users", { id, isVerified })
      if (response.error) {
        console.error("Failed to update verify status:", response.error)
      } else {
        fetchUsers()
      }
    } catch (err) {
      console.error("Failed to update verify status:", err)
    }
  }

  const getRoleBadge = (isVerified: boolean, level: number) => {
    if (isVerified) {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-600">
          <Crown className="mr-1 h-3 w-3" />
          认证用户
        </Badge>
      )
    }
    if (level >= 5) {
      return (
        <Badge className="bg-blue-500/10 text-blue-600">
          <Crown className="mr-1 h-3 w-3" />
          高级用户
        </Badge>
      )
    }
    return <Badge variant="secondary">普通用户</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">用户管理</h1>
          <p className="text-muted-foreground">管理平台用户，设置权限和状态</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{total.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">总用户数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-green-500/10 p-2.5">
              <UserCheck className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.filter(u => u.contributions > 0).length}</p>
              <p className="text-sm text-muted-foreground">活跃用户</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-yellow-500/10 p-2.5">
              <Crown className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.filter(u => u.is_verified).length}</p>
              <p className="text-sm text-muted-foreground">认证用户</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.filter(u => u.level >= 5).length}</p>
              <p className="text-sm text-muted-foreground">高级用户</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索用户名、邮箱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="pro">Pro会员</SelectItem>
                <SelectItem value="user">普通用户</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="banned">已封禁</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead>用户</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>贡献</TableHead>
                <TableHead>粉丝</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>最后登录</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    暂无用户数据
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar || "/placeholder-user.jpg"} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.is_verified, user.level)}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500/10 text-green-600">
                        <UserCheck className="mr-1 h-3 w-3" />
                        正常
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{user.contributions}</TableCell>
                    <TableCell className="text-sm">{user.followers_count.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(user.joined_at)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/user/${user.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVerify(user.id, !user.is_verified)}>
                            {user.is_verified ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                取消认证
                              </>
                            ) : (
                              <>
                                <Shield className="mr-2 h-4 w-4" />
                                设为认证
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedUser(user)
                              setBanDialogOpen(true)
                            }}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            封禁用户
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>封禁用户</DialogTitle>
            <DialogDescription>
              确定要封禁用户 "{selectedUser?.name}" 吗？封禁后该用户将无法登录和使用平台功能。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">封禁原因</label>
              <Select defaultValue="spam">
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">发布垃圾内容</SelectItem>
                  <SelectItem value="abuse">辱骂他人</SelectItem>
                  <SelectItem value="fake">虚假信息</SelectItem>
                  <SelectItem value="other">其他原因</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">封禁时长</label>
              <Select defaultValue="7">
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1天</SelectItem>
                  <SelectItem value="7">7天</SelectItem>
                  <SelectItem value="30">30天</SelectItem>
                  <SelectItem value="forever">永久封禁</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={() => setBanDialogOpen(false)}>
              确认封禁
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
