"use client"

import * as React from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// TEMPORARY FALLBACK: Disabled animation to fix SSR window errors
// This component is simplified to avoid any window access during SSR

export interface AnimatedButtonProps extends ButtonProps {
  // Animation props kept for compatibility but ignored
  animationType?: 'hover' | 'press' | 'loading' | 'success' | 'error' | 'pulse' | 'scale' | 'simple' | 'none'
  loading?: boolean
  success?: boolean
  error?: boolean
  loadingText?: string
  successText?: string
  errorText?: string
  // motionProps removed to avoid framer-motion dependency
}

const getButtonContent = (
  children: React.ReactNode,
  loading?: boolean,
  success?: boolean,
  error?: boolean,
  loadingText?: string,
  successText?: string,
  errorText?: string
) => {
  if (loading && loadingText) return loadingText
  if (success && successText) return successText
  if (error && errorText) return errorText
  return children
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    success = false,
    error = false,
    loadingText,
    successText,
    errorText,
    disabled,
    children,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading

    // Determine current state for styling
    const getVariant = () => {
      if (error) return 'destructive'
      if (success) return 'default'
      return variant
    }

    if (asChild) {
      return (
        <Button
          className={className}
          variant={getVariant()}
          size={size}
          asChild
          disabled={isDisabled}
          ref={ref}
          {...props}
        >
          {children}
        </Button>
      )
    }

    return (
      <Button
        className={cn(
          // State-based styles
          loading && "cursor-wait",
          success && "text-green-600 border-green-600",
          error && "text-red-600 border-red-600",
          className
        )}
        variant={getVariant()}
        size={size}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {/* Simple loading spinner using CSS */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              style={{
                animation: 'spin 1s linear infinite'
              }}
            />
          </div>
        )}

        {/* Button content */}
        <span
          className={cn(
            "flex items-center justify-center gap-2",
            (loading || success || error) && (loadingText || successText || errorText) && "opacity-0"
          )}
        >
          {children}
        </span>

        {/* State text overlay */}
        {((loading && loadingText) || (success && successText) || (error && errorText)) && (
          <span className="absolute inset-0 flex items-center justify-center text-sm">
            {getButtonContent(children, loading, success, error, loadingText, successText, errorText)}
          </span>
        )}
      </Button>
    )
  }
)

AnimatedButton.displayName = "AnimatedButton"

// Hook for managing button states
export const useAnimatedButton = () => {
  const [loading, setLoading] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [error, setError] = React.useState(false)

  const reset = React.useCallback(() => {
    setLoading(false)
    setSuccess(false)
    setError(false)
  }, [])

  const showLoading = React.useCallback(() => {
    setLoading(true)
    setSuccess(false)
    setError(false)
  }, [])

  const showSuccess = React.useCallback((duration = 2000) => {
    setLoading(false)
    setSuccess(true)
    setError(false)

    if (duration > 0) {
      setTimeout(() => setSuccess(false), duration)
    }
  }, [])

  const showError = React.useCallback((duration = 2000) => {
    setLoading(false)
    setSuccess(false)
    setError(true)

    if (duration > 0) {
      setTimeout(() => setError(false), duration)
    }
  }, [])

  return {
    loading,
    success,
    error,
    reset,
    showLoading,
    showSuccess,
    showError
  }
}