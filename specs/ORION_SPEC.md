# Orion Specification

## Overview
Orion is a business scraping and research tool within MIDAS that extracts profile data for marketing intelligence through multiple channels:
- Instagram profile scraping
- Google Maps business data via AP5 Google Maps Fast Scraper

## Core Features
- Scrape Instagram profile data (followers, posts, engagement)
- Scrape Google Maps business data via AP5 Google Maps Fast Scraper
- Store data in Supabase database with user association
- Dashboard for viewing, editing, and managing scraped data
- Advanced fuzzy search across all data fields
- Customizable results per URL (user input field)
- Export functionality

## How it Works

### Instagram Scraping
1. User enters Instagram URL and max results (custom number input)
2. Request sent to `/api/scraping` endpoint
3. External webhook processes scraping
4. Data stored in `data_screping_instagram` table
5. Results displayed in editable table

### Google Maps Scraping
1. User configures Google Maps search parameters and max results (custom number input)
2. Request sent to AP5 Google Maps Fast Scraper API
3. Business data extracted and processed
4. Data stored in appropriate database table
5. Results displayed in editable table

## Key Components
- **ScrapingForm**: URL/search input form with custom results number field
- **InstagramTable**: Data display with editing and fuzzy search
- **GoogleMapsTable**: Business data display with editing and fuzzy search
- **FuzzySearchBar**: Advanced search component for all data fields
- **ResultsInput**: Custom number input component for results per URL
- **API Routes**: Backend scraping handlers for multiple platforms

## User Actions
- Enter URLs/search parameters and scrape profiles/businesses
- Set custom number of results per URL (input field instead of dropdown)
- View paginated results
- Edit data inline
- Fuzzy search across all data fields (replaces username-only search)
- Export results
- Delete entries

## Technical Stack
- **Frontend**: Next.js 13+ with React
- **Backend**: API routes with webhook integration
- **Database**: Supabase PostgreSQL
- **Auth**: Protected routes with session management
- **Styling**: Tailwind CSS + shadcn/ui

## File Structure
- Main: `src/app/(dashboard)/orion/page.tsx`
- Components: `src/components/features/orion/`
- API: `src/app/api/scraping/route.ts`

## External Services
- Instagram Webhook: `https://tequisa-n8n.217.15.164.63.sslip.io/webhook-test/Web_Midas`
- AP5 Google Maps Fast Scraper API
- Database: Supabase

## Limitations
- External API dependencies (Instagram webhook, Google Maps API)
- No real-time status updates
- Manual refresh for new results
- Rate limiting constraints from external services