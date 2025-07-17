"use client"

import { useState } from "react"
import { useAuth } from "@/lib/providers/AuthProvider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Plus } from "lucide-react"

interface QuickAddKeywordModalProps {
  trigger?: React.ReactNode
  onKeywordAdded?: (keyword: any) => void
}

const categories = [
  'general',
  'fitness',
  'food',
  'travel',
  'tech',
  'fashion',
  'lifestyle',
  'business',
  'health',
  'entertainment',
  'education',
  'sports',
  'other'
]

export function QuickAddKeywordModal({ trigger, onKeywordAdded }: QuickAddKeywordModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    keyword: '',
    description: '',
    category: 'general'
  })
  const { user } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.keyword.trim()) {
      toast({
        title: "Error",
        description: "Keyword is required",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: formData.keyword.trim(),
          description: formData.description.trim(),
          category: formData.category,
          priority: 1,
          status: 'active'
        })
      })

      if (response.ok) {
        const newKeyword = await response.json()
        toast({
          title: "Success",
          description: "Keyword added successfully"
        })
        setOpen(false)
        setFormData({ keyword: '', description: '', category: 'general' })
        onKeywordAdded?.(newKeyword)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add keyword')
      }
    } catch (error) {
      console.error('Error adding keyword:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add keyword",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Keyword
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Keyword</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keyword">Keyword *</Label>
            <Input
              id="keyword"
              value={formData.keyword}
              onChange={(e) => handleChange('keyword', e.target.value)}
              placeholder="Enter keyword (e.g., fitness influencer)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.keyword.trim()}
            >
              {isSubmitting ? 'Adding...' : 'Add Keyword'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}