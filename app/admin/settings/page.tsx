"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Globe, Mail, Shield, Bell, Database, Palette, Save } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">系统设置</h1>
          <p className="text-muted-foreground">配置平台的基本设置和功能选项</p>
        </div>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          保存设置
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full max-w-xl grid-cols-5">
          <TabsTrigger value="general">基本</TabsTrigger>
          <TabsTrigger value="content">内容</TabsTrigger>
          <TabsTrigger value="security">安全</TabsTrigger>
          <TabsTrigger value="notification">通知</TabsTrigger>
          <TabsTrigger value="appearance">外观</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                网站基本信息
              </CardTitle>
              <CardDescription>配置网站的基本信息和元数据</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>网站名称</Label>
                  <Input defaultValue="高能百科" />
                </div>
                <div className="space-y-2">
                  <Label>网站副标题</Label>
                  <Input defaultValue="前沿知识探索平台" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>网站描述</Label>
                <Textarea
                  defaultValue="汇聚各领域前沿知识、高新名词的专业百科平台，快速收录最新科技、学术、行业前沿概念"
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>联系邮箱</Label>
                  <Input defaultValue="contact@gaonengbaike.com" />
                </div>
                <div className="space-y-2">
                  <Label>备案号</Label>
                  <Input defaultValue="京ICP备XXXXXXXX号" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                SEO 设置
              </CardTitle>
              <CardDescription>搜索引擎优化相关配置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>关键词</Label>
                <Input defaultValue="百科, 科技, 人工智能, 量子计算, 生物科技, 前沿知识" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>允许搜索引擎索引</Label>
                  <p className="text-sm text-muted-foreground">开启后搜索引擎可以抓取网站内容</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>生成 Sitemap</Label>
                  <p className="text-sm text-muted-foreground">自动生成网站地图</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Settings */}
        <TabsContent value="content" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>内容审核设置</CardTitle>
              <CardDescription>配置词条和评论的审核规则</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>词条需要审核</Label>
                  <p className="text-sm text-muted-foreground">新词条发布前需要管理员审核</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>评论需要审核</Label>
                  <p className="text-sm text-muted-foreground">新评论发布前需要管理员审核</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>允许匿名评论</Label>
                  <p className="text-sm text-muted-foreground">未登录用户可以发表评论</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>敏感词过滤</Label>
                <Textarea placeholder="每行输入一个敏感词..." rows={4} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>积分规则</CardTitle>
              <CardDescription>配置用户积分奖励规则</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>每日签到积分</Label>
                  <Input type="number" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <Label>发布词条积分</Label>
                  <Input type="number" defaultValue="50" />
                </div>
                <div className="space-y-2">
                  <Label>评论积分</Label>
                  <Input type="number" defaultValue="5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                安全设置
              </CardTitle>
              <CardDescription>配置账户安全和访问控制</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>强制双因素认证</Label>
                  <p className="text-sm text-muted-foreground">管理员账户必须启用双因素认证</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>登录失败锁定</Label>
                  <p className="text-sm text-muted-foreground">连续登录失败后锁定账户</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>最大失败次数</Label>
                  <Input type="number" defaultValue="5" />
                </div>
                <div className="space-y-2">
                  <Label>锁定时长（分钟）</Label>
                  <Input type="number" defaultValue="30" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>会话超时时间</Label>
                <Select defaultValue="24">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 小时</SelectItem>
                    <SelectItem value="6">6 小时</SelectItem>
                    <SelectItem value="24">24 小时</SelectItem>
                    <SelectItem value="168">7 天</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notification" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                通知设置
              </CardTitle>
              <CardDescription>配置系统通知和邮件发送</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>新词条提交通知</Label>
                  <p className="text-sm text-muted-foreground">有新词条提交时通知管理员</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>评论举报通知</Label>
                  <p className="text-sm text-muted-foreground">有评论被举报时通知管理员</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>每日数据报告</Label>
                  <p className="text-sm text-muted-foreground">每天发送运营数据邮件</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                邮件服务配置
              </CardTitle>
              <CardDescription>配置 SMTP 邮件发送服务</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>SMTP 服务器</Label>
                  <Input placeholder="smtp.example.com" />
                </div>
                <div className="space-y-2">
                  <Label>端口</Label>
                  <Input placeholder="587" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>用户名</Label>
                  <Input placeholder="user@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>密码</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
              <Button variant="outline">发送测试邮件</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                外观设置
              </CardTitle>
              <CardDescription>自定义网站外观和主题</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>默认主题</Label>
                <Select defaultValue="light">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">浅色模式</SelectItem>
                    <SelectItem value="dark">深色模式</SelectItem>
                    <SelectItem value="system">跟随系统</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>主色调</Label>
                <div className="flex gap-2">
                  {["#b91c1c", "#2563eb", "#059669", "#7c3aed", "#ea580c"].map((color) => (
                    <button
                      key={color}
                      className="h-8 w-8 rounded-full ring-2 ring-offset-2 ring-transparent hover:ring-primary"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>显示网站 Logo</Label>
                  <p className="text-sm text-muted-foreground">在导航栏显示网站 Logo</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
