# MIDAS API Reference

## 📋 Table of Contents
- [Authentication API](#authentication-api)
- [Scraping API](#scraping-api)
- [Database Schema](#database-schema)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication API

### Overview
Authentication is handled through Supabase Auth with custom helpers for session management.

### Base Configuration
```typescript
// src/lib/database/supabase.ts
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Endpoints

#### User Registration
```typescript
// Method: POST
// Endpoint: Supabase Auth /auth/v1/signup
// Component: src/components/features/auth/register-form.tsx

interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  company?: string;
}

interface RegisterResponse {
  user: User | null;
  error: AuthError | null;
}
```

#### User Login
```typescript
// Method: POST
// Endpoint: Supabase Auth /auth/v1/token
// Component: src/components/features/auth/login-modal.tsx

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}
```

#### User Logout
```typescript
// Method: POST
// Endpoint: Supabase Auth /auth/v1/logout
// Implementation: AuthProvider context

const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
```

#### Get Current User
```typescript
// Method: GET
// Endpoint: Supabase Auth /auth/v1/user
// Implementation: AuthProvider context

const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};
```

---

## Scraping API

### Instagram Scraping

#### Initiate Scraping
```typescript
// Method: POST
// Endpoint: /api/scraping
// File: src/app/api/scraping/route.ts

interface ScrapingRequest {
  url: string;
  maxResults: number;
  userId?: string;
}

interface ScrapingResponse {
  success: boolean;
  message: string;
  data?: {
    webhookUrl: string;
    requestId: string;
  };
}

// Example Usage
const response = await fetch('/api/scraping', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://instagram.com/username',
    maxResults: 100,
    userId: user.id
  })
});
```

#### External Webhook
```typescript
// Webhook URL: https://tequisa-n8n.217.15.164.63.sslip.io/webhook-test/Web_Midas
// Method: POST (triggered by external service)

interface WebhookPayload {
  url: string;
  maxResults: number;
  userId: string;
  data: InstagramProfile[];
}

interface InstagramProfile {
  username: string;
  followers: number;
  following: number;
  posts: number;
  engagement_rate: number;
  bio: string;
  verified: boolean;
}
```

### Google Maps Scraping

#### AP5 Google Maps Fast Scraper Integration
```typescript
// External API: AP5 Google Maps Fast Scraper
// Implementation: src/components/features/orion/google-maps-table.tsx

interface GoogleMapsRequest {
  query: string;
  location: string;
  maxResults: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface GoogleMapsResponse {
  businesses: BusinessData[];
  totalResults: number;
  hasMore: boolean;
}

interface BusinessData {
  name: string;
  address: string;
  phone: string;
  rating: number;
  reviews: number;
  category: string;
  website: string;
  hours: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  avatar_url VARCHAR,
  phone VARCHAR,
  company VARCHAR,
  role VARCHAR DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### Instagram Scraping Data
```sql
CREATE TABLE data_screping_instagram (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR NOT NULL,
  followers INTEGER,
  following INTEGER,
  posts INTEGER,
  engagement_rate DECIMAL(5,2),
  bio TEXT,
  verified BOOLEAN DEFAULT FALSE,
  profile_image_url VARCHAR,
  url VARCHAR,
  scraped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE data_screping_instagram ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scraping data" ON data_screping_instagram
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scraping data" ON data_screping_instagram
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scraping data" ON data_screping_instagram
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scraping data" ON data_screping_instagram
  FOR DELETE USING (auth.uid() = user_id);
```

### Contacts Table
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  company VARCHAR,
  message TEXT,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin only access
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all contacts" ON contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

### KOL Management Table
```sql
CREATE TABLE kol_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  platform VARCHAR NOT NULL,
  username VARCHAR NOT NULL,
  followers INTEGER,
  engagement_rate DECIMAL(5,2),
  category VARCHAR,
  location VARCHAR,
  contact_email VARCHAR,
  rate_per_post DECIMAL(10,2),
  status VARCHAR DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE kol_management ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own KOL data" ON kol_management
  FOR ALL USING (auth.uid() = user_id);
```

---

## Type Definitions

### Authentication Types
```typescript
// src/lib/types/supabase.ts
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  phone?: string;
  company?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

export interface AuthError {
  message: string;
  status: number;
}
```

### Scraping Types
```typescript
// src/lib/types/orion.ts
export interface InstagramData {
  id: string;
  user_id: string;
  username: string;
  followers: number;
  following: number;
  posts: number;
  engagement_rate: number;
  bio: string;
  verified: boolean;
  profile_image_url: string;
  url: string;
  scraped_at: string;
  created_at: string;
}

export interface GoogleMapsData {
  id: string;
  user_id: string;
  business_name: string;
  address: string;
  phone: string;
  rating: number;
  reviews: number;
  category: string;
  website: string;
  hours: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  created_at: string;
}
```

### Service Types
```typescript
// src/lib/types/service.ts
export interface Service {
  title: string;
  description: string;
  iconName: string;
  longDescription: string;
  features: string[];
  benefits: string[];
  process: ProcessStep[];
}

export interface ProcessStep {
  title: string;
  description: string;
}
```

### KOL Types
```typescript
// src/lib/types/kol.ts
export interface KOLData {
  id: string;
  user_id: string;
  name: string;
  platform: string;
  username: string;
  followers: number;
  engagement_rate: number;
  category: string;
  location: string;
  contact_email: string;
  rate_per_post: number;
  status: 'active' | 'inactive' | 'pending';
  notes: string;
  created_at: string;
  updated_at: string;
}
```

---

## Error Handling

### API Error Response Format
```typescript
interface APIError {
  error: {
    message: string;
    code: string;
    details?: any;
  };
  status: number;
}

// Example Usage
try {
  const response = await fetch('/api/scraping', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error: APIError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result = await response.json();
} catch (error) {
  console.error('API Error:', error);
  // Handle error appropriately
}
```

### Common Error Codes
```typescript
enum ErrorCodes {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}
```

### Error Handling Utilities
```typescript
// src/lib/utils/error-handler.ts
export const handleAPIError = (error: any): string => {
  if (error.code === 'PGRST301') {
    return 'Resource not found';
  }
  
  if (error.message?.includes('rate limit')) {
    return 'Rate limit exceeded. Please try again later.';
  }
  
  return error.message || 'An unexpected error occurred';
};
```

---

## Rate Limiting

### Supabase Rate Limits
- **Anonymous requests**: 100 requests per hour
- **Authenticated requests**: 1000 requests per hour
- **Database queries**: 500 concurrent connections

### External API Limits
- **Instagram Webhook**: 10 requests per minute
- **Google Maps API**: 100 requests per day (free tier)

### Rate Limiting Implementation
```typescript
// src/lib/utils/rate-limiter.ts
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  public canMakeRequest(userId: string, limit: number = 10, window: number = 60000): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Filter requests within the time window
    const recentRequests = userRequests.filter(time => now - time < window);
    
    if (recentRequests.length >= limit) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }
}
```

---

## Helper Functions

### Database Helpers
```typescript
// src/lib/database/supabase.ts
export const supabaseHelpers = {
  async getUser(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async createContact(contact: Omit<Contact, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async getInstagramData(userId: string) {
    const { data, error } = await supabase
      .from('data_screping_instagram')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};
```

### Authentication Helpers
```typescript
// src/lib/auth/auth-helpers.ts
export const authHelpers = {
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },
  
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  async updateProfile(updates: Partial<User>) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    if (error) throw error;
    return data;
  }
};
```

---

*Last Updated: $(date)*
*Version: 1.0.0*