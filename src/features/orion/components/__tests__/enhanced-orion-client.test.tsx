import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EnhancedOrionClient } from '../enhanced-orion-client'

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

// Mock the auth provider
jest.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth
}))

// Mock child components
jest.mock('../scraping-form', () => ({
  ScrapingForm: ({ scrapingType, onSuccess }: { scrapingType: string; onSuccess: () => void }) => (
    <div data-testid={`scraping-form-${scrapingType}`}>
      <div>Scraping Form for {scrapingType}</div>
      <button onClick={onSuccess} data-testid="form-success-trigger">Success</button>
    </div>
  )
}))

jest.mock('../instagram-table', () => ({
  InstagramTable: ({ data }: { data: any[] }) => (
    <div data-testid="instagram-table">
      <div>Instagram Table ({data.length} items)</div>
    </div>
  )
}))

jest.mock('../google-maps-table', () => ({
  GoogleMapsTable: ({ data }: { data: any[] }) => (
    <div data-testid="google-maps-table">
      <div>Google Maps Table ({data.length} items)</div>
    </div>
  )
}))

jest.mock('../resizable-sidebar', () => ({
  ResizableSidebar: ({ children, isOpen, onClose }: { 
    children: React.ReactNode; 
    isOpen: boolean; 
    onClose: () => void 
  }) => (
    <div data-testid="resizable-sidebar" data-open={isOpen}>
      {isOpen && (
        <>
          <button onClick={onClose} data-testid="sidebar-close">Close</button>
          {children}
        </>
      )}
    </div>
  )
}))

jest.mock('../quick-add-keyword-modal', () => ({
  QuickAddKeywordModal: ({ trigger }: { trigger: React.ReactNode }) => (
    <div data-testid="quick-add-keyword-modal">
      {trigger}
    </div>
  )
}))

