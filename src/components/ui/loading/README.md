# Loading States Implementation

This directory contains a comprehensive set of loading state components for the Orion application.

## Components

### Core Loading Components

#### `Spinner` - Animated Loading Spinner
- **Variants**: `sm`, `default`, `lg`, `xl`
- **Colors**: `default`, `secondary`, `muted`, `white`
- **Accessibility**: Screen reader support with ARIA labels
- **Usage**: Import from `@/components/ui/spinner`

```tsx
import { Spinner } from '@/components/ui/spinner'

<Spinner size="lg" variant="default" label="Processing..." />
```

#### `ProgressBar` - Animated Progress Bar
- **Features**: Percentage display, shimmer animation, color variants
- **Variants**: `default`, `success`, `warning`, `error`
- **Sizes**: `sm`, `default`, `lg`, `xl`
- **Usage**: Import from `@/components/ui/progress-bar`

```tsx
import { ProgressBar } from '@/components/ui/progress-bar'

<ProgressBar 
  value={progress} 
  showLabel={true} 
  label="Scraping Progress" 
  variant="default" 
  animated={true} 
/>
```

#### `LoadingOverlay` - Full-Screen Loading Overlay
- **Features**: Backdrop blur, progress display, cancellation
- **Variants**: `default`, `dark`, `light`, `transparent`
- **Usage**: Import from `@/components/ui/loading-overlay`

```tsx
import { LoadingOverlay } from '@/components/ui/loading-overlay'

<LoadingOverlay 
  show={isLoading} 
  title="Processing Data" 
  description="Please wait while we scrape the data..." 
  progress={progress} 
  showProgress={true}
  onCancel={handleCancel}
/>
```

#### `SkeletonLoader` - Content Placeholder Components
- **Components**: `TableSkeleton`, `FormSkeleton`, `CardSkeleton`, `ListSkeleton`, `SearchSkeleton`, `DashboardSkeleton`
- **Usage**: Import from `@/components/ui/skeleton-loader`

```tsx
import { TableSkeleton, FormSkeleton } from '@/components/ui/skeleton-loader'

<TableSkeleton rows={5} columns={4} showHeader={true} />
<FormSkeleton fields={3} showTitle={true} showButtons={true} />
```

### Progress Management System

#### `ProgressContext` - Global State Management
- **Location**: `@/lib/progress/progress-context`
- **Features**: Job management, progress tracking, background processing
- **Usage**: Wrap your app with `ProgressProvider`

```tsx
import { ProgressProvider } from '@/lib/progress/progress-context'

<ProgressProvider>
  <YourApp />
</ProgressProvider>
```

#### `useProgressManager` - Progress Management Hook
- **Location**: `@/hooks/useProgressManager`
- **Features**: Auto-retry, persistence, progress tracking
- **Usage**: Manage scraping jobs with built-in retry logic

```tsx
import { useProgressManager } from '@/hooks/useProgressManager'

const {
  progress,
  isLoading,
  start,
  pause,
  resume,
  stop,
  retry
} = useProgressManager(url, maxResults, {
  autoStart: false,
  enableRetry: true,
  maxRetries: 3
})
```

#### `useRealTimeProgress` - Real-Time Updates
- **Location**: `@/hooks/useRealTimeProgress`
- **Features**: Polling, WebSocket support, network monitoring
- **Usage**: Get real-time progress updates

```tsx
import { useRealTimeProgress } from '@/hooks/useRealTimeProgress'

const { isConnected, lastUpdate, refresh } = useRealTimeProgress({
  enablePolling: true,
  pollingInterval: 2000,
  onUpdate: (jobId, progress, step) => {
    console.log(`Job ${jobId}: ${progress}% - ${step}`)
  }
})
```

### Orion-Specific Components

#### `BackgroundProgress` - Minimizable Progress Display
- **Location**: `@/components/features/orion/background-progress`
- **Features**: Minimizable, real-time updates, multiple job support
- **Usage**: Floating progress indicator

```tsx
import { BackgroundProgress } from '@/components/features/orion/background-progress'

<BackgroundProgress position="bottom-right" showWhenMinimized={true} />
```

#### `ErrorRecovery` - Error Handling and Retry
- **Location**: `@/components/features/orion/error-recovery`
- **Features**: Smart retry strategies, error categorization, network monitoring
- **Usage**: Comprehensive error handling

```tsx
import { ErrorRecovery } from '@/components/features/orion/error-recovery'

<ErrorRecovery
  jobId={jobId}
  maxRetries={3}
  autoRetry={true}
  onRetry={handleRetry}
/>
```

## Enhanced Components

### `ScrapingForm` - Enhanced with Loading States
- **Features**: Real-time progress, pause/resume, error handling
- **Visual Feedback**: Status icons, progress bars, estimated time
- **Error Handling**: Retry mechanisms, clear error messages

### `InstagramTable` - Enhanced with Skeleton Loading
- **Features**: Bulk operations, selection, skeleton loading
- **Loading States**: Table skeleton, bulk operation progress
- **Performance**: Virtual scrolling support

## Usage Patterns

### Basic Loading State
```tsx
import { Spinner } from '@/components/ui/spinner'

function MyComponent() {
  const [isLoading, setIsLoading] = useState(false)
  
  return (
    <div>
      {isLoading ? (
        <Spinner size="lg" label="Loading..." />
      ) : (
        <div>Content here</div>
      )}
    </div>
  )
}
```

### Progress Tracking
```tsx
import { ProgressBar } from '@/components/ui/progress-bar'
import { useProgressManager } from '@/hooks/useProgressManager'

function ScrapingComponent() {
  const { progress, isLoading, start, pause, resume } = useProgressManager(
    url, 
    maxResults, 
    {
      onComplete: (results) => console.log('Done!', results),
      onError: (error) => console.error('Error:', error)
    }
  )
  
  return (
    <div>
      <ProgressBar value={progress} showLabel={true} animated={isLoading} />
      <button onClick={start}>Start</button>
      <button onClick={pause}>Pause</button>
      <button onClick={resume}>Resume</button>
    </div>
  )
}
```

### Error Recovery
```tsx
import { ErrorRecovery } from '@/components/features/orion/error-recovery'
import { useProgress } from '@/lib/progress/progress-context'

function MyComponent() {
  const progress = useProgress()
  const errorJobs = progress.getJobsByStatus('error')
  
  return (
    <div>
      {errorJobs.map(job => (
        <ErrorRecovery
          key={job.id}
          jobId={job.id}
          maxRetries={3}
          autoRetry={true}
        />
      ))}
    </div>
  )
}
```

## Best Practices

1. **Always provide loading states** - Never leave users wondering what's happening
2. **Use skeleton loaders** for content that takes time to load
3. **Provide progress feedback** for long-running operations
4. **Handle errors gracefully** with clear messages and retry options
5. **Make loading states accessible** with proper ARIA labels
6. **Test loading states** with slow network conditions
7. **Use consistent loading patterns** across your application

## Performance Considerations

- **Skeleton loaders** prevent layout shifts
- **Progress bars** provide visual feedback without blocking UI
- **Background processing** allows users to continue working
- **Efficient polling** with exponential backoff for errors
- **Memory cleanup** with proper useEffect cleanup functions

## Accessibility Features

- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **High contrast** mode compatibility
- **Screen reader announcements** for progress updates
- **Focus management** during loading states