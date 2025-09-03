import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScrapingForm } from '../scraping-form'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock the auth context
const mockUser = {
  id: 'test-user-id',
  email: 'test@gmail.com',
  firstName: 'Test',
  lastName: 'User'
}

const mockUseAuth = {
  user: mockUser,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: true
}

jest.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth
}))

// Mock UI components with proper test IDs
jest.mock('@/components/ui/animated-button', () => ({
  AnimatedButton: ({ 
    children, 
    onClick, 
    disabled, 
    loading, 
    success, 
    error, 
    className,
    type,
    ...props 
  }: any) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      data-loading={loading}
      data-success={success}
      data-error={error}
      className={className}
      type={type}
      {...props}
    >
      {children}
    </button>
  ),
  useAnimatedButton: () => ({
    loading: false,
    success: false,
    error: false,
    reset: jest.fn(),
    showLoading: jest.fn(),
    showSuccess: jest.fn(),
    showError: jest.fn()
  })
}))

jest.mock('@/components/ui/progress-bar', () => ({
  ProgressBar: ({ value, variant, animated, showLabel }: any) => (
    <div 
      data-testid="progress-bar"
      data-value={value}
      data-variant={variant}
      data-animated={animated}
      data-show-label={showLabel}
      role="progressbar"
      aria-valuenow={value}
    >
      Progress: {value}%
    </div>
  )
}))

jest.mock('@/components/ui/spinner', () => ({
  Spinner: ({ size }: any) => (
    <div data-testid="spinner" data-size={size}>Loading...</div>
  )
}))

