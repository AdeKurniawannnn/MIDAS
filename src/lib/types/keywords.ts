// Keywords Management Types for Orion App

export interface Keyword {
  id: number
  keyword: string
  description?: string
  category: string
  status: 'active' | 'inactive' | 'archived'
  priority: number
  created_at: string
  updated_at: string
  user_id: string
  gmail: string
}

export interface KeywordInstagramAssignment {
  id: number
  keyword_id: number
  instagram_id: number
  assigned_at: string
  user_id: string
  gmail: string
}

export interface KeywordGoogleMapsAssignment {
  id: number
  keyword_id: number
  google_maps_id: number
  assigned_at: string
  user_id: string
  gmail: string
}

export interface KeywordScrapingJob {
  id: number
  keyword_id: number
  job_type: 'instagram' | 'google_maps'
  status: 'pending' | 'running' | 'completed' | 'failed'
  results_count: number
  started_at?: string
  completed_at?: string
  error_message?: string
  created_at: string
  user_id: string
  gmail: string
}

// Form types for keyword management
export interface KeywordFormData {
  keyword: string
  description?: string
  category: string
  priority: number
  status: 'active' | 'inactive' | 'archived'
}

export interface KeywordWithAssignments extends Keyword {
  instagramAssignments: KeywordInstagramAssignment[]
  googleMapsAssignments: KeywordGoogleMapsAssignment[]
  recentJobs: KeywordScrapingJob[]
}

// Bulk operations
export interface BulkKeywordOperation {
  keywordIds: number[]
  operation: 'activate' | 'deactivate' | 'archive' | 'delete' | 'scrape'
  scrapingType?: 'instagram' | 'google_maps'
}

// Search and filter types
export interface KeywordFilters {
  search?: string
  category?: string
  status?: 'active' | 'inactive' | 'archived'
  priority?: number
  sortBy?: 'keyword' | 'created_at' | 'updated_at' | 'priority'
  sortOrder?: 'asc' | 'desc'
}

// API response types
export interface KeywordResponse {
  keywords: Keyword[]
  total: number
  page: number
  limit: number
}

export interface KeywordStats {
  total: number
  active: number
  inactive: number
  archived: number
  categories: { [key: string]: number }
  recentJobs: number
}