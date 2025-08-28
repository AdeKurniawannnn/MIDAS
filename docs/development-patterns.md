# Development Patterns

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

## TypeScript Guidelines

### Usage Patterns
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

## Styling Approach

### Tailwind CSS Patterns
- Tailwind CSS for all styling with custom configuration
- shadcn/ui for consistent component library
- Dark theme as default (forced in layout with `darkMode: ["class"]`)
- Responsive design with mobile-first approach
- Custom color scheme with CSS variables for theming
- Sidebar-specific color variables for dashboard components
- Custom animations: `accordion-down`, `accordion-up`, `scroll` (25s infinite)

## Code Quality Standards

### Best Practices
- ESLint configuration with Next.js and TypeScript rules (`eslint.config.mjs`)
- Proper error handling with user-friendly messages
- Comprehensive logging for debugging
- Security best practices for authentication and data handling
- Content Security Policy implementation
- Input sanitization and CORS handling
- Avoid try/catch blocks unless necessary for error translation

### Testing Patterns
- **Unit Testing**: Jest with React Testing Library for component testing
- **E2E Testing**: Playwright for end-to-end browser automation
- **Test Organization**: Tests located in `__tests__` directories alongside components
- **Coverage**: Jest coverage reporting with thresholds
- **Test Utils**: Custom test utilities in `src/lib/test-utils.ts`
- **Mocking**: Comprehensive mocking for Supabase and external dependencies

## Development Workflow

### Cursor Rules Integration
This project includes `.cursorrules` with specific requirements:
- **Always start replies with "Boss 🫡"** (for Cursor AI)
- Tech stack: Next.js, TailwindCSS, Shadcn UI, Firebase (legacy), TypeScript, Lucide Icons
- Commit message prefixes: "fix:", "feat:", "perf:", "docs:", "style:", "refactor:", "test:", "chore:"

### Development Process
- Run `npm run check-env` before building
- Always validate environment variables first
- Use `npm run lint` after code changes
- Test with development auto-login: `test@gmail.com` / `Test123`
- Feature-based component organization in `src/components/features/`

### Environment Management
Create `.env.local` file with required Supabase configuration:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Key Development Notes
- **CRITICAL**: Use `npx shadcn@latest add <component-name>` (NOT `shadcn-ui@latest`)
- Auto-login only active in development mode
- App builds successfully even without environment variables (fallback system)
- Development indicator appears in bottom-right corner
- postgres-meta API for programmatic database management
- Set `NEXT_PUBLIC_DEBUG=true` for Supabase debugging