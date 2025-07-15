export interface KOLData {
  id: number
  name: string
  platform: string
  username?: string
  profileUrl?: string
  followers: number
  following?: number
  category: string
  engagementRate?: number
  avgLikes?: number
  avgComments?: number
  avgViews?: number
  location?: string
  bio?: string
  email?: string
  phone?: string
  ratePerPost?: number
  ratePerStory?: number
  ratePerVideo?: number
  lastPostDate?: string
  totalPosts?: number
  status?: 'active' | 'inactive' | 'pending'
  tags?: string[]
  notes?: string
  createdAt?: string
  updatedAt?: string
  userId?: string
  userEmail?: string
}

export interface KOLTableProps {
  data: KOLData[]
  isLoading?: boolean
  onRefresh?: () => void
  onDataUpdate?: (data: KOLData[]) => void
}

export interface KOLSearchableField {
  key: keyof KOLData
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  searchable?: boolean
  options?: string[]
}

export interface KOLFilter {
  field: keyof KOLData
  operator: 'contains' | 'equals' | 'greater' | 'less' | 'between'
  value: string | number | boolean
  label: string
}

export interface KOLBulkAction {
  type: 'delete' | 'export' | 'update' | 'tag'
  label: string
  icon?: string
  variant?: 'default' | 'destructive' | 'outline'
}

export interface KOLStats {
  totalKOLs: number
  activeKOLs: number
  platforms: Record<string, number>
  categories: Record<string, number>
  avgFollowers: number
  avgEngagement: number
}