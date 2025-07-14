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

### Development Auto-Login
The application includes automatic login functionality for development:
- **Email**: `test@gmail.com`
- **Password**: `Test123`
- **Only active in development mode** (`NODE_ENV === 'development'`)
- Creates master account automatically if it doesn't exist
- Shows development indicator in bottom-right corner
- Skips auto-login if user is already authenticated

### Adding shadcn Components
Always use: `npx shadcn@latest add <component-name>`
Never use: `npx shadcn-ui@latest add <component-name>`

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
- **users** table: User profiles with auth integration
- **contacts** table: Contact form submissions
- Comprehensive TypeScript types exported from `src/lib/supabase.ts`

#### Authentication Flow
- Login/registration modals with form validation
- Protected routes using `src/components/protected-route.tsx`
- Session management with proper cleanup

#### Fallback System
- Mock Supabase client when environment variables are missing
- Graceful degradation for development and build processes
- Informative error messages for debugging

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

### TypeScript Usage
- Use interfaces over types
- Avoid enums; use const objects with 'as const'
- Explicit return types for functions
- Strict typing for database operations

### Component Development
- Functional components with TypeScript interfaces
- Use React Context for global state
- Implement proper cleanup in useEffect hooks
- Error boundaries for robust error handling

### Styling Approach
- Tailwind CSS for all styling
- shadcn/ui for consistent component library
- Dark theme as default (forced in layout)
- Responsive design with mobile-first approach

### Code Quality
- ESLint configuration with Next.js and TypeScript rules
- Proper error handling with user-friendly messages
- Comprehensive logging for debugging
- Security best practices for authentication and data handling

## Specialized Features

### Dashboard System
- Admin dashboard with sidebar navigation
- Data visualization with Recharts
- User management and analytics
- Protected routes with role-based access

### Service System
- Dynamic service pages with slug-based routing
- Service-specific client components
- ROI calculators and interactive elements
- Case study integration

### Work Portfolio
- Filterable work showcase
- Dynamic case study pages
- Image optimization and galleries
- Client testimonials integration

## Testing & Deployment

### Build Process
- Environment variable validation before build
- Webpack optimizations for production
- Source maps for development debugging
- Vendor chunk optimization for better performance

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