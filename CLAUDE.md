# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Development Commands
- `npm run dev` - Start development server (default port 3000)
- `npm run build` - Build for production  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run check-env` - Validate environment variables
- `npm run build:check` - Check environment variables and build
- `npm run deploy:check` - Check environment variables, build, and start
- `npm run deploy:railway` - Deploy to Railway platform

### Database Migration Commands
- `npm run db:start` - Start local Supabase instance
- `npm run db:stop` - Stop local Supabase instance
- `npm run db:status` - Check Supabase service status
- `npm run db:reset` - Reset local database to initial state
- `npm run db:migrate` - Generate migration from schema differences
- `npm run db:push` - Push local changes to remote Supabase
- `npm run db:gen-types` - Generate TypeScript types from database schema
- `npm run db:gen-migration` - Generate named migration file
- `npm run db:apply-migration` - Apply pending migrations

### Testing Commands  
- `npm run test:prod` - Test production database connection
- `npm run test:manual` - Run manual production tests
- `npm run test:dev` - Start development server in test mode
- `npm run test:build` - Build in test mode

### Key Development Scripts
- `scripts/check-env.js` - Environment variable validation with detailed feedback
- `scripts/railway-deploy.sh` - Railway deployment automation
- `scripts/test-production-db.js` - Production database connection testing
- `scripts/manual-prod-tests.js` - Manual production validation tests

### Development Auto-Login
The application includes automatic login functionality for development:
- **Email**: `test@gmail.com`
- **Password**: `Test123`
- **Only active in development mode** (`NODE_ENV === 'development'`)
- Creates master account automatically if it doesn't exist
- Shows development indicator in bottom-right corner
- Skips auto-login if user is already authenticated

### Adding shadcn Components
**CRITICAL**: Always use: `npx shadcn@latest add <component-name>`
**NEVER** use: `npx shadcn-ui@latest add <component-name>`

### Environment Setup
Create `.env.local` file with required Supabase configuration:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```
Use `npm run check-env` to validate environment variables before building.

## Architecture Overview

### Core Stack
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

### Key Architecture Patterns

#### Provider Pattern
The app uses a hierarchical provider structure:
1. `ThemeProvider` - Dark/light theme management (default: dark)
2. `AuthProvider` - Authentication state management
3. `SupabaseProvider` - Database and auth integration

#### Component Architecture
- **Feature Components**: Feature-specific components in `src/components/features/`
  - `auth/` - Authentication components (login, register, user management)
  - `navigation/` - Navigation components (navbar, nav items, site header)
  - `dashboard/` - Dashboard-specific components (sidebar, charts, data tables)
  - `services/` - Service-specific components and client pages
  - `kol/` - KOL (Key Opinion Leader) feature components
  - `orion/` - Orion feature components (Instagram scraping, analytics)
- **Layout Components**: `Header`, `Footer`, `Layout` in `src/components/layout/`
- **Section Components**: Modular page sections in `src/components/sections/`
- **Shared Components**: Cross-feature components in `src/components/shared/`
- **UI Components**: shadcn/ui primitives in `src/components/ui/`

#### Data Management
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

#### App Router Structure
The app uses Next.js 14 App Router with organized route groups:
- **`(auth)/`** - Authentication routes (login, register)
- **`(dashboard)/`** - Dashboard routes (admin, KOL, Orion tools)
- **`(marketing)/`** - Marketing routes (home, services, case studies)
- **`api/`** - API routes for server-side functionality

### API Routes Structure
- **`/api/keywords/`** - CRUD operations for keywords management
- **`/api/keywords/bulk/`** - Bulk operations for multiple keywords
- **`/api/keywords/assignments/`** - Keyword assignment management
- **`/api/keywords/stats/`** - Keyword statistics and analytics
- **`/api/scraping/`** - Instagram data scraping and processing
- All API routes implement proper authentication, error handling, and validation

### Environment Configuration

#### Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

#### Environment Validation
The codebase includes robust environment validation:
- `scripts/check-env.js` - Validates required environment variables
- Comprehensive fallback system in `src/lib/supabase.ts` for missing env vars
- Build-time safety - app builds successfully even without environment variables

### Supabase Integration

#### Database Schema
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

#### Authentication Flow
- Login/registration modals with form validation
- Protected routes using `src/components/features/auth/protected-route.tsx`
- Session management with proper cleanup (`persistSession: true`)
- Auto-refresh token enabled (`autoRefreshToken: true`)

#### Fallback System
- Comprehensive mock Supabase client when environment variables are missing
- Graceful degradation for development and build processes
- Informative error messages for debugging
- URL normalization (removes trailing slashes, enforces HTTPS for sslip.io URLs)
- Debug logging available via `NEXT_PUBLIC_DEBUG=true`

## File Structure Conventions

### Naming Conventions
- **Components**: PascalCase (e.g., `Hero.tsx`, `ServiceCard.tsx`)
- **Utilities**: camelCase (e.g., `utils.ts`, `service-utils.ts`)
- **Directories**: lowercase with dashes (e.g., `case-studies/`, `components/ui/`)
- **Pages**: App Router convention (e.g., `page.tsx`, `layout.tsx`)

