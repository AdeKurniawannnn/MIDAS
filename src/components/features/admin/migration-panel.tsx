'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database, 
  RefreshCw,
  AlertCircle,
  History
} from 'lucide-react'

interface MigrationChunk {
  id: string
  name: string
}

interface MigrationHistory {
  id: number
  migration_name: string
  chunk_id: string
  chunk_name: string
  executed_by?: string
  executed_at: string
  success: boolean
  error_message?: string
  execution_time_ms?: number
}

export default function MigrationPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [migrationHistory, setMigrationHistory] = useState<MigrationHistory[]>([])
  const [availableChunks, setAvailableChunks] = useState<MigrationChunk[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const { toast } = useToast()

  const loadMigrationStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/migrations')
      const data = await response.json()

      if (data.success) {
        setMigrationHistory(data.history || [])
        setAvailableChunks(data.chunks || [])
        setIsInitialized(true)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load migration status',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to load migration status:', error)
      toast({
        title: 'Error',
        description: 'Failed to connect to migration API',
        variant: 'destructive'
      })
    }
  }, [toast])

  // Load migration status on component mount
  useEffect(() => {
    loadMigrationStatus()
  }, [loadMigrationStatus])

  const initializeMigrationTracking = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/migrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'init' })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Migration tracking initialized successfully'
        })
        await loadMigrationStatus()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to initialize migration tracking',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to initialize migration tracking:', error)
      toast({
        title: 'Error',
        description: 'Failed to initialize migration tracking',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const runInstagramMigration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/migrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'run_instagram_migration' })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: `Instagram schema migration completed in ${data.total_execution_time_ms}ms`
        })
        await loadMigrationStatus()
      } else {
        toast({
          title: 'Migration Failed',
          description: data.error || 'Failed to run Instagram migration',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to run Instagram migration:', error)
      toast({
        title: 'Error',
        description: 'Failed to run Instagram migration',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const rollbackMigration = async () => {
    if (!confirm('Are you sure you want to rollback the Instagram migration? This will drop all Instagram tables.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/migrations/rollback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ migration_name: 'instagram_scraper_schema' })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: `Migration rolled back successfully in ${data.execution_time_ms}ms`
        })
        await loadMigrationStatus()
      } else {
        toast({
          title: 'Rollback Failed',
          description: data.error || 'Failed to rollback migration',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to rollback migration:', error)
      toast({
        title: 'Error',
        description: 'Failed to rollback migration',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkMigrationStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/migrations/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ migration_name: 'instagram_scraper_schema' })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Status Check Complete',
          description: 'Migration status refreshed'
        })
        await loadMigrationStatus()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to check migration status',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to check migration status:', error)
      toast({
        title: 'Error',
        description: 'Failed to check migration status',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatExecutionTime = (ms?: number) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Success
      </Badge>
    ) : (
      <Badge variant="destructive">
        Failed
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Migration Panel</h2>
          <p className="text-muted-foreground">
            Manage database schema migrations via REST API
          </p>
        </div>
        <Button 
          onClick={loadMigrationStatus}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Migration Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Instagram Schema Migration
          </CardTitle>
          <CardDescription>
            Execute the Instagram scraper database schema migration with comprehensive tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isInitialized && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-800">
                  Migration tracking not initialized. Please initialize first.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={initializeMigrationTracking}
              disabled={isLoading}
              variant="outline"
            >
              <Database className="h-4 w-4 mr-2" />
              Initialize Tracking
            </Button>

            <Button
              onClick={runInstagramMigration}
              disabled={isLoading || !isInitialized}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Run Instagram Migration
            </Button>

            <Button
              onClick={rollbackMigration}
              disabled={isLoading}
              variant="destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rollback Migration
            </Button>

            <Button
              onClick={checkMigrationStatus}
              disabled={isLoading}
              variant="secondary"
            >
              <Clock className="h-4 w-4 mr-2" />
              Check Status
            </Button>
          </div>

          {availableChunks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Available Migration Chunks:</h4>
              <div className="flex flex-wrap gap-2">
                {availableChunks.map((chunk) => (
                  <Badge key={chunk.id} variant="outline">
                    {chunk.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Migration History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Migration History
          </CardTitle>
          <CardDescription>
            Recent migration executions and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {migrationHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No migration history available
            </p>
          ) : (
            <div className="space-y-4">
              {migrationHistory.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.success)}
                      <span className="font-medium">{item.chunk_name}</span>
                      {getStatusBadge(item.success)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatExecutionTime(item.execution_time_ms)}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Migration: {item.migration_name}</p>
                    <p>Chunk ID: {item.chunk_id}</p>
                    <p>Executed: {new Date(item.executed_at).toLocaleString()}</p>
                    {item.error_message && (
                      <p className="text-red-600 bg-red-50 p-2 rounded mt-2">
                        Error: {item.error_message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}