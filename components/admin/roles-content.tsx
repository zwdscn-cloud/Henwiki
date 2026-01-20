"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, Edit, Trash2, Shield } from "lucide-react"
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/utils/api"
import { useAuth } from "@/lib/auth-context"

interface Role {
  id: number
  code: string
  name: string
  description: string | null
  level: number
  is_system: boolean
  permissions: Permission[]
}

interface Permission {
  id: number
  code: string
  name: string
  description: string | null
  module: string
  resource: string
  action: string
}

export function RolesContent() {
  const { hasPermission } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    level: 0,
    permissionIds: [] as number[],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        apiGet<{ roles: Role[] }>("/admin/roles"),
        apiGet<{ permissions: Permission[] }>("/admin/permissions"),
      ])

      if (rolesResponse.data) {
        setRoles(rolesResponse.data.roles)
      }
      if (permissionsResponse.data) {
        setPermissions(permissionsResponse.data.permissions)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingRole(null)
    setFormData({
      code: "",
      name: "",
      description: "",
      level: 0,
      permissionIds: [],
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({
      code: role.code,
      name: role.name,
      description: role.description || "",
      level: role.level,
      permissionIds: role.permissions.map((p) => p.id),
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingRole) {
        await apiPut("/admin/roles", {
          id: editingRole.id,
          ...formData,
        })
      } else {
        await apiPost("/admin/roles", formData)
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Failed to save role:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个角色吗？")) return

    try {
      await apiDelete(`/admin/roles?id=${id}`)
      fetchData()
    } catch (error) {
      console.error("Failed to delete role:", error)
    }
  }

  const togglePermission = (permissionId: number) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }))
  }

  // 按模块分组权限
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = []
    }
    acc[perm.module].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!hasPermission("admin.roles.view")) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">权限不足，无法查看角色列表</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">角色管理</h1>
          <p className="text-muted-foreground">管理系统角色和权限分配</p>
        </div>
        {hasPermission("admin.roles.create") && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            创建角色
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>角色列表</CardTitle>
          <CardDescription>系统中定义的所有角色及其权限</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>角色代码</TableHead>
                <TableHead>角色名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>权限数量</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-mono text-sm">{role.code}</TableCell>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description || "-"}</TableCell>
                  <TableCell>{role.level}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{role.permissions.length}</Badge>
                  </TableCell>
                  <TableCell>
                    {role.is_system ? (
                      <Badge variant="secondary">系统角色</Badge>
                    ) : (
                      <Badge variant="outline">自定义</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {hasPermission("admin.roles.edit") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission("admin.roles.delete") && !role.is_system && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(role.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "编辑角色" : "创建角色"}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? "修改角色信息和权限分配"
                : "创建新角色并分配权限"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">角色代码</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                disabled={!!editingRole}
                placeholder="例如: editor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">角色名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="例如: 编辑"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="角色描述"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">角色等级</Label>
              <Input
                id="level"
                type="number"
                value={formData.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground">
                数字越大，权限级别越高
              </p>
            </div>

            <div className="space-y-4">
              <Label>权限分配</Label>
              <div className="border rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(groupedPermissions).map(([module, perms]) => (
                  <div key={module} className="space-y-2">
                    <h4 className="font-medium text-sm">{module}</h4>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      {perms.map((perm) => (
                        <div key={perm.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${perm.id}`}
                            checked={formData.permissionIds.includes(perm.id)}
                            onCheckedChange={() => togglePermission(perm.id)}
                          />
                          <label
                            htmlFor={`perm-${perm.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {perm.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingRole ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
