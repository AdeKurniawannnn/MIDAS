"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface AnimatedButtonProps extends ButtonProps {
  animationType?: 'hover' | 'press' | 'loading' | 'success' | 'error' | 'pulse' | 'scale' | 'none'
  loading?: boolean
  success?: boolean
  error?: boolean
  loadingText?: string
  successText?: string
  errorText?: string
  motionProps?: Omit<HTMLMotionProps<"button">, keyof ButtonProps>
}

const animationVariants = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.2, ease: "easeInOut" }
  },
  press: {
    scale: 0.98,
    transition: { duration: 0.1, ease: "easeInOut" }
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
  },
  loading: {
    scale: [1, 1.02, 1],
    transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
  },
  success: {
    scale: [1, 1.1, 1],
    transition: { duration: 0.4, ease: "easeInOut" }
  },
  error: {
    scale: [1, 1.05, 1],
    x: [0, -2, 2, -2, 2, 0],
    transition: { duration: 0.4, ease: "easeInOut" }
  }
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
    animationType = 'hover',
    loading = false,
    success = false,
    error = false,
    loadingText,
    successText,
    errorText,
    motionProps,
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

    const getAnimationProps = () => {
      if (animationType === 'none') return {}
      
      const baseProps = {
        whileHover: !isDisabled ? animationVariants.hover : undefined,
        whileTap: !isDisabled ? animationVariants.press : undefined,
        // Respect user's preference for reduced motion
        transition: { 
          duration: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.2 
        },
        ...motionProps
      }

      // Add specific animations based on state
      if (loading) {
        return {
          ...baseProps,
          animate: animationVariants.loading
        }
      }
      
      if (success) {
        return {
          ...baseProps,
          animate: animationVariants.success
        }
      }
      
      if (error) {
        return {
          ...baseProps,
          animate: animationVariants.error
        }
      }

      if (animationType === 'pulse') {
        return {
          ...baseProps,
          animate: animationVariants.pulse
        }
      }

      return baseProps
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
          <motion.div {...getAnimationProps()}>
            {getButtonContent(children, loading, success, error, loadingText, successText, errorText)}
          </motion.div>
        </Button>
      )
    }

    return (
      <Button
        className={cn(
          // Base styles
          "relative overflow-hidden",
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
        asChild
      >
        <motion.button {...getAnimationProps()}>
          {/* Background animation for loading */}
          {loading && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          )}
          
          {/* Success checkmark animation */}
          {success && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <motion.svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <polyline points="20,6 9,17 4,12" />
              </motion.svg>
            </motion.div>
          )}
          
          {/* Error X animation */}
          {error && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <motion.svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </motion.svg>
            </motion.div>
          )}
          
          {/* Loading spinner */}
          {loading && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          )}
          
          {/* Button content */}
          <motion.span
            className={cn(
              "relative z-10 flex items-center justify-center gap-2",
              (loading || success || error) && (loadingText || successText || errorText) && "opacity-0"
            )}
            initial={{ opacity: 1 }}
            animate={{ 
              opacity: (loading || success || error) && (loadingText || successText || errorText) ? 0 : 1 
            }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>
          
          {/* State text overlay */}
          {((loading && loadingText) || (success && successText) || (error && errorText)) && (
            <motion.span
              className="absolute inset-0 flex items-center justify-center text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              {getButtonContent(children, loading, success, error, loadingText, successText, errorText)}
            </motion.span>
          )}
        </motion.button>
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