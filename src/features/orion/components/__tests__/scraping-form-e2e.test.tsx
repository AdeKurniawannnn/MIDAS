import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScrapingForm } from '../scraping-form'

// Mock for comprehensive end-to-end testing
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock real-world auth scenarios
const createMockAuth = (overrides = {}) => ({
  user: {
    id: 'test-user-id',
    email: 'test@gmail.com',
    firstName: 'Test',
    lastName: 'User'
  },
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: true,
  ...overrides
})

let mockAuthState = createMockAuth()

jest.mock('@/features/auth', () => ({
  useAuth: () => mockAuthState
}))

// Mock UI components to track interactions
const mockAnimatedButtonHook = {
  loading: false,
  success: false,
  error: false,
  reset: jest.fn(),
  showLoading: jest.fn(),
  showSuccess: jest.fn(),
  showError: jest.fn()
}

jest.mock('@/components/ui/animated-button', () => ({
  AnimatedButton: ({ 
    children, 
    onClick, 
    disabled, 
    loading, 
    success, 
    error,
    type,
    ...props 
  }: any) => (
    <button 
      onClick={onClick}
      disabled={disabled || loading}
      data-loading={loading}
      data-success={success}
      data-error={error}
      type={type}
      {...props}
    >
      {loading ? 'Loading...' : success ? 'Success!' : error ? 'Error!' : children}
    </button>
  ),
  useAnimatedButton: () => mockAnimatedButtonHook
}))

jest.mock('@/components/ui/progress-bar', () => ({
  ProgressBar: ({ value, variant, animated }: any) => (
    <div 
      data-testid="progress-bar"
      data-value={value}
      data-variant={variant}
      data-animated={animated}
      role="progressbar"
      aria-valuenow={value}
      style={{ width: `${value}%` }}
    >
      <div className={`progress-fill ${variant}`} />
      <span>{value}%</span>
    </div>
  )
}))

jest.mock('@/components/ui/spinner', () => ({
  Spinner: ({ size }: any) => (
    <div 
      data-testid="spinner" 
      data-size={size}
      className="animate-spin"
    >
      ⟳
    </div>
  )
}))

