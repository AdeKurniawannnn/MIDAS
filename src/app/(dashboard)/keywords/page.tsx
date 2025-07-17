import { ProtectedRoute } from "@/components/features/auth/protected-route"
import { KeywordsClient } from "@/components/features/keywords/keywords-client"
import { createClient } from '@supabase/supabase-js'
import { cookies } from "next/headers"
import { Keyword } from "@/lib/types/keywords"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Fetch keywords from Supabase
async function getKeywords(): Promise<Keyword[]> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        },
        global: {
          headers: {
            'Cookie': cookieStore.getAll()
              .map(cookie => `${cookie.name}=${cookie.value}`)
              .join('; ')
          }
        }
      }
    )
    
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching keywords:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error:', error)
    return []
  }
}

// Fetch keyword stats
async function getKeywordStats() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        },
        global: {
          headers: {
            'Cookie': cookieStore.getAll()
              .map(cookie => `${cookie.name}=${cookie.value}`)
              .join('; ')
          }
        }
      }
    )
    
    // Get keyword counts by status
    const { data: statusData, error: statusError } = await supabase
      .from('keywords')
      .select('status')
    
    if (statusError) {
      console.error('Error fetching keyword stats:', statusError)
      return { total: 0, active: 0, inactive: 0, archived: 0, categories: {}, recentJobs: 0 }
    }
    
    const stats = statusData?.reduce((acc, keyword) => {
      acc.total++
      if (keyword.status === 'active') acc.active++
      else if (keyword.status === 'inactive') acc.inactive++
      else if (keyword.status === 'archived') acc.archived++
      return acc
    }, { total: 0, active: 0, inactive: 0, archived: 0 }) || { total: 0, active: 0, inactive: 0, archived: 0 }
    
    return {
      ...stats,
      categories: {},
      recentJobs: 0
    }
  } catch (error) {
    console.error('Error fetching keyword stats:', error)
    return { total: 0, active: 0, inactive: 0, archived: 0, categories: {}, recentJobs: 0 }
  }
}

export default async function KeywordsPage() {
  const keywords = await getKeywords()
  const stats = await getKeywordStats()

  return (
    <ProtectedRoute>
      <KeywordsClient initialKeywords={keywords} initialStats={stats} />
    </ProtectedRoute>
  )
}