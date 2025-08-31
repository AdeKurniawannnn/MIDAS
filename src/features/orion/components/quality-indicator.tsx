"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Target,
  Shield,
  Eye,
  EyeOff
} from "lucide-react"

interface QualityIndicatorProps {
  data: Record<string, any>[]
  fields: QualityField[]
  showDetails?: boolean
  className?: string
}

interface QualityField {
  key: string
  label: string
  required?: boolean
  weight?: number
  validator?: (value: any) => QualityResult
}

interface QualityResult {
  isValid: boolean
  score: number // 0-100
  message?: string
  severity: 'success' | 'warning' | 'error'
}

interface FieldQuality {
  field: QualityField
  completeness: number
  quality: number
  issues: string[]
  samples: any[]
}

const defaultValidator = (value: any): QualityResult => {
  if (value === null || value === undefined || value === '') {
    return {
      isValid: false,
      score: 0,
      message: 'Missing value',
      severity: 'error'
    }
  }
  
  if (typeof value === 'string' && value.trim().length === 0) {
    return {
      isValid: false,
      score: 20,
      message: 'Empty string',
      severity: 'warning'
    }
  }
  
  if (typeof value === 'string' && value.trim().length < 3) {
    return {
      isValid: true,
      score: 60,
      message: 'Very short content',
      severity: 'warning'
    }
  }
  
  return {
    isValid: true,
    score: 100,
    message: 'Valid data',
    severity: 'success'
  }
}

export function QualityIndicator({
  data,
  fields,
  showDetails = true,
  className = ""
}: QualityIndicatorProps) {
  const [showDetailedView, setShowDetailedView] = useState(false)
  const [selectedField, setSelectedField] = useState<string | null>(null)

  const qualityAnalysis = useMemo(() => {
    const fieldQualities: FieldQuality[] = fields.map(field => {
      const validator = field.validator || defaultValidator
      const values = data.map(item => item[field.key])
      const validResults = values.map(validator)
      
      const completeness = (values.filter(v => v !== null && v !== undefined && v !== '').length / values.length) * 100
      const averageQuality = validResults.reduce((sum, result) => sum + result.score, 0) / validResults.length
      
      const issues = validResults
        .filter(result => !result.isValid || result.severity !== 'success')
        .map(result => result.message || 'Unknown issue')
        .filter((issue, index, arr) => arr.indexOf(issue) === index)
      
      const samples = values.filter(v => v !== null && v !== undefined && v !== '').slice(0, 3)
      
      return {
        field,
        completeness,
        quality: averageQuality,
        issues,
        samples
      }
    })
    
    const totalWeight = fields.reduce((sum, field) => sum + (field.weight || 1), 0)
    const overallScore = fieldQualities.reduce((sum, fq) => {
      const weight = fq.field.weight || 1
      const fieldScore = (fq.completeness + fq.quality) / 2
      return sum + (fieldScore * weight)
    }, 0) / totalWeight
    
    return {
      fieldQualities,
      overallScore,
      totalRecords: data.length,
      requiredFields: fields.filter(f => f.required).length,
      completedRequired: fieldQualities.filter(fq => fq.field.required && fq.completeness > 80).length
    }
  }, [data, fields])

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getQualityBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', variant: 'default' as const, icon: <CheckCircle2 className="h-3 w-3" /> }
    if (score >= 60) return { label: 'Good', variant: 'secondary' as const, icon: <AlertCircle className="h-3 w-3" /> }
    return { label: 'Poor', variant: 'destructive' as const, icon: <XCircle className="h-3 w-3" /> }
  }

  const overallBadge = getQualityBadge(qualityAnalysis.overallScore)

  return (
    <TooltipProvider>
      <div className={`space-y-4 ${className}`}>
        {/* Overall Quality Score */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Data Quality Score</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={overallBadge.variant} className="flex items-center gap-1">
                  {overallBadge.icon}
                  {overallBadge.label}
                </Badge>
                {showDetails && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetailedView(!showDetailedView)}
                    className="h-6 w-6 p-0"
                  >
                    {showDetailedView ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {Math.round(qualityAnalysis.overallScore)}%
                </span>
                <div className="text-right text-sm text-muted-foreground">
                  <div>{qualityAnalysis.totalRecords} records</div>
                  <div>{qualityAnalysis.completedRequired}/{qualityAnalysis.requiredFields} required fields</div>
                </div>
              </div>
              
              <Progress 
                value={qualityAnalysis.overallScore} 
                className="h-2"
              />
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-green-600">
                    {qualityAnalysis.fieldQualities.filter(fq => fq.quality >= 80).length}
                  </div>
                  <div className="text-muted-foreground">Excellent</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-yellow-600">
                    {qualityAnalysis.fieldQualities.filter(fq => fq.quality >= 60 && fq.quality < 80).length}
                  </div>
                  <div className="text-muted-foreground">Good</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-red-600">
                    {qualityAnalysis.fieldQualities.filter(fq => fq.quality < 60).length}
                  </div>
                  <div className="text-muted-foreground">Poor</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Field Quality */}
        {showDetailedView && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Field Quality Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {qualityAnalysis.fieldQualities.map((fieldQuality, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{fieldQuality.field.label}</span>
                        {fieldQuality.field.required && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getQualityColor(fieldQuality.quality)}`}>
                          {Math.round(fieldQuality.quality)}%
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setSelectedField(
                                selectedField === fieldQuality.field.key ? null : fieldQuality.field.key
                              )}
                            >
                              <Info className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <div>Completeness: {Math.round(fieldQuality.completeness)}%</div>
                              <div>Quality: {Math.round(fieldQuality.quality)}%</div>
                              <div>Issues: {fieldQuality.issues.length}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Completeness</div>
                        <Progress value={fieldQuality.completeness} className="h-1" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Quality</div>
                        <Progress value={fieldQuality.quality} className="h-1" />
                      </div>
                    </div>
                    
                    {selectedField === fieldQuality.field.key && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-lg space-y-2">
                        {fieldQuality.issues.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-red-600 mb-1">Issues Found:</div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {fieldQuality.issues.map((issue, idx) => (
                                <li key={idx} className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3 text-red-500" />
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {fieldQuality.samples.length > 0 && (
                          <div>
                            <div className="text-xs font-medium mb-1">Sample Values:</div>
                            <div className="flex flex-wrap gap-1">
                              {fieldQuality.samples.map((sample, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {String(sample).length > 20 
                                    ? `${String(sample).substring(0, 20)}...` 
                                    : String(sample)
                                  }
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">
                {qualityAnalysis.fieldQualities.filter(fq => fq.completeness === 100).length} complete fields
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">
                {qualityAnalysis.fieldQualities.filter(fq => fq.issues.length === 0).length} clean fields
              </span>
            </div>
          </div>
          
          <Badge variant="outline" className="text-xs">
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </div>
    </TooltipProvider>
  )
}