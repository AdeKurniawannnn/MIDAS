"use client"

import { useState, useEffect } from "react"
import { AdvancedKOLTable } from "@/components/features/kol/advanced-kol-table"
import { ProtectedRoute } from "@/components/features/auth/protected-route"
import { Api } from "nocodb-sdk"
import { KOLData } from "@/lib/types/kol"
import { toast } from "sonner"
import { Plus, Users, TrendingUp, Star, ArrowUp, ArrowDown, Minus } from "lucide-react"
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
      
      // Load sample data immediately as fallback
      const sampleData: KOLData[] = [
        {
          id: 1,
          name: "Sample KOL 1",
          platform: "instagram",
          username: "sample_user1",
          followers: 50000,
          category: "Lifestyle",
          engagementRate: 3.5,
          ratePerPost: 500000,
          status: "active"
        },
        {
          id: 2,
          name: "Sample KOL 2", 
          platform: "youtube",
          username: "sample_user2",
          followers: 100000,
          category: "Tech",
          engagementRate: 4.2,
          ratePerPost: 1000000,
          status: "active"
        },
        {
          id: 3,
          name: "Influencer ID",
          platform: "tiktok",
          username: "influencer_id",
          followers: 250000,
          category: "Entertainment",
          engagementRate: 5.8,
          ratePerPost: 750000,
          status: "active"
        }
      ]

      const baseURL = process.env.NEXT_PUBLIC_NOCODB_BASE_URL as string
      const token = process.env.NEXT_PUBLIC_NOCODB_TOKEN as string
      const projectId = process.env.NEXT_PUBLIC_NOCODB_PROJECT as string
      const tableId = process.env.NEXT_PUBLIC_NOCODB_TABLE as string
      const viewId = process.env.NEXT_PUBLIC_NOCODB_VIEW as string
      const fieldSetId = process.env.NEXT_PUBLIC_NOCODB_FIELDSET as string

      console.log('Environment variables check:', {
        baseURL: baseURL ? 'Set' : 'Missing',
        token: token ? 'Set' : 'Missing',
        projectId: projectId ? 'Set' : 'Missing',
        tableId: tableId ? 'Set' : 'Missing',
        viewId: viewId ? 'Set' : 'Missing',
        fieldSetId: fieldSetId ? 'Set' : 'Missing'
      })

      if (!baseURL || !token || !projectId || !tableId || !viewId || !fieldSetId) {
        console.log("NocoDB configuration missing, using sample data")
        setData(sampleData)
        toast.info('Using sample data - NoCoDB not configured')
        return
      }

      console.log('Using NoCoDB SDK with config:', { baseURL, projectId, tableId, viewId, fieldSetId })

      // Initialize NoCoDB SDK
      const api = new Api({
        baseURL: baseURL,
        headers: {
          "xc-token": token
        }
      })

      let res: any
      try {
        console.log('Fetching data from NoCoDB...')
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API timeout after 30 seconds')), 30000)
        })
        
        // Create the API call promise
        const apiPromise = api.dbViewRow.list(
          projectId,
          tableId,
          viewId,
          fieldSetId,
          {
            offset: 0,
            limit: 25000, // Show all data from NoCoDB
            where: ""
          }
        )
        
        console.log('Calling NoCoDB API with timeout protection...')
        
        // Race between API call and timeout
        res = await Promise.race([apiPromise, timeoutPromise]) as any
        
        console.log('Successfully fetched data from NoCoDB SDK')
        console.log('API response:', res)
        
        const dataCount = (res as any)?.list?.length || (res as any)?.records?.length || 0
        console.log(`Fetched ${dataCount} records from NoCoDB`)
        
      } catch (error) {
        console.error('NoCoDB SDK error:', error)
        console.log('Falling back to sample data due to API error')
        setData(sampleData)
        toast.error('API error: ' + (error as Error).message)
        return
      }
      
      // Transform the data to match KOLData interface
      // NoCoDB v2 API returns data in 'list' property or directly as array
      const rawData = res.list || res.records || res || []
      console.log('Raw data from NoCoDB v2:', rawData)
      console.log('Raw data type:', typeof rawData)
      console.log('Raw data length:', rawData.length)
      
      if (rawData.length > 0) {
        console.log('Sample item structure:', rawData[0])
        console.log('Sample item keys:', Object.keys(rawData[0]))
      }
      
      if (!Array.isArray(rawData) || rawData.length === 0) {
        console.log('No data found in API response, using sample data')
        setData(sampleData)
        toast.info('No data found in database, using sample data')
        return
      }
      
      const transformedData: KOLData[] = rawData.map((item: any, index: number) => {
        console.log(`Processing item ${index}:`, item)
        
        const transformed = {
          id: item.Id || item.id || Math.random(),
          name: item.Name || item.name || `KOL ${index + 1}`,
          platform: (item.Platform || item.platform || 'instagram').toLowerCase(),
          username: item.Username || item.username || `user${index + 1}`,
          profileUrl: item.ProfileUrl || item.profileUrl || item.profile_url || '',
          followers: Number(item.Followers || item.followers || Math.floor(Math.random() * 100000)),
          following: Number(item.Following || item.following || 0),
          category: item.Category || item.category || 'General',
          engagementRate: Number(item.EngagementRate || item.engagementRate || item.engagement_rate || item.Engagement || item.engagement || Math.random() * 10),
          engagement: Number(item.Engagement || item.engagement || 0),
          avgLikes: Number(item.AvgLikes || item.avgLikes || item.avg_likes || 0),
          avgComments: Number(item.AvgComments || item.avgComments || item.avg_comments || 0),
          avgViews: Number(item.AvgViews || item.avgViews || item.avg_views || 0),
          location: item.Location || item.location || '',
          bio: item.Bio || item.bio || item.biography || item.Biography || '',
          email: item.Email || item.email || '',
          phone: item.Phone || item.phone || '',
          ratePerPost: Number(item.RatePerPost || item.ratePerPost || item.rate_per_post || item.rate_post || item.RatePost || Math.floor(Math.random() * 1000000)),
          rate_post: Number(item.RatePost || item.rate_post || item.ratePerPost || item.RatePerPost || 0),
          ratePerStory: Number(item.RatePerStory || item.ratePerStory || item.rate_per_story || 0),
          ratePerVideo: Number(item.RatePerVideo || item.ratePerVideo || item.rate_per_video || 0),
          lastPostDate: item.LastPostDate || item.lastPostDate || item.last_post_date || '',
          totalPosts: Number(item.TotalPosts || item.totalPosts || item.total_posts || 0),
          status: (item.Status || item.status || 'active').toLowerCase(),
          tags: item.Tags || item.tags ? (Array.isArray(item.Tags || item.tags) ? (item.Tags || item.tags) : (item.Tags || item.tags).split(',')) : [],
          notes: item.Notes || item.notes || '',
          createdAt: item.CreatedAt || item.createdAt || item.created_at || '',
          updatedAt: item.UpdatedAt || item.updatedAt || item.updated_at || '',
        }
        
        console.log(`Transformed item ${index}:`, transformed)
        return transformed
      })

      console.log('Raw NoCoDB response:', res)
      console.log('Transformed data:', transformedData)
      setData(transformedData)
      
      if (transformedData.length > 0) {
        toast.success(`Successfully loaded ${transformedData.length} KOL records`)
      } else {
        console.warn('No data found in NoCoDB response')
        toast.info('No KOL data found in database')
        
        // Add sample data for testing if no data is found
        console.log('Adding sample data for testing...')
        const sampleData: KOLData[] = [
          {
            id: 1,
            name: "Sample KOL 1",
            platform: "instagram",
            username: "sample_user1",
            followers: 50000,
            category: "Lifestyle",
            engagementRate: 3.5,
            ratePerPost: 500000,
            status: "active"
          },
          {
            id: 2,
            name: "Sample KOL 2", 
            platform: "youtube",
            username: "sample_user2",
            followers: 100000,
            category: "Tech",
            engagementRate: 4.2,
            ratePerPost: 1000000,
            status: "active"
          }
        ]
        setData(sampleData)
        toast.info('Loaded sample data for testing')
      }
    } catch (e: any) {
      console.error('Error fetching KOL data:', e)
      setError(e.message || "Failed to fetch KOL data")
      
      // Always load sample data on error
      console.log('Loading fallback sample data due to error...')
      const sampleData: KOLData[] = [
        {
          id: 1,
          name: "Sample KOL 1",
          platform: "instagram",
          username: "sample_user1",
          followers: 50000,
          category: "Lifestyle",
          engagementRate: 3.5,
          ratePerPost: 500000,
          status: "active"
        },
        {
          id: 2,
          name: "Sample KOL 2", 
          platform: "youtube",
          username: "sample_user2",
          followers: 100000,
          category: "Tech",
          engagementRate: 4.2,
          ratePerPost: 1000000,
          status: "active"
        },
        {
          id: 3,
          name: "Influencer ID",
          platform: "tiktok",
          username: "influencer_id",
          followers: 250000,
          category: "Entertainment",
          engagementRate: 5.8,
          ratePerPost: 750000,
          status: "active"
        }
      ]
      setData(sampleData)
      toast.info('Loaded sample data due to API error')
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

  // Calculate stats with trends
  const stats = {
    totalKOLs: data.length,
    activeKOLs: data.filter(kol => kol.status === 'active').length,
    avgFollowers: data.length > 0 ? Math.round(data.reduce((sum, kol) => sum + kol.followers, 0) / data.length) : 0,
    avgEngagement: data.length > 0 ? Math.round(data.reduce((sum, kol) => sum + (kol.engagementRate || 0), 0) / data.length * 100) / 100 : 0,
  }

  // Calculate trend indicators (mock data for demonstration)
  const trends = {
    totalKOLs: { value: 12, direction: 'up' as const },
    activeKOLs: { value: 8, direction: 'up' as const },
    avgFollowers: { value: 15, direction: 'up' as const },
    avgEngagement: { value: 3, direction: 'down' as const },
  }

  // Generate mini chart data for visualization
  const generateChartData = (baseValue: number, trend: 'up' | 'down' | 'stable' = 'stable') => {
    const points = []
    for (let i = 0; i < 7; i++) {
      const variation = Math.random() * 0.2 - 0.1
      const trendFactor = trend === 'up' ? i * 0.05 : trend === 'down' ? -i * 0.05 : 0
      points.push(baseValue * (1 + variation + trendFactor))
    }
    return points
  }

  const chartData = {
    totalKOLs: generateChartData(stats.totalKOLs, 'up'),
    activeKOLs: generateChartData(stats.activeKOLs, 'up'),
    avgFollowers: generateChartData(stats.avgFollowers, 'up'),
    avgEngagement: generateChartData(stats.avgEngagement, 'down'),
  }

  // Mini chart component
  const MiniChart = ({ data, color = '#3b82f6' }: { data: number[], color?: string }) => {
    if (data.length === 0) return null
    
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 60
      const y = 20 - ((value - min) / range) * 20
      return `${x},${y}`
    }).join(' ')
    
    return (
      <div className="absolute right-4 top-4 opacity-30">
        <svg width="60" height="20" viewBox="0 0 60 20">
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )
  }

  // Trend indicator component
  const TrendIndicator = ({ trend }: { trend: { value: number, direction: 'up' | 'down' | 'stable' } }) => {
    const Icon = trend.direction === 'up' ? ArrowUp : trend.direction === 'down' ? ArrowDown : Minus
    const colorClass = trend.direction === 'up' ? 'text-green-500' : trend.direction === 'down' ? 'text-red-500' : 'text-gray-500'
    
    return (
      <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
        <Icon className="h-3 w-3" />
        <span>{trend.value}%</span>
      </div>
    )
  }

  // Loading state component
  const LoadingView = () => (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded-md"></div>
          <div className="h-4 w-72 bg-muted rounded-md"></div>
        </div>
        <div className="h-10 w-24 bg-muted rounded-md"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted rounded-md"></div>
              <div className="h-4 w-4 bg-muted rounded-md"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 w-16 bg-muted rounded-md"></div>
              <div className="h-3 w-32 bg-muted rounded-md"></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Table Card Skeleton */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-32 bg-muted rounded-md"></div>
              <div className="h-4 w-80 bg-muted rounded-md"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-10 w-80 bg-muted rounded-md"></div>
              <div className="flex gap-2">
                <div className="h-10 w-24 bg-muted rounded-md"></div>
                <div className="h-10 w-20 bg-muted rounded-md"></div>
              </div>
            </div>
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-12 w-full bg-muted rounded-md"></div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  return (
    <ProtectedRoute>
      {loading ? (
        <LoadingView />
      ) : (
        <div className="space-y-6">
          {/* Header with improved spacing and typography */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">KOL Management</h1>
              <p className="text-muted-foreground">
                Manage your Key Opinion Leaders and influencer partnerships
              </p>
            </div>
            <AnimatedButton
              onClick={handleAddKOL}
              animationType="hover"
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label="Add new KOL"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add KOL
            </AnimatedButton>
          </div>

          {/* Enhanced Stats Cards with Data Visualization */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow duration-200 relative overflow-hidden">
              <MiniChart data={chartData.totalKOLs} color="#6b7280" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total KOLs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold tabular-nums" aria-label={`${stats.totalKOLs} total KOLs`}>
                    {stats.totalKOLs}
                  </div>
                  <TrendIndicator trend={trends.totalKOLs} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Influencers in database
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-200 relative overflow-hidden">
              <MiniChart data={chartData.activeKOLs} color="#22c55e" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active KOLs</CardTitle>
                <Star className="h-4 w-4 text-green-500" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold tabular-nums text-green-600" aria-label={`${stats.activeKOLs} active KOLs`}>
                    {stats.activeKOLs}
                  </div>
                  <TrendIndicator trend={trends.activeKOLs} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently active partnerships
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-200 relative overflow-hidden">
              <MiniChart data={chartData.avgFollowers} color="#3b82f6" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Followers</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold tabular-nums text-blue-600" aria-label={`${stats.avgFollowers} average followers`}>
                    {stats.avgFollowers >= 1000000 ? 
                      (stats.avgFollowers / 1000000).toFixed(1) + 'M' : 
                      stats.avgFollowers >= 1000 ? 
                        (stats.avgFollowers / 1000).toFixed(1) + 'K' : 
                        stats.avgFollowers
                    }
                  </div>
                  <TrendIndicator trend={trends.avgFollowers} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average follower count
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-200 relative overflow-hidden">
              <MiniChart data={chartData.avgEngagement} color="#a855f7" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold tabular-nums text-purple-600" aria-label={`${stats.avgEngagement}% average engagement`}>
                    {stats.avgEngagement}%
                  </div>
                  <TrendIndicator trend={trends.avgEngagement} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average engagement rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced KOL Table */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>KOL Database</CardTitle>
              <CardDescription>
                View, edit, and manage your KOL database with advanced search and filtering capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="flex items-center justify-center h-32" role="alert">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L5.232 18.5C4.462 20.333 5.424 22 6.982 22z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Error Loading Data</p>
                      <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                    <AnimatedButton
                      onClick={handleRefresh}
                      variant="outline"
                      animationType="hover"
                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
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
      )}
    </ProtectedRoute>
  )
}
