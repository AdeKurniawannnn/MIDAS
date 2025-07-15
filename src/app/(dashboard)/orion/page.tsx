import { ProtectedRoute } from "@/components/features/auth/protected-route"
import { EnhancedOrionClient } from "@/components/features/orion/enhanced-orion-client"
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

// Interface for Google Maps scraping data
interface GoogleMapsData {
  id: number
  inputUrl: string
  placeName: string | null
  address: string | null
  phoneNumber: string | null
  website: string | null
  rating: string | null
  reviewCount: string | null
  category: string | null
  hours: string | null
  description: string | null
  coordinates: string | null
  imageUrl: string | null
  priceRange: string | null
  User_Id: string | null
  gmail: string | null
  createdAt: string
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

// Fetch data from Google Maps table in Supabase
async function getGoogleMapsData(): Promise<GoogleMapsData[]> {
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
      .from('data_scraping_google_maps')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error('Error fetching Google Maps data:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error:', error)
    return []
  }
}

export default async function Page() {
  const instagramData = await getInstagramData()
  const googleMapsData = await getGoogleMapsData()

  return (
    <ProtectedRoute>
      <EnhancedOrionClient 
        instagramData={instagramData} 
        googleMapsData={googleMapsData} 
      />
    </ProtectedRoute>
  )
}
