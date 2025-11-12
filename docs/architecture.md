# Architecture Overview

This is a comprehensive full-stack marketing agency platform with advanced dashboard features, Instagram analytics, KOL management, and content management systems. The codebase is production-ready with sophisticated error handling, authentication, and deployment infrastructure.

## Core Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Supabase (with comprehensive fallback handling)
- **Authentication**: Supabase Auth with custom providers
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Table Management**: @tanstack/react-table
- **Drag & Drop**: @dnd-kit/core
- **Maps**: Leaflet with react-leaflet
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Form Validation**: Zod
- **Notifications**: Sonner

## Key Architecture Patterns

### Provider Pattern
The app uses a hierarchical provider structure:
1. `ThemeProvider` - Dark/light theme management (default: dark)
2. `AuthProvider` - Authentication state management
3. `SupabaseProvider` - Database and auth integration

### Component Architecture
- **Feature Components**: Feature-specific components in `src/components/features/`
  - `auth/` - Authentication components (login, register, user management)
  - `navigation/` - Navigation components (navbar, nav items, site header)
  - `dashboard/` - Dashboard-specific components (sidebar, charts, data tables)
  - `keywords/` - Keywords management components (tables, forms, stats)
  - `services/` - Service-specific components and client pages
  - `kol/` - KOL (Key Opinion Leader) feature components
  - `orion/` - Orion feature components (Instagram scraping, analytics)
- **Layout Components**: `Header`, `Footer`, `Layout` in `src/components/layout/`
- **Section Components**: Modular page sections in `src/components/sections/`
- **Shared Components**: Cross-feature components in `src/components/shared/`
- **UI Components**: shadcn/ui primitives in `src/components/ui/`

### Data Management
- **Static Data**: Services, case studies, and work portfolio data in `src/lib/data/`
- **Database**: Supabase and NoCoDB integration in `src/lib/database/`
- **Authentication**: Auth helpers and utilities in `src/lib/auth/`
- **Types**: Comprehensive TypeScript types in `src/lib/types/`
- **Constants**: Application constants in `src/lib/constants/`
- **Utilities**: Helper functions in `src/lib/utils/`
- **Hooks**: Custom React hooks in `src/hooks/`
  - `useSupabase.ts` - Supabase client and auth utilities
  - `useProgressManager.ts` - Progress tracking for long operations
  - `useRealTimeProgress.ts` - Real-time updates for background tasks
  - `useScrollPosition.ts` - Scroll position tracking
  - `useMobile.tsx` - Mobile device detection

### App Router Structure
The app uses Next.js 14 App Router with organized route groups:
- **`(auth)/`** - Authentication routes (login, register)
- **`(dashboard)/`** - Dashboard routes (admin, keywords, KOL, Orion tools)
- **`(marketing)/`** - Marketing routes (home, services, case studies)
- **`api/`** - API routes for server-side functionality

## API Routes Structure
- **`/api/keywords/`** - CRUD operations for keywords management
- **`/api/keywords/bulk/`** - Bulk operations for multiple keywords
- **`/api/keywords/assignments/`** - Keyword assignment management
- **`/api/keywords/stats/`** - Keyword statistics and analytics
- **`/api/scraping/`** - Instagram data scraping and processing
- All API routes implement proper authentication, error handling, and validation

## Environment Configuration

### Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### Environment Validation
The codebase includes robust environment validation:
- `scripts/check-env.js` - Validates required environment variables
- Comprehensive fallback system in `src/lib/supabase.ts` for missing env vars
- Build-time safety - app builds successfully even without environment variables

## Supabase Integration

### Database Schema
- **users** table: User profiles with auth integration (id, email, name, avatar_url, phone, company, role)
- **contacts** table: Contact form submissions (id, name, email, company, message, status)
- **keywords** table: Keyword management with tracking, priority, and status fields
- **kol_data** table: KOL information and analytics
- **instagram_data** table: Instagram scraping results and metrics
- **assignments** table: Keyword assignments and tracking
- **statistics** table: Performance metrics and analytics data
- Comprehensive TypeScript types exported from `src/lib/database/supabase.ts`
- Helper functions available via `supabaseHelpers` for common operations
- Type definitions in `src/lib/types/` for keywords, KOL, services, and work data

### Programmatic Table Creation
- **postgres-meta API**: Full database management via REST API at `/pg/` endpoints
- **Table Operations**: `POST /pg/tables` for creating tables with columns, constraints, RLS
- **Schema Management**: Complete CRUD operations for schemas, functions, triggers, extensions
- **Dynamic Operations**: Create tables, indexes, policies programmatically without direct DB access
- **Working Implementation**: `create-table-via-meta.js` demonstrates table creation via API
- **Security**: Service role authentication required for schema modifications

### Authentication Flow
- Login/registration modals with form validation
- Protected routes using `src/components/features/auth/protected-route.tsx`
- Session management with proper cleanup (`persistSession: true`)
- Auto-refresh token enabled (`autoRefreshToken: true`)

