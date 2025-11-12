# MIDAS Project Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Development Guide](#development-guide)
- [Services](#services)
- [Specialized Systems](#specialized-systems)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

MIDAS is a comprehensive marketing agency platform built with modern web technologies. It combines a marketing website with advanced business intelligence tools including KOL management, Instagram scraping (Orion), and comprehensive dashboard analytics.

**Key Capabilities:**
- 🎯 **Marketing Website**: Professional landing page with services, case studies, and portfolio
- 🔐 **Authentication System**: Secure user management with Supabase Auth
- 📊 **Dashboard Analytics**: Interactive charts and data visualization
- 👥 **KOL Management**: Key Opinion Leader tracking and management
- 🤖 **Orion System**: Instagram and Google Maps data scraping
- 📱 **Responsive Design**: Mobile-first approach with dark/light themes

---

## Architecture

### System Architecture
```
┌─────────────────────────────────────────┐
│              MIDAS Platform             │
├─────────────────────────────────────────┤
│  Marketing Website  │  Business Tools   │
│  - Landing Pages    │  - Dashboard      │
│  - Services         │  - KOL Management │
│  - Case Studies     │  - Orion Scraping │
│  - Portfolio        │  - Analytics      │
├─────────────────────────────────────────┤
│           Next.js 14 App Router         │
├─────────────────────────────────────────┤
│  Authentication │  Database │  External │
│  - Supabase Auth│  - Supabase│  - APIs   │
│  - Session Mgmt │  - TypeScript│- Webhooks│
└─────────────────────────────────────────┘
```

### Route Organization
```
app/
├── (auth)/           # Authentication flows
│   └── register/
├── (dashboard)/      # Protected business tools
│   ├── dashboard/    # Main analytics dashboard
│   ├── kol/         # KOL management system
│   └── orion/       # Data scraping tools
├── (marketing)/      # Public marketing pages
│   ├── (home)/      # Landing page
│   ├── case-studies/# Portfolio showcase
│   └── services/    # Service offerings
└── api/             # Backend API routes
```

---

## Core Features

### 🎨 Marketing Website
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Dark/Light Theme**: System preference detection with manual toggle
- **Interactive Components**: Framer Motion animations and smooth transitions
- **Portfolio System**: Filterable case studies and work showcase
- **Service Pages**: Dynamic routing with detailed service information

### 🔐 Authentication & Security
- **Supabase Auth**: Secure authentication with session management
- **Protected Routes**: Role-based access control
- **Development Mode**: Auto-login functionality for development
- **Fallback System**: Graceful degradation without environment variables

### 📊 Dashboard System
- **Interactive Charts**: Recharts integration for data visualization
- **Data Tables**: Sortable, filterable data displays
- **Sidebar Navigation**: Collapsible navigation with role-based items
- **Real-time Updates**: Live data synchronization

### 👥 KOL Management
- **KOL Database**: Comprehensive influencer tracking
- **Advanced Table**: Drag-and-drop, filtering, and search capabilities
- **Analytics Integration**: Performance metrics and reporting

### 🤖 Orion Data Intelligence
- **Instagram Scraping**: Profile data extraction and analysis
- **Google Maps Integration**: Business data via AP5 Google Maps Fast Scraper
- **Fuzzy Search**: Advanced search across all data fields
- **Export Functionality**: Multiple format support

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Charts**: Recharts

### Backend & Data
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **API Routes**: Next.js API routes
- **External APIs**: Instagram webhooks, Google Maps API

### Development Tools
- **Linting**: ESLint with Next.js config
- **Type Checking**: TypeScript strict mode
- **Git Hooks**: Pre-commit validation
- **Environment**: Comprehensive environment variable validation

---

## Project Structure

```
src/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Authentication routes
│   │   └── register/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/            # Main dashboard
│   │   ├── kol/                  # KOL management
│   │   └── orion/                # Data scraping tools
│   ├── (marketing)/              # Public marketing pages
│   │   ├── (home)/               # Landing page
│   │   ├── case-studies/         # Portfolio showcase
│   │   └── services/             # Service pages
│   ├── api/                      # Backend API routes
│   │   └── scraping/             # Data scraping endpoints
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── not-found.tsx             # 404 page
├── components/                   # React components
│   ├── features/                 # Feature-specific components
│   │   ├── auth/                 # Authentication components
│   │   ├── dashboard/            # Dashboard components
│   │   ├── kol/                  # KOL management components
│   │   ├── navigation/           # Navigation components
│   │   ├── orion/               # Orion scraping components
│   │   └── services/            # Service-specific components
│   ├── layout/                   # Layout components
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   ├── sections/                 # Page sections
│   │   ├── Hero.tsx
│   │   ├── Services.tsx
│   │   ├── Portfolio.tsx
│   │   └── Testimonials.tsx
│   ├── shared/                   # Shared components
│   │   ├── CTASection.tsx
│   │   ├── image/                # Image components
│   │   └── work/                 # Work-related components
│   └── ui/                       # shadcn/ui primitives
├── hooks/                        # Custom React hooks
│   ├── useScrollPosition.ts
│   ├── useSupabase.ts
│   └── useProgressManager.ts
├── lib/                          # Core utilities
│   ├── auth/                     # Authentication helpers
│   ├── config/                   # Configuration
│   ├── constants/                # Application constants
│   ├── data/                     # Static data
│   │   ├── services.ts           # Service definitions
│   │   ├── case-studies.ts       # Case study data
│   │   └── workCards.ts          # Portfolio data
│   ├── database/                 # Database utilities
│   │   ├── supabase.ts           # Supabase client
│   │   └── nocodb.ts             # NoCoDB integration
│   ├── providers/                # React providers
│   │   ├── AuthProvider.tsx
│   │   └── SupabaseProvider.tsx
│   ├── types/                    # TypeScript types
│   │   ├── service.ts
│   │   ├── work.ts
│   │   ├── kol.ts
│   │   └── supabase.ts
│   └── utils/                    # Utility functions
│       ├── icons.ts
│       └── service-utils.ts
├── public/                       # Static assets
│   ├── images/                   # Image assets
│   └── avatars/                  # User avatars
└── styles/                       # Additional styles
```

---

## Development Guide

### Getting Started

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd midas
   npm install
   ```

2. **Environment Setup**
   ```bash
   # Create .env.local
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run check-env` | Validate environment variables |
| `npm run build:check` | Check environment and build |
| `npm run deploy:check` | Check, build, and start |
| `npm run deploy:railway` | Deploy to Railway |
| `npm run test:prod` | Test production database |

### Development Guidelines

#### Code Style
- **TypeScript**: Strict typing with explicit return types
- **Components**: Functional components with proper interfaces
- **Naming**: PascalCase for components, camelCase for utilities
- **Imports**: Absolute imports with `@/` prefix

#### Git Workflow
- **Commit Prefixes**: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
- **Branch Strategy**: Feature branches with descriptive names
- **Pull Requests**: Required for main branch changes

#### Adding shadcn Components
```bash
# ALWAYS use this format
npx shadcn@latest add <component-name>

# NEVER use this format
npx shadcn-ui@latest add <component-name>
```

---

## Services

MIDAS offers seven core services, each with dedicated pages and components:

### 1. Digital Automation
- **Focus**: Workflow automation and process optimization
- **Features**: RPA, AI-powered automation, integration services
- **Benefits**: Increased efficiency, reduced errors, 24/7 operation

### 2. IT Systems
- **Focus**: Custom software development and system integration
- **Features**: Cloud solutions, security implementation, technical support
- **Benefits**: Improved efficiency, enhanced security, scalable architecture

### 3. Video Production
- **Focus**: Compelling visual content creation
- **Features**: Corporate videos, animation, drone footage
- **Benefits**: Professional quality, increased engagement, brand storytelling

### 4. Branding
- **Focus**: Brand identity and strategy development
- **Features**: Visual identity, brand guidelines, logo design
- **Benefits**: Market positioning, brand recognition, competitive advantage

### 5. Marketing Strategy
- **Focus**: Data-driven marketing campaigns
- **Features**: Market research, campaign planning, performance tracking
- **Benefits**: Targeted campaigns, better ROI, measurable results

### 6. KOL Endorsement
- **Focus**: Influencer partnerships and advocacy
- **Features**: Influencer selection, campaign management, ROI analysis
- **Benefits**: Extended reach, authentic advocacy, trust building

### 7. Performance Marketing
- **Focus**: Results-driven advertising campaigns
- **Features**: PPC, social media advertising, conversion optimization
- **Benefits**: Measurable results, cost-effectiveness, real-time optimization

---

## Specialized Systems

### Dashboard System
**Location**: `src/app/(dashboard)/dashboard/`

**Components**:
- `app-sidebar.tsx` - Collapsible navigation sidebar
- `chart-area-interactive.tsx` - Interactive data visualization
- `data-table.tsx` - Sortable, filterable data tables
- `dashboard-navbar.tsx` - Dashboard header navigation
- `unified-dashboard-layout.tsx` - Main dashboard layout

**Features**:
- Real-time data visualization with Recharts
- Role-based navigation items
- Responsive design with collapsible sidebar
- Interactive charts and metrics

### KOL Management System
**Location**: `src/app/(dashboard)/kol/`

**Components**:
- `kol-table.tsx` - Basic KOL data table
- `advanced-kol-table.tsx` - Enhanced table with drag-and-drop

**Features**:
- Comprehensive influencer database
- Advanced filtering and search
- Drag-and-drop row reordering
- Export functionality

### Orion Intelligence System
**Location**: `src/app/(dashboard)/orion/`

**Purpose**: Business intelligence through data scraping

**Components**:
- `scraping-form.tsx` - URL input and configuration
- `instagram-table.tsx` - Instagram data display
- `google-maps-table.tsx` - Google Maps business data
- `fuzzy-search-bar.tsx` - Advanced search functionality
- `export-customizer.tsx` - Export configuration

**Capabilities**:
- Instagram profile data extraction
- Google Maps business data scraping
- Fuzzy search across all data fields
- Customizable results per URL
- Multiple export formats

**External Integrations**:
- Instagram Webhook: `https://tequisa-n8n.217.15.164.63.sslip.io/webhook-test/Web_Midas`
- AP5 Google Maps Fast Scraper API
- Supabase database storage

---

## API Documentation

### Authentication API
**Base Path**: Built into Supabase Auth

**Endpoints**:
- `POST /auth/signUp` - User registration
- `POST /auth/signIn` - User login
- `POST /auth/signOut` - User logout
- `GET /auth/user` - Get current user

### Scraping API
**Base Path**: `/api/scraping`

**Endpoints**:
- `POST /api/scraping` - Initiate Instagram scraping
  - Body: `{ url: string, maxResults: number }`
  - Response: `{ success: boolean, message: string }`

### Database Schema

**Users Table**:
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
```

**Instagram Scraping Table**:
```sql
CREATE TABLE data_screping_instagram (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  username VARCHAR,
  followers INTEGER,
  following INTEGER,
  posts INTEGER,
  engagement_rate DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Contacts Table**:
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
```

---

## Deployment

### Environment Variables
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_URL=your_domain
NEXTAUTH_SECRET=your_secret
```

### Railway Deployment
```bash
# Using deployment script
./scripts/railway-deploy.sh

# Manual deployment
npm run deploy:check
```

### Build Process
- Environment validation via `scripts/check-env.js`
- TypeScript compilation with strict mode
- Webpack optimization for production
- Automatic fallback for missing environment variables

### Production Checklist
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] SSL certificates configured
- [ ] Performance monitoring enabled
- [ ] Error tracking configured

---

## Troubleshooting

### Common Issues

#### Environment Variables
**Problem**: Build fails due to missing environment variables
**Solution**: 
1. Run `npm run check-env` to validate
2. Create `.env.local` with required variables
3. Use fallback system for development

#### Authentication Issues
**Problem**: Login/registration not working
**Solution**:
1. Check Supabase URL and key configuration
2. Verify RLS policies are enabled
3. Check browser console for errors
4. Review authentication flow logs

#### Database Connection
**Problem**: Database queries failing
**Solution**:
1. Verify Supabase connection string
2. Check database permissions
3. Validate table schemas
4. Test connection with `npm run test:prod`

#### Orion Scraping
**Problem**: Instagram scraping not working
**Solution**:
1. Verify webhook URL is accessible
2. Check API rate limits
3. Validate request format
4. Review external service status

### Debug Mode
Enable debug logging:
```bash
NEXT_PUBLIC_DEBUG=true
```

### Performance Optimization
- Use `next/image` for optimized images
- Implement lazy loading for components
- Optimize bundle size with code splitting
- Monitor Core Web Vitals

---

## Support & Resources

### Documentation Links
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Internal Documentation
- [Authentication Setup](docs/AUTH_MODALS.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Supabase Setup](docs/SUPABASE_SETUP.md)
- [Orion Specification](specs/ORION_SPEC.md)
- [Production Testing](docs/PRODUCTION_TESTING.md)

### Development Standards
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error boundaries
- Write meaningful commit messages
- Maintain comprehensive documentation

---

*Last Updated: $(date)*
*Version: 1.0.0*