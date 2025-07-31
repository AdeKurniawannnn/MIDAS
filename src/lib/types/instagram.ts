// Instagram Scraper Data Types
// TypeScript interfaces for Instagram hashtag and post data

export interface InstagramHashtag {
  id: number;
  hashtag_name: string;
  posts_count: number;
  hashtag_url: string;
  search_query?: string;
  user_id: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface InstagramLocation {
  id: number;
  location_id?: string;
  location_name: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  city?: string;
  country?: string;
  created_at: string;
}

export interface InstagramMusicInfo {
  id: number;
  audio_id?: string;
  artist_name?: string;
  song_name?: string;
  uses_original_audio: boolean;
  should_mute_audio: boolean;
  should_mute_audio_reason?: string;
  created_at: string;
}

export interface InstagramPost {
  id: number;
  
  // Instagram identifiers
  instagram_id: string;
  short_code: string;
  post_url: string;
  input_url?: string;
  
  // Content metadata
  post_type: 'Image' | 'Video' | 'Sidecar' | 'Reel';
  caption?: string;
  timestamp?: string;
  
  // Media information
  display_url?: string;
  video_url?: string;
  video_duration?: number;
  dimensions_height?: number;
  dimensions_width?: number;
  images?: string[];
  
  // Engagement metrics
  likes_count: number;
  comments_count: number;
  video_play_count: number;
  ig_play_count: number;
  reshare_count: number;
  
  // Owner information
  owner_id?: string;
  owner_username?: string;
  owner_full_name?: string;
  
  // References
  location_id?: number;
  music_info_id?: number;
  hashtag_id: number;
  user_id: string;
  
  // Business information
  is_sponsored: boolean;
  product_type?: string;
  
  // Comments data
  first_comment?: string;
  latest_comments: InstagramComment[];
  
  // Child posts for carousels
  child_posts: any[];
  
  // Additional metadata
  metadata?: Record<string, any>;
  
