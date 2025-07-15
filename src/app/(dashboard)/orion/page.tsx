import { ScrapingForm } from "@/components/features/orion/scraping-form"
import { InstagramTable } from "@/components/features/orion/instagram-table"
import { ProtectedRoute } from "@/components/features/auth/protected-route"
import { createClient } from '@supabase/supabase-js'
import { cookies } from "next/headers"

// Interface for Instagram scraping data
interface DataScrapingInstagram {
  id: number
  inputUrl: string
  username: string | null
  followersCount: string | null
  followsCount: string | null
  biography: string | null
  postsCount: string | null
  highlightReelCount: string | null
  igtvVideoCount: string | null
  latestPostsTotal: string | null
  latestPostsLikes: string | null
  latestPostsComments: string | null
  Url: string | null
  User_Id: string | null
  gmail: string | null
}

// Force dynamic rendering to handle environment variables
export const dynamic = 'force-dynamic'

// Fetch data from data_scraping_instagram table in Supabase
async function getInstagramData(): Promise<DataScrapingInstagram[]> {
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
      .from('data_screping_instagram')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error('Error fetching data:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error:', error)
    return []
  }
}

export default async function Page() {
  const data = await getInstagramData()

  return (
    <ProtectedRoute>
      <div className="space-y-4">
        <ScrapingForm />
        <div className="max-h-96 overflow-y-auto rounded-lg border bg-card p-2 shadow-sm w-full">
          <InstagramTable data={data} />
        </div>
      </div>
    </ProtectedRoute>
  )
}
