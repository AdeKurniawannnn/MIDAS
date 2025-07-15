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

### Testing Commands  
- `npm run test:prod` - Test production database connection
- `npm run test:manual` - Run manual production tests
- `npm run test:dev` - Start development server in test mode
- `npm run test:build` - Build in test mode

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

#### App Router Structure
The app uses Next.js 14 App Router with organized route groups:
- **`(auth)/`** - Authentication routes (login, register)
- **`(dashboard)/`** - Dashboard routes (admin, KOL, Orion tools)
- **`(marketing)/`** - Marketing routes (home, services, case studies)
- **`api/`** - API routes for server-side functionality

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
- Comprehensive TypeScript types exported from `src/lib/database/supabase.ts`
- Helper functions available via `supabaseHelpers` for common operations

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

### Dashboard System
- Admin dashboard with sidebar navigation (`src/components/features/dashboard/app-sidebar.tsx`)
- Data visualization with Recharts (`chart-area-interactive.tsx`)
- User management and analytics (`data-table.tsx`)
- Protected routes with role-based access

### KOL (Key Opinion Leader) System
- KOL table management (`src/components/features/kol/kol-table.tsx`)
- Dedicated KOL route group in `(dashboard)/kol/`
- Role-based access control for KOL features

### Orion System (Instagram Analytics)
- Instagram data scraping functionality (`src/components/features/orion/scraping-form.tsx`)
- Instagram table display (`instagram-table.tsx`)
- Search and filter capabilities (`search-filter.tsx`)
- API route for scraping at `src/app/api/scraping/route.ts`

### Service System
- Dynamic service pages with slug-based routing (`src/app/(marketing)/services/[slug]/`)
- Service-specific client components in `src/components/features/services/`
- ROI calculators and interactive elements (`ROICalculator.tsx`)
- Animated process sections (`AnimatedProcessSection.tsx`)
- Case study integration (`CaseStudiesSection.tsx`)

### Work Portfolio
- Filterable work showcase
- Dynamic case study pages with not-found handling
- Image optimization and galleries (`src/components/shared/image/`)
- Client testimonials integration

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
- Proper validation and error handling
- Toast notifications for user feedback

### State Management
- React Context for authentication state
- Local state for component-specific data
- Proper cleanup and memory management

### Error Handling
- Comprehensive error boundaries
- Graceful fallbacks for missing data
- User-friendly error messages
- Development-friendly debugging information

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