"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/features/auth"
import { Keyword, KeywordStats } from "@/lib/types/keywords"
import { KeywordsTable } from "@/components/features/keywords/keywords-table"
import { KeywordForm } from "@/components/features/keywords/keyword-form"
import { KeywordStats as KeywordStatsComponent } from "@/components/features/keywords/keyword-stats"
import { BulkActionsBar } from "@/components/features/keywords/bulk-actions-bar"
import { KeywordSearchFilter } from "@/components/features/keywords/keyword-search-filter"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Search, Filter, BarChart3 } from "lucide-react"

interface KeywordsClientProps {
  initialKeywords: Keyword[]
  initialStats: KeywordStats
}

export function KeywordsClient({ initialKeywords, initialStats }: KeywordsClientProps) {
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords)
  const [stats, setStats] = useState<KeywordStats>(initialStats)
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const handleCloseAddDialog = (open: boolean) => {
    setShowAddForm(open)
    // Auto-refresh when dialog is closed to ensure fresh data
    if (!open) {
      setTimeout(() => {
        window.location.reload()
      }, 500) // Short delay to allow dialog close animation
    }
  }
  const [showStatsDialog, setShowStatsDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { user } = useAuth()
  const { toast } = useToast()

  // Filter keywords based on user email
  const userKeywords = keywords.filter(keyword => keyword.email_user === user?.email)

  // Apply search and filters
  const filteredKeywords = userKeywords.filter(keyword => {
    const matchesSearch = !searchTerm || 
      keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
      keyword.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !categoryFilter || categoryFilter === "all" || keyword.category === categoryFilter
    const matchesStatus = !statusFilter || statusFilter === "all" || keyword.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(userKeywords.map(k => k.category)))

  // Refresh keywords from API
  const refreshKeywords = async () => {
    setIsLoading(true)
    try {
      // Prepare headers with user information
      const headers: HeadersInit = {}
      if (user?.email && user?.id) {
        headers['x-user-email'] = user.email
        headers['x-user-id'] = user.id
      }
      
      const response = await fetch('/api/keywords', { headers })
      if (response.ok) {
        const data = await response.json()
        setKeywords(data.keywords)
        await refreshStats()
      }
    } catch (error) {
      console.error('Error refreshing keywords:', error)
      toast({
        title: "Error",
        description: "Failed to refresh keywords",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh stats
  const refreshStats = async () => {
    try {
      // Prepare headers with user information
      const headers: HeadersInit = {}
      if (user?.email && user?.id) {
        headers['x-user-email'] = user.email
        headers['x-user-id'] = user.id
      }
      
      const response = await fetch('/api/keywords/stats', { headers })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error refreshing stats:', error)
    }
  }

  // Handle keyword creation
  const handleCreateKeyword = async (keywordData: any) => {
    try {
      // Prepare headers with user information
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (user?.email && user?.id) {
        headers['x-user-email'] = user.email
        headers['x-user-id'] = user.id
      }
      
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers,
        body: JSON.stringify(keywordData),
      })

      if (response.ok) {
        // Auto-refresh page after successful creation to avoid UI freeze (client-side only)
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload()
          }
        }, 1000) // Give time for success toast to show
        
        // Update local state immediately for smoother UX
        const result = await response.json()
        setKeywords(prev => [result, ...prev])
        setShowAddForm(false)
        
        // Show appropriate message for mock vs real create
        if (result.warning) {
          console.warn('Warning:', result.warning)
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create keyword')
      }
    } catch (error) {
      console.error('Error creating keyword:', error)
      // Re-throw error to let form component handle toast notification
      throw error
    }
  }

  // Handle keyword update
  const handleUpdateKeyword = async (id: number, keywordData: any) => {
    try {
      // Prepare headers with user information
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (user?.email && user?.id) {
        headers['x-user-email'] = user.email
        headers['x-user-id'] = user.id
      }
      
      const response = await fetch('/api/keywords', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, ...keywordData }),
      })

      if (response.ok) {
        // Auto-refresh page after successful update to avoid UI freeze
        setTimeout(() => {
          window.location.reload()
        }, 1000) // Give time for success toast to show
        
        // Update local state immediately for smoother UX
        const result = await response.json()
        setKeywords(prev => prev.map(k => k.id === id ? result : k))
        
        // Show appropriate message for mock vs real update
        if (result.warning) {
          console.warn('Warning:', result.warning)
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update keyword')
      }
    } catch (error) {
      console.error('Error updating keyword:', error)
      // Re-throw error to let form component handle toast notification
      throw error
    }
  }

  // Handle keyword deletion
  const handleDeleteKeyword = async (id: number) => {
    try {
      
      // Prepare headers with user information
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Add user information to headers if available
      if (user?.email && user?.id) {
        headers['x-user-email'] = user.email
        headers['x-user-id'] = user.id
      }
      
      const response = await fetch(`/api/keywords?id=${id}`, {
        method: 'DELETE',
        headers,
      })


      const result = await response.json()

      if (response.ok && result.success) {
        // Auto-refresh page after successful deletion to avoid UI freeze
        setTimeout(() => {
          window.location.reload()
        }, 1000) // Give time for success toast to show
        
        // Update local state immediately for smoother UX
        setKeywords(prev => prev.filter(k => k.id !== id))
        setSelectedKeywords(prev => prev.filter(selectedId => selectedId !== id))
        
        // Show appropriate message based on whether it's mock or real delete
        if (result.warning) {
          toast({
            title: "Mock Success",
            description: result.message + " (Configure Supabase for real database operations)",
            variant: "default",
          })
          console.warn('Warning:', result.warning)
        } else {
          toast({
            title: "Success",
            description: result.message || "Keyword deleted successfully",
          })
        }
      } else {
        throw new Error(result.error || 'Failed to delete keyword')
      }
    } catch (error) {
      console.error('Error deleting keyword:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete keyword",
        variant: "destructive",
      })
    }
  }

  // Handle bulk operations
  const handleBulkOperation = async (operation: string, scrapingType?: string) => {
    if (selectedKeywords.length === 0) {
      toast({
        title: "Warning",
        description: "Please select keywords first",
        variant: "destructive",
      })
      return
    }

    try {
      // Prepare headers with user information
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (user?.email && user?.id) {
        headers['x-user-email'] = user.email
        headers['x-user-id'] = user.id
      }
      
      const response = await fetch('/api/keywords/bulk', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          keywordIds: selectedKeywords,
          operation,
          scrapingType,
        }),
      })

      if (response.ok) {
        // Auto-refresh page after successful bulk operation to avoid UI freeze
        setTimeout(() => {
          window.location.reload()
        }, 1000) // Give time for success toast to show
        
        // Update local state immediately for smoother UX
        setSelectedKeywords([])
        
        const actionText = operation === 'scrape' ? 'Scraping started' : `Keywords ${operation}d`
        toast({
          title: "Success",
          description: `${actionText} successfully`,
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${operation} keywords`)
      }
    } catch (error) {
      console.error(`Error in bulk ${operation}:`, error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${operation} keywords`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Keywords Management</h1>
          <p className="text-muted-foreground">
            Manage your keywords for automated scraping
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatsDialog(true)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Stats
          </Button>
          
          <Dialog open={showAddForm} onOpenChange={handleCloseAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Keyword
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Keyword</DialogTitle>
                <DialogDescription>
                  Create a new keyword for automated scraping and monitoring. Fill in the required information below.
                </DialogDescription>
              </DialogHeader>
              <KeywordForm onSubmit={handleCreateKeyword} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <KeywordSearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categories={categories}
      />

      {/* Bulk Actions */}
      {selectedKeywords.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedKeywords.length}
          selectedKeywords={filteredKeywords.filter(k => selectedKeywords.includes(k.id)).map(k => k.keyword)}
          onBulkAction={handleBulkOperation}
        />
      )}

      {/* Keywords Table */}
      <KeywordsTable
        keywords={filteredKeywords}
        selectedKeywords={selectedKeywords}
        onSelectionChange={setSelectedKeywords}
        onUpdate={handleUpdateKeyword}
        onDelete={handleDeleteKeyword}
        isLoading={isLoading}
      />

      {/* Stats Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keywords Statistics</DialogTitle>
            <DialogDescription>
              View comprehensive statistics and analytics for your keywords including performance metrics and trends.
            </DialogDescription>
          </DialogHeader>
          <KeywordStatsComponent stats={stats} />
        </DialogContent>
      </Dialog>
    </div>
  )
}