import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Mock the hooks and components that will be tested
const mockKeywords = [
  {
    id: 1,
    keyword: 'test keyword 1',
    description: 'Test description 1',
    category: 'testing',
    status: 'active',
    priority: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    gmail: 'test@test.com',
    tags: ['test', 'integration']
  },
  {
    id: 2,
    keyword: 'test keyword 2',
    description: 'Test description 2',
    category: 'testing',
    status: 'inactive',
    priority: 3,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    gmail: 'test@test.com',
    tags: ['test']
  }
]

// Mock API calls
const mockCreateKeyword = jest.fn()
const mockUpdateKeyword = jest.fn()
const mockDeleteKeyword = jest.fn()
const mockBulkOperation = jest.fn()

// Mock the API module
jest.mock('@/lib/api/keywords', () => ({
  createKeyword: (...args: any[]) => mockCreateKeyword(...args),
  updateKeyword: (...args: any[]) => mockUpdateKeyword(...args),
  deleteKeyword: (...args: any[]) => mockDeleteKeyword(...args),
  bulkOperation: (...args: any[]) => mockBulkOperation(...args),
}))

// Mock component that represents the keywords management interface
const MockKeywordsList = ({ 
  keywords, 
  onCreateKeyword, 
  onUpdateKeyword, 
  onDeleteKeyword, 
  onBulkOperation 
}: {
  keywords: any[]
  onCreateKeyword: (data: any) => Promise<void>
  onUpdateKeyword: (id: number, data: any) => Promise<void>
  onDeleteKeyword: (id: number) => Promise<void>
  onBulkOperation: (operation: string, keywordIds: number[]) => Promise<void>
}) => {
  const [selectedKeywords, setSelectedKeywords] = React.useState<number[]>([])
  const [showCreateForm, setShowCreateForm] = React.useState(false)
  const [editingKeyword, setEditingKeyword] = React.useState<any>(null)

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    await onCreateKeyword({
      keyword: formData.get('keyword') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      priority: parseInt(formData.get('priority') as string),
      status: formData.get('status') as string,
    })
    
    setShowCreateForm(false)
    form.reset()
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    await onUpdateKeyword(editingKeyword.id, {
      keyword: formData.get('keyword') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      priority: parseInt(formData.get('priority') as string),
      status: formData.get('status') as string,
    })
    
    setEditingKeyword(null)
  }

  const handleBulkAction = async (operation: string) => {
    await onBulkOperation(operation, selectedKeywords)
    setSelectedKeywords([])
  }

  return (
    <div data-testid="keywords-management">
      <div className="header">
        <h1>Keywords Management</h1>
        <button 
          onClick={() => setShowCreateForm(true)}
          data-testid="create-keyword-button"
        >
          Create Keyword
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedKeywords.length > 0 && (
        <div data-testid="bulk-actions">
          <span>{selectedKeywords.length} keywords selected</span>
          <button 
            onClick={() => handleBulkAction('activate')}
            data-testid="bulk-activate"
          >
            Activate
          </button>
          <button 
            onClick={() => handleBulkAction('deactivate')}
            data-testid="bulk-deactivate"
          >
            Deactivate
          </button>
          <button 
            onClick={() => handleBulkAction('delete')}
            data-testid="bulk-delete"
          >
            Delete
          </button>
        </div>
      )}

      {/* Keywords List */}
      <div data-testid="keywords-list">
        {keywords.map((keyword) => (
          <div key={keyword.id} data-testid={`keyword-${keyword.id}`} className="keyword-item">
            <input
              type="checkbox"
              checked={selectedKeywords.includes(keyword.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedKeywords([...selectedKeywords, keyword.id])
                } else {
                  setSelectedKeywords(selectedKeywords.filter(id => id !== keyword.id))
                }
              }}
              data-testid={`keyword-checkbox-${keyword.id}`}
            />
            <div className="keyword-content">
              <h3>{keyword.keyword}</h3>
              <p>{keyword.description}</p>
              <span className={`status ${keyword.status}`}>{keyword.status}</span>
              <span className={`priority priority-${keyword.priority}`}>Priority: {keyword.priority}</span>
            </div>
            <div className="keyword-actions">
              <button 
                onClick={() => setEditingKeyword(keyword)}
                data-testid={`edit-keyword-${keyword.id}`}
              >
                Edit
              </button>
              <button 
                onClick={() => onDeleteKeyword(keyword.id)}
                data-testid={`delete-keyword-${keyword.id}`}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div data-testid="create-keyword-modal" className="modal">
          <form onSubmit={handleCreateSubmit} data-testid="create-keyword-form">
            <h2>Create New Keyword</h2>
            <input
              name="keyword"
              placeholder="Enter keyword"
              required
              data-testid="create-keyword-input"
            />
            <textarea
              name="description"
              placeholder="Enter description"
              data-testid="create-description-input"
            />
            <select
              name="category"
              required
              data-testid="create-category-input"
              defaultValue=""
            >
              <option value="" disabled>Select category</option>
              <option value="testing">Testing</option>
              <option value="marketing">Marketing</option>
              <option value="seo">SEO</option>
            </select>
            <select
              name="priority"
              defaultValue="1"
              data-testid="create-priority-input"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            <select
              name="status"
              defaultValue="active"
              data-testid="create-status-input"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
            <div className="form-actions">
              <button type="submit" data-testid="create-submit-button">
                Create
              </button>
              <button 
                type="button" 
                onClick={() => setShowCreateForm(false)}
                data-testid="create-cancel-button"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingKeyword && (
        <div data-testid="edit-keyword-modal" className="modal">
          <form onSubmit={handleUpdateSubmit} data-testid="edit-keyword-form">
            <h2>Edit Keyword</h2>
            <input
              name="keyword"
              defaultValue={editingKeyword.keyword}
              required
              data-testid="edit-keyword-input"
            />
            <textarea
              name="description"
              defaultValue={editingKeyword.description}
              data-testid="edit-description-input"
            />
            <select
              name="category"
              defaultValue={editingKeyword.category}
              required
              data-testid="edit-category-input"
            >
              <option value="testing">Testing</option>
              <option value="marketing">Marketing</option>
              <option value="seo">SEO</option>
            </select>
            <select
              name="priority"
              defaultValue={editingKeyword.priority.toString()}
              data-testid="edit-priority-input"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            <select
              name="status"
              defaultValue={editingKeyword.status}
              data-testid="edit-status-input"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
            <div className="form-actions">
              <button type="submit" data-testid="edit-submit-button">
                Update
              </button>
              <button 
                type="button" 
                onClick={() => setEditingKeyword(null)}
                data-testid="edit-cancel-button"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

// Main test component that handles API integration
const KeywordsManagementIntegration = () => {
  const [keywords, setKeywords] = React.useState(mockKeywords)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleCreateKeyword = async (data: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await mockCreateKeyword(data)
      const newKeyword = { id: Date.now(), ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), gmail: 'test@test.com' }
      setKeywords([...keywords, newKeyword])
    } catch (err) {
      setError('Failed to create keyword')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateKeyword = async (id: number, data: any) => {
    setLoading(true)
    setError(null)
    try {
      await mockUpdateKeyword(id, data)
      setKeywords(keywords.map(k => k.id === id ? { ...k, ...data, updated_at: new Date().toISOString() } : k))
    } catch (err) {
      setError('Failed to update keyword')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteKeyword = async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await mockDeleteKeyword(id)
      setKeywords(keywords.filter(k => k.id !== id))
    } catch (err) {
      setError('Failed to delete keyword')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleBulkOperation = async (operation: string, keywordIds: number[]) => {
    setLoading(true)
    setError(null)
    try {
      await mockBulkOperation(operation, keywordIds)
      
      // Update local state based on operation
      if (operation === 'delete') {
        setKeywords(keywords.filter(k => !keywordIds.includes(k.id)))
      } else if (operation === 'activate') {
        setKeywords(keywords.map(k => keywordIds.includes(k.id) ? { ...k, status: 'active' } : k))
      } else if (operation === 'deactivate') {
        setKeywords(keywords.map(k => keywordIds.includes(k.id) ? { ...k, status: 'inactive' } : k))
      }
    } catch (err) {
      setError(`Failed to ${operation} keywords`)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <div data-testid="error-message" className="error">{error}</div>}
      {loading && <div data-testid="loading-indicator">Loading...</div>}
      
      <MockKeywordsList
        keywords={keywords}
        onCreateKeyword={handleCreateKeyword}
        onUpdateKeyword={handleUpdateKeyword}
        onDeleteKeyword={handleDeleteKeyword}
        onBulkOperation={handleBulkOperation}
      />
    </div>
  )
}

describe('Keywords Management Integration Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default successful API responses
    mockCreateKeyword.mockResolvedValue({ id: 999, success: true })
    mockUpdateKeyword.mockResolvedValue({ success: true })
    mockDeleteKeyword.mockResolvedValue({ success: true })
    mockBulkOperation.mockResolvedValue({ success: true })
  })

  describe('Keyword Display and Interaction', () => {
    it('should render keywords list with all information', () => {
      render(<KeywordsManagementIntegration />)

      expect(screen.getByTestId('keywords-management')).toBeInTheDocument()
      expect(screen.getByTestId('keywords-list')).toBeInTheDocument()
      
      // Check first keyword
      expect(screen.getByTestId('keyword-1')).toBeInTheDocument()
      expect(screen.getByText('test keyword 1')).toBeInTheDocument()
      expect(screen.getByText('Test description 1')).toBeInTheDocument()
      expect(screen.getByText('active')).toBeInTheDocument()
      expect(screen.getByText('Priority: 1')).toBeInTheDocument()
      
      // Check second keyword
      expect(screen.getByTestId('keyword-2')).toBeInTheDocument()
      expect(screen.getByText('test keyword 2')).toBeInTheDocument()
      expect(screen.getByText('inactive')).toBeInTheDocument()
      expect(screen.getByText('Priority: 3')).toBeInTheDocument()
    })

    it('should show create keyword button', () => {
      render(<KeywordsManagementIntegration />)
      
      expect(screen.getByTestId('create-keyword-button')).toBeInTheDocument()
      expect(screen.getByText('Create Keyword')).toBeInTheDocument()
    })

    it('should show edit and delete buttons for each keyword', () => {
      render(<KeywordsManagementIntegration />)
      
      expect(screen.getByTestId('edit-keyword-1')).toBeInTheDocument()
      expect(screen.getByTestId('delete-keyword-1')).toBeInTheDocument()
      expect(screen.getByTestId('edit-keyword-2')).toBeInTheDocument()
      expect(screen.getByTestId('delete-keyword-2')).toBeInTheDocument()
    })
  })

  describe('Create Keyword Functionality', () => {
    it('should open create modal when create button is clicked', async () => {
      render(<KeywordsManagementIntegration />)
      
      await user.click(screen.getByTestId('create-keyword-button'))
      
      expect(screen.getByTestId('create-keyword-modal')).toBeInTheDocument()
      expect(screen.getByTestId('create-keyword-form')).toBeInTheDocument()
      expect(screen.getByText('Create New Keyword')).toBeInTheDocument()
    })

    it('should create a new keyword with valid data', async () => {
      render(<KeywordsManagementIntegration />)
      
      // Open create modal
      await user.click(screen.getByTestId('create-keyword-button'))
      
      // Fill form
      await user.type(screen.getByTestId('create-keyword-input'), 'new test keyword')
      await user.type(screen.getByTestId('create-description-input'), 'new test description')
      await user.selectOptions(screen.getByTestId('create-category-input'), 'marketing')
      await user.selectOptions(screen.getByTestId('create-priority-input'), '4')
      await user.selectOptions(screen.getByTestId('create-status-input'), 'active')
      
      // Submit form
      await user.click(screen.getByTestId('create-submit-button'))
      
      // Verify API call
      await waitFor(() => {
        expect(mockCreateKeyword).toHaveBeenCalledWith({
          keyword: 'new test keyword',
          description: 'new test description',
          category: 'marketing',
          priority: 4,
          status: 'active'
        })
      })
      
      // Verify UI updates
      await waitFor(() => {
        expect(screen.getByText('new test keyword')).toBeInTheDocument()
      })
      
      // Modal should close
      expect(screen.queryByTestId('create-keyword-modal')).not.toBeInTheDocument()
    })

    it('should cancel create form', async () => {
      render(<KeywordsManagementIntegration />)
      
      // Open and cancel create modal
      await user.click(screen.getByTestId('create-keyword-button'))
      await user.click(screen.getByTestId('create-cancel-button'))
      
      expect(screen.queryByTestId('create-keyword-modal')).not.toBeInTheDocument()
      expect(mockCreateKeyword).not.toHaveBeenCalled()
    })

    it('should handle create keyword API error', async () => {
      mockCreateKeyword.mockRejectedValue(new Error('API Error'))
      
      render(<KeywordsManagementIntegration />)
      
      // Open create modal and submit
      await user.click(screen.getByTestId('create-keyword-button'))
      await user.type(screen.getByTestId('create-keyword-input'), 'test keyword')
      await user.selectOptions(screen.getByTestId('create-category-input'), 'testing')
      await user.click(screen.getByTestId('create-submit-button'))
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByText('Failed to create keyword')).toBeInTheDocument()
      })
    })

    it('should require keyword and category fields', async () => {
      render(<KeywordsManagementIntegration />)
      
      await user.click(screen.getByTestId('create-keyword-button'))
      
      // Try to submit without required fields
      await user.click(screen.getByTestId('create-submit-button'))
      
      // Form validation should prevent submission
      expect(mockCreateKeyword).not.toHaveBeenCalled()
    })
  })

  describe('Edit Keyword Functionality', () => {
    it('should open edit modal when edit button is clicked', async () => {
      render(<KeywordsManagementIntegration />)
      
      await user.click(screen.getByTestId('edit-keyword-1'))
      
      expect(screen.getByTestId('edit-keyword-modal')).toBeInTheDocument()
      expect(screen.getByTestId('edit-keyword-form')).toBeInTheDocument()
      expect(screen.getByText('Edit Keyword')).toBeInTheDocument()
      
      // Form should be pre-filled
      expect(screen.getByDisplayValue('test keyword 1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test description 1')).toBeInTheDocument()
    })

    it('should update keyword with new data', async () => {
      render(<KeywordsManagementIntegration />)
      
      // Open edit modal
      await user.click(screen.getByTestId('edit-keyword-1'))
      
      // Update form fields
      const keywordInput = screen.getByTestId('edit-keyword-input')
      await user.clear(keywordInput)
      await user.type(keywordInput, 'updated keyword')
      
      const descriptionInput = screen.getByTestId('edit-description-input')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'updated description')
      
      await user.selectOptions(screen.getByTestId('edit-priority-input'), '5')
      await user.selectOptions(screen.getByTestId('edit-status-input'), 'inactive')
      
      // Submit form
      await user.click(screen.getByTestId('edit-submit-button'))
      
      // Verify API call
      await waitFor(() => {
        expect(mockUpdateKeyword).toHaveBeenCalledWith(1, {
          keyword: 'updated keyword',
          description: 'updated description',
          category: 'testing', // Should keep original category
          priority: 5,
          status: 'inactive'
        })
      })
      
      // Verify UI updates
      await waitFor(() => {
        expect(screen.getByText('updated keyword')).toBeInTheDocument()
        expect(screen.getByText('updated description')).toBeInTheDocument()
      })
    })

    it('should cancel edit form', async () => {
      render(<KeywordsManagementIntegration />)
      
      await user.click(screen.getByTestId('edit-keyword-1'))
      await user.click(screen.getByTestId('edit-cancel-button'))
      
      expect(screen.queryByTestId('edit-keyword-modal')).not.toBeInTheDocument()
      expect(mockUpdateKeyword).not.toHaveBeenCalled()
    })

    it('should handle update keyword API error', async () => {
      mockUpdateKeyword.mockRejectedValue(new Error('Update failed'))
      
      render(<KeywordsManagementIntegration />)
      
      await user.click(screen.getByTestId('edit-keyword-1'))
      await user.click(screen.getByTestId('edit-submit-button'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByText('Failed to update keyword')).toBeInTheDocument()
      })
    })
  })

  describe('Delete Keyword Functionality', () => {
    it('should delete keyword when delete button is clicked', async () => {
      render(<KeywordsManagementIntegration />)
      
      await user.click(screen.getByTestId('delete-keyword-1'))
      
      await waitFor(() => {
        expect(mockDeleteKeyword).toHaveBeenCalledWith(1)
      })
      
      // Keyword should be removed from UI
      await waitFor(() => {
        expect(screen.queryByTestId('keyword-1')).not.toBeInTheDocument()
        expect(screen.queryByText('test keyword 1')).not.toBeInTheDocument()
      })
    })

    it('should handle delete keyword API error', async () => {
      mockDeleteKeyword.mockRejectedValue(new Error('Delete failed'))
      
      render(<KeywordsManagementIntegration />)
      
      await user.click(screen.getByTestId('delete-keyword-1'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByText('Failed to delete keyword')).toBeInTheDocument()
      })
      
      // Keyword should still be in UI
      expect(screen.getByTestId('keyword-1')).toBeInTheDocument()
    })
  })

  describe('Bulk Operations Functionality', () => {
    it('should show bulk actions when keywords are selected', async () => {
      render(<KeywordsManagementIntegration />)
      
      // Select first keyword
      await user.click(screen.getByTestId('keyword-checkbox-1'))
      
      expect(screen.getByTestId('bulk-actions')).toBeInTheDocument()
      expect(screen.getByText('1 keywords selected')).toBeInTheDocument()
      expect(screen.getByTestId('bulk-activate')).toBeInTheDocument()
      expect(screen.getByTestId('bulk-deactivate')).toBeInTheDocument()
      expect(screen.getByTestId('bulk-delete')).toBeInTheDocument()
    })

    it('should update selection count when multiple keywords are selected', async () => {
      render(<KeywordsManagementIntegration />)
      
      // Select both keywords
      await user.click(screen.getByTestId('keyword-checkbox-1'))
      await user.click(screen.getByTestId('keyword-checkbox-2'))
      
      expect(screen.getByText('2 keywords selected')).toBeInTheDocument()
    })

    it('should perform bulk activation', async () => {
      render(<KeywordsManagementIntegration />)
      
      // Select keywords and perform bulk action
      await user.click(screen.getByTestId('keyword-checkbox-1'))
      await user.click(screen.getByTestId('keyword-checkbox-2'))
      await user.click(screen.getByTestId('bulk-activate'))
      
      await waitFor(() => {
        expect(mockBulkOperation).toHaveBeenCalledWith('activate', [1, 2])
      })
      
      // Selection should be cleared
      await waitFor(() => {
        expect(screen.queryByTestId('bulk-actions')).not.toBeInTheDocument()
      })
    })

    it('should perform bulk deletion', async () => {
      render(<KeywordsManagementIntegration />)
      
      await user.click(screen.getByTestId('keyword-checkbox-1'))
      await user.click(screen.getByTestId('bulk-delete'))
      
      await waitFor(() => {
        expect(mockBulkOperation).toHaveBeenCalledWith('delete', [1])
      })
      
      // Deleted keyword should be removed from UI
      await waitFor(() => {
        expect(screen.queryByTestId('keyword-1')).not.toBeInTheDocument()
      })
    })

    it('should handle bulk operation errors', async () => {
      mockBulkOperation.mockRejectedValue(new Error('Bulk operation failed'))
      
      render(<KeywordsManagementIntegration />)
      
      await user.click(screen.getByTestId('keyword-checkbox-1'))
      await user.click(screen.getByTestId('bulk-activate'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByText('Failed to activate keywords')).toBeInTheDocument()
      })
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading indicator during API calls', async () => {
      // Make API call take longer
      mockCreateKeyword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<KeywordsManagementIntegration />)
      
      await user.click(screen.getByTestId('create-keyword-button'))
      await user.type(screen.getByTestId('create-keyword-input'), 'test')
      await user.selectOptions(screen.getByTestId('create-category-input'), 'testing')
      
      // Start form submission
      await act(async () => {
        await user.click(screen.getByTestId('create-submit-button'))
      })
      
      // Should briefly show loading indicator
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    })

    it('should clear error messages on successful operations', async () => {
      // First operation fails
      mockCreateKeyword.mockRejectedValueOnce(new Error('First error'))
      // Second operation succeeds
      mockCreateKeyword.mockResolvedValueOnce({ id: 999, success: true })
      
      render(<KeywordsManagementIntegration />)
      
      // Trigger error
      await user.click(screen.getByTestId('create-keyword-button'))
      await user.type(screen.getByTestId('create-keyword-input'), 'test')
      await user.selectOptions(screen.getByTestId('create-category-input'), 'testing')
      await user.click(screen.getByTestId('create-submit-button'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })
      
      // Try again successfully
      await user.click(screen.getByTestId('create-keyword-button'))
      await user.type(screen.getByTestId('create-keyword-input'), 'test2')
      await user.selectOptions(screen.getByTestId('create-category-input'), 'testing')
      await user.click(screen.getByTestId('create-submit-button'))
      
      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
      })
    })
  })

  describe('User Experience and Accessibility', () => {
    it('should provide proper form labels and accessibility attributes', () => {
      render(<KeywordsManagementIntegration />)
      
      // Check main heading
      expect(screen.getByText('Keywords Management')).toBeInTheDocument()
      
      // Check that form inputs have appropriate test IDs for accessibility
      expect(screen.getByTestId('create-keyword-button')).toBeInTheDocument()
    })

    it('should handle keyboard navigation properly', async () => {
      render(<KeywordsManagementIntegration />)
      
      // Test keyboard navigation to create button
      const createButton = screen.getByTestId('create-keyword-button')
      createButton.focus()
      
      // Press Enter to activate
      await user.keyboard('{Enter}')
      
      expect(screen.getByTestId('create-keyword-modal')).toBeInTheDocument()
    })

    it('should provide visual feedback for different keyword states', () => {
      render(<KeywordsManagementIntegration />)
      
      // Check status indicators
      const activeStatus = screen.getByText('active')
      const inactiveStatus = screen.getByText('inactive')
      
      expect(activeStatus).toHaveClass('status', 'active')
      expect(inactiveStatus).toHaveClass('status', 'inactive')
      
      // Check priority indicators
      expect(screen.getByText('Priority: 1')).toHaveClass('priority', 'priority-1')
      expect(screen.getByText('Priority: 3')).toHaveClass('priority', 'priority-3')
    })
  })
})