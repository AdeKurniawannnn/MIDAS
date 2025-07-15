"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Tag,
  Plus,
  X,
  Edit,
  Trash2,
  Search,
  Filter,
  Hash,
  Palette,
  Settings,
  CheckCircle2,
  Circle,
  Star,
  Target,
  Zap,
  AlertCircle,
  Users,
  Calendar,
  MoreHorizontal
} from "lucide-react"

interface TagManagerProps {
  selectedItems: any[]
  onTagsChange: (itemId: string, tags: TagData[]) => void
  onBulkTagChange: (itemIds: string[], tags: TagData[]) => void
  existingTags?: TagData[]
  className?: string
}

interface TagData {
  id: string
  name: string
  color: TagColor
  description?: string
  category?: string
  createdAt: Date
  usageCount: number
  isSystem?: boolean
}

type TagColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink' | 'indigo' | 'gray'

interface TagCategory {
  id: string
  name: string
  color: TagColor
  description?: string
}

const TAG_COLORS: { value: TagColor; label: string; class: string }[] = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500 text-white' },
  { value: 'green', label: 'Green', class: 'bg-green-500 text-white' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500 text-white' },
  { value: 'red', label: 'Red', class: 'bg-red-500 text-white' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500 text-white' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500 text-white' },
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500 text-white' },
  { value: 'gray', label: 'Gray', class: 'bg-gray-500 text-white' }
]

const DEFAULT_CATEGORIES: TagCategory[] = [
  { id: 'priority', name: 'Priority', color: 'red', description: 'Priority levels' },
  { id: 'status', name: 'Status', color: 'blue', description: 'Processing status' },
  { id: 'quality', name: 'Quality', color: 'green', description: 'Data quality' },
  { id: 'source', name: 'Source', color: 'purple', description: 'Data source' },
  { id: 'custom', name: 'Custom', color: 'gray', description: 'Custom tags' }
]

const SYSTEM_TAGS: TagData[] = [
  { id: 'high-priority', name: 'High Priority', color: 'red', category: 'priority', createdAt: new Date(), usageCount: 0, isSystem: true },
  { id: 'medium-priority', name: 'Medium Priority', color: 'yellow', category: 'priority', createdAt: new Date(), usageCount: 0, isSystem: true },
  { id: 'low-priority', name: 'Low Priority', color: 'green', category: 'priority', createdAt: new Date(), usageCount: 0, isSystem: true },
  { id: 'verified', name: 'Verified', color: 'green', category: 'quality', createdAt: new Date(), usageCount: 0, isSystem: true },
  { id: 'needs-review', name: 'Needs Review', color: 'yellow', category: 'quality', createdAt: new Date(), usageCount: 0, isSystem: true },
  { id: 'flagged', name: 'Flagged', color: 'red', category: 'quality', createdAt: new Date(), usageCount: 0, isSystem: true }
]

