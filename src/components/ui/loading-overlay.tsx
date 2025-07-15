import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"

const loadingOverlayVariants = cva(
  "fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50",
  {
    variants: {
      variant: {
        default: "bg-background/80",
        dark: "bg-black/80",
        light: "bg-white/80",
        transparent: "bg-transparent"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

const contentVariants = cva(
  "flex flex-col items-center justify-center space-y-4 p-6 rounded-lg border shadow-lg backdrop-blur-sm",
  {
    variants: {
      size: {
        sm: "p-4 space-y-2",
        default: "p-6 space-y-4",
        lg: "p-8 space-y-6"
      }
    },
    defaultVariants: {
      size: "default"
    }
  }
)

export interface LoadingOverlayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingOverlayVariants>,
    VariantProps<typeof contentVariants> {
  show: boolean
  title?: string
  description?: string
  progress?: number
  showProgress?: boolean
  spinnerSize?: "sm" | "default" | "lg" | "xl"
  onCancel?: () => void
  cancelText?: string
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ 
    className, 
    variant, 
    size,
    show,
    title,
    description,
    progress,
    showProgress = false,
    spinnerSize = "lg",
    onCancel,
    cancelText = "Cancel",
    ...props 
  }, ref) => {
    if (!show) return null

    return (
      <div
        ref={ref}
        className={cn(loadingOverlayVariants({ variant, className }))}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "loading-title" : undefined}
        aria-describedby={description ? "loading-description" : undefined}
        {...props}
      >
        <div className={cn(contentVariants({ size }), "bg-card text-card-foreground")}>
          <Spinner size={spinnerSize} />
          
          {title && (
            <h3 
              id="loading-title"
              className="text-lg font-semibold text-center"
            >
              {title}
            </h3>
          )}
          
          {description && (
            <p 
              id="loading-description"
              className="text-sm text-muted-foreground text-center max-w-sm"
            >
              {description}
            </p>
          )}
          
          {showProgress && typeof progress === 'number' && (
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                />
              </div>
            </div>
          )}
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="mt-4 px-4 py-2 text-sm border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {cancelText}
            </button>
          )}
        </div>
      </div>
    )
  }
)
LoadingOverlay.displayName = "LoadingOverlay"

export { LoadingOverlay, loadingOverlayVariants, contentVariants }