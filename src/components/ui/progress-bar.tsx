import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressBarVariants = cva(
  "relative overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      size: {
        sm: "h-2",
        default: "h-3",
        lg: "h-4",
        xl: "h-6"
      }
    },
    defaultVariants: {
      size: "default"
    }
  }
)

const progressFillVariants = cva(
  "h-full bg-primary transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        error: "bg-red-500"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressBarVariants>,
    VariantProps<typeof progressFillVariants> {
  value: number
  max?: number
  showLabel?: boolean
  label?: string
  animated?: boolean
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ 
    className, 
    size, 
    variant, 
    value, 
    max = 100, 
    showLabel = false, 
    label,
    animated = true,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    return (
      <div className="w-full space-y-2">
        {(showLabel || label) && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {label || "Progress"}
            </span>
            <span className="text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          ref={ref}
          className={cn(progressBarVariants({ size, className }))}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || "Progress"}
          {...props}
        >
          <div
            className={cn(
              progressFillVariants({ variant }),
              animated && "transition-all duration-300 ease-out"
            )}
            style={{ width: `${percentage}%` }}
          />
          {animated && (
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse"
              style={{
                animation: percentage > 0 && percentage < 100 
                  ? "progress-shimmer 2s infinite" 
                  : "none"
              }}
            />
          )}
        </div>
      </div>
    )
  }
)
ProgressBar.displayName = "ProgressBar"

export { ProgressBar, progressBarVariants, progressFillVariants }