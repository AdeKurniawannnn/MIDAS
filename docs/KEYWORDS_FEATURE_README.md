# Keywords Management System

A comprehensive keyword management system for the MIDAS Orion application that enables users to organize, track, and automate scraping operations.

## 🚀 Features

### ✅ **Keyword Management**
- **CRUD Operations**: Create, Read, Update, Delete keywords
- **Categories**: Organize keywords by categories (fitness, food, travel, etc.)
- **Status Management**: Active, Inactive, Archived states
- **Priority System**: 1-5 priority levels for keyword importance
- **Search & Filter**: Real-time search and filtering capabilities

### ✅ **Bulk Operations**
- **Multi-Select**: Checkbox selection for multiple keywords
- **Bulk Actions**: Activate, Deactivate, Archive, Delete multiple keywords
- **Bulk Scraping**: Start scraping jobs for multiple keywords simultaneously
- **Platform Selection**: Choose Instagram or Google Maps for bulk scraping

### ✅ **Integration with Orion**
- **Assignment System**: Link keywords to Instagram/Google Maps data
- **Quick Add**: Add keywords directly from tracking pages
- **Automation**: Trigger scraping jobs based on keyword selections
- **User Isolation**: Per-account keyword management

### ✅ **User Interface**
- **Dedicated Page**: `/keywords` for comprehensive management
- **Modal Support**: Quick add/edit modals for efficiency
- **Statistics**: Real-time keyword statistics and analytics
- **Responsive Design**: Mobile-friendly interface

## 📊 **Database Schema**

### **Keywords Table**
```sql
CREATE TABLE keywords (
    id SERIAL PRIMARY KEY,
    keyword TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    status TEXT DEFAULT 'active',
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    user_id TEXT NOT NULL,
    gmail TEXT NOT NULL
);
```

### **Assignment Tables**
```sql
-- Instagram assignments
CREATE TABLE keyword_instagram_assignments (
    id SERIAL PRIMARY KEY,
    keyword_id INTEGER REFERENCES keywords(id),
    instagram_id INTEGER REFERENCES data_screping_instagram(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    user_id TEXT NOT NULL,
    gmail TEXT NOT NULL
);

-- Google Maps assignments
CREATE TABLE keyword_google_maps_assignments (
    id SERIAL PRIMARY KEY,
    keyword_id INTEGER REFERENCES keywords(id),
    google_maps_id INTEGER REFERENCES data_scraping_google_maps(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    user_id TEXT NOT NULL,
    gmail TEXT NOT NULL
);
```

### **Scraping Jobs Table**
```sql
CREATE TABLE keyword_scraping_jobs (
    id SERIAL PRIMARY KEY,
    keyword_id INTEGER REFERENCES keywords(id),
    job_type TEXT CHECK (job_type IN ('instagram', 'google_maps')),
    status TEXT DEFAULT 'pending',
    results_count INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    user_id TEXT NOT NULL,
    gmail TEXT NOT NULL
);
```

## 🔧 **API Endpoints**

### **Keywords Management**
- `GET /api/keywords` - Get user keywords with filtering
- `POST /api/keywords` - Create new keyword
- `PUT /api/keywords` - Update existing keyword
- `DELETE /api/keywords` - Delete keyword

### **Bulk Operations**
- `POST /api/keywords/bulk` - Bulk operations (activate, deactivate, archive, delete, scrape)
- `GET /api/keywords/bulk` - Get bulk operation status

### **Assignments**
- `GET /api/keywords/assignments` - Get keyword assignments
- `POST /api/keywords/assignments` - Create/update assignments
- `DELETE /api/keywords/assignments` - Delete assignment

### **Statistics**
- `GET /api/keywords/stats` - Get keyword statistics

## 🎨 **Components**

### **Main Components**
- `KeywordsClient` - Main client-side component
- `KeywordsTable` - Data table with inline editing
- `KeywordForm` - Add/edit keyword form
- `BulkActionsBar` - Bulk operations interface
- `KeywordSearchFilter` - Search and filter controls
- `KeywordStats` - Statistics display

### **Integration Components**
- `KeywordAssignmentModal` - Assign keywords to data
- `QuickAddKeywordModal` - Quick keyword creation

## 📱 **User Experience**

### **Navigation**
- **Sidebar**: Keywords link added to dashboard sidebar
- **Quick Access**: Add keyword button in Orion tracking pages
- **Integration**: Seamless integration with existing workflows

### **Workflow**
1. **Add Keywords**: Create keywords via dedicated page or quick-add modal
2. **Organize**: Categorize and prioritize keywords
3. **Assign**: Link keywords to tracked data
4. **Automate**: Use bulk scraping for multiple keywords
5. **Monitor**: Track scraping jobs and results

## 🔐 **Security**

### **Authentication**
- **User Isolation**: All data filtered by user ID and email
- **Row Level Security**: Supabase RLS policies implemented
- **Session Management**: Secure session handling

### **Data Protection**
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Sanitized user inputs

## 📊 **Performance**

### **Optimization**
- **Pagination**: Efficient data loading with pagination
- **Caching**: Client-side caching for better performance
- **Lazy Loading**: Components loaded on demand
- **Batch Operations**: Efficient bulk operations

### **Monitoring**
- **Real-time Updates**: Live statistics and status updates
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading States**: User-friendly loading indicators

## 🚀 **Getting Started**

### **1. Database Setup**
```bash
# Run the schema file
psql -d your_database -f supabase-keywords-schema.sql
```

### **2. Environment Setup**
Ensure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **3. Navigation**
- Visit `/keywords` for the main management interface
- Use the "Add Keyword" button in Orion pages for quick additions
- Access via the sidebar "Keywords" link

### **4. Usage**
1. Add keywords with descriptions and categories
2. Use bulk operations for efficiency
3. Assign keywords to tracking data
4. Monitor scraping jobs and results

## 🔄 **Future Enhancements**

### **Planned Features**
- **AI-Powered Suggestions**: Keyword recommendations based on data
- **Advanced Analytics**: Detailed performance metrics
- **Export/Import**: Bulk keyword management
- **Templates**: Pre-built keyword sets for common use cases
- **Scheduling**: Automated scraping schedules
- **Notifications**: Real-time alerts for job completion

### **Integration Opportunities**
- **Machine Learning**: Keyword performance prediction
- **Natural Language Processing**: Auto-categorization
- **API Webhooks**: External system integration
- **Reporting**: Advanced reporting and dashboards

## 📞 **Support**

For issues or questions about the keyword management system:
1. Check the console for error messages
2. Verify database connectivity
3. Ensure proper authentication
4. Review API endpoint responses

## 🎯 **Summary**

The Keywords Management System provides a comprehensive solution for organizing and automating scraping operations in the MIDAS Orion application. With features like bulk operations, user isolation, and seamless integration, it enhances productivity and provides better control over data collection workflows.