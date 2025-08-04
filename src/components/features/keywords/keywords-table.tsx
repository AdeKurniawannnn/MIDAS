"use client"

import { useState } from "react"
import { Keyword } from "@/lib/types/keywords"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { KeywordForm } from "@/components/features/keywords/keyword-form"
import { InstagramScraperButton } from "@/components/features/keywords/instagram-scraper-button"
import { Edit, Trash2, MoreVertical, Play } from "lucide-react"
import { format } from "date-fns"

interface KeywordsTableProps {
  keywords: Keyword[]
  selectedKeywords: number[]
  onSelectionChange: (selected: number[]) => void
  onUpdate: (id: number, data: any) => void
  onDelete: (id: number) => void
  isLoading: boolean
}

export function KeywordsTable({
  keywords,
  selectedKeywords,
  onSelectionChange,
  onUpdate,
  onDelete,
  isLoading
}: KeywordsTableProps) {
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null)
  const [deletingKeyword, setDeletingKeyword] = useState<Keyword | null>(null)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(keywords.map(k => k.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectKeyword = (keywordId: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedKeywords, keywordId])
    } else {
      onSelectionChange(selectedKeywords.filter(id => id !== keywordId))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      case 'archived':
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap: { [key: string]: { color: string; label: string } } = {
      'low': { color: 'bg-blue-100 text-blue-800', label: 'Low' },
      'medium': { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      'high': { color: 'bg-orange-100 text-orange-800', label: 'High' },
      'urgent': { color: 'bg-red-100 text-red-800', label: 'Urgent' },
      'critical': { color: 'bg-purple-100 text-purple-800', label: 'Critical' }
    }
    
    const priorityInfo = priorityMap[priority.toLowerCase()] || { color: 'bg-gray-100 text-gray-800', label: priority }
    return <Badge variant="secondary" className={priorityInfo.color}>{priorityInfo.label}</Badge>
  }

  const handleEdit = (keyword: Keyword) => {
    setEditingKeyword(keyword)
  }

  const handleCloseDialog = () => {
    setEditingKeyword(null)
    // Auto-refresh when dialog is closed to ensure fresh data
    setTimeout(() => {
      window.location.reload()
    }, 500) // Short delay to allow dialog close animation
  }

  const handleDeleteClick = (keyword: Keyword) => {
    setDeletingKeyword(keyword)
  }

  const handleConfirmDelete = async () => {
    if (deletingKeyword) {
      await onDelete(deletingKeyword.id)
      setDeletingKeyword(null)
    }
  }

  const handleCancelDelete = () => {
    setDeletingKeyword(null)
  }

  const handleUpdate = async (data: any) => {
    if (editingKeyword) {
      try {
        await onUpdate(editingKeyword.id, data)
        setEditingKeyword(null) // Close dialog on successful update
      } catch (error) {
        // Error is handled by the form component
        console.error('Update failed:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (keywords.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No keywords found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Add your first keyword to get started with automation
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedKeywords.length === keywords.length}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Keyword</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-20">Scrape</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keywords.map((keyword) => (
            <TableRow key={keyword.id}>
              <TableCell>
                <Checkbox
                  checked={selectedKeywords.includes(keyword.id)}
                  onCheckedChange={(checked) => handleSelectKeyword(keyword.id, checked as boolean)}
                />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{keyword.keyword}</div>
                  {keyword.description && (
                    <div className="text-sm text-muted-foreground">
                      {keyword.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{keyword.category}</Badge>
              </TableCell>
              <TableCell>
                {getStatusBadge(keyword.status)}
              </TableCell>
              <TableCell>
                {getPriorityBadge(keyword.priority)}
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(keyword.created_at), 'MMM d, yyyy')}
                </div>
              </TableCell>
              <TableCell>
                <InstagramScraperButton
                  keyword={keyword}
                  size="sm"
                  variant="outline"
                  showProgress={true}
                  onSuccess={(data) => {
                    console.log('Scraping completed for keyword:', keyword.keyword, data)
                  }}
                  onError={(error) => {
                    console.error('Scraping failed for keyword:', keyword.keyword, error)
                  }}
                />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(keyword)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteClick(keyword)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Dialog */}
      <Dialog open={!!editingKeyword} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Keyword</DialogTitle>
            <DialogDescription>
              Update the keyword information including name, description, category, priority, and status.
            </DialogDescription>
          </DialogHeader>
          {editingKeyword && (
            <KeywordForm
              initialData={editingKeyword}
              onSubmit={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingKeyword} onOpenChange={handleCancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the keyword 
              &quot;{deletingKeyword?.keyword}&quot; and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}