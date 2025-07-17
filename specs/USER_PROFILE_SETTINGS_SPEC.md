# User Profile & Settings System Specification

## 📋 Overview

This specification defines the design and implementation requirements for a comprehensive user profile and settings system for the MIDAS application.

### Purpose
Create a user-centric profile and settings experience that allows users to manage their personal information, preferences, and account security within the existing MIDAS dashboard architecture.

### Scope
- User profile management with avatar upload
- Comprehensive settings with 6 main categories
- Mobile-first responsive design
- Integration with existing Supabase auth system
- API endpoints for profile and settings operations

---

## 🏗️ Architecture Overview

### Tech Stack Integration
- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (extends existing users table)
- **UI Components**: shadcn/ui with Tailwind CSS
- **Authentication**: Existing Supabase Auth system
- **File Storage**: Supabase Storage for avatar uploads

### Existing System Integration
- **Dashboard Layout**: Uses `UnifiedDashboardLayout`
- **Sidebar Navigation**: Extends `AppSidebar` with profile/settings links
- **Auth Context**: Leverages existing `AuthProvider`
- **Database Helpers**: Extends `supabaseHelpers`

---

## 🎯 User Stories

### Profile Management
- **As a user**, I want to view and edit my profile information
- **As a user**, I want to upload and manage my profile avatar
- **As a user**, I want to see my profile completion percentage
- **As a user**, I want to manage my professional information

### Settings Management
- **As a user**, I want to customize my notification preferences
- **As a user**, I want to manage my account security settings
- **As a user**, I want to control my data privacy settings
- **As a user**, I want to customize my app appearance

---

## 🗂️ Database Schema

### Enhanced User Profile Schema
```typescript
export type EnhancedUserProfile = {
  // Existing fields (from current users table)
  id: string
  email: string
  name: string
  avatar_url?: string
  phone?: string
  company?: string
  role?: string
  created_at: string
  updated_at: string

  // New profile fields
  bio?: string
  location?: string
  website?: string
  linkedin?: string
  twitter?: string
  job_title?: string
  department?: string
  timezone?: string
  language?: string
  
  // Settings fields
  theme?: 'light' | 'dark' | 'system'
  email_notifications?: boolean
  push_notifications?: boolean
  marketing_emails?: boolean
  two_factor_enabled?: boolean
  
  // Metadata
  last_login?: string
  profile_completion?: number
  is_verified?: boolean
  status?: 'active' | 'inactive' | 'suspended'
}
```

### New Tables
```sql
-- User settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_preferences JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  appearance_settings JSONB DEFAULT '{}',
  integration_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_info TEXT,
  ip_address INET,
  location TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🚀 API Endpoints

### Profile Management
```typescript
// GET /api/profile
// Get current user profile
Response: EnhancedUserProfile

// PUT /api/profile
// Update user profile
Body: Partial<EnhancedUserProfile>
Response: Updated EnhancedUserProfile

// POST /api/profile/avatar
// Upload/update avatar
Body: FormData with image file
Response: { avatar_url: string }

// DELETE /api/profile/avatar
// Remove avatar
Response: { success: boolean }
```

### Settings Management
```typescript
// GET /api/settings
// Get user settings
Response: UserSettings

// PUT /api/settings
// Update user settings
Body: Partial<UserSettings>
Response: Updated UserSettings

// GET /api/settings/sessions
// Get active sessions
Response: UserSessions[]

