"use client"

import { useState, useEffect, useCallback, ReactNode } from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { GripVertical, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ResizableSidebarProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  storageKey?: string
}

export function ResizableSidebar({
  isOpen,
  onClose,
  children,
  defaultWidth = 35,
  minWidth = 20,
  maxWidth = 60,
  storageKey = "orion-sidebar-width"
}: ResizableSidebarProps) {
  const [sidebarWidth, setSidebarWidth] = useState<number>(defaultWidth)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Adjust width constraints for mobile
      if (mobile && sidebarWidth < 80) {
        setSidebarWidth(90)
      } else if (!mobile && sidebarWidth > 70) {
        setSidebarWidth(defaultWidth)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [defaultWidth, sidebarWidth])

  // Load saved width from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWidth = localStorage.getItem(storageKey)
      if (savedWidth) {
        const width = parseFloat(savedWidth)
        if (width >= minWidth && width <= maxWidth) {
          setSidebarWidth(width)
        }
      }
    }
  }, [storageKey, minWidth, maxWidth])

  // Save width to localStorage when it changes
  const handleResize = useCallback((sizes: number[]) => {
    if (sizes.length >= 2) {
      const newWidth = sizes[1]
      setSidebarWidth(newWidth)
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, newWidth.toString())
      }
    }
  }, [storageKey])

  // Handle double-click to reset to default width
  const handleDoubleClick = useCallback(() => {
    setSidebarWidth(defaultWidth)
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, defaultWidth.toString())
    }
    // Force panel to resize to default width
    const event = new CustomEvent('panel-resize-reset', { detail: { width: defaultWidth } })
    window.dispatchEvent(event)
  }, [defaultWidth, storageKey])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full">
        <PanelGroup
          direction="horizontal"
          onLayout={handleResize}
          className="h-full"
        >
          {/* Spacer panel */}
          <Panel defaultSize={100 - sidebarWidth} />
          
          {/* Resize handle */}
          <PanelResizeHandle 
            className="relative w-2 bg-transparent hover:bg-blue-500/20 transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500"
            tabIndex={0}
            role="separator"
            aria-label="Resize sidebar"
            aria-orientation="vertical"
          >
            <div className="absolute inset-y-0 left-0 w-1 bg-border" />
            <div 
              className="absolute inset-y-0 left-1 w-3 flex items-center justify-center cursor-col-resize"
              onDoubleClick={handleDoubleClick}
              title="Double-click to reset width"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
            </div>
          </PanelResizeHandle>
          
          {/* Sidebar panel */}
          <Panel
            defaultSize={sidebarWidth}
            minSize={isMobile ? 80 : minWidth}
            maxSize={isMobile ? 95 : maxWidth}
            className="bg-background border-l shadow-2xl"
          >
            <div className="relative h-full flex flex-col">
              {/* Header with close button */}
              <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <h2 className="text-lg font-semibold">Data Scraping Tool</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Content area */}
              <div className="flex-1 overflow-y-auto p-6">
                {children}
              </div>
              
              {/* Footer with resize indicator */}
              <div className="p-4 border-t bg-muted/30 text-xs text-muted-foreground text-center">
                <div className="flex items-center justify-center gap-2">
                  <GripVertical className="h-3 w-3" />
                  <span>Drag to resize • Double-click to reset</span>
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}

// Custom resize handle component with enhanced styling
export function CustomResizeHandle({ 
  className, 
  onDoubleClick,
  ...props 
}: React.ComponentProps<typeof PanelResizeHandle> & { onDoubleClick?: () => void }) {
  return (
    <PanelResizeHandle
      className={cn(
        "relative w-2 bg-transparent hover:bg-blue-500/20 transition-all duration-200 group",
        "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-border",
        "after:absolute after:inset-y-0 after:left-1 after:w-3 after:cursor-col-resize",
        "hover:before:bg-blue-500/50",
        className
      )}
      onDoubleClick={onDoubleClick}
      {...props}
    >
      <div className="absolute inset-y-0 left-1 w-3 flex items-center justify-center pointer-events-none">
        <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
      </div>
    </PanelResizeHandle>
  )
}