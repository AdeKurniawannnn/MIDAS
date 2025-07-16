"use client"

import { useState, useEffect } from "react"
import { AdvancedKOLTable } from "@/components/features/kol/advanced-kol-table"
import { ProtectedRoute } from "@/components/features/auth/protected-route"
import { Api } from "nocodb-sdk"
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
