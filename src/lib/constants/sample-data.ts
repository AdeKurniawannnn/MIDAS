import { KOLData } from "@/lib/types/kol"

// Centralized sample KOL data to avoid duplication
export const SAMPLE_KOL_DATA: KOLData[] = [
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