  created_at: string;
  updated_at: string;
}

export interface InstagramComment {
  id: string;
  text: string;
  ownerUsername: string;
  ownerProfilePicUrl?: string;
  timestamp: string;
  repliesCount: number;
  replies: InstagramComment[];
  likesCount: number;
  owner: {
    id: string;
    is_verified: boolean;
    profile_pic_url?: string;
    username: string;
  };
}

export interface InstagramPostHashtag {
  id: number;
  post_id: number;
  hashtag_name: string;
  created_at: string;
}

export interface InstagramPostMention {
  id: number;
  post_id: number;
  mentioned_username: string;
  created_at: string;
}

export interface InstagramSearchQuery {
  id: number;
  search_term: string;
  search_type: 'hashtag' | 'user' | 'location';
  results_count: number;
  results_limit: number;
  user_id: string;
  apify_run_id?: string;
  search_metadata: Record<string, any>;
  created_at: string;
}

// Comprehensive type for full post with relationships
export interface InstagramPostWithRelations extends InstagramPost {
  location?: InstagramLocation;
  music_info?: InstagramMusicInfo;
  hashtags: string[];
  mentions: string[];
  hashtag?: InstagramHashtag;
}

// Analytics view types
export interface HashtagAnalytics {
  hashtag_name: string;
  official_posts_count: number;
  scraped_posts_count: number;
  avg_likes: number;
  avg_comments: number;
  avg_video_plays: number;
  sponsored_posts_count: number;
  latest_post_date?: string;
  user_id: string;
}

export interface UserPostAnalytics {
  owner_username: string;
  total_posts: number;
  avg_likes: number;
  avg_comments: number;
  total_likes: number;
  total_comments: number;
  sponsored_posts: number;
  video_posts: number;
  latest_post_date?: string;
  user_id: string;
}

// API response types for the scraper data
export interface InstagramScraperHashtagResponse {
  name: string;
  postsCount: number;
  url: string;
  id: string;
  topPosts: InstagramScraperPost[];
}

export interface InstagramScraperPost {
  inputUrl: string;
  id: string;
  type: string;
  shortCode: string;
  caption: string;
  hashtags: string[];
  mentions: string[];
  url: string;
  commentsCount: number;
  firstComment: string;
  latestComments: InstagramComment[];
  dimensionsHeight: number;
  dimensionsWidth: number;
  displayUrl: string;
  images: string[];
  videoUrl?: string;
  likesCount: number;
  videoPlayCount?: number;
  igPlayCount?: number;
  reshareCount: number;
  timestamp: string;
  childPosts: any[];
  locationName?: string;
  locationId?: string;
  ownerFullName: string;
  ownerUsername: string;
  ownerId: string;
  productType: string;
  videoDuration?: number;
  isSponsored: boolean;
  musicInfo?: {
    artist_name: string;
    song_name: string;
    uses_original_audio: boolean;
    should_mute_audio: boolean;
    should_mute_audio_reason: string;
    audio_id: string;
  };
}

// Form types for creating/updating records
export interface CreateInstagramHashtagData {
  hashtag_name: string;
  posts_count?: number;
  hashtag_url: string;
  search_query?: string;
  metadata?: Record<string, any>;
}

export interface CreateInstagramPostData {
  instagram_id: string;
  short_code: string;
  post_url: string;
  input_url?: string;
  post_type: 'Image' | 'Video' | 'Sidecar' | 'Reel';
  caption?: string;
  timestamp?: string;
  display_url?: string;
  video_url?: string;
  video_duration?: number;
  dimensions_height?: number;
  dimensions_width?: number;
  images?: string[];
  likes_count?: number;
  comments_count?: number;
  video_play_count?: number;
  ig_play_count?: number;
  reshare_count?: number;
  owner_id?: string;
  owner_username?: string;
  owner_full_name?: string;
  is_sponsored?: boolean;
  product_type?: string;
  first_comment?: string;
  latest_comments?: InstagramComment[];
  child_posts?: any[];
  metadata?: Record<string, any>;
  hashtags?: string[];
  mentions?: string[];
  location?: {
    location_id?: string;
    location_name: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
    city?: string;
    country?: string;
  };
  music_info?: {
    audio_id?: string;
    artist_name?: string;
    song_name?: string;
    uses_original_audio?: boolean;
    should_mute_audio?: boolean;
    should_mute_audio_reason?: string;
  };
}

// Filter and search types
export interface InstagramPostFilters {
  hashtag_name?: string;
  owner_username?: string;
  post_type?: 'Image' | 'Video' | 'Sidecar' | 'Reel';
  is_sponsored?: boolean;
  min_likes?: number;
  max_likes?: number;
  min_comments?: number;
  max_comments?: number;
  date_from?: string;
  date_to?: string;
  location_name?: string;
  has_video?: boolean;
  has_music?: boolean;
}

export interface InstagramSearchOptions {
  search_term: string;
  search_type: 'hashtag' | 'user' | 'location';
  results_limit?: number;
  additional_params?: Record<string, any>;
}

// API route response types
export interface InstagramDataResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface InstagramBulkInsertResponse {
  hashtag_id: number;
  posts_inserted: number;
  hashtags_inserted: number;
  mentions_inserted: number;
  locations_inserted: number;
  music_info_inserted: number;
  success: boolean;
  message: string;
}

// Utility types
export type InstagramTableNames = 
  | 'instagram_hashtags'
  | 'instagram_posts'
  | 'instagram_locations'
  | 'instagram_music_info'
  | 'instagram_post_hashtags'
  | 'instagram_post_mentions'
  | 'instagram_search_queries';

export type InstagramSortableFields = 
  | 'created_at'
  | 'updated_at'
  | 'timestamp'
  | 'likes_count'
  | 'comments_count'
  | 'video_play_count'
  | 'posts_count'
  | 'hashtag_name'
  | 'owner_username';

export interface InstagramPaginationOptions {
  page?: number;
  limit?: number;
  sort_by?: InstagramSortableFields;
  sort_order?: 'asc' | 'desc';
}