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
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Download,
  Settings,
  FileText,
  Database,
  Image,
  Code,
  Save,
  Trash2,
  Copy,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Info,
  Filter,
  Columns,
  ArrowUpDown,
  Calendar,
  Hash,
  Type,
  MoreHorizontal
} from "lucide-react"

interface ExportCustomizerProps {
  data: any[]
  fields: ExportField[]
  onExport: (config: ExportConfig) => void
  templates?: ExportTemplate[]
  className?: string
}

interface ExportField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'url' | 'email'
  required?: boolean
  sortable?: boolean
  filterable?: boolean
}

interface ExportConfig {
  format: ExportFormat
  fields: string[]
  filters: ExportFilter[]
  sorting: ExportSort[]
  options: ExportOptions
  template?: string
}

interface ExportFilter {
  field: string
  operator: string
  value: any
}

interface ExportSort {
  field: string
  direction: 'asc' | 'desc'
}

interface ExportOptions {
  includeHeaders: boolean
  includeTags: boolean
  includeTimestamp: boolean
  dateFormat: string
  encoding: string
  delimiter: string
  quoteChar: string
  escapeChar: string
  nullValue: string
  filename: string
  compression: boolean
  chunkSize?: number
}

interface ExportTemplate {
  id: string
  name: string
  description?: string
  config: ExportConfig
  isDefault?: boolean
  createdAt: Date
  usageCount: number
}

type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf' | 'xml' | 'html'

const EXPORT_FORMATS: { value: ExportFormat; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'csv', label: 'CSV', icon: <FileText className="h-4 w-4" />, description: 'Comma-separated values' },
  { value: 'json', label: 'JSON', icon: <Code className="h-4 w-4" />, description: 'JavaScript Object Notation' },
  { value: 'xlsx', label: 'Excel', icon: <Database className="h-4 w-4" />, description: 'Microsoft Excel spreadsheet' },
  { value: 'pdf', label: 'PDF', icon: <FileText className="h-4 w-4" />, description: 'Portable Document Format' },
  { value: 'xml', label: 'XML', icon: <Code className="h-4 w-4" />, description: 'Extensible Markup Language' },
  { value: 'html', label: 'HTML', icon: <Code className="h-4 w-4" />, description: 'HyperText Markup Language' }
]

const DATE_FORMATS = [
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY' },
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY' },
  { value: 'yyyy-MM-dd HH:mm:ss', label: 'YYYY-MM-DD HH:MM:SS' },
  { value: 'dd/MM/yyyy HH:mm', label: 'DD/MM/YYYY HH:MM' },
  { value: 'iso', label: 'ISO 8601' }
]

