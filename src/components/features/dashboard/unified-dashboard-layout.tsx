"use client"

import { ReactNode, useEffect } from "react"
import { DashboardNavbar } from "@/components/features/dashboard/dashboard-navbar"
import { AppSidebar } from "@/components/features/dashboard/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

interface DashboardPageProps {
  children: ReactNode
  currentPage: string
  showSidebar?: boolean
  showBreadcrumbs?: boolean
}

export default function UnifiedDashboardLayout({ 
  children, 
  currentPage, 
  showSidebar = false, 
  showBreadcrumbs = false 
}: DashboardPageProps) {
  useEffect(() => {
    // Hide footer for dashboard pages
    const footer = document.querySelector('footer')
    if (footer) footer.style.display = 'none'
    
    // Cleanup on unmount
    return () => {
      if (footer) footer.style.display = ''
    }
  }, [])

  // Simple layout (Dashboard style) - no sidebar
  if (!showSidebar) {
    return (
      <div className="flex-1 bg-background">
        <DashboardNavbar currentPage={currentPage} />
        <div className="h-full flex flex-col pt-16">
          <main className="flex-1">
            <div className="px-4 lg:px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Complex layout (Orion/KOL style) - with sidebar
  return (
    <div className="flex-1 bg-background">
      <DashboardNavbar currentPage={currentPage} />
      <div className="flex h-full w-full">
        <SidebarProvider>
          <AppSidebar variant="inset" className="pt-16" />
          <SidebarInset className="flex-1">
            <div className="flex flex-col h-full pt-16">
              {/* Header with breadcrumbs */}
              {showBreadcrumbs && (
                <header className="flex-shrink-0 flex h-16 items-center gap-2 border-b bg-background px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href="/">
                          MIDAS
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{currentPage}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </header>
              )}
              
              {/* Content Area */}
              <main className="flex-1">
                <div className="px-4 lg:px-6 py-6">
                  {children}
                </div>
              </main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  )
}