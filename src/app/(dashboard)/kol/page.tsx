"use client"

import { useState, useEffect } from "react"
import { AdvancedKOLTable } from "@/components/features/kol/advanced-kol-table"
import { ProtectedRoute } from "@/components/features/auth/protected-route"
import { nocodb } from "@/lib/database/nocodb"
import { KOLData } from "@/lib/types/kol"
import { toast } from "sonner"
import { Plus, Users, TrendingUp, Star } from "lucide-react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  const [data, setData] = useState<KOLData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKOLData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const projectSlug = process.env.NEXT_PUBLIC_NOCODB_PROJECT as string
      const tableSlug = process.env.NEXT_PUBLIC_NOCODB_TABLE as string
      const viewSlug = process.env.NEXT_PUBLIC_NOCODB_VIEW as string | undefined
      const fieldSetSlug = process.env.NEXT_PUBLIC_NOCODB_FIELDSET as string | undefined

      if (!projectSlug || !tableSlug) {
        throw new Error("NocoDB configuration missing. Please check environment variables.")
      }

      let res
      if (viewSlug) {
        res = await nocodb.dbViewRow.list(projectSlug, tableSlug, viewSlug, fieldSetSlug ?? "", {
          limit: 1000,
          offset: 0
        })
      } else {
        res = await nocodb.dbTableRow.list(projectSlug, tableSlug, {
          limit: 1000,
          offset: 0
        })
      }
      
      // Transform the data to match KOLData interface
      const transformedData: KOLData[] = (res as any).list?.map((item: any) => ({
        id: item.id,
        name: item.name || '',
        platform: item.platform || '',
        username: item.username || '',
        profileUrl: item.profileUrl || item.profile_url || '',
        followers: Number(item.followers) || 0,
        following: Number(item.following) || 0,
        category: item.category || '',
        engagementRate: Number(item.engagementRate) || Number(item.engagement_rate) || 0,
        avgLikes: Number(item.avgLikes) || Number(item.avg_likes) || 0,
        avgComments: Number(item.avgComments) || Number(item.avg_comments) || 0,
        avgViews: Number(item.avgViews) || Number(item.avg_views) || 0,
        location: item.location || '',
        bio: item.bio || item.biography || '',
        email: item.email || '',
        phone: item.phone || '',
        ratePerPost: Number(item.ratePerPost) || Number(item.rate_per_post) || 0,
        ratePerStory: Number(item.ratePerStory) || Number(item.rate_per_story) || 0,
        ratePerVideo: Number(item.ratePerVideo) || Number(item.rate_per_video) || 0,
        lastPostDate: item.lastPostDate || item.last_post_date || '',
        totalPosts: Number(item.totalPosts) || Number(item.total_posts) || 0,
        status: item.status || 'pending',
        tags: item.tags ? (Array.isArray(item.tags) ? item.tags : item.tags.split(',')) : [],
        notes: item.notes || '',
        createdAt: item.createdAt || item.created_at || '',
        updatedAt: item.updatedAt || item.updated_at || '',
        userId: item.userId || item.user_id || '',
        userEmail: item.userEmail || item.user_email || '',
      })) || []

      setData(transformedData)
    } catch (e: any) {
      console.error('Error fetching KOL data:', e)
      setError(e.message || "Failed to fetch KOL data")
      toast.error("Failed to fetch KOL data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKOLData()
  }, [])

  const handleRefresh = () => {
    fetchKOLData()
  }

  const handleAddKOL = () => {
    toast.info("Add KOL functionality coming soon!")
  }

  // Calculate stats
  const stats = {
    totalKOLs: data.length,
    activeKOLs: data.filter(kol => kol.status === 'active').length,
    avgFollowers: data.length > 0 ? Math.round(data.reduce((sum, kol) => sum + kol.followers, 0) / data.length) : 0,
    avgEngagement: data.length > 0 ? Math.round(data.reduce((sum, kol) => sum + (kol.engagementRate || 0), 0) / data.length * 100) / 100 : 0,
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">KOL Management</h1>
            <p className="text-muted-foreground">
              Manage your Key Opinion Leaders and influencer partnerships
            </p>
          </div>
          <AnimatedButton
            onClick={handleAddKOL}
            animationType="hover"
            className="hover:bg-blue-100 hover:text-blue-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add KOL
          </AnimatedButton>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total KOLs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalKOLs}</div>
              <p className="text-xs text-muted-foreground">
                Influencers in database
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active KOLs</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeKOLs}</div>
              <p className="text-xs text-muted-foreground">
                Currently active partnerships
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Followers</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avgFollowers >= 1000000 ? 
                  (stats.avgFollowers / 1000000).toFixed(1) + 'M' : 
                  stats.avgFollowers >= 1000 ? 
                    (stats.avgFollowers / 1000).toFixed(1) + 'K' : 
                    stats.avgFollowers
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Average follower count
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgEngagement}%</div>
              <p className="text-xs text-muted-foreground">
                Average engagement rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Advanced KOL Table */}
        <Card>
          <CardHeader>
            <CardTitle>KOL Database</CardTitle>
            <CardDescription>
              View, edit, and manage your KOL database with advanced search and filtering capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">{error}</p>
                  <AnimatedButton
                    onClick={handleRefresh}
                    variant="outline"
                    animationType="hover"
                    className="hover:bg-blue-100 hover:text-blue-600"
                  >
                    Try Again
                  </AnimatedButton>
                </div>
              </div>
            ) : (
              <AdvancedKOLTable
                data={data}
                isLoading={loading}
                onRefresh={handleRefresh}
                onDataUpdate={setData}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
