# MIDAS Component Guide

## 📋 Table of Contents
- [Component Architecture](#component-architecture)
- [Feature Components](#feature-components)
- [Layout Components](#layout-components)
- [UI Components](#ui-components)
- [Shared Components](#shared-components)
- [Component Patterns](#component-patterns)
- [Styling Guidelines](#styling-guidelines)

---

## Component Architecture

### Hierarchical Structure
```
src/components/
├── features/        # Feature-specific components
├── layout/         # Layout and navigation components
├── sections/       # Page sections and content blocks
├── shared/         # Reusable components across features
└── ui/             # shadcn/ui primitives and custom UI components
```

### Component Categories

#### 1. **Feature Components** (`src/components/features/`)
Domain-specific components organized by feature area:
- `auth/` - Authentication and user management
- `dashboard/` - Dashboard and analytics
- `kol/` - KOL management system
- `navigation/` - Navigation and menu components
- `orion/` - Data scraping and intelligence
- `services/` - Service-specific components

#### 2. **Layout Components** (`src/components/layout/`)
Structural components for page layout:
- Global page layout and structure
- Header and footer components
- Navigation containers

#### 3. **UI Components** (`src/components/ui/`)
Primitive UI components from shadcn/ui and custom components:
- Button variants and interactions
- Form controls and inputs
- Data display components
- Overlay and modal components

#### 4. **Shared Components** (`src/components/shared/`)
Reusable components across multiple features:
- CTA sections and call-to-action components
- Image and media components
- Work and portfolio components

---

## Feature Components

### Authentication Components (`src/components/features/auth/`)

#### `login-modal.tsx`
```typescript
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

// Features:
// - Email/password authentication
// - Form validation with Zod
// - Error handling and display
// - Auto-redirect after login
// - Development auto-login
```

#### `register-modal.tsx`
```typescript
interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

// Features:
// - User registration form
// - Profile information collection
// - Email verification
// - Form validation
// - Error handling
```

#### `protected-route.tsx`
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
  fallback?: React.ReactNode;
}

// Features:
// - Route protection based on authentication
// - Role-based access control
// - Loading states
// - Redirect handling
```

#### `user-status.tsx`
```typescript
interface UserStatusProps {
  showWelcome?: boolean;
  compact?: boolean;
}

// Features:
// - User profile display
// - Authentication status
// - Quick actions menu
// - Profile picture display
```

### Dashboard Components (`src/components/features/dashboard/`)

#### `app-sidebar.tsx`
```typescript
interface AppSidebarProps {
  className?: string;
}

// Features:
// - Collapsible sidebar navigation
// - Role-based navigation items
// - Active route highlighting
// - Responsive behavior
// - User profile section
```

#### `chart-area-interactive.tsx`
```typescript
interface ChartAreaInteractiveProps {
  data: ChartData[];
  title: string;
  description?: string;
}

// Features:
// - Interactive area chart with Recharts
// - Data visualization
// - Responsive design
// - Multiple data series support
// - Hover interactions
```

#### `data-table.tsx`
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
}

// Features:
// - Sortable and filterable data display
// - Pagination support
// - Search functionality
// - Export capabilities
// - Custom column definitions
```

### KOL Management Components (`src/components/features/kol/`)

#### `kol-table.tsx`
```typescript
interface KOLTableProps {
  data: KOLData[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// Features:
// - KOL data display
// - Inline editing
// - Sorting and filtering
// - Action buttons
// - Responsive design
```

#### `advanced-kol-table.tsx`
```typescript
interface AdvancedKOLTableProps {
  data: KOLData[];
  onUpdate: (data: KOLData[]) => void;
  enableDragDrop?: boolean;
}

// Features:
// - Drag and drop row reordering
// - Advanced filtering
// - Multi-select actions
// - Export functionality
// - Performance optimization
```

### Navigation Components (`src/components/features/navigation/`)

#### `navbar.tsx`
```typescript
interface NavbarProps {
  showAuthButtons?: boolean;
  transparent?: boolean;
}

// Features:
// - Responsive navigation bar
// - Authentication buttons
// - Mobile menu toggle
// - Theme toggle
// - Active route highlighting
```

#### `site-header.tsx`
```typescript
interface SiteHeaderProps {
  variant?: 'default' | 'minimal' | 'dashboard';
}

// Features:
// - Site-wide header component
// - Logo and branding
// - Navigation menu
// - User status display
// - Theme switching
```

### Orion Components (`src/components/features/orion/`)

#### `scraping-form.tsx`
```typescript
interface ScrapingFormProps {
  onSubmit: (data: ScrapingData) => void;
  loading?: boolean;
  platform: 'instagram' | 'googlemaps';
}

// Features:
// - URL input and validation
// - Custom results count input
// - Platform-specific configuration
// - Progress tracking
// - Error handling
```

#### `instagram-table.tsx`
```typescript
interface InstagramTableProps {
  data: InstagramData[];
  onEdit: (id: string, data: Partial<InstagramData>) => void;
  onDelete: (ids: string[]) => void;
  onExport: (data: InstagramData[]) => void;
}

// Features:
// - Instagram data display
// - Inline editing
// - Fuzzy search
// - Bulk actions
// - Export functionality
```

#### `fuzzy-search-bar.tsx`
```typescript
interface FuzzySearchBarProps {
  data: any[];
  onFilteredDataChange: (filteredData: any[]) => void;
  searchFields: string[];
  placeholder?: string;
}

// Features:
// - Fuzzy search across multiple fields
// - Real-time filtering
// - Search highlighting
// - Performance optimization
// - Debounced input
```

### Service Components (`src/components/features/services/`)

#### `ServiceHero.tsx`
```typescript
interface ServiceHeroProps {
  service: Service;
  className?: string;
}

// Features:
// - Hero section for service pages
// - Service information display
// - Call-to-action buttons
// - Background imagery
// - Responsive design
```

#### `ROICalculator.tsx`
```typescript
interface ROICalculatorProps {
  service: string;
  onCalculate: (result: ROIResult) => void;
}

// Features:
// - Interactive ROI calculation
// - Service-specific metrics
// - Real-time updates
// - Result visualization
// - Export capabilities
```

---

## Layout Components

### `Header.tsx`
```typescript
interface HeaderProps {
  variant?: 'marketing' | 'dashboard' | 'minimal';
  fixed?: boolean;
}

// Features:
// - Site-wide header
// - Navigation integration
// - Authentication status
// - Theme toggle
// - Responsive design
```

### `Footer.tsx`
```typescript
interface FooterProps {
  showSitemap?: boolean;
  compact?: boolean;
}

// Features:
// - Site footer with links
// - Social media links
// - Copyright information
// - Newsletter signup
// - Responsive columns
```

### `Layout.tsx`
```typescript
interface LayoutProps {
  children: React.ReactNode;
  variant?: 'default' | 'dashboard' | 'auth';
  title?: string;
  description?: string;
}

// Features:
// - Main layout wrapper
// - SEO meta tags
// - Header and footer integration
// - Provider wrappers
// - Page-specific layouts
```

---

## UI Components

### Button Components

#### `button.tsx` (shadcn/ui)
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}
```

#### `button-accent.tsx`
```typescript
interface ButtonAccentProps extends ButtonProps {
  gradient?: boolean;
  glow?: boolean;
}

// Features:
// - Accent button with custom styling
// - Gradient backgrounds
// - Glow effects
// - Animation support
```

#### `animated-button.tsx`
```typescript
interface AnimatedButtonProps extends ButtonProps {
  animation?: 'pulse' | 'bounce' | 'slide' | 'fade';
  duration?: number;
}

// Features:
// - Button with Framer Motion animations
// - Multiple animation types
// - Customizable duration
// - Hover and click effects
```

### Form Components

#### `input.tsx` (shadcn/ui)
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'ghost' | 'outline';
  error?: boolean;
}
```

#### `textarea.tsx` (shadcn/ui)
```typescript
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  maxLength?: number;
}
```

#### `select.tsx` (shadcn/ui)
```typescript
interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}
```

### Display Components

#### `card.tsx` (shadcn/ui)
```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'secondary';
}

// Sub-components:
// - CardHeader
// - CardTitle
// - CardDescription
// - CardContent
// - CardFooter
```

#### `table.tsx` (shadcn/ui)
```typescript
interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  striped?: boolean;
  hoverable?: boolean;
}

// Sub-components:
// - TableHeader
// - TableBody
// - TableFooter
// - TableRow
// - TableHead
// - TableCell
```

### Loading Components

#### `skeleton.tsx` (shadcn/ui)
```typescript
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'rectangular';
}
```

#### `loading-overlay.tsx`
```typescript
interface LoadingOverlayProps {
  loading: boolean;
  message?: string;
  overlay?: boolean;
}

// Features:
// - Full-screen loading overlay
// - Custom loading messages
// - Spinner animations
// - Backdrop blur
```

---

## Shared Components

### CTA Components

#### `CTASection.tsx`
```typescript
interface CTASectionProps {
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  variant?: 'default' | 'gradient' | 'minimal';
}

// Features:
// - Call-to-action sections
// - Multiple design variants
// - Custom button styling
// - Responsive layout
```

### Image Components

#### `ResponsiveImage.tsx`
```typescript
interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

// Features:
// - Next.js Image optimization
// - Responsive breakpoints
// - Lazy loading
// - Priority loading
// - Aspect ratio handling
```

#### `ImageGallery.tsx`
```typescript
interface ImageGalleryProps {
  images: ImageData[];
  columns?: number;
  spacing?: number;
  lightbox?: boolean;
}

// Features:
// - Grid-based image gallery
// - Lightbox functionality
// - Responsive columns
// - Lazy loading
// - Custom spacing
```

### Work Components

#### `WorkCard.tsx`
```typescript
interface WorkCardProps {
  work: WorkData;
  variant?: 'default' | 'minimal' | 'featured';
  onClick?: () => void;
}

// Features:
// - Work portfolio display
// - Hover animations
// - Category badges
// - Responsive design
// - Click interactions
```

#### `CaseStudy.tsx`
```typescript
interface CaseStudyProps {
  caseStudy: CaseStudyData;
  showDetails?: boolean;
  compact?: boolean;
}

// Features:
// - Case study display
// - Detailed information
// - Image galleries
// - Results metrics
// - Responsive layout
```

---

## Component Patterns

### Common Patterns

#### 1. **Provider Pattern**
```typescript
// AuthProvider example
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Provider logic...
  
  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 2. **Compound Components**
```typescript
// Card compound component example
const Card = ({ children, ...props }: CardProps) => (
  <div className="card" {...props}>{children}</div>
);

Card.Header = ({ children, ...props }: CardHeaderProps) => (
  <div className="card-header" {...props}>{children}</div>
);

Card.Body = ({ children, ...props }: CardBodyProps) => (
  <div className="card-body" {...props}>{children}</div>
);
```

#### 3. **Render Props**
```typescript
// Data fetcher with render props
interface DataFetcherProps<T> {
  url: string;
  render: (data: T | null, loading: boolean, error: string | null) => React.ReactNode;
}

const DataFetcher = <T,>({ url, render }: DataFetcherProps<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch logic...
  
  return <>{render(data, loading, error)}</>;
};
```

#### 4. **Custom Hooks**
```typescript
// useSupabase hook
export const useSupabase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const executeQuery = async (query: () => Promise<any>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await query();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { executeQuery, loading, error };
};
```

### Component Composition

#### Higher-Order Components (HOCs)
```typescript
// withAuth HOC
const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const { user, loading } = useAuth();
    
    if (loading) return <LoadingSpinner />;
    if (!user) return <LoginPrompt />;
    
    return <Component {...props} />;
  };
};
```

#### Component Factories
```typescript
// createFormField factory
const createFormField = (type: string) => {
  return ({ name, label, error, ...props }: FormFieldProps) => (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input type={type} id={name} name={name} {...props} />
      {error && <span className="error">{error}</span>}
    </div>
  );
};

export const TextField = createFormField('text');
export const EmailField = createFormField('email');
export const PasswordField = createFormField('password');
```

---

## Styling Guidelines

### Tailwind CSS Classes

#### Layout Classes
```css
/* Container and spacing */
.container { @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8; }
.section { @apply py-16 lg:py-24; }
.grid-cols-auto { @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3; }

/* Flexbox utilities */
.flex-center { @apply flex items-center justify-center; }
.flex-between { @apply flex items-center justify-between; }
.flex-col-center { @apply flex flex-col items-center; }
```

#### Typography Classes
```css
/* Headings */
.heading-1 { @apply text-4xl sm:text-5xl lg:text-6xl font-bold; }
.heading-2 { @apply text-3xl sm:text-4xl lg:text-5xl font-bold; }
.heading-3 { @apply text-2xl sm:text-3xl lg:text-4xl font-semibold; }

/* Body text */
.body-lg { @apply text-lg sm:text-xl; }
.body-sm { @apply text-sm sm:text-base; }
.text-muted { @apply text-muted-foreground; }
```

#### Component-Specific Classes
```css
/* Cards */
.card-default { @apply bg-card text-card-foreground rounded-lg border shadow-sm; }
.card-hover { @apply transition-shadow hover:shadow-md; }

/* Buttons */
.btn-primary { @apply bg-primary text-primary-foreground hover:bg-primary/90; }
.btn-secondary { @apply bg-secondary text-secondary-foreground hover:bg-secondary/80; }

/* Form elements */
.form-input { @apply border border-input bg-background px-3 py-2 rounded-md; }
.form-error { @apply text-destructive text-sm; }
```

### Custom CSS Variables
```css
/* Color system */
:root {
  --background: 0 0% 100%;
  --foreground: 224 71% 4%;
  --card: 0 0% 100%;
  --card-foreground: 224 71% 4%;
  --popover: 0 0% 100%;
  --popover-foreground: 224 71% 4%;
  --primary: 221 83% 53%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 84% 5%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 210 40% 96%;
  --accent-foreground: 222 84% 5%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 210 40% 98%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 221 83% 53%;
  --radius: 0.5rem;
}

/* Dark mode */
.dark {
  --background: 224 71% 4%;
  --foreground: 213 31% 91%;
  --card: 224 71% 4%;
  --card-foreground: 213 31% 91%;
  --popover: 224 71% 4%;
  --popover-foreground: 215 20% 65%;
  --primary: 210 40% 98%;
  --primary-foreground: 222 84% 5%;
  --secondary: 222 84% 5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 223 47% 11%;
  --muted-foreground: 215 20% 65%;
  --accent: 216 34% 17%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 210 40% 98%;
  --border: 216 34% 17%;
  --input: 216 34% 17%;
  --ring: 216 34% 17%;
}
```

### Animation Classes
```css
/* Transitions */
.transition-all { @apply transition-all duration-200 ease-in-out; }
.transition-colors { @apply transition-colors duration-200 ease-in-out; }
.transition-transform { @apply transition-transform duration-200 ease-in-out; }

/* Animations */
.animate-fade-in { @apply animate-in fade-in duration-500; }
.animate-slide-up { @apply animate-in slide-in-from-bottom-4 duration-500; }
.animate-scale-in { @apply animate-in zoom-in-95 duration-300; }

/* Hover effects */
.hover-lift { @apply hover:translate-y-1 hover:shadow-lg; }
.hover-scale { @apply hover:scale-105; }
.hover-glow { @apply hover:shadow-2xl hover:shadow-primary/25; }
```

---

*Last Updated: $(date)*
*Version: 1.0.0*