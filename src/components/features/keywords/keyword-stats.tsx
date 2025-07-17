"use client"

import { KeywordStats as KeywordStatsType } from "@/lib/types/keywords"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Target, Archive, Zap } from "lucide-react"

interface KeywordStatsProps {
  stats: KeywordStatsType
}

export function KeywordStats({ stats }: KeywordStatsProps) {
  const getPercentage = (value: number) => {
    if (stats.total === 0) return 0
    return Math.round((value / stats.total) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keywords</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Keywords</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Active</span>
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {stats.active}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {getPercentage(stats.active)}%
                </span>
              </div>
            </div>
            <Progress value={getPercentage(stats.active)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Inactive</span>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {stats.inactive}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {getPercentage(stats.inactive)}%
                </span>
              </div>
            </div>
            <Progress value={getPercentage(stats.inactive)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Archived</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {stats.archived}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {getPercentage(stats.archived)}%
                </span>
              </div>
            </div>
            <Progress value={getPercentage(stats.archived)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      {stats.categories && Object.keys(stats.categories).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.categories)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">{category}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Automation Ready</span>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{stats.active}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Need Attention</span>
            <div className="flex items-center space-x-2">
              <Archive className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{stats.inactive}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}