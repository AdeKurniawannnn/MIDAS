"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/providers/AuthProvider"
import { Keyword } from "@/lib/types/keywords"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Hash, Search, Plus, X } from "lucide-react"

interface KeywordAssignmentModalProps {
  trigger: React.ReactNode
  instagramId?: number
  googleMapsId?: number
  assignedKeywords?: number[]
  onAssignmentChange?: (keywordIds: number[]) => void
}

export function KeywordAssignmentModal({ 
  trigger, 
  instagramId, 
  googleMapsId, 
  assignedKeywords = [],
  onAssignmentChange 
}: KeywordAssignmentModalProps) {
  const [open, setOpen] = useState(false)
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>(assignedKeywords)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // Fetch keywords when modal opens
  useEffect(() => {
    if (open) {
      fetchKeywords()
    }
  }, [open])

  const fetchKeywords = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/keywords')
      if (response.ok) {
        const data = await response.json()
        setKeywords(data.keywords.filter((k: Keyword) => k.status === 'active'))
      }
    } catch (error) {
      console.error('Error fetching keywords:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter keywords based on search
  const filteredKeywords = keywords.filter(keyword =>
    keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
    keyword.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleKeywordToggle = (keywordId: number, checked: boolean) => {
    setSelectedKeywords(prev => {
      if (checked) {
        return [...prev, keywordId]
      } else {
        return prev.filter(id => id !== keywordId)
      }
    })
  }

  const handleSave = async () => {
    try {
      // Determine the assignment type and target ID
      const assignmentType = instagramId ? 'instagram' : 'google_maps'
      const targetId = instagramId || googleMapsId

      if (!targetId) {
        toast({
          title: "Error",
          description: "No target ID provided",
          variant: "destructive"
        })
        return
      }

      // Create assignments for selected keywords
      const assignments = selectedKeywords.map(keywordId => ({
        keyword_id: keywordId,
        [assignmentType === 'instagram' ? 'instagram_id' : 'google_maps_id']: targetId,
        user_id: user?.id,
        gmail: user?.email
      }))

      // API call to save assignments
      const response = await fetch('/api/keywords/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignments,
          assignmentType,
          targetId
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Keywords assigned successfully"
        })
        setOpen(false)
        onAssignmentChange?.(selectedKeywords)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign keywords')
      }
    } catch (error) {
      console.error('Error saving assignments:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign keywords",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Assign Keywords
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Keywords Summary */}
          {selectedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
              {selectedKeywords.map(keywordId => {
                const keyword = keywords.find(k => k.id === keywordId)
                return keyword ? (
                  <Badge key={keywordId} variant="secondary" className="text-xs">
                    {keyword.keyword}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => handleKeywordToggle(keywordId, false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ) : null
              })}
            </div>
          )}

          {/* Keywords List */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : filteredKeywords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No keywords found' : 'No active keywords available'}
              </div>
            ) : (
              filteredKeywords.map(keyword => (
                <div key={keyword.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-lg">
                  <Checkbox
                    checked={selectedKeywords.includes(keyword.id)}
                    onCheckedChange={(checked) => handleKeywordToggle(keyword.id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{keyword.keyword}</div>
                    {keyword.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {keyword.description}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {keyword.category}
                  </Badge>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedKeywords.length} keyword{selectedKeywords.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={selectedKeywords.length === 0}>
                Assign Keywords
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}