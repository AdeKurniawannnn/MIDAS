# 🗃️ MIDAS Database Migration Guide

Complete guide for managing database schema migrations with Supabase CLI and TypeScript type generation.

## 📁 Migration Structure

```
supabase/
├── config.toml              # Supabase configuration
├── migrations/              # Version-controlled schema changes
│   └── 20240101000000_initial_schema.sql
├── functions/               # Database functions (future use)
└── seed.sql                 # Sample data for development
```

## 🛠️ Available Commands

### Local Development
```bash
npm run db:start              # Start local Supabase (requires Docker)
npm run db:stop               # Stop local Supabase
npm run db:status             # Check service status
npm run db:reset              # Reset to initial state + run seed
```

### Schema Management
```bash
npm run db:migrate            # Generate migration from schema diff
npm run db:push               # Push local changes to remote
npm run db:gen-types          # Generate TypeScript types
npm run db:gen-migration      # Create named migration file
npm run db:apply-migration    # Apply pending migrations
```

## 📊 Database Schema Overview

### Core Tables
- **`contacts`** - Contact form submissions
- **`keywords`** - SEO keyword management with priorities
- **`keyword_assignments`** - Task assignment system
- **`data_scraping_google_maps`** - Google Maps scraping results
- **`data_scraping_instagram`** - Instagram profile data
- **`kol_data`** - Key Opinion Leader profiles
- **`statistics`** - Analytics and metrics

### Security Features
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ User-specific data isolation
- ✅ Comprehensive access policies
- ✅ Automated timestamp triggers

## 🔄 Migration Workflow

### 1. Creating New Migrations
```bash
# Generate migration from schema changes
npm run db:gen-migration add_new_table

# Edit the generated file in supabase/migrations/
# Apply the migration
npm run db:apply-migration
```

### 2. Type Generation
```bash
# Auto-generate TypeScript types
npm run db:gen-types

# Types are saved to: src/lib/types/database.generated.ts
```

### 3. Pushing to Production
```bash
# Test locally first
npm run db:start
npm run db:reset

# Push to remote Supabase
npm run db:push
```

## 📝 Schema Files Reference

### Migration File
`supabase/migrations/20240101000000_initial_schema.sql`
- Combines all existing schema files
- Safe `CREATE IF NOT EXISTS` statements
- Comprehensive indexes and RLS policies

### Seed File
`supabase/seed.sql`
- Sample data for development
- Only runs if tables are empty
- Includes realistic test data

### Generated Types
`src/lib/types/database.generated.ts`
- Auto-generated from database schema
- Type-safe database operations
- Helper types for Insert/Update operations

## 🔧 Configuration

### Supabase Config (`supabase/config.toml`)
- **Database**: PostgreSQL 17
- **API Port**: 54321
- **Studio Port**: 54323
- **Auth**: Enabled with JWT
- **Storage**: 50MiB file limit
- **Realtime**: Enabled

### Environment Variables
```bash
# Required for remote operations
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional for CLI operations
SUPABASE_ACCESS_TOKEN=your_access_token
```

## 🚀 Usage Examples

### Using Generated Types
```typescript
import { Database, Keyword, KeywordInsert } from '@/lib/types/database.generated'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient<Database>(url, key)

// Type-safe database operations
const { data: keywords } = await supabase
  .from('keywords')
  .select('*')
  .eq('status', 'active')

// Insert with type safety
const newKeyword: KeywordInsert = {
  keyword: 'digital marketing',
  category: 'services',
  priority: 5
}
```

### Creating Migrations
```sql
-- supabase/migrations/20240202000000_add_analytics_table.sql
CREATE TABLE IF NOT EXISTS public.analytics (
    id BIGSERIAL PRIMARY KEY,
    page_path TEXT NOT NULL,
    view_count INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Add policy
CREATE POLICY "Users can view their own analytics" 
ON public.analytics FOR SELECT 
USING (auth.uid() = user_id);
```

## 🔍 Troubleshooting

### Docker Issues
```bash
# Ensure Docker is running
docker --version

# Reset Docker if needed
docker system prune

# Start Supabase with debug
npx supabase start --debug
```

### Migration Conflicts
```bash
# Check migration status
npx supabase migration list

# Repair migration if needed
npx supabase migration repair --status applied --version 20240101000000
```

### Type Generation Issues
```bash
# Generate types with specific project
npx supabase gen types typescript --project-id YOUR_PROJECT_ID

# Or from local schema
npm run db:gen-types
```

## 🔐 Security Best Practices

### Row Level Security
- All tables have RLS enabled
- User-specific data isolation
- Proper policy definitions

### Data Validation
- CHECK constraints on critical fields
- Foreign key relationships
- Input sanitization in application layer

### Access Control
- JWT-based authentication
- Role-based access policies
- Secure API endpoints

## 📈 Performance Optimization

### Indexes
- Strategic indexes on frequently queried columns
- Composite indexes for complex queries
- JSONB indexes for metadata fields

### Query Optimization
- Use generated types for type safety
- Leverage Supabase query builder
- Implement proper pagination

## 🔄 Backup & Recovery

### Local Backups
```bash
# Export schema
npx supabase db dump --schema-only > backup_schema.sql

# Export data
npx supabase db dump --data-only > backup_data.sql
```

### Production Backups
- Supabase provides automatic backups
- Point-in-time recovery available
- Manual exports via Dashboard

---

## 🎯 Next Steps

1. **Start Docker** and run `npm run db:start`
2. **Test migrations** with sample data
3. **Generate types** after schema changes
4. **Set up CI/CD** for automatic deployments
5. **Monitor performance** and optimize queries

Your database now has full schema migration capabilities with type safety! 🚀