// DELETE /api/settings/sessions/:id
// Revoke specific session
Response: { success: boolean }
```

---

## 📱 Component Architecture

### Profile Page Structure
```
/dashboard/profile
├── ProfileHeader
│   ├── AvatarSection (upload/edit)
│   ├── BasicInfo (name, email, role)
│   └── ProfileActions (edit, save, cancel)
├── ProfileTabs
│   ├── PersonalInfo
│   ├── Professional
│   ├── Security
│   └── Activity
└── ProfileForm (context-driven forms)
```

### Settings Page Structure
```
/dashboard/settings
├── SettingsHeader
├── SettingsNavigation (vertical tabs)
├── SettingsContent
│   ├── AccountSettings
│   ├── NotificationSettings
│   ├── SecuritySettings
│   ├── AppearanceSettings
│   ├── IntegrationSettings
│   └── DataSettings
└── SettingsFooter (save/reset actions)
```

---

## 🎨 UI/UX Design Specifications

### Profile Page Design
- **Header Section**: Avatar (120px), name, role, completion percentage
- **Tab Navigation**: Horizontal tabs on desktop, vertical on mobile
- **Form Layout**: Two-column grid on desktop, stacked on mobile
- **Save State**: Auto-save with manual save option for important changes

### Settings Page Design
- **Navigation**: Left sidebar with icons and labels
- **Content Area**: Right panel with section-specific content
- **Mobile Layout**: Accordion-style collapsible sections
- **Search**: Global search across all settings

### Visual Design
- **Color Scheme**: Consistent with existing MIDAS dark theme
- **Typography**: Inter font family with proper hierarchy
- **Spacing**: 8px grid system
- **Icons**: Lucide React icons throughout

---

## 📋 Settings Categories

### 1. Account Settings
- **Personal Information**: Name, email, phone, company
- **Profile Picture**: Upload, crop, delete
- **Account Status**: Verification, subscription status
- **Account Actions**: Deactivate, delete account

### 2. Notification Settings
- **Email Notifications**: Marketing, security, updates
- **In-App Notifications**: Dashboard alerts, mentions
- **Push Notifications**: Browser/mobile push settings
- **Frequency**: Immediate, daily digest, weekly summary

### 3. Security Settings
- **Password Management**: Change password, strength indicator
- **Two-Factor Authentication**: Enable/disable, backup codes
- **Active Sessions**: View and manage active sessions
- **Login History**: Recent login attempts and locations

### 4. Appearance Settings
- **Theme Selection**: Light, dark, system preference
- **Language**: Multi-language support
- **Time Zone**: Automatic detection with manual override
- **Dashboard Layout**: Compact, comfortable, spacious

### 5. Integration Settings
- **Connected Apps**: Third-party service connections
- **API Keys**: Generate and manage API access
- **Webhooks**: Configure webhook endpoints
- **Data Sync**: Sync preferences with external services

### 6. Data Settings
- **Data Export**: Download personal data (GDPR compliant)
- **Data Retention**: Configure data retention policies
- **Privacy Controls**: Data sharing preferences
- **Analytics**: Opt-in/out of usage analytics

---

## 📱 Responsive Design

### Mobile-First Approach
- **Breakpoints**: Mobile (320px-768px), Tablet (768px-1024px), Desktop (1024px+)
- **Touch Targets**: Minimum 44px for interactive elements
- **Navigation**: Bottom tab bar for mobile settings navigation
- **Forms**: Stacked layouts with proper spacing

### Desktop Enhancements
- **Sidebar Navigation**: Persistent left sidebar for settings
- **Multi-Column Layout**: Two-column forms where appropriate
- **Hover States**: Enhanced hover interactions
- **Keyboard Navigation**: Full keyboard accessibility

---

## 🔒 Security Requirements

### Data Protection
- **Input Validation**: Client and server-side validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content sanitization
- **CSRF Protection**: Token-based protection

### Authentication & Authorization
- **Session Management**: Secure session handling
- **Permission Checks**: Role-based access control
- **API Rate Limiting**: Prevent abuse
- **Audit Logging**: Track sensitive operations

### Privacy Compliance
- **GDPR Compliance**: Data export/deletion
- **Data Minimization**: Collect only necessary data
- **Consent Management**: Clear consent mechanisms
- **Data Encryption**: Encrypt sensitive data at rest

---

## 🧪 Testing Requirements

### Unit Tests
- **Component Testing**: React component unit tests
- **API Testing**: Endpoint functionality tests
- **Utility Testing**: Helper function tests
- **Validation Testing**: Form validation tests

### Integration Tests
- **Profile Flow**: Complete profile update flow
- **Settings Flow**: Settings modification flow
- **Avatar Upload**: File upload functionality
- **Session Management**: Session creation/deletion

### E2E Tests
- **User Journey**: Complete user profile journey
- **Mobile Testing**: Mobile-specific interactions
- **Cross-Browser**: Chrome, Firefox, Safari testing
- **Accessibility**: WCAG compliance testing

---

## 📊 Performance Requirements

### Load Performance
- **Initial Load**: <2 seconds for profile page
- **Form Interactions**: <100ms response time
- **Image Upload**: <5 seconds for 2MB images
- **Settings Navigation**: <50ms tab switching

### Optimization Strategies
- **Code Splitting**: Route-based code splitting
- **Image Optimization**: WebP with fallbacks
- **Caching**: Browser and CDN caching
- **Lazy Loading**: Below-fold content lazy loading

---

## 🚢 Implementation Phases

### Phase 1: Foundation (1-2 days)
- [ ] Create route structure (`/profile`, `/settings`)
- [ ] Implement basic page layouts
- [ ] Add database schema migrations
- [ ] Create basic API endpoints

### Phase 2: Core Features (2-3 days)
- [ ] Complete profile page with avatar upload
- [ ] Implement all 6 settings categories
- [ ] Add form validation and error handling
- [ ] Create responsive layouts

### Phase 3: Enhanced Features (1-2 days)
- [ ] Add advanced security features (2FA, sessions)
- [ ] Implement data export/import
- [ ] Add third-party integrations
- [ ] Create analytics and tracking

### Phase 4: Polish & Testing (1 day)
- [ ] Mobile optimization and testing
- [ ] Performance optimization
- [ ] Comprehensive testing suite
- [ ] Documentation and deployment

---

## 📈 Success Metrics

### User Engagement
- **Profile Completion Rate**: Target 85%+
- **Settings Usage**: Average 3+ sections visited per session
- **Feature Adoption**: 70%+ users modify at least one setting
- **Return Rate**: 60%+ users return to settings within 30 days

### Technical Performance
- **Error Rate**: <1% on profile/settings operations
- **API Response Time**: <200ms average
- **Upload Success Rate**: 99%+ for avatar uploads
- **Page Load Time**: <2s for 95th percentile

### User Satisfaction
- **User Feedback**: 4.5+ stars on profile/settings experience
- **Support Tickets**: <5% increase in profile-related tickets
- **Task Completion**: 90%+ successful completion of common tasks
- **Accessibility**: 100% WCAG AA compliance

---

## 🔧 Technical Considerations

### State Management
- **Local State**: React useState for form data
- **Global State**: Context API for user profile
- **Server State**: SWR for data fetching and caching
- **Form State**: React Hook Form for complex forms

### Error Handling
- **User-Friendly Messages**: Clear error communication
- **Fallback UI**: Graceful degradation on failures
- **Retry Logic**: Automatic retry for transient errors
- **Error Boundaries**: React error boundary implementation

### Accessibility
- **ARIA Labels**: Proper ARIA labeling throughout
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Semantic HTML structure
- **Color Contrast**: WCAG AA compliance

---

## 📚 Dependencies

### New Dependencies
```json
{
  "react-hook-form": "^7.47.0",
  "react-dropzone": "^14.2.3",
  "date-fns": "^2.30.0",
  "react-cropper": "^2.3.3"
}
```

### Existing Dependencies (leveraged)
- Next.js 14, TypeScript, Tailwind CSS
- shadcn/ui, Lucide React, Framer Motion
- Supabase client, React Context API

---

## 🎯 Acceptance Criteria

### Profile Page
- [ ] Users can view and edit all profile information
- [ ] Avatar upload works with crop functionality
- [ ] Profile completion percentage is accurate
- [ ] All changes are saved automatically or manually
- [ ] Mobile layout is fully functional

### Settings Page
- [ ] All 6 settings categories are implemented
- [ ] Settings persist across sessions
- [ ] Mobile navigation is intuitive
- [ ] Search functionality works across all settings
- [ ] Data export feature is GDPR compliant

### General Requirements
- [ ] Pages load within performance targets
- [ ] All forms have proper validation
- [ ] Error handling is user-friendly
- [ ] Accessibility standards are met
- [ ] Cross-browser compatibility is maintained

---

This specification provides a comprehensive blueprint for implementing a robust user profile and settings system that integrates seamlessly with the existing MIDAS application architecture while providing an excellent user experience across all devices.