export function ExportCustomizer({
  data,
  fields,
  onExport,
  templates = [],
  className = ""
}: ExportCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState("format")
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'csv',
    fields: fields.map(f => f.key),
    filters: [],
    sorting: [],
    options: {
      includeHeaders: true,
      includeTags: false,
      includeTimestamp: true,
      dateFormat: 'yyyy-MM-dd',
      encoding: 'utf-8',
      delimiter: ',',
      quoteChar: '"',
      escapeChar: '\\',
      nullValue: '',
      filename: `export_${new Date().toISOString().split('T')[0]}`,
      compression: false
    }
  })
  
  const [savedTemplates, setSavedTemplates] = useState<ExportTemplate[]>(templates)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    // Load saved templates
    const saved = localStorage.getItem('orion-export-templates')
    if (saved) {
      try {
        setSavedTemplates(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading templates:', error)
      }
    }
  }, [])

  const updateConfig = (updates: Partial<ExportConfig>) => {
    setExportConfig(prev => ({ ...prev, ...updates }))
  }

  const updateOptions = (updates: Partial<ExportOptions>) => {
    setExportConfig(prev => ({
      ...prev,
      options: { ...prev.options, ...updates }
    }))
  }

  const handleFieldToggle = (fieldKey: string, checked: boolean) => {
    const newFields = checked
      ? [...exportConfig.fields, fieldKey]
      : exportConfig.fields.filter(f => f !== fieldKey)
    
    updateConfig({ fields: newFields })
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport(exportConfig)
      setIsOpen(false)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const saveTemplate = () => {
    if (!templateName.trim()) return

    const template: ExportTemplate = {
      id: `template-${Date.now()}`,
      name: templateName.trim(),
      description: templateDescription.trim() || undefined,
      config: exportConfig,
      createdAt: new Date(),
      usageCount: 0
    }

    const newTemplates = [...savedTemplates, template]
    setSavedTemplates(newTemplates)
    localStorage.setItem('orion-export-templates', JSON.stringify(newTemplates))
    
    setTemplateName("")
    setTemplateDescription("")
    setShowTemplateDialog(false)
  }

  const loadTemplate = (templateId: string) => {
    const template = savedTemplates.find(t => t.id === templateId)
    if (template) {
      setExportConfig(template.config)
      setSelectedTemplate(templateId)
      
      // Update usage count
      const updatedTemplates = savedTemplates.map(t =>
        t.id === templateId ? { ...t, usageCount: t.usageCount + 1 } : t
      )
      setSavedTemplates(updatedTemplates)
      localStorage.setItem('orion-export-templates', JSON.stringify(updatedTemplates))
    }
  }

  const deleteTemplate = (templateId: string) => {
    const newTemplates = savedTemplates.filter(t => t.id !== templateId)
    setSavedTemplates(newTemplates)
    localStorage.setItem('orion-export-templates', JSON.stringify(newTemplates))
  }

  const getEstimatedFileSize = () => {
    const selectedFields = fields.filter(f => exportConfig.fields.includes(f.key))
    const avgFieldSize = 20 // rough estimate
    const headerSize = exportConfig.options.includeHeaders ? selectedFields.length * 15 : 0
    const dataSize = data.length * selectedFields.length * avgFieldSize
    const totalSize = headerSize + dataSize
    
    if (totalSize < 1024) return `${totalSize} B`
    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(1)} KB`
    return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />
      case 'number': return <Hash className="h-4 w-4" />
      case 'date': return <Calendar className="h-4 w-4" />
      case 'boolean': return <CheckCircle2 className="h-4 w-4" />
      default: return <Type className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Customizer</DialogTitle>
          <DialogDescription>
            Configure your export settings for {data.length} records
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {EXPORT_FORMATS.map(format => (
                <Card 
                  key={format.value}
                  className={`cursor-pointer transition-all ${
                    exportConfig.format === format.value 
                      ? 'ring-2 ring-primary' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => updateConfig({ format: format.value })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {format.icon}
                      <div>
                        <div className="font-medium">{format.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {format.description}
                        </div>
                      </div>
                      {exportConfig.format === format.value && (
                        <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="fields" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Columns className="h-4 w-4" />
                <span className="font-medium">Select Fields</span>
                <Badge variant="outline">
                  {exportConfig.fields.length} of {fields.length}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateConfig({ fields: fields.map(f => f.key) })}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateConfig({ fields: [] })}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {fields.map(field => (
                <div key={field.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.key}
                    checked={exportConfig.fields.includes(field.key)}
                    onCheckedChange={(checked) => handleFieldToggle(field.key, !!checked)}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    {getFieldIcon(field.type)}
                    <label htmlFor={field.key} className="text-sm font-medium">
                      {field.label}
                    </label>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Export Filters</span>
              <Badge variant="outline">
                {exportConfig.filters.length} active
              </Badge>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="text-center py-8">
                  <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No filters configured</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add filters to export only specific data
                  </p>
                  <Button size="sm">
                    Add Filter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">General Options</h4>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-headers">Include Headers</Label>
                  <Switch
                    id="include-headers"
                    checked={exportConfig.options.includeHeaders}
                    onCheckedChange={(checked) => updateOptions({ includeHeaders: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-tags">Include Tags</Label>
                  <Switch
                    id="include-tags"
                    checked={exportConfig.options.includeTags}
                    onCheckedChange={(checked) => updateOptions({ includeTags: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-timestamp">Include Timestamp</Label>
                  <Switch
                    id="include-timestamp"
                    checked={exportConfig.options.includeTimestamp}
                    onCheckedChange={(checked) => updateOptions({ includeTimestamp: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="compression">Enable Compression</Label>
                  <Switch
                    id="compression"
                    checked={exportConfig.options.compression}
                    onCheckedChange={(checked) => updateOptions({ compression: checked })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Format Options</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="filename">Filename</Label>
                  <Input
                    id="filename"
                    value={exportConfig.options.filename}
                    onChange={(e) => updateOptions({ filename: e.target.value })}
                    placeholder="export_filename"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select 
                    value={exportConfig.options.dateFormat} 
                    onValueChange={(value) => updateOptions({ dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FORMATS.map(format => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {exportConfig.format === 'csv' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="delimiter">Delimiter</Label>
                      <Select 
                        value={exportConfig.options.delimiter} 
                        onValueChange={(value) => updateOptions({ delimiter: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=",">Comma (,)</SelectItem>
                          <SelectItem value=";">Semicolon (;)</SelectItem>
                          <SelectItem value="\t">Tab</SelectItem>
                          <SelectItem value="|">Pipe (|)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quote-char">Quote Character</Label>
                      <Input
                        id="quote-char"
                        value={exportConfig.options.quoteChar}
                        onChange={(e) => updateOptions({ quoteChar: e.target.value })}
                        maxLength={1}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                <span className="font-medium">Export Templates</span>
                <Badge variant="outline">
                  {savedTemplates.length} saved
                </Badge>
              </div>
              
              <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Export Template</DialogTitle>
                    <DialogDescription>
                      Save current configuration as a template
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Enter template name..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="template-description">Description (optional)</Label>
                      <Textarea
                        id="template-description"
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        placeholder="Describe this template..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={saveTemplate} disabled={!templateName.trim()}>
                        Save Template
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {savedTemplates.map(template => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {template.description || 'No description'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {template.config.format.toUpperCase()} • {template.config.fields.length} fields • Used {template.usageCount} times
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadTemplate(template.id)}
                          className="h-8"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                          className="h-8 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {savedTemplates.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <Save className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No saved templates</h3>
                    <p className="text-sm text-muted-foreground">
                      Save your export configuration as a template for quick reuse
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{exportConfig.fields.length} fields selected</span>
            <span>{data.length} records</span>
            <span>~{getEstimatedFileSize()}</span>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={exportConfig.fields.length === 0 || isExporting}
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {exportConfig.format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}