jest.mock('@/components/ui/combobox', () => ({
  Combobox: ({ 
    options, 
    value, 
    onChange, 
    disabled, 
    className,
    ...props 
  }: any) => (
    <select
      data-testid="combobox"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={className}
      {...props}
    >
      {options?.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}))

// Mock toast notifications
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn()
}

jest.mock('sonner', () => ({
  toast: mockToast
}))

describe('ScrapingForm Component', () => {
  const defaultProps = {
    scrapingType: 'instagram' as const,
    onSuccess: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Component Rendering', () => {
    it('renders correctly for Instagram scraping', () => {
      render(<ScrapingForm {...defaultProps} />)
      
      expect(screen.getByLabelText('Instagram URL')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter Instagram URL...')).toBeInTheDocument()
      expect(screen.getByLabelText('Max Results')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start scraping/i })).toBeInTheDocument()
    })

    it('renders correctly for Google Maps scraping', () => {
      render(<ScrapingForm {...defaultProps} scrapingType="google-maps" />)
      
      expect(screen.getByLabelText('Google Maps URL or Search Term')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter Google Maps URL or search term...')).toBeInTheDocument()
      expect(screen.getByLabelText('Latitude')).toBeInTheDocument()
      expect(screen.getByLabelText('Longitude')).toBeInTheDocument()
    })

    it('shows coordinate inputs only for Google Maps', () => {
      const { rerender } = render(<ScrapingForm {...defaultProps} scrapingType="instagram" />)
      
      expect(screen.queryByLabelText('Latitude')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Longitude')).not.toBeInTheDocument()

      rerender(<ScrapingForm {...defaultProps} scrapingType="google-maps" />)
      
      expect(screen.getByLabelText('Latitude')).toBeInTheDocument()
      expect(screen.getByLabelText('Longitude')).toBeInTheDocument()
    })

    it('displays smart defaults hint', () => {
      render(<ScrapingForm {...defaultProps} />)
      
      expect(screen.getByText('Smart defaults: Instagram (50), Google Maps (100)')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('validates required URL field', async () => {
      const user = userEvent.setup()
      render(<ScrapingForm {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: /start scraping/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('URL is required')).toBeInTheDocument()
      })
    })

    it('validates URL format', async () => {
      const user = userEvent.setup()
      render(<ScrapingForm {...defaultProps} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const submitButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'invalid-url')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument()
      })
    })

    it('accepts valid Instagram URLs', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm {...defaultProps} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      await user.type(urlInput, 'https://instagram.com/testuser')
      
      // Should not show validation errors
      expect(screen.queryByText('Please enter a valid URL')).not.toBeInTheDocument()
    })

    it('accepts valid Google Maps URLs', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm {...defaultProps} scrapingType="google-maps" />)
      
      const urlInput = screen.getByLabelText('Google Maps URL or Search Term')
      await user.type(urlInput, 'https://maps.google.com/place/test')
      
      expect(screen.queryByText('Please enter a valid URL')).not.toBeInTheDocument()
    })
  })

  describe('Smart URL Detection', () => {
    it('detects Instagram URLs and sets smart defaults', async () => {
      const user = userEvent.setup()
      render(<ScrapingForm {...defaultProps} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      await user.type(urlInput, 'https://instagram.com/testuser')
      
      await waitFor(() => {
        const maxResultsSelect = screen.getByTestId('combobox')
        expect(maxResultsSelect).toHaveValue('50')
      })
    })

    it('detects Google Maps URLs and sets smart defaults', async () => {
      const user = userEvent.setup()
      render(<ScrapingForm {...defaultProps} scrapingType="google-maps" />)
      
      const urlInput = screen.getByLabelText('Google Maps URL or Search Term')
      await user.type(urlInput, 'https://maps.google.com/place/test')
      
      await waitFor(() => {
        const maxResultsSelect = screen.getByTestId('combobox')
        expect(maxResultsSelect).toHaveValue('100')
      })
    })

    it('auto-extracts coordinates from Google Maps URLs', async () => {
      const user = userEvent.setup()
      render(<ScrapingForm {...defaultProps} scrapingType="google-maps" />)
      
      const urlInput = screen.getByLabelText('Google Maps URL or Search Term')
      const mapsUrlWithCoords = 'https://maps.google.com/@40.7128,-74.0060,15z'
      
      await user.type(urlInput, mapsUrlWithCoords)
      
      await waitFor(() => {
        const latInput = screen.getByLabelText('Latitude')
        const lngInput = screen.getByLabelText('Longitude')
        expect(latInput).toHaveValue('40.7128')
        expect(lngInput).toHaveValue('-74.0060')
      })
    })

    it('extracts coordinates from alternative URL patterns', async () => {
      const user = userEvent.setup()
      render(<ScrapingForm {...defaultProps} scrapingType="google-maps" />)
      
      const urlInput = screen.getByLabelText('Google Maps URL or Search Term')
      const mapsUrlWithLL = 'https://maps.google.com/?ll=40.7589,-73.9851&z=15'
      
      await user.type(urlInput, mapsUrlWithLL)
      
      await waitFor(() => {
        const latInput = screen.getByLabelText('Latitude')
        const lngInput = screen.getByLabelText('Longitude')
        expect(latInput).toHaveValue('40.7589')
        expect(lngInput).toHaveValue('-73.9851')
      })
    })
  })

  describe('State Management', () => {
    it('starts in idle state', () => {
      render(<ScrapingForm {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /start scraping/i })).not.toBeDisabled()
      expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument()
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
    })

    it('transitions to processing state when scraping starts', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm {...defaultProps} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const submitButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
        expect(screen.getByTestId('spinner')).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
      })
    })

    it('shows progress updates during processing', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm {...defaultProps} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const submitButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(submitButton)
      
      // Wait for processing to start
      await waitFor(() => {
        expect(screen.getByText(/initializing scraper/i)).toBeInTheDocument()
      })

      // Progress should update
      await waitFor(() => {
        expect(screen.getByText(/0\/50 items/)).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('transitions to completed state when scraping finishes', async () => {
      const user = userEvent.setup()
      const onSuccess = jest.fn()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm {...defaultProps} onSuccess={onSuccess} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const submitButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(submitButton)
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText(/scraping completed successfully/i)).toBeInTheDocument()
      }, { timeout: 10000 })
      
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  describe('Max Results Configuration', () => {
    it('provides correct max results options', () => {
      render(<ScrapingForm {...defaultProps} />)
      
      const maxResultsSelect = screen.getByTestId('combobox')
      const options = Array.from(maxResultsSelect.querySelectorAll('option'))
      
      expect(options).toHaveLength(5)
      expect(options.map(option => option.value)).toEqual(['10', '25', '50', '100', '200'])
    })

    it('sets default max results based on scraping type', () => {
      const { rerender } = render(<ScrapingForm {...defaultProps} scrapingType="instagram" />)
      
      expect(screen.getByTestId('combobox')).toHaveValue('50')
      
      rerender(<ScrapingForm {...defaultProps} scrapingType="google-maps" />)
      
      expect(screen.getByTestId('combobox')).toHaveValue('100')
    })

    it('allows user to change max results', async () => {
      const user = userEvent.setup()
      render(<ScrapingForm {...defaultProps} />)
      
      const maxResultsSelect = screen.getByTestId('combobox')
      await user.selectOptions(maxResultsSelect, '200')
      
      expect(maxResultsSelect).toHaveValue('200')
    })
  })

  describe('Action Buttons', () => {
    it('shows start scraping button in idle state', () => {
      render(<ScrapingForm {...defaultProps} />)
      
      const startButton = screen.getByRole('button', { name: /start scraping/i })
      expect(startButton).toBeInTheDocument()
      expect(startButton).not.toBeDisabled()
    })

    it('shows stop scraping button during processing', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm {...defaultProps} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const startButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(startButton)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop scraping/i })).toBeInTheDocument()
      })
    })

    it('shows export results button when completed', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm {...defaultProps} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const startButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(startButton)
      
      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export results/i })
        expect(exportButton).not.toBeDisabled()
      }, { timeout: 10000 })
    })

    it('handles reset button functionality', async () => {
      const user = userEvent.setup()
      render(<ScrapingForm {...defaultProps} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const resetButton = screen.getByRole('button', { name: /reset form/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      expect(urlInput).toHaveValue('https://instagram.com/testuser')
      
      await user.click(resetButton)
      
      expect(urlInput).toHaveValue('')
      expect(screen.getByTestId('combobox')).toHaveValue('50') // Default for Instagram
    })
  })

  describe('Error Handling', () => {
    it('shows error when user is not authenticated', async () => {
      const mockUnauthenticatedAuth = {
        user: null,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        isAuthenticated: false
      }

      jest.doMock('@/features/auth', () => ({
        useAuth: () => mockUnauthenticatedAuth
      }))

      const user = userEvent.setup()
      render(<ScrapingForm {...defaultProps} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const submitButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('You must log in first')).toBeInTheDocument()
      })
    })

    it('handles API errors gracefully', async () => {
      const user = userEvent.setup()
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      render(<ScrapingForm {...defaultProps} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const submitButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to start scraping. Please try again.')).toBeInTheDocument()
      })
    })

    it('handles HTTP error responses', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      
      render(<ScrapingForm {...defaultProps} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const submitButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to start scraping. Please try again.')).toBeInTheDocument()
      })
    })

    it('displays error messages with proper styling', async () => {
      const user = userEvent.setup()
      mockFetch.mockRejectedValueOnce(new Error('Test error'))
      
      render(<ScrapingForm {...defaultProps} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const submitButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(submitButton)
      
      await waitFor(() => {
        const errorContainer = screen.getByText('Errors occurred:').closest('div')
        expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200')
      })
    })
  })

  describe('API Integration', () => {
    it('sends correct payload for Instagram scraping', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm {...defaultProps} scrapingType="instagram" />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const submitButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/scraping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: 'https://instagram.com/testuser',
            maxResults: 50,
            userEmail: 'test@gmail.com',
            userid: 'test-user-id',
            scrapingType: 'instagram',
            coordinates: null
          })
        })
      })
    })

    it('sends correct payload for Google Maps scraping with coordinates', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm {...defaultProps} scrapingType="google-maps" />)
      
      const urlInput = screen.getByLabelText('Google Maps URL or Search Term')
      const latInput = screen.getByLabelText('Latitude')
      const lngInput = screen.getByLabelText('Longitude')
      const submitButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://maps.google.com/place/test')
      await user.type(latInput, '40.7128')
      await user.type(lngInput, '-74.0060')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/scraping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: 'https://maps.google.com/place/test',
            maxResults: 100,
            userEmail: 'test@gmail.com',
            userid: 'test-user-id',
            scrapingType: 'google-maps',
            coordinates: {
              latitude: 40.7128,
              longitude: -74.0060
            }
          })
        })
      })
    })

    it('sends null coordinates when not provided for Google Maps', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm {...defaultProps} scrapingType="google-maps" />)
      
      const urlInput = screen.getByLabelText('Google Maps URL or Search Term')
      const submitButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://maps.google.com/place/test')
      await user.click(submitButton)
      
      await waitFor(() => {
        const call = mockFetch.mock.calls[0]
        const payload = JSON.parse(call[1].body)
        expect(payload.coordinates).toBeNull()
      })
    })
  })

  describe('Progress Simulation', () => {
    it('simulates realistic progress for different result counts', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm {...defaultProps} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const maxResultsSelect = screen.getByTestId('combobox')
      const submitButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.selectOptions(maxResultsSelect, '200')
      await user.click(submitButton)
      
      // Should show initial progress
      await waitFor(() => {
        expect(screen.getByText(/0\/200 items/)).toBeInTheDocument()
      })

      // Progress should increase over time
      await waitFor(() => {
        const progressText = screen.getByText(/\d+\/200 items/)
        const match = progressText.textContent?.match(/(\d+)\/200/)
        const currentProgress = match ? parseInt(match[1]) : 0
        expect(currentProgress).toBeGreaterThan(0)
      }, { timeout: 3000 })
    })

    it('shows different progress steps', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm {...defaultProps} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const submitButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(submitButton)
      
      // Should show initial step
      await waitFor(() => {
        expect(screen.getByText(/initializing scraper/i)).toBeInTheDocument()
      })

      // Should progress through steps
      await waitFor(() => {
        expect(screen.getByText(/validating url/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ScrapingForm {...defaultProps} />)
      
      expect(screen.getByLabelText('Instagram URL')).toBeInTheDocument()
      expect(screen.getByLabelText('Max Results')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start scraping/i })).toBeInTheDocument()
    })

    it('has proper form structure', () => {
      render(<ScrapingForm {...defaultProps} />)
      
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
    })

    it('has proper progress bar accessibility', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm {...defaultProps} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const submitButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(submitButton)
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar')
        expect(progressBar).toBeInTheDocument()
        expect(progressBar).toHaveAttribute('aria-valuenow')
      })
    })

    it('maintains keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<ScrapingForm {...defaultProps} />)
      
      // Tab through form elements
      await user.tab()
      expect(screen.getByLabelText('Instagram URL')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByTestId('combobox')).toHaveFocus()
    })
  })

  describe('Responsive Design', () => {
    it('applies responsive classes correctly', () => {
      render(<ScrapingForm {...defaultProps} />)
      
      const form = screen.getByRole('form').closest('div')
      expect(form).toHaveClass('flex', 'flex-col', 'space-y-6')
    })

    it('handles coordinate inputs layout for Google Maps', () => {
      render(<ScrapingForm {...defaultProps} scrapingType="google-maps" />)
      
      const coordinateContainer = screen.getByLabelText('Latitude').closest('.grid')
      expect(coordinateContainer).toHaveClass('grid-cols-2', 'gap-4')
    })
  })

  describe('Integration with Parent Component', () => {
    it('calls onSuccess callback when scraping completes', async () => {
      const user = userEvent.setup()
      const onSuccess = jest.fn()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm {...defaultProps} onSuccess={onSuccess} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const submitButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      }, { timeout: 10000 })
    })

    it('handles scrapingType prop changes', () => {
      const { rerender } = render(<ScrapingForm {...defaultProps} scrapingType="instagram" />)
      
      expect(screen.getByLabelText('Instagram URL')).toBeInTheDocument()
      expect(screen.queryByLabelText('Latitude')).not.toBeInTheDocument()
      
      rerender(<ScrapingForm {...defaultProps} scrapingType="google-maps" />)
      
      expect(screen.getByLabelText('Google Maps URL or Search Term')).toBeInTheDocument()
      expect(screen.getByLabelText('Latitude')).toBeInTheDocument()
    })
  })
})