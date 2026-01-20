"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Maximize2, Filter } from "lucide-react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface ChartWithSettingsProps {
  title?: string
  description?: string
  data: any[]
  defaultXAxis?: {
    dataKey: string
    label: string
  }
  defaultYAxis?: {
    dataKey: string
    label: string
  }
  availableFields?: Array<{ key: string; label: string }>
}

export function ChartWithSettings({
  title = "Trend Over Time",
  description,
  data,
  defaultXAxis = { dataKey: "x", label: "X轴" },
  defaultYAxis = { dataKey: "y", label: "Y轴" },
  availableFields = [],
}: ChartWithSettingsProps) {
  const [xAxis, setXAxis] = useState(defaultXAxis)
  const [yAxis, setYAxis] = useState(defaultYAxis)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [fullScreenOpen, setFullScreenOpen] = useState(false)
  const [tempXAxis, setTempXAxis] = useState(defaultXAxis)
  const [tempYAxis, setTempYAxis] = useState(defaultYAxis)

  // 如果没有提供可用字段，从数据中自动提取
  const fields =
    availableFields.length > 0
      ? availableFields
      : data.length > 0
        ? Object.keys(data[0]).map((key) => ({
            key,
            label: key,
          }))
        : []

  const handleSaveSettings = () => {
    setXAxis(tempXAxis)
    setYAxis(tempYAxis)
    setSettingsOpen(false)
  }

  const handleCancelSettings = () => {
    setTempXAxis(xAxis)
    setTempYAxis(yAxis)
    setSettingsOpen(false)
  }

  const chartContent = (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          dataKey={xAxis.dataKey}
          name={xAxis.label}
          label={{ value: xAxis.label, position: "insideBottom", offset: -5 }}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis
          type="number"
          dataKey={yAxis.dataKey}
          name={yAxis.label}
          label={{ value: yAxis.label, angle: -90, position: "insideLeft" }}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Scatter name={yAxis.label} dataKey={yAxis.dataKey} fill="hsl(var(--primary))" />
      </ScatterChart>
    </ResponsiveContainer>
  )

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSettingsOpen(true)}
                title="设置"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setFullScreenOpen(true)}
                title="全屏"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="操作">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">{chartContent}</div>
        </CardContent>
      </Card>

      {/* 设置对话框 */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>图表设置</DialogTitle>
            <DialogDescription>配置X轴和Y轴的数据字段和标签</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* X轴设置 */}
            <div className="space-y-2">
              <Label htmlFor="x-axis-field">X轴数据字段</Label>
              <Select
                value={tempXAxis.dataKey}
                onValueChange={(value) =>
                  setTempXAxis({ ...tempXAxis, dataKey: value })
                }
              >
                <SelectTrigger id="x-axis-field">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((field) => (
                    <SelectItem key={field.key} value={field.key}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="x-axis-label">X轴标签</Label>
              <Input
                id="x-axis-label"
                value={tempXAxis.label}
                onChange={(e) => setTempXAxis({ ...tempXAxis, label: e.target.value })}
                placeholder="输入X轴标签"
              />
            </div>

            {/* Y轴设置 */}
            <div className="space-y-2">
              <Label htmlFor="y-axis-field">Y轴数据字段</Label>
              <Select
                value={tempYAxis.dataKey}
                onValueChange={(value) =>
                  setTempYAxis({ ...tempYAxis, dataKey: value })
                }
              >
                <SelectTrigger id="y-axis-field">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((field) => (
                    <SelectItem key={field.key} value={field.key}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="y-axis-label">Y轴标签</Label>
              <Input
                id="y-axis-label"
                value={tempYAxis.label}
                onChange={(e) => setTempYAxis({ ...tempYAxis, label: e.target.value })}
                placeholder="输入Y轴标签"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelSettings}>
              取消
            </Button>
            <Button onClick={handleSaveSettings}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 全屏对话框 */}
      <Dialog open={fullScreenOpen} onOpenChange={setFullScreenOpen}>
        <DialogContent fullScreen className="flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{title}</DialogTitle>
                {description && <DialogDescription>{description}</DialogDescription>}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setFullScreenOpen(false)
                    setSettingsOpen(true)
                  }}
                  title="设置"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 mt-4">{chartContent}</div>
        </DialogContent>
      </Dialog>
    </>
  )
}