### Import Patterns
- Use absolute imports with `@/` prefix
- Prefer named exports for components and utilities
- Group imports: React imports, third-party, internal components, utilities

## Development Guidelines

### Cursor Rules Integration
This project includes `.cursorrules` with specific requirements:
- **Always start replies with "Boss 🫡"** (for Cursor AI)
- Tech stack: Next.js, TailwindCSS, Shadcn UI, Firebase (legacy), TypeScript, Lucide Icons
- Commit message prefixes: "fix:", "feat:", "perf:", "docs:", "style:", "refactor:", "test:", "chore:"

### TypeScript Usage
- Use interfaces over types (per .cursorrules)
- Avoid enums; use const objects with 'as const' assertion
- Explicit return types for functions
- Strict typing for database operations
- Use absolute imports with `@/` prefix
- Define strict types for message passing between components

### Component Development
- Functional components with TypeScript interfaces
- Use React Context for global state
- Implement proper cleanup in useEffect hooks
- Error boundaries for robust error handling
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError)
- Prefer iteration and modularization over code duplication

### Styling Approach
- Tailwind CSS for all styling with custom configuration
- shadcn/ui for consistent component library
- Dark theme as default (forced in layout with `darkMode: ["class"]`)
- Responsive design with mobile-first approach
- Custom color scheme with CSS variables for theming
- Sidebar-specific color variables for dashboard components
- Custom animations: `accordion-down`, `accordion-up`, `scroll` (25s infinite)

### Code Quality
- ESLint configuration with Next.js and TypeScript rules (`eslint.config.mjs`)
- Proper error handling with user-friendly messages
- Comprehensive logging for debugging
- Security best practices for authentication and data handling
- Content Security Policy implementation
- Input sanitization and CORS handling
- Avoid try/catch blocks unless necessary for error translation

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

### Build Process
- Environment variable validation before build (`scripts/check-env.js`)
- Webpack optimizations for production with custom splitChunks configuration
- Source maps for development debugging (`devtool: 'source-map'`)
- Vendor chunk optimization specifically for Framer Motion
- App builds successfully even without environment variables (fallback system)

### Railway Deployment
- Custom deployment script at `scripts/railway-deploy.sh`
- Environment variable validation for production
- HTTPS enforcement for Supabase URLs

## Common Patterns

### Form Handling
- Supabase integration for form submissions
- Zod validation for type-safe form validation
- Toast notifications for user feedback using Sonner
- Form state management with proper error handling

### State Management
- React Context for authentication state (`AuthProvider`)
- Local state for component-specific data
- Proper cleanup and memory management
- Real-time updates using Supabase subscriptions

### Error Handling
- Comprehensive error boundaries
- Graceful fallbacks for missing data
- User-friendly error messages
- Development-friendly debugging information
- Environment-aware error handling (development vs production)

### Data Fetching Patterns
- API routes with proper authentication middleware
- Supabase client-side queries with error handling
- Real-time subscriptions for live data updates
- Optimistic updates for better user experience

### Table Management
- @tanstack/react-table for complex data tables
- Sorting, filtering, and pagination built-in
- Bulk operations with selection state management
- Export functionality for data analysis

### Component Architecture
- Feature-based component organization
- Shared UI components using shadcn/ui
- Consistent prop interfaces and TypeScript types
- Proper loading states and error boundaries

## Directory Structure

The project follows a feature-based architecture with clear separation of concerns:

```
src/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Authentication routes
│   │   └── register/
│   ├── (dashboard)/              # Dashboard routes
│   │   ├── dashboard/
│   │   ├── kol/
│   │   └── orion/
│   ├── (marketing)/              # Marketing routes
│   │   ├── (home)/
│   │   ├── case-studies/
│   │   └── services/
│   ├── api/                      # API routes
│   ├── globals.css
│   ├── layout.tsx
│   └── not-found.tsx
├── components/                   # React components
│   ├── features/                 # Feature-specific components
│   │   ├── auth/                 # Authentication components
│   │   ├── dashboard/            # Dashboard components
│   │   ├── kol/                  # KOL feature components
│   │   ├── navigation/           # Navigation components
│   │   ├── orion/               # Orion feature components
│   │   └── services/            # Service components
│   ├── layout/                   # Layout components
│   ├── sections/                 # Page sections
│   ├── shared/                   # Shared components
│   └── ui/                       # shadcn/ui primitives
├── hooks/                        # Custom React hooks
├── lib/                          # Core utilities
│   ├── auth/                     # Authentication utilities
│   ├── config/                   # Configuration files
│   ├── constants/                # Application constants
│   ├── data/                     # Static data
│   ├── database/                 # Database utilities
│   ├── providers/                # React providers
│   ├── types/                    # TypeScript types
│   └── utils/                    # Utility functions
├── public/                       # Static assets
└── styles/                       # Global styles
```

### Key Benefits of This Structure

1. **Feature-based organization** - Related code is grouped together
2. **Clear separation of concerns** - Each directory has a specific purpose
3. **Scalable architecture** - Easy to add new features or modify existing ones
4. **Consistent naming** - kebab-case for directories, consistent file naming
5. **Logical import paths** - Clear and predictable import structure
6. **Route organization** - App Router groups for better organization

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