### Fallback System
- Comprehensive mock Supabase client when environment variables are missing
- Graceful degradation for development and build processes
- Informative error messages for debugging
- URL normalization (removes trailing slashes, enforces HTTPS for sslip.io URLs)
- Debug logging available via `NEXT_PUBLIC_DEBUG=true`

## Specialized Features

### Keywords Management System
- **Keywords Table**: Comprehensive keyword tracking with filtering, sorting, and bulk actions
- **Keyword Form**: Add/edit keywords with validation and auto-suggestions
- **Keyword Stats**: Analytics and performance metrics visualization
- **Bulk Actions**: Mass operations on selected keywords (delete, update, assign)
- **Search & Filter**: Advanced filtering by status, priority, date ranges
- **API Routes**: `/api/keywords/` for CRUD operations, `/api/keywords/bulk/` for bulk operations

### Dashboard System
- **Admin Dashboard**: Sidebar navigation with role-based access (`src/components/features/dashboard/app-sidebar.tsx`)
- **Data Visualization**: Interactive charts with Recharts (`chart-area-interactive.tsx`)
- **User Management**: User analytics and management (`data-table.tsx`)
- **Protected Routes**: Role-based access control with authentication guards
- **Unified Layout**: Consistent dashboard layout across all admin pages

### KOL (Key Opinion Leader) System
- **KOL Table Management**: Advanced table with sorting, filtering, and actions (`src/components/features/kol/kol-table.tsx`)
- **KOL Route Group**: Dedicated routes in `(dashboard)/kol/`
- **Role-Based Access**: Access control for KOL features
- **Advanced KOL Table**: Enhanced table with additional features (`advanced-kol-table.tsx`)

### Orion System (Instagram Analytics)
- **Instagram Scraping**: Data extraction functionality (`src/components/features/orion/scraping-form.tsx`)
- **Instagram Table**: Display and manage Instagram data (`instagram-table.tsx`)
- **Google Maps Integration**: Location-based data visualization (`google-maps-table.tsx`)
- **Interactive Maps**: Leaflet-based mapping with clustering (`interactive-map.tsx`)
- **Search & Filter**: Advanced filtering and search capabilities (`search-filter.tsx`)
- **API Routes**: `/api/scraping/` for data extraction operations
- **Quality Indicators**: Data quality assessment and feedback (`quality-indicator.tsx`)
- **Background Processing**: Long-running operations with progress tracking (`background-progress.tsx`)

### Service System
- **Dynamic Service Pages**: Slug-based routing (`src/app/(marketing)/services/[slug]/`)
- **Service-Specific Components**: Dedicated client components in `src/components/features/services/`
- **ROI Calculators**: Interactive calculators for service value (`ROICalculator.tsx`)
- **Animated Process Sections**: Engaging process visualization (`AnimatedProcessSection.tsx`)
- **Case Study Integration**: Service-specific case studies (`CaseStudiesSection.tsx`)
- **Service Features**: Feature showcases and benefits (`ServiceFeatures.tsx`)

### Work Portfolio
- **Filterable Showcase**: Dynamic work portfolio with category filtering
- **Case Study Pages**: Dynamic case study pages with not-found handling
- **Image Optimization**: Responsive image galleries (`src/components/shared/image/`)
- **Client Testimonials**: Integrated testimonial system

## Testing & Deployment

### Testing Framework
- **Unit Testing**: Jest with React Testing Library for component testing
- **E2E Testing**: Playwright for end-to-end browser automation
- **Test Organization**: Tests located in `__tests__` directories alongside components
- **Coverage**: Jest coverage reporting with thresholds
- **Test Utils**: Custom test utilities in `src/lib/test-utils.ts`
- **Mocking**: Comprehensive mocking for Supabase and external dependencies

### Build Process
- Environment variable validation before build (`scripts/check-env.js`)
- Webpack optimizations for production with custom splitChunks configuration
- Source maps for development debugging (`devtool: 'source-map'`)
- Vendor chunk optimization specifically for Framer Motion
- App builds successfully even without environment variables (fallback system)

## Debugging & Troubleshooting

### Environment Issues
- Run `npm run check-env` to validate environment variables
- Check `/scripts/check-env.js` for validation logic
- Set `NEXT_PUBLIC_DEBUG=true` for detailed Supabase debugging
- Application builds successfully even without environment variables (fallback mode)

### Common Issues & Solutions
- **Supabase Connection**: Use fallback mock client when env vars missing
- **Authentication**: Check `AuthProvider` and `SupabaseProvider` configuration
- **Build Errors**: Validate environment variables first with `npm run check-env`
- **Type Errors**: Check TypeScript types in `src/lib/types/` for consistency
- **API Routes**: Verify authentication middleware and proper error handling

### Development Tips
- Use development auto-login with `test@gmail.com` / `Test123`
- Development indicator appears in bottom-right corner
- Source maps available in development mode
- Use `npm run lint` to catch common issues
- Check Network tab for API route debugging

### Production Deployment
- Always run `npm run build:check` before deployment
- Validate environment variables in production platform
- Use HTTPS for Supabase URLs in production
- Monitor Railway deployment logs for issues
- Test production database connectivity with `npm run test:prod`