jest.mock('@/components/ui/combobox', () => ({
  Combobox: ({ 
    options, 
    value, 
    onChange, 
    disabled,
    ...props 
  }: any) => (
    <select
      data-testid="max-results-combobox"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
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

describe('ScrapingForm End-to-End Tests', () => {
  const defaultProps = {
    scrapingType: 'instagram' as const,
    onSuccess: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
    mockAuthState = createMockAuth()
    Object.values(mockAnimatedButtonHook).forEach(fn => 
      typeof fn === 'function' && fn.mockClear?.()
    )
  })

  describe('Complete Instagram Scraping Workflow', () => {
    it('completes full Instagram scraping flow successfully', async () => {
      const user = userEvent.setup()
      const onSuccess = jest.fn()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm scrapingType="instagram" onSuccess={onSuccess} />)
      
      // Step 1: Enter Instagram URL
      const urlInput = screen.getByLabelText('Instagram URL')
      await user.type(urlInput, 'https://instagram.com/testuser')
      
      // Step 2: Verify smart defaults are applied
      await waitFor(() => {
        expect(screen.getByTestId('max-results-combobox')).toHaveValue('50')
      })
      
      // Step 3: Customize max results
      const maxResultsSelect = screen.getByTestId('max-results-combobox')
      await user.selectOptions(maxResultsSelect, '100')
      
      // Step 4: Start scraping
      const startButton = screen.getByRole('button', { name: /start scraping/i })
      expect(startButton).not.toBeDisabled()
      await user.click(startButton)
      
      // Step 5: Verify processing state
      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
        expect(screen.getByTestId('spinner')).toBeInTheDocument()
        expect(screen.getByText(/initializing scraper/i)).toBeInTheDocument()
        expect(startButton).toBeDisabled()
      })
      
      // Step 6: Verify progress updates
      await waitFor(() => {
        expect(screen.getByText(/0\/100 items/)).toBeInTheDocument()
      })
      
      // Step 7: Wait for completion
      await waitFor(() => {
        expect(screen.getByText(/scraping completed successfully/i)).toBeInTheDocument()
        expect(screen.getByText(/100\/100 items/)).toBeInTheDocument()
      }, { timeout: 15000 })
      
      // Step 8: Verify completion state
      expect(onSuccess).toHaveBeenCalled()
      expect(screen.getByRole('button', { name: /export results/i })).not.toBeDisabled()
      
      // Step 9: Test export functionality
      const exportButton = screen.getByRole('button', { name: /export results/i })
      await user.click(exportButton)
      
      // Verify API was called with correct parameters
      expect(mockFetch).toHaveBeenCalledWith('/api/scraping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://instagram.com/testuser',
          maxResults: 100,
          userEmail: 'test@gmail.com',
          userid: 'test-user-id',
          scrapingType: 'instagram',
          coordinates: null
        })
      })
    })

    it('handles Instagram profile with auto-detection features', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm scrapingType="instagram" onSuccess={jest.fn()} />)
      
      // Test different Instagram URL formats
      const testUrls = [
        'https://instagram.com/testuser',
        'https://www.instagram.com/testuser/',
        'https://instagram.com/testuser?hl=en'
      ]
      
      for (const url of testUrls) {
        const urlInput = screen.getByLabelText('Instagram URL')
        await user.clear(urlInput)
        await user.type(urlInput, url)
        
        // Verify smart defaults are applied for each URL format
        await waitFor(() => {
          expect(screen.getByTestId('max-results-combobox')).toHaveValue('50')
        })
      }
    })
  })

  describe('Complete Google Maps Scraping Workflow', () => {
    it('completes full Google Maps scraping flow with coordinate extraction', async () => {
      const user = userEvent.setup()
      const onSuccess = jest.fn()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm scrapingType="google-maps" onSuccess={onSuccess} />)
      
      // Step 1: Enter Google Maps URL with coordinates
      const urlInput = screen.getByLabelText('Google Maps URL or Search Term')
      const mapsUrl = 'https://maps.google.com/@40.7128,-74.0060,15z'
      await user.type(urlInput, mapsUrl)
      
      // Step 2: Verify smart defaults and coordinate extraction
      await waitFor(() => {
        expect(screen.getByTestId('max-results-combobox')).toHaveValue('100')
        expect(screen.getByLabelText('Latitude')).toHaveValue('40.7128')
        expect(screen.getByLabelText('Longitude')).toHaveValue('-74.0060')
      })
      
      // Step 3: Modify coordinates if needed
      const latInput = screen.getByLabelText('Latitude')
      const lngInput = screen.getByLabelText('Longitude')
      await user.clear(latInput)
      await user.type(latInput, '40.7589')
      await user.clear(lngInput)
      await user.type(lngInput, '-73.9851')
      
      // Step 4: Start scraping
      const startButton = screen.getByRole('button', { name: /start scraping/i })
      await user.click(startButton)
      
      // Step 5: Verify processing with coordinate data
      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
        expect(screen.getByText(/connecting to target/i)).toBeInTheDocument()
      })
      
      // Step 6: Wait for completion
      await waitFor(() => {
        expect(screen.getByText(/scraping completed successfully/i)).toBeInTheDocument()
      }, { timeout: 15000 })
      
      // Verify API was called with coordinates
      expect(mockFetch).toHaveBeenCalledWith('/api/scraping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: mapsUrl,
          maxResults: 100,
          userEmail: 'test@gmail.com',
          userid: 'test-user-id',
          scrapingType: 'google-maps',
          coordinates: {
            latitude: 40.7589,
            longitude: -73.9851
          }
        })
      })
      
      expect(onSuccess).toHaveBeenCalled()
    })

    it('handles Google Maps search queries without coordinates', async () => {
      const user = userEvent.setup()
      const onSuccess = jest.fn()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm scrapingType="google-maps" onSuccess={onSuccess} />)
      
      // Use search query instead of URL
      const urlInput = screen.getByLabelText('Google Maps URL or Search Term')
      await user.type(urlInput, 'coffee shops in New York')
      
      // Coordinates should remain empty
      expect(screen.getByLabelText('Latitude')).toHaveValue('')
      expect(screen.getByLabelText('Longitude')).toHaveValue('')
      
      const startButton = screen.getByRole('button', { name: /start scraping/i })
      await user.click(startButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
      })
      
      // Wait for completion
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      }, { timeout: 15000 })
      
      // Verify coordinates are null in API call
      const call = mockFetch.mock.calls[0]
      const payload = JSON.parse(call[1].body)
      expect(payload.coordinates).toBeNull()
    })
  })

  describe('Error Recovery Workflows', () => {
    it('recovers from network errors and allows retry', async () => {
      const user = userEvent.setup()
      const onSuccess = jest.fn()
      
      // First attempt fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      render(<ScrapingForm scrapingType="instagram" onSuccess={onSuccess} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const startButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(startButton)
      
      // Should show error
      await waitFor(() => {
        expect(screen.getByText('Failed to start scraping. Please try again.')).toBeInTheDocument()
      })
      
      // Reset and try again
      const resetButton = screen.getByRole('button', { name: /reset form/i })
      await user.click(resetButton)
      
      // Form should be reset
      expect(urlInput).toHaveValue('')
      expect(screen.queryByText('Failed to start scraping')).not.toBeInTheDocument()
      
      // Second attempt succeeds
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(startButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
      })
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      }, { timeout: 15000 })
    })

    it('handles authentication errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Start with authenticated user
      render(<ScrapingForm scrapingType="instagram" onSuccess={jest.fn()} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const startButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      
      // Simulate auth state change to unauthenticated
      mockAuthState = createMockAuth({
        user: null,
        isAuthenticated: false
      })
      
      await user.click(startButton)
      
      await waitFor(() => {
        expect(screen.getByText('You must log in first')).toBeInTheDocument()
      })
      
      // Error should be displayed with proper styling
      const errorContainer = screen.getByText('Errors occurred:').closest('div')
      expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200')
    })
  })

  describe('User Experience Workflows', () => {
    it('provides smooth stop and restart workflow', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm scrapingType="instagram" onSuccess={jest.fn()} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const startButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(startButton)
      
      // Wait for processing to start
      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /stop scraping/i })).toBeInTheDocument()
      })
      
      // Stop the scraping
      const stopButton = screen.getByRole('button', { name: /stop scraping/i })
      await user.click(stopButton)
      
      // Should return to idle state
      expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument()
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start scraping/i })).not.toBeDisabled()
      
      // Should be able to start again
      mockFetch.mockResolvedValueOnce({ ok: true })
      await user.click(startButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
      })
    })

    it('maintains form state during processing', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm scrapingType="google-maps" onSuccess={jest.fn()} />)
      
      const urlInput = screen.getByLabelText('Google Maps URL or Search Term')
      const latInput = screen.getByLabelText('Latitude')
      const lngInput = screen.getByLabelText('Longitude')
      const maxResultsSelect = screen.getByTestId('max-results-combobox')
      
      // Fill out form
      await user.type(urlInput, 'https://maps.google.com/place/test')
      await user.type(latInput, '40.7128')
      await user.type(lngInput, '-74.0060')
      await user.selectOptions(maxResultsSelect, '200')
      
      // Start scraping
      const startButton = screen.getByRole('button', { name: /start scraping/i })
      await user.click(startButton)
      
      // During processing, form inputs should be disabled but maintain values
      await waitFor(() => {
        expect(urlInput).toBeDisabled()
        expect(latInput).toBeDisabled()
        expect(lngInput).toBeDisabled()
        expect(maxResultsSelect).toBeDisabled()
        
        // Values should be preserved
        expect(urlInput).toHaveValue('https://maps.google.com/place/test')
        expect(latInput).toHaveValue('40.7128')
        expect(lngInput).toHaveValue('-74.0060')
        expect(maxResultsSelect).toHaveValue('200')
      })
    })

    it('shows realistic progress simulation based on result count', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      render(<ScrapingForm scrapingType="instagram" onSuccess={jest.fn()} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const maxResultsSelect = screen.getByTestId('max-results-combobox')
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.selectOptions(maxResultsSelect, '10') // Small result set
      
      const startButton = screen.getByRole('button', { name: /start scraping/i })
      await user.click(startButton)
      
      // Should complete faster for smaller result sets
      await waitFor(() => {
        expect(screen.getByText(/scraping completed successfully/i)).toBeInTheDocument()
        expect(screen.getByText(/10\/10 items/)).toBeInTheDocument()
      }, { timeout: 8000 }) // Should be faster than default 15s
      
      // Test larger result set
      await user.click(screen.getByRole('button', { name: /reset form/i }))
      
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.selectOptions(maxResultsSelect, '200') // Large result set
      await user.click(startButton)
      
      // Should show more gradual progress
      await waitFor(() => {
        expect(screen.getByText(/0\/200 items/)).toBeInTheDocument()
      })
      
      // Progress should be realistic for larger sets
      await waitFor(() => {
        const progressText = screen.getByText(/\d+\/200 items/)
        const match = progressText.textContent?.match(/(\d+)\/200/)
        const currentProgress = match ? parseInt(match[1]) : 0
        expect(currentProgress).toBeGreaterThan(0)
        expect(currentProgress).toBeLessThan(200) // Should not complete instantly
      }, { timeout: 5000 })
    })
  })

  describe('Cross-Platform URL Validation', () => {
    it('validates various Instagram URL formats', async () => {
      const user = userEvent.setup()
      
      const validInstagramUrls = [
        'https://instagram.com/testuser',
        'https://www.instagram.com/testuser',
        'https://instagram.com/testuser/',
        'https://www.instagram.com/testuser?hl=en',
        'https://instagram.com/p/ABC123',
        'https://www.instagram.com/p/ABC123/?hl=en'
      ]
      
      render(<ScrapingForm scrapingType="instagram" onSuccess={jest.fn()} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const maxResultsSelect = screen.getByTestId('max-results-combobox')
      
      for (const url of validInstagramUrls) {
        await user.clear(urlInput)
        await user.type(urlInput, url)
        
        // Should apply Instagram defaults
        await waitFor(() => {
          expect(maxResultsSelect).toHaveValue('50')
        })
        
        // Should not show validation errors
        expect(screen.queryByText('Please enter a valid URL')).not.toBeInTheDocument()
      }
    })

    it('validates various Google Maps URL formats', async () => {
      const user = userEvent.setup()
      
      const validGoogleMapsUrls = [
        { url: 'https://maps.google.com/place/test', coords: null },
        { url: 'https://goo.gl/maps/abc123', coords: null },
        { url: 'https://maps.google.com/@40.7128,-74.0060,15z', coords: { lat: '40.7128', lng: '-74.0060' } },
        { url: 'https://maps.google.com/?ll=40.7589,-73.9851&z=15', coords: { lat: '40.7589', lng: '-73.9851' } }
      ]
      
      render(<ScrapingForm scrapingType="google-maps" onSuccess={jest.fn()} />)
      
      const urlInput = screen.getByLabelText('Google Maps URL or Search Term')
      const maxResultsSelect = screen.getByTestId('max-results-combobox')
      const latInput = screen.getByLabelText('Latitude')
      const lngInput = screen.getByLabelText('Longitude')
      
      for (const { url, coords } of validGoogleMapsUrls) {
        await user.clear(urlInput)
        await user.clear(latInput)
        await user.clear(lngInput)
        
        await user.type(urlInput, url)
        
        // Should apply Google Maps defaults
        await waitFor(() => {
          expect(maxResultsSelect).toHaveValue('100')
        })
        
        // Check coordinate extraction
        if (coords) {
          await waitFor(() => {
            expect(latInput).toHaveValue(coords.lat)
            expect(lngInput).toHaveValue(coords.lng)
          })
        }
        
        // Should not show validation errors
        expect(screen.queryByText('Please enter a valid URL')).not.toBeInTheDocument()
      }
    })
  })

  describe('Performance and Resource Management', () => {
    it('handles rapid user interactions gracefully', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValue({ ok: true })
      
      render(<ScrapingForm scrapingType="instagram" onSuccess={jest.fn()} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const startButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      
      // Rapid clicking should not cause multiple API calls
      await user.click(startButton)
      await user.click(startButton)
      await user.click(startButton)
      
      // Only one API call should be made
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('cleans up resources when component unmounts', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({ ok: true })
      
      const { unmount } = render(<ScrapingForm scrapingType="instagram" onSuccess={jest.fn()} />)
      
      const urlInput = screen.getByLabelText('Instagram URL')
      const startButton = screen.getByRole('button', { name: /start scraping/i })
      
      await user.type(urlInput, 'https://instagram.com/testuser')
      await user.click(startButton)
      
      // Start processing
      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
      })
      
      // Unmount should not cause errors
      expect(() => unmount()).not.toThrow()
    })
  })
})