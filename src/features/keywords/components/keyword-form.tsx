"use client"

import { useState } from "react"
import { useAuth } from "@/features/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Keyword, KeywordFormData } from "../types"

interface KeywordFormProps {
  initialData?: Keyword
  onSubmit: (data: KeywordFormData) => Promise<void>
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

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' }
]

const priorityOptions = [
  { value: '1', label: '1 - Low' },
  { value: '2', label: '2 - Medium' },
  { value: '3', label: '3 - High' },
  { value: '4', label: '4 - Very High' },
  { value: '5', label: '5 - Critical' }
]

export function KeywordForm({ initialData, onSubmit }: KeywordFormProps) {
  const [formData, setFormData] = useState<KeywordFormData>({
    keyword: initialData?.keyword || '',
    description: initialData?.description || '',
    category: initialData?.category || 'general',
    priority: initialData?.priority || '1',
    status: initialData?.status || 'active'
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.keyword.trim()) {
      return
    }

    // Check if user is authenticated
    if (!user || !user.email) {
      toast({
        title: "Error",
        description: "Please login to add keywords",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Include current user data in the form submission
      const formDataWithUser = {
        ...formData,
        currentUser: {
          id: user.id || '',
          email: user.email
        }
      }
      
      await onSubmit(formDataWithUser)
      
      // Only show success and reset if we reach this point (no error thrown)
      toast({
        title: "Success",
        description: initialData ? "Keyword updated successfully" : "Keyword added successfully",
      })
      
      // Reset form only for add mode (not update mode)
      if (!initialData) {
        setFormData({
          keyword: '',
          description: '',
          category: 'general',
          priority: '1',
          status: 'active'
        })
      }
      
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save keyword",
        variant: "destructive"
      })
      throw error // Re-throw to let parent component handle it
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof KeywordFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
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
          placeholder="Optional description for this keyword"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
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

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => handleChange('priority', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => handleChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isSubmitting || !formData.keyword.trim()}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update Keyword' : 'Add Keyword'}
        </Button>
      </div>
    </form>
  )
}