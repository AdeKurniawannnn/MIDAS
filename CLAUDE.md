# CLAUDE.md

## Bash commands
- npm run dev: Start development server
- npm run build: Build for production  
- npm run lint: Run ESLint
- npm run check-env: Validate environment variables
- npm run test: Run Jest tests
- npm run test:e2e: Run Playwright tests
- npm run db:start: Start local Supabase instance
- npm run db:migrate: Generate database migration
- npm run deploy:railway: Deploy to Railway platform

## Code style
- Use interfaces over types
- Avoid enums; use const objects with 'as const'
- Use absolute imports with @/ prefix
- Functional components with TypeScript interfaces
- Tailwind CSS for styling with shadcn/ui components
- Dark theme default

## Workflow
- Run npm run check-env before building
- Always validate environment variables first
- Use npm run lint after code changes
- Test with development auto-login: test@gmail.com / Test123
- Feature-based component organization in src/components/features/

## Project notes
- **CRITICAL**: Use npx shadcn@latest add <component-name> (NOT shadcn-ui@latest)
- Next.js 14 with App Router, TypeScript, Supabase
- Auto-login only active in development mode
- Environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- App builds successfully even without environment variables (fallback system)
- Development indicator appears in bottom-right corner
- postgres-meta API for programmatic database management
- Set NEXT_PUBLIC_DEBUG=true for Supabase debugging

## Documentation
- Architecture details: @/docs/architecture.md
- Directory structure: @/docs/project-structure.md  
- Development patterns: @/docs/development-patterns.md
