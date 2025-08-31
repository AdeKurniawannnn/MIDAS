"use client"

import React, { useState, useRef } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RippleButtonProps extends ButtonProps {
  rippleColor?: string
  rippleDuration?: number
}

export const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ className, children, rippleColor = 'rgba(255, 255, 255, 0.6)', rippleDuration = 600, onClick, ...props }, ref) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
    const buttonRef = useRef<HTMLButtonElement>(null)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = buttonRef.current
      if (button) {
        const rect = button.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        
        const newRipple = {
          x,
          y,
          id: Date.now()
        }
        
        setRipples(prev => [...prev, newRipple])
        
        // Remove ripple after animation
        setTimeout(() => {
          setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
        }, rippleDuration)
      }
      
      onClick?.(e)
    }

    return (
      <Button
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <span 
          ref={buttonRef}
          className="relative z-10 flex items-center justify-center w-full h-full"
        >
          {children}
        </span>
        
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute z-0 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)',
              backgroundColor: rippleColor,
              borderRadius: '50%',
              animation: `ripple ${rippleDuration}ms ease-out`,
              animationFillMode: 'forwards'
            }}
          />
        ))}
        
        <style jsx>{`
          @keyframes ripple {
            0% {
              width: 0;
              height: 0;
              opacity: 1;
            }
            100% {
              width: 200px;
              height: 200px;
              opacity: 0;
            }
          }
        `}</style>
      </Button>
    )
  }
)

RippleButton.displayName = "RippleButton"