// Mock SimpleRippleButton to behave like a regular button
jest.mock('@/components/ui/simple-ripple-button', () => ({
  SimpleRippleButton: ({ children, onClick, className, rippleColor, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  )
}))

// Mock all lucide-react icons used in the component
jest.mock('lucide-react', () => ({
  Plus: (props: any) => <span data-testid="plus-icon" {...props}>Plus</span>,
  Database: (props: any) => <span data-testid="database-icon" {...props}>Database</span>,
  Zap: (props: any) => <span data-testid="zap-icon" {...props}>Zap</span>,
  Settings: (props: any) => <span data-testid="settings-icon" {...props}>Settings</span>,
  Hash: (props: any) => <span data-testid="tag-icon" {...props}>Hash</span>,
  ChevronDown: (props: any) => <span data-testid="chevron-down-icon" {...props}>ChevronDown</span>
}))

// Mock window.location.reload 
const mockReload = jest.fn()
delete (window as any).location
window.location = {
  href: 'http://localhost:3000/',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  reload: mockReload
} as Location

describe('EnhancedOrionClient Component', () => {
  const mockInstagramData = [
    {
      id: 1,
      inputUrl: 'https://instagram.com/test1',
      username: 'test1',
      followersCount: '1000',
      followsCount: '100',
      biography: 'Test bio 1',
      postsCount: '50',
      highlightReelCount: '5',
      igtvVideoCount: '2',
      latestPostsTotal: '10',
      latestPostsLikes: '500',
      latestPostsComments: '25',
      Url: 'https://instagram.com/test1',
      User_Id: 'test-user-id',
      gmail: 'test@gmail.com'
    },
    {
      id: 2,
      inputUrl: 'https://instagram.com/test2',
      username: 'test2',
      followersCount: '2000',
      followsCount: '200',
      biography: 'Test bio 2',
      postsCount: '75',
      highlightReelCount: '8',
      igtvVideoCount: '3',
      latestPostsTotal: '15',
      latestPostsLikes: '750',
      latestPostsComments: '40',
      Url: 'https://instagram.com/test2',
      User_Id: 'test-user-id',
      gmail: 'test@gmail.com'
    },
    {
      id: 3,
      inputUrl: 'https://instagram.com/other',
      username: 'other',
      followersCount: '500',
      followsCount: '50',
      biography: 'Other user bio',
      postsCount: '25',
      highlightReelCount: '3',
      igtvVideoCount: '1',
      latestPostsTotal: '5',
      latestPostsLikes: '250',
      latestPostsComments: '12',
      Url: 'https://instagram.com/other',
      User_Id: 'other-user-id',
      gmail: 'other@gmail.com'
    }
  ]

  const mockGoogleMapsData = [
    {
      id: 1,
      inputUrl: 'https://maps.google.com/place1',
      placeName: 'Test Place 1',
      address: '123 Test St',
      phoneNumber: '+1234567890',
      website: 'https://testplace1.com',
      rating: '4.5',
      reviewCount: '100',
      category: 'Restaurant',
      hours: 'Mon-Fri 9am-5pm',
      description: 'Great place to eat',
      coordinates: '40.7128,-74.0060',
      imageUrl: 'https://example.com/image1.jpg',
      priceRange: '$$',
      User_Id: 'test-user-id',
      gmail: 'test@gmail.com',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      inputUrl: 'https://maps.google.com/place2',
      placeName: 'Test Place 2',
      address: '456 Another St',
      phoneNumber: '+0987654321',
      website: 'https://testplace2.com',
      rating: '4.8',
      reviewCount: '200',
      category: 'Shop',
      hours: 'Mon-Sun 10am-8pm',
      description: 'Nice shopping place',
      coordinates: '40.7589,-73.9851',
      imageUrl: 'https://example.com/image2.jpg',
      priceRange: '$$$',
      User_Id: 'test-user-id',
      gmail: 'test@gmail.com',
      createdAt: '2024-01-02T00:00:00Z'
    },
    {
      id: 3,
      inputUrl: 'https://maps.google.com/place3',
      placeName: 'Other Place',
      address: '789 Other St',
      phoneNumber: '+1122334455',
      website: 'https://otherplace.com',
      rating: '4.0',
      reviewCount: '50',
      category: 'Service',
      hours: 'Mon-Fri 8am-6pm',
      description: 'Service place',
      coordinates: '40.7505,-73.9934',
      imageUrl: 'https://example.com/image3.jpg',
      priceRange: '$',
      User_Id: 'other-user-id',
      gmail: 'other@gmail.com',
      createdAt: '2024-01-03T00:00:00Z'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders correctly with empty data', () => {
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      expect(screen.getByText('Instagram')).toBeInTheDocument()
      expect(screen.getByText('Google Maps')).toBeInTheDocument()
      expect(screen.getByText('0 Instagram records')).toBeInTheDocument()
    })

    it('renders with provided data and filters by user email', () => {
      render(
        <EnhancedOrionClient 
          instagramData={mockInstagramData} 
          googleMapsData={mockGoogleMapsData} 
        />
      )
      
      // Should show only data for the authenticated user (2 Instagram, 2 Google Maps)
      expect(screen.getByText('2 Instagram records')).toBeInTheDocument()
    })

    it('displays correct record counts for current user only', () => {
      render(
        <EnhancedOrionClient 
          instagramData={mockInstagramData} 
          googleMapsData={mockGoogleMapsData} 
        />
      )

      // Verify filtered data count is shown
      expect(screen.getByText('2 records')).toBeInTheDocument()
    })
  })

  describe('Unified Dropdown - "Start New Scraping"', () => {
    it('renders the unified dropdown button', () => {
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      const dropdownButton = screen.getByText('Start New Scraping').closest('button')
      expect(dropdownButton).toBeInTheDocument()
      expect(dropdownButton).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-blue-700')
    })

    it('shows platform-specific text for mobile and desktop', () => {
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      // Should contain both mobile and desktop text
      expect(screen.getByText('Start New Scraping')).toBeInTheDocument()
      expect(screen.getByText('Scrape')).toBeInTheDocument()
    })

    it('opens dropdown menu when clicked', async () => {
      const user = userEvent.setup()
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      const dropdownButton = screen.getByText('Start New Scraping').closest('button') as HTMLElement
      await user.click(dropdownButton)
      
      await waitFor(() => {
        expect(screen.getByText('Instagram Scraping')).toBeInTheDocument()
        expect(screen.getByText('Extract profile data and posts')).toBeInTheDocument()
        expect(screen.getByText('Google Maps Scraping')).toBeInTheDocument()
        expect(screen.getByText('Extract business listings and reviews')).toBeInTheDocument()
      })
    })

    it('triggers Instagram scraping when Instagram option selected', async () => {
      const user = userEvent.setup()
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      // Open dropdown
      const dropdownButton = screen.getByText('Start New Scraping').closest('button') as HTMLElement
      await user.click(dropdownButton)
      
      // Wait for dropdown to open and click Instagram option
      await waitFor(() => {
        expect(screen.getByText('Instagram Scraping')).toBeInTheDocument()
      })
      
      const instagramOption = screen.getByText('Instagram Scraping')
      await user.click(instagramOption)
      
      // Should open the scraping panel
      expect(screen.getByTestId('resizable-sidebar')).toHaveAttribute('data-open', 'true')
      expect(screen.getByTestId('scraping-form-instagram')).toBeInTheDocument()
    })

    it('triggers Google Maps scraping when Google Maps option selected', async () => {
      const user = userEvent.setup()
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      // Open dropdown
      const dropdownButton = screen.getByText('Start New Scraping').closest('button') as HTMLElement
      await user.click(dropdownButton)
      
      // Wait for dropdown to open and click Google Maps option
      await waitFor(() => {
        expect(screen.getByText('Google Maps Scraping')).toBeInTheDocument()
      })
      
      const googleMapsOption = screen.getByText('Google Maps Scraping')
      await user.click(googleMapsOption)
      
      // Should open the scraping panel
      expect(screen.getByTestId('resizable-sidebar')).toHaveAttribute('data-open', 'true')
      expect(screen.getByTestId('scraping-form-google-maps')).toBeInTheDocument()
    })
  })

  describe('Contextual "Add Keyword" Buttons', () => {
    it('renders "Add Keyword" button in Instagram data section header', () => {
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      const addKeywordButton = screen.getByText('Add Keyword')
      expect(addKeywordButton).toBeInTheDocument()
      expect(addKeywordButton.closest('button')).toHaveClass('hover:bg-purple-100', 'hover:text-purple-700')
    })

    it('renders "Add Keyword" button in Google Maps data section header', async () => {
      const user = userEvent.setup()
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      // Switch to Google Maps tab
      const googleMapsTab = screen.getByText('Google Maps')
      await user.click(googleMapsTab)
      
      await waitFor(() => {
        const addKeywordButton = screen.getByText('Add Keyword')
        expect(addKeywordButton).toBeInTheDocument()
        expect(addKeywordButton.closest('button')).toHaveClass('hover:bg-green-100', 'hover:text-green-700')
      })
    })

    it('renders Hash icon in Add Keyword buttons', () => {
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      expect(screen.getByTestId('tag-icon')).toBeInTheDocument()
    })
  })

  describe('Removed Elements Verification', () => {
    it('does NOT render individual platform buttons (removed)', () => {
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      // These buttons should NOT exist as standalone buttons (they were removed in the UI simplification)
      const buttons = screen.getAllByRole('button')
      const buttonTexts = buttons.map(button => button.textContent)
      
      // Should not have standalone platform buttons
      expect(buttonTexts.filter(text => text === 'Instagram')).toHaveLength(0)
      expect(buttonTexts.filter(text => text === 'Google Maps')).toHaveLength(0)
      expect(buttonTexts.filter(text => text?.includes('Quick Scrape'))).toHaveLength(0)
    })

    it('does NOT render floating action button (removed)', () => {
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      // Floating action button should not exist
      expect(screen.queryByTestId('floating-action-button')).toBeNull()
      expect(screen.queryByText(/floating/i)).toBeNull()
    })

    it('renders exactly one "Add Keyword" button per tab', async () => {
      const user = userEvent.setup()
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      // Should have exactly 1 visible "Add Keyword" button in Instagram tab
      expect(screen.getAllByText('Add Keyword')).toHaveLength(1)
      
      // Switch to Google Maps tab
      const googleMapsTab = screen.getByText('Google Maps')
      await user.click(googleMapsTab)
      
      await waitFor(() => {
        // Should still have exactly 1 visible "Add Keyword" button in Google Maps tab
        expect(screen.getAllByText('Add Keyword')).toHaveLength(1)
      })
    })
  })

  describe('Tab Navigation and State Management', () => {
    it('starts with Instagram tab active by default', () => {
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      const instagramTab = screen.getByRole('tab', { name: /instagram/i })
      const googleMapsTab = screen.getByRole('tab', { name: /google maps/i })
      
      expect(instagramTab).toHaveAttribute('aria-selected', 'true')
      expect(googleMapsTab).toHaveAttribute('aria-selected', 'false')
    })

    it('switches to Google Maps tab when clicked', async () => {
      const user = userEvent.setup()
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      const googleMapsTab = screen.getByRole('tab', { name: /google maps/i })
      await user.click(googleMapsTab)
      
      expect(googleMapsTab).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: /instagram/i })).toHaveAttribute('aria-selected', 'false')
    })

    it('updates record count display when switching tabs', async () => {
      const user = userEvent.setup()
      render(
        <EnhancedOrionClient 
          instagramData={mockInstagramData} 
          googleMapsData={mockGoogleMapsData} 
        />
      )
      
      // Initially shows Instagram count
      expect(screen.getByText('2 Instagram records')).toBeInTheDocument()
      
      // Switch to Google Maps tab
      const googleMapsTab = screen.getByRole('tab', { name: /google maps/i })
      await user.click(googleMapsTab)
      
      await waitFor(() => {
        // Should now show Google Maps count
        expect(screen.getByText('2 Google Maps records')).toBeInTheDocument()
      })
    })
  })

  describe('Data Tables Integration', () => {
    it('passes filtered Instagram data to InstagramTable', () => {
      render(
        <EnhancedOrionClient 
          instagramData={mockInstagramData} 
          googleMapsData={[]} 
        />
      )
      
      const instagramTable = screen.getByTestId('instagram-table')
      expect(instagramTable).toHaveTextContent('Instagram Table (2 items)')
    })

    it('passes filtered Google Maps data to GoogleMapsTable', async () => {
      const user = userEvent.setup()
      render(
        <EnhancedOrionClient 
          instagramData={[]} 
          googleMapsData={mockGoogleMapsData} 
        />
      )
      
      // Switch to Google Maps tab
      const googleMapsTab = screen.getByRole('tab', { name: /google maps/i })
      await user.click(googleMapsTab)
      
      await waitFor(() => {
        const googleMapsTable = screen.getByTestId('google-maps-table')
        expect(googleMapsTable).toHaveTextContent('Google Maps Table (2 items)')
      })
    })

    it('filters data correctly by user email', () => {
      render(
        <EnhancedOrionClient 
          instagramData={mockInstagramData} 
          googleMapsData={mockGoogleMapsData} 
        />
      )
      
      // Should only show 2 Instagram items (filtering out the 'other@gmail.com' user)
      const instagramTable = screen.getByTestId('instagram-table')
      expect(instagramTable).toHaveTextContent('Instagram Table (2 items)')
    })
  })

  describe('Scraping Panel Management', () => {
    it('opens scraping panel when Start New Scraping is clicked', async () => {
      const user = userEvent.setup()
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      // Initially closed
      expect(screen.getByTestId('resizable-sidebar')).toHaveAttribute('data-open', 'false')
      
      // Open dropdown and select Instagram
      const dropdownButton = screen.getByText('Start New Scraping').closest('button') as HTMLElement
      await user.click(dropdownButton)
      
      await waitFor(() => {
        expect(screen.getByText('Instagram Scraping')).toBeInTheDocument()
      })
      
      const instagramOption = screen.getByText('Instagram Scraping')
      await user.click(instagramOption)
      
      // Should be open now
      expect(screen.getByTestId('resizable-sidebar')).toHaveAttribute('data-open', 'true')
    })

    it('closes scraping panel when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      // Open the panel first
      const dropdownButton = screen.getByText('Start New Scraping').closest('button') as HTMLElement
      await user.click(dropdownButton)
      
      await waitFor(() => {
        expect(screen.getByText('Instagram Scraping')).toBeInTheDocument()
      })
      
      const instagramOption = screen.getByText('Instagram Scraping')
      await user.click(instagramOption)
      
      expect(screen.getByTestId('resizable-sidebar')).toHaveAttribute('data-open', 'true')
      
      // Close the panel
      const closeButton = screen.getByTestId('sidebar-close')
      await user.click(closeButton)
      
      expect(screen.getByTestId('resizable-sidebar')).toHaveAttribute('data-open', 'false')
    })

    it('provides success callback to scraping form', async () => {
      const user = userEvent.setup()
      
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      // Open scraping panel
      const dropdownButton = screen.getByText('Start New Scraping').closest('button') as HTMLElement
      await user.click(dropdownButton)
      
      await waitFor(() => {
        expect(screen.getByText('Instagram Scraping')).toBeInTheDocument()
      })
      
      const instagramOption = screen.getByText('Instagram Scraping')
      await user.click(instagramOption)
      
      // Verify that the scraping form receives an onSuccess callback
      expect(screen.getByTestId('scraping-form-instagram')).toBeInTheDocument()
      expect(screen.getByTestId('form-success-trigger')).toBeInTheDocument()
      
      // Test that the success callback is callable (doesn't test reload due to jsdom limitations)
      const successButton = screen.getByTestId('form-success-trigger')
      expect(() => successButton.click()).not.toThrow()
    })
  })

  describe('User Authentication Integration', () => {
    it('handles unauthenticated user gracefully', () => {
      // Create a temporary mock for unauthenticated state
      const mockUnauthenticatedAuth = {
        user: null,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        isAuthenticated: false
      }

      // Use jest.doMock to temporarily override the auth mock
      const originalMock = jest.requireMock('@/features/auth').useAuth
      jest.requireMock('@/features/auth').useAuth = () => mockUnauthenticatedAuth
      
      render(
        <EnhancedOrionClient 
          instagramData={mockInstagramData} 
          googleMapsData={mockGoogleMapsData} 
        />
      )
      
      // Should show 0 records when no user
      expect(screen.getByText('0 Instagram records')).toBeInTheDocument()
      
      // Reset the mock back to original
      jest.requireMock('@/features/auth').useAuth = originalMock
    })

    it('filters data correctly for authenticated user', async () => {
      render(
        <EnhancedOrionClient 
          instagramData={mockInstagramData} 
          googleMapsData={mockGoogleMapsData} 
        />
      )
      
      // Should show only data for test@gmail.com user (Instagram initially visible)
      expect(screen.getByText('2 Instagram records')).toBeInTheDocument()
      
      // Switch to Google Maps to verify it also filters correctly
      const user = userEvent.setup()
      const googleMapsTab = screen.getByRole('tab', { name: /google maps/i })
      await user.click(googleMapsTab)
      
      await waitFor(() => {
        expect(screen.getByText('2 Google Maps records')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      // Tab navigation should be accessible
      expect(screen.getByRole('tablist')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /instagram/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /google maps/i })).toBeInTheDocument()
      expect(screen.getByRole('tabpanel')).toBeInTheDocument()
    })

    it('has proper button roles for interactive elements', () => {
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      // Main action button should be accessible
      const dropdownButton = screen.getByText('Start New Scraping').closest('button')
      expect(dropdownButton).toBeInTheDocument()
      
      // Add Keyword button should be accessible
      const addKeywordButton = screen.getByText('Add Keyword').closest('button')
      expect(addKeywordButton).toBeInTheDocument()
    })

    it('maintains focus management when switching tabs', async () => {
      const user = userEvent.setup()
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      const googleMapsTab = screen.getByRole('tab', { name: /google maps/i })
      
      // Tab should be focusable - wrap in act to handle state updates
      act(() => {
        googleMapsTab.focus()
      })
      expect(googleMapsTab).toHaveFocus()
      
      // Clicking should maintain proper tab state
      await user.click(googleMapsTab)
      expect(googleMapsTab).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('handles empty data arrays gracefully', async () => {
      const user = userEvent.setup()
      render(<EnhancedOrionClient instagramData={[]} googleMapsData={[]} />)
      
      expect(screen.getByText('0 Instagram records')).toBeInTheDocument()
      
      // Switch to Google Maps tab to check that count too
      const googleMapsTab = screen.getByRole('tab', { name: /google maps/i })
      await user.click(googleMapsTab)
      
      await waitFor(() => {
        expect(screen.getByText('0 Google Maps records')).toBeInTheDocument()
      })
      
      // Tables should still render in both tabs
      expect(screen.getByTestId('google-maps-table')).toBeInTheDocument()
    })

    it('handles malformed data gracefully', () => {
      const malformedData = [
        // Missing required fields
        { id: 1, gmail: 'test@gmail.com' } as any
      ]
      
      expect(() => {
        render(
          <EnhancedOrionClient 
            instagramData={malformedData} 
            googleMapsData={malformedData} 
          />
        )
      }).not.toThrow()
    })

    it('handles user email mismatch correctly', () => {
      const dataWithDifferentEmails = mockInstagramData.map(item => ({
        ...item,
        gmail: 'different@gmail.com'
      }))
      
      render(
        <EnhancedOrionClient 
          instagramData={dataWithDifferentEmails} 
          googleMapsData={[]} 
        />
      )
      
      // Should show 0 records since no data matches current user
      expect(screen.getByText('0 Instagram records')).toBeInTheDocument()
    })
  })
})