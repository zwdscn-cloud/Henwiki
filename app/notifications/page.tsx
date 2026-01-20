"use client"

import { useState, useEffect } from "react"
import { Bell, ThumbsUp, MessageCircle, UserPlus, AtSign, Settings, CheckCheck, Sparkles, Loader2 } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiGet, apiPut } from "@/lib/utils/api"

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "like":
      return <ThumbsUp className="h-4 w-4 text-primary" />
    case "comment":
      return <MessageCircle className="h-4 w-4 text-blue-500" />
    case "follow":
      return <UserPlus className="h-4 w-4 text-green-500" />
    case "mention":
      return <AtSign className="h-4 w-4 text-orange-500" />
    case "system":
      return <Sparkles className="h-4 w-4 text-purple-500" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

const getNotificationText = (notification: any) => {
  switch (notification.type) {
    case "like":
      return (
        <>
          <strong>{notification.actor?.name}</strong> 赞了你的词条 <strong>{notification.target || ""}</strong>
        </>
      )
    case "comment":
      return (
        <>
          <strong>{notification.actor?.name}</strong> 评论了 <strong>{notification.target || ""}</strong>
          {notification.content && `：${notification.content}`}
        </>
      )
    case "follow":
      return (
        <>
          <strong>{notification.actor?.name}</strong> 关注了你
        </>
      )
    case "mention":
      return (
        <>
          <strong>{notification.actor?.name}</strong> 在 <strong>{notification.target || ""}</strong> 中提到了你
        </>
      )
    case "system":
      return notification.content || ""
    default:
      return ""
  }
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [activeTab])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab !== "all") {
        if (activeTab === "unread") {
          params.append("unread", "true")
        } else {
          params.append("type", activeTab)
        }
      }

      const response = await apiGet<{ notifications: any[]; unreadCount: number }>(
        `/notifications?${params.toString()}`
      )
      if (response.data) {
        setNotifications(response.data.notifications || [])
        setUnreadCount(response.data.unreadCount || 0)
      }
    } catch (err) {
      console.error("Fetch notifications error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await apiPut("/notifications", { markAllRead: true })
      setUnreadCount(0)
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      console.error("Mark all read error:", err)
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await apiPut("/notifications", { id })
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (err) {
      console.error("Mark read error:", err)
    }
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Bell className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">通知</h1>
                {unreadCount > 0 && <Badge variant="destructive">{unreadCount} 未读</Badge>}
              </div>
              <p className="text-muted-foreground">查看你的消息和动态</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleMarkAllRead}>
                <CheckCheck className="h-4 w-4" />
                全部已读
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-card border border-border flex-wrap h-auto p-1">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="unread">未读</TabsTrigger>
            <TabsTrigger value="like">点赞</TabsTrigger>
            <TabsTrigger value="comment">评论</TabsTrigger>
            <TabsTrigger value="follow">关注</TabsTrigger>
            <TabsTrigger value="system">系统</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border divide-y divide-border">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.isRead ? "bg-primary/5" : ""
                      }`}
                      onClick={() => !notification.isRead && handleMarkRead(notification.id)}
                    >
                      {notification.actor ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={notification.actor.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {notification.actor.name[0]}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-foreground">{getNotificationText(notification)}</p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{notification.createdAt}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">暂无通知</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
