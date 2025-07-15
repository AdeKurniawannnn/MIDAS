"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Plus,
  X,
  Filter,
  Save,
  RotateCcw,
  Copy,
  Trash2,
  GripVertical,
  Settings,
  BookOpen,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from "lucide-react"

interface FilterBuilderProps {
  fields: FilterField[]
  onFiltersChange: (filters: FilterCondition[]) => void
  initialFilters?: FilterCondition[]
  presets?: FilterPreset[]
  className?: string
}

interface FilterField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select'
  options?: string[]
  placeholder?: string
}

interface FilterCondition {
  id: string
  field: string
  operator: string
  value: any
  logicalOperator: 'AND' | 'OR'
  enabled: boolean
}

interface FilterPreset {
  id: string
  name: string
  filters: FilterCondition[]
  description?: string
}

interface FilterGroup {
  id: string
  name: string
  conditions: FilterCondition[]
  logicalOperator: 'AND' | 'OR'
  enabled: boolean
}

const OPERATORS = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' }
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'greater_equal', label: 'Greater or equal' },
    { value: 'less_equal', label: 'Less or equal' },
    { value: 'between', label: 'Between' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' }
  ],
  date: [
    { value: 'equals', label: 'Equals' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'between', label: 'Between' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' }
  ],
  boolean: [
    { value: 'equals', label: 'Equals' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' }
  ],
  select: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'in', label: 'In' },
    { value: 'not_in', label: 'Not in' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' }
  ]
}

function SortableFilterCondition({ 
  condition, 
  fields, 
  onUpdate, 
  onRemove 
}: {
  condition: FilterCondition
  fields: FilterField[]
  onUpdate: (condition: FilterCondition) => void
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: condition.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const selectedField = fields.find(f => f.key === condition.field)
  const operators = selectedField ? OPERATORS[selectedField.type] : []

  const handleFieldChange = (fieldKey: string) => {
    const field = fields.find(f => f.key === fieldKey)
    if (field) {
      onUpdate({
        ...condition,
        field: fieldKey,
        operator: OPERATORS[field.type][0].value,
        value: field.type === 'boolean' ? false : ''
      })
    }
  }

  const handleOperatorChange = (operator: string) => {
    onUpdate({
      ...condition,
      operator,
      value: operator === 'is_empty' || operator === 'is_not_empty' ? '' : condition.value
    })
  }

  const handleValueChange = (value: any) => {
    onUpdate({ ...condition, value })
  }

  const renderValueInput = () => {
    if (condition.operator === 'is_empty' || condition.operator === 'is_not_empty') {
      return null
    }

    if (!selectedField) return null

    switch (selectedField.type) {
      case 'text':
        return (
          <Input
            placeholder={selectedField.placeholder || "Enter value..."}
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            className="flex-1"
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            placeholder="Enter number..."
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            className="flex-1"
          />
        )
      case 'boolean':
        return (
          <Select value={condition.value?.toString() || 'true'} onValueChange={handleValueChange}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        )
      case 'select':
        return (
          <Select value={condition.value || ''} onValueChange={handleValueChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select value..." />
            </SelectTrigger>
            <SelectContent>
              {selectedField.options?.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      default:
        return null
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      <Card className={`${!condition.enabled ? 'opacity-50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div
              className="cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <Checkbox
              checked={condition.enabled}
              onCheckedChange={(checked) => onUpdate({ ...condition, enabled: !!checked })}
            />
            
            <Select value={condition.field} onValueChange={handleFieldChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select field..." />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field.key} value={field.key}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={condition.operator} onValueChange={handleOperatorChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {renderValueInput()}
            
            <Select 
              value={condition.logicalOperator} 
              onValueChange={(value: 'AND' | 'OR') => onUpdate({ ...condition, logicalOperator: value })}
            >
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function FilterBuilder({
  fields,
  onFiltersChange,
  initialFilters = [],
  presets = [],
  className = ""
}: FilterBuilderProps) {
  const [filters, setFilters] = useState<FilterCondition[]>(initialFilters)
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>(presets)
  const [showPresets, setShowPresets] = useState(false)
  const [presetName, setPresetName] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: `filter-${Date.now()}`,
      field: fields[0]?.key || '',
      operator: OPERATORS[fields[0]?.type || 'text'][0].value,
      value: '',
      logicalOperator: 'AND',
      enabled: true
    }
    setFilters([...filters, newFilter])
  }

  const updateFilter = (id: string, updatedFilter: FilterCondition) => {
    setFilters(filters.map(filter => 
      filter.id === id ? updatedFilter : filter
    ))
  }

  const removeFilter = (id: string) => {
    setFilters(filters.filter(filter => filter.id !== id))
  }

  const clearAll = () => {
    setFilters([])
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    
    if (active.id !== over.id) {
      setFilters((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const savePreset = () => {
    if (!presetName.trim()) return
    
    const preset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name: presetName,
      filters: filters.filter(f => f.enabled),
      description: `${filters.filter(f => f.enabled).length} conditions`
    }
    
    setSavedPresets([...savedPresets, preset])
    setPresetName("")
    setShowPresets(false)
  }

  const loadPreset = (preset: FilterPreset) => {
    setFilters(preset.filters.map(f => ({ ...f, id: `filter-${Date.now()}-${Math.random()}` })))
    setShowPresets(false)
  }

  const deletePreset = (id: string) => {
    setSavedPresets(savedPresets.filter(p => p.id !== id))
  }

  const enabledFilters = filters.filter(f => f.enabled)
  const activeFiltersCount = enabledFilters.length

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Filter Builder</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Popover open={showPresets} onOpenChange={setShowPresets}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Presets
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filter Presets</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPresets(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Preset name..."
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={savePreset}
                      disabled={!presetName.trim() || activeFiltersCount === 0}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {savedPresets.map((preset) => (
                    <div key={preset.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{preset.name}</div>
                        <div className="text-xs text-muted-foreground">{preset.description}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadPreset(preset)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePreset(preset.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {savedPresets.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-4">
                      No saved presets
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="sm" onClick={addFilter}>
            <Plus className="h-4 w-4 mr-2" />
            Add Filter
          </Button>
          
          {filters.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {filters.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={filters.map(f => f.id)} strategy={verticalListSortingStrategy}>
              {filters.map((filter) => (
                <SortableFilterCondition
                  key={filter.id}
                  condition={filter}
                  fields={fields}
                  onUpdate={(updatedFilter) => updateFilter(filter.id, updatedFilter)}
                  onRemove={() => removeFilter(filter.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Filter className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No filters configured</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add filters to refine your search results
              </p>
              <Button onClick={addFilter}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Filter
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary */}
      {activeFiltersCount > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">
                  {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {enabledFilters.filter(f => f.logicalOperator === 'AND').length} AND, {enabledFilters.filter(f => f.logicalOperator === 'OR').length} OR
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}