"use client"

import { useState } from "react"
import { Keyword } from "@/lib/types/keywords"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { KeywordForm } from "@/components/features/keywords/keyword-form"
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

  const getPriorityBadge = (priority: number) => {
    const colors = {
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-orange-100 text-orange-800',
      4: 'bg-red-100 text-red-800',
      5: 'bg-purple-100 text-purple-800'
    }
    return <Badge variant="secondary" className={colors[priority as keyof typeof colors]}>{priority}</Badge>
  }

  const handleEdit = (keyword: Keyword) => {
    setEditingKeyword(keyword)
  }

  const handleUpdate = (data: any) => {
    if (editingKeyword) {
      onUpdate(editingKeyword.id, data)
      setEditingKeyword(null)
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
                    <DropdownMenuItem onClick={() => onDelete(keyword.id)}>
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
      <Dialog open={!!editingKeyword} onOpenChange={() => setEditingKeyword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Keyword</DialogTitle>
          </DialogHeader>
          {editingKeyword && (
            <KeywordForm
              initialData={editingKeyword}
              onSubmit={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}