export function TagManager({
  selectedItems,
  onTagsChange,
  onBulkTagChange,
  existingTags = [],
  className = ""
}: TagManagerProps) {
  const [tags, setTags] = useState<TagData[]>([...SYSTEM_TAGS, ...existingTags])
  const [categories, setCategories] = useState<TagCategory[]>(DEFAULT_CATEGORIES)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [editingTag, setEditingTag] = useState<TagData | null>(null)
  
  // New tag form state
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState<TagColor>('blue')
  const [newTagCategory, setNewTagCategory] = useState("")
  const [newTagDescription, setNewTagDescription] = useState("")

  // Bulk operations state
  const [bulkSelectedTags, setBulkSelectedTags] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<'add' | 'remove' | 'replace'>('add')

  useEffect(() => {
    // Load tags from localStorage
    const savedTags = localStorage.getItem('orion-tags')
    if (savedTags) {
      try {
        const parsedTags = JSON.parse(savedTags)
        setTags([...SYSTEM_TAGS, ...parsedTags])
      } catch (error) {
        console.error('Error loading tags:', error)
      }
    }
  }, [])

  useEffect(() => {
    // Save non-system tags to localStorage
    const customTags = tags.filter(tag => !tag.isSystem)
    localStorage.setItem('orion-tags', JSON.stringify(customTags))
  }, [tags])

  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || tag.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getTagColorClass = (color: TagColor) => {
    return TAG_COLORS.find(c => c.value === color)?.class || 'bg-gray-500 text-white'
  }

  const createTag = () => {
    if (!newTagName.trim()) return

    const newTag: TagData = {
      id: `tag-${Date.now()}`,
      name: newTagName.trim(),
      color: newTagColor,
      category: newTagCategory || 'custom',
      description: newTagDescription.trim() || undefined,
      createdAt: new Date(),
      usageCount: 0,
      isSystem: false
    }

    setTags([...tags, newTag])
    
    // Reset form
    setNewTagName("")
    setNewTagColor('blue')
    setNewTagCategory("")
    setNewTagDescription("")
    setShowCreateDialog(false)
  }

  const updateTag = (tagId: string, updates: Partial<TagData>) => {
    setTags(tags.map(tag => 
      tag.id === tagId ? { ...tag, ...updates } : tag
    ))
  }

  const deleteTag = (tagId: string) => {
    setTags(tags.filter(tag => tag.id !== tagId))
  }

  const applyBulkTags = () => {
    if (selectedItems.length === 0 || bulkSelectedTags.length === 0) return

    const selectedTagObjects = tags.filter(tag => bulkSelectedTags.includes(tag.id))
    const itemIds = selectedItems.map(item => item.id)

    onBulkTagChange(itemIds, selectedTagObjects)
    
    // Update usage count
    bulkSelectedTags.forEach(tagId => {
      updateTag(tagId, { usageCount: tags.find(t => t.id === tagId)?.usageCount || 0 + selectedItems.length })
    })

    setBulkSelectedTags([])
    setShowBulkDialog(false)
  }

  const getTagsByCategory = (categoryId: string) => {
    return tags.filter(tag => tag.category === categoryId)
  }

  const getMostUsedTags = () => {
    return [...tags].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Tag Manager</h3>
          <Badge variant="outline">
            {tags.length} tags
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedItems.length > 0 && (
            <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Bulk Tag ({selectedItems.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Tag Operations</DialogTitle>
                  <DialogDescription>
                    Apply tags to {selectedItems.length} selected items
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Action</Label>
                    <Select value={bulkAction} onValueChange={(value: 'add' | 'remove' | 'replace') => setBulkAction(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">Add tags</SelectItem>
                        <SelectItem value="remove">Remove tags</SelectItem>
                        <SelectItem value="replace">Replace tags</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Select Tags</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {tags.map(tag => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`bulk-${tag.id}`}
                            checked={bulkSelectedTags.includes(tag.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setBulkSelectedTags([...bulkSelectedTags, tag.id])
                              } else {
                                setBulkSelectedTags(bulkSelectedTags.filter(id => id !== tag.id))
                              }
                            }}
                          />
                          <Badge className={getTagColorClass(tag.color)}>
                            {tag.name}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={applyBulkTags} disabled={bulkSelectedTags.length === 0}>
                      Apply Tags
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Tag</DialogTitle>
                <DialogDescription>
                  Add a new tag to organize your data
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tag-name">Tag Name</Label>
                  <Input
                    id="tag-name"
                    placeholder="Enter tag name..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {TAG_COLORS.map(color => (
                      <Button
                        key={color.value}
                        variant="outline"
                        size="sm"
                        className={`w-8 h-8 p-0 ${color.class} ${
                          newTagColor === color.value ? 'ring-2 ring-ring' : ''
                        }`}
                        onClick={() => setNewTagColor(color.value)}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newTagCategory} onValueChange={setNewTagCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tag-description">Description (optional)</Label>
                  <Textarea
                    id="tag-description"
                    placeholder="Describe what this tag represents..."
                    value={newTagDescription}
                    onChange={(e) => setNewTagDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTag} disabled={!newTagName.trim()}>
                    Create Tag
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{tags.length}</div>
                <div className="text-xs text-muted-foreground">Total Tags</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{getMostUsedTags().length}</div>
                <div className="text-xs text-muted-foreground">Popular Tags</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{categories.length}</div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{selectedItems.length}</div>
                <div className="text-xs text-muted-foreground">Selected Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags by Category */}
      <div className="space-y-4">
        {categories.map(category => {
          const categoryTags = getTagsByCategory(category.id)
          if (categoryTags.length === 0 && selectedCategory !== 'all' && selectedCategory !== category.id) {
            return null
          }
          
          return (
            <Card key={category.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getTagColorClass(category.color)}>
                      {category.name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {categoryTags.length} tags
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {categoryTags.filter(tag => 
                    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(tag => (
                    <div key={tag.id} className="flex items-center gap-1 group">
                      <Badge 
                        className={`${getTagColorClass(tag.color)} cursor-pointer hover:opacity-80`}
                        onClick={() => {
                          // Quick apply tag to selected items
                          if (selectedItems.length > 0) {
                            const itemIds = selectedItems.map(item => item.id)
                            onBulkTagChange(itemIds, [tag])
                            updateTag(tag.id, { usageCount: tag.usageCount + selectedItems.length })
                          }
                        }}
                      >
                        {tag.name}
                        {tag.usageCount > 0 && (
                          <span className="ml-1 text-xs opacity-75">
                            {tag.usageCount}
                          </span>
                        )}
                      </Badge>
                      
                      {!tag.isSystem && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTag(tag)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTag(tag.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {categoryTags.filter(tag => 
                    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length === 0 && (
                    <div className="text-sm text-muted-foreground py-2">
                      No tags found in this category
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Most Used Tags */}
      {getMostUsedTags().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Most Used Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {getMostUsedTags().map(tag => (
                <Badge 
                  key={tag.id} 
                  className={`${getTagColorClass(tag.color)} cursor-pointer hover:opacity-80`}
                  onClick={() => {
                    if (selectedItems.length > 0) {
                      const itemIds = selectedItems.map(item => item.id)
                      onBulkTagChange(itemIds, [tag])
                      updateTag(tag.id, { usageCount: tag.usageCount + selectedItems.length })
                    }
                  }}
                >
                  {tag.name}
                  <span className="ml-1 text-xs opacity-75">
                    {tag.usageCount}
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}