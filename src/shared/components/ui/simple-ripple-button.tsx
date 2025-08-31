"use client"

import React from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SimpleRippleButtonProps extends ButtonProps {
  rippleColor?: 'blue' | 'white' | 'gray' | 'green' | 'red'
}

export const SimpleRippleButton = React.forwardRef<HTMLButtonElement, SimpleRippleButtonProps>(
  ({ className, children, rippleColor = 'white', ...props }, ref) => {
    const getRippleClasses = () => {
      const baseClasses = "relative overflow-hidden before:absolute before:inset-0 before:rounded-[inherit] before:bg-current before:opacity-0 before:scale-0 before:transition-all before:duration-300 active:before:opacity-20 active:before:scale-100 motion-reduce:before:transition-none motion-reduce:before:duration-0"
      
      switch (rippleColor) {
        case 'blue':
          return cn(baseClasses, "before:bg-blue-400")
        case 'white':
          return cn(baseClasses, "before:bg-white")
        case 'gray':
          return cn(baseClasses, "before:bg-gray-400")
        case 'green':
          return cn(baseClasses, "before:bg-green-400")
        case 'red':
          return cn(baseClasses, "before:bg-red-400")
        default:
          return cn(baseClasses, "before:bg-white")
      }
    }

    return (
      <Button
        ref={ref}
        className={cn(
          getRippleClasses(),
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center w-full h-full">
          {children}
        </span>
      </Button>
    )
  }
)

SimpleRippleButton.displayName = "SimpleRippleButton"