import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    a: ({ children, ...props }) => <a {...props}>{children}</a>,
    img: ({ children, ...props }) => <img {...props}>{children}</img>,
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
  }),
}))

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: jest.fn(() => ({ unsubscribe: jest.fn() })),
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon">Search</span>,
  User: () => <span data-testid="user-icon">User</span>,
  Settings: () => <span data-testid="settings-icon">Settings</span>,
  Menu: () => <span data-testid="menu-icon">Menu</span>,
  X: () => <span data-testid="x-icon">X</span>,
  ChevronDown: () => <span data-testid="chevron-down-icon">ChevronDown</span>,
  ChevronUp: () => <span data-testid="chevron-up-icon">ChevronUp</span>,
  Home: () => <span data-testid="home-icon">Home</span>,
  Dashboard: () => <span data-testid="dashboard-icon">Dashboard</span>,
  RotateCcw: () => <span data-testid="rotate-ccw-icon">RotateCcw</span>,
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  Minus: () => <span data-testid="minus-icon">Minus</span>,
  Edit: () => <span data-testid="edit-icon">Edit</span>,
  Trash: () => <span data-testid="trash-icon">Trash</span>,
  Download: () => <span data-testid="download-icon">Download</span>,
  Upload: () => <span data-testid="upload-icon">Upload</span>,
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  EyeOff: () => <span data-testid="eye-off-icon">EyeOff</span>,
  Check: () => <span data-testid="check-icon">Check</span>,
  AlertCircle: () => <span data-testid="alert-circle-icon">AlertCircle</span>,
  Info: () => <span data-testid="info-icon">Info</span>,
  Star: () => <span data-testid="star-icon">Star</span>,
  Heart: () => <span data-testid="heart-icon">Heart</span>,
  Share: () => <span data-testid="share-icon">Share</span>,
  MoreHorizontal: () => <span data-testid="more-horizontal-icon">MoreHorizontal</span>,
  MoreVertical: () => <span data-testid="more-vertical-icon">MoreVertical</span>,
  Filter: () => <span data-testid="filter-icon">Filter</span>,
  SortAsc: () => <span data-testid="sort-asc-icon">SortAsc</span>,
  SortDesc: () => <span data-testid="sort-desc-icon">SortDesc</span>,
  Columns: () => <span data-testid="columns-icon">Columns</span>,
  ArrowLeft: () => <span data-testid="arrow-left-icon">ArrowLeft</span>,
  ArrowRight: () => <span data-testid="arrow-right-icon">ArrowRight</span>,
  ArrowUp: () => <span data-testid="arrow-up-icon">ArrowUp</span>,
  ArrowDown: () => <span data-testid="arrow-down-icon">ArrowDown</span>,
  ExternalLink: () => <span data-testid="external-link-icon">ExternalLink</span>,
  Copy: () => <span data-testid="copy-icon">Copy</span>,
  Loader2: () => <span data-testid="loader-icon">Loader2</span>,
  Calendar: () => <span data-testid="calendar-icon">Calendar</span>,
  Clock: () => <span data-testid="clock-icon">Clock</span>,
  MapPin: () => <span data-testid="map-pin-icon">MapPin</span>,
  Mail: () => <span data-testid="mail-icon">Mail</span>,
  Phone: () => <span data-testid="phone-icon">Phone</span>,
  Globe: () => <span data-testid="globe-icon">Globe</span>,
  Building: () => <span data-testid="building-icon">Building</span>,
  Users: () => <span data-testid="users-icon">Users</span>,
  Tag: () => <span data-testid="tag-icon">Tag</span>,
  Bookmark: () => <span data-testid="bookmark-icon">Bookmark</span>,
  Flag: () => <span data-testid="flag-icon">Flag</span>,
  Zap: () => <span data-testid="zap-icon">Zap</span>,
  TrendingUp: () => <span data-testid="trending-up-icon">TrendingUp</span>,
  BarChart: () => <span data-testid="bar-chart-icon">BarChart</span>,
  PieChart: () => <span data-testid="pie-chart-icon">PieChart</span>,
  Activity: () => <span data-testid="activity-icon">Activity</span>,
  Target: () => <span data-testid="target-icon">Target</span>,
  Award: () => <span data-testid="award-icon">Award</span>,
  Shield: () => <span data-testid="shield-icon">Shield</span>,
  Lock: () => <span data-testid="lock-icon">Lock</span>,
  Unlock: () => <span data-testid="unlock-icon">Unlock</span>,
  Key: () => <span data-testid="key-icon">Key</span>,
  Database: () => <span data-testid="database-icon">Database</span>,
  Server: () => <span data-testid="server-icon">Server</span>,
  Cloud: () => <span data-testid="cloud-icon">Cloud</span>,
  Link: () => <span data-testid="link-icon">Link</span>,
  Unlink: () => <span data-testid="unlink-icon">Unlink</span>,
  Refresh: () => <span data-testid="refresh-icon">Refresh</span>,
  Sync: () => <span data-testid="sync-icon">Sync</span>,
  Download: () => <span data-testid="download-icon">Download</span>,
  Upload: () => <span data-testid="upload-icon">Upload</span>,
  Save: () => <span data-testid="save-icon">Save</span>,
  Trash2: () => <span data-testid="trash2-icon">Trash2</span>,
  Archive: () => <span data-testid="archive-icon">Archive</span>,
  Folder: () => <span data-testid="folder-icon">Folder</span>,
  File: () => <span data-testid="file-icon">File</span>,
  FileText: () => <span data-testid="file-text-icon">FileText</span>,
  Image: () => <span data-testid="image-icon">Image</span>,
  Video: () => <span data-testid="video-icon">Video</span>,
  Music: () => <span data-testid="music-icon">Music</span>,
  Headphones: () => <span data-testid="headphones-icon">Headphones</span>,
  Mic: () => <span data-testid="mic-icon">Mic</span>,
  MicOff: () => <span data-testid="mic-off-icon">MicOff</span>,
  Volume2: () => <span data-testid="volume2-icon">Volume2</span>,
  VolumeX: () => <span data-testid="volume-x-icon">VolumeX</span>,
  Play: () => <span data-testid="play-icon">Play</span>,
  Pause: () => <span data-testid="pause-icon">Pause</span>,
  Square: () => <span data-testid="square-icon">Square</span>,
  SkipBack: () => <span data-testid="skip-back-icon">SkipBack</span>,
  SkipForward: () => <span data-testid="skip-forward-icon">SkipForward</span>,
  Rewind: () => <span data-testid="rewind-icon">Rewind</span>,
  FastForward: () => <span data-testid="fast-forward-icon">FastForward</span>,
  RotateCw: () => <span data-testid="rotate-cw-icon">RotateCw</span>,
  Shuffle: () => <span data-testid="shuffle-icon">Shuffle</span>,
  Repeat: () => <span data-testid="repeat-icon">Repeat</span>,
  Repeat1: () => <span data-testid="repeat1-icon">Repeat1</span>,
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock Next.js server utilities
global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.headers = new Headers(options.headers || {})
    this.body = options.body
  }
  
  async json() {
    return this.body ? JSON.parse(this.body) : {}
  }
}

global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status || 200
    this.headers = new Headers(options.headers || {})
  }
  
  static json(data, options = {}) {
    return new Response(JSON.stringify(data), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  }
  
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
  }
}

global.Headers = class Headers {
  constructor(init = {}) {
    this.headers = new Map()
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value)
      })
    }
  }
  
  get(name) {
    return this.headers.get(name.toLowerCase())
  }
  
  set(name, value) {
    this.headers.set(name.toLowerCase(), value)
  }
  
  has(name) {
    return this.headers.has(name.toLowerCase())
  }
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock performance.mark and performance.measure
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    now: jest.fn(() => Date.now()),
  },
})