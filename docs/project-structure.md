# Project Structure

The project follows a feature-based architecture with clear separation of concerns:

```
src/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Authentication routes
│   │   └── register/
│   ├── (dashboard)/              # Dashboard routes
│   │   ├── dashboard/
│   │   ├── keywords/
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
│   │   ├── keywords/             # Keywords management components
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

## Key Benefits of This Structure

1. **Feature-based organization** - Related code is grouped together
2. **Clear separation of concerns** - Each directory has a specific purpose
3. **Scalable architecture** - Easy to add new features or modify existing ones
4. **Consistent naming** - kebab-case for directories, consistent file naming
5. **Logical import paths** - Clear and predictable import structure
6. **Route organization** - App Router groups for better organization

## Naming Conventions

### Components
- **Components**: PascalCase (e.g., `Hero.tsx`, `ServiceCard.tsx`)
- **Utilities**: camelCase (e.g., `utils.ts`, `service-utils.ts`)
- **Directories**: lowercase with dashes (e.g., `case-studies/`, `components/ui/`)
- **Pages**: App Router convention (e.g., `page.tsx`, `layout.tsx`)

### Import Patterns
- Use absolute imports with `@/` prefix
- Prefer named exports for components and utilities
- Group imports: React imports, third-party, internal components, utilities

## Key Scripts and Files

### Development Scripts
- `scripts/check-env.js` - Environment variable validation with detailed feedback
- `scripts/railway-deploy.sh` - Railway deployment automation
- `scripts/test-production-db.js` - Production database connection testing
- `scripts/manual-prod-tests.js` - Manual production validation tests

### Database Management Scripts
- `create-table-via-meta.js` - Create tables via postgres-meta API
- `test-table-creation.js` - Test programmatic table creation methods

### Configuration Files
- `eslint.config.mjs` - ESLint configuration with Next.js and TypeScript rules
- `tailwind.config.ts` - Tailwind CSS configuration with custom theme
- `tsconfig.json` - TypeScript configuration with strict settings
- `next.config.js` - Next.js configuration with optimizations