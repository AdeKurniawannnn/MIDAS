# Current Remote Database Schema
Generated: 2025-07-31T15:13:25.159Z
Database: https://supabasekong-joc0wg4wkwo8o48swgswgo0g.217.15.164.63.sslip.io

## Accessible Tables (2)

### contacts
**Columns (9):**
- id
- image
- name
- status
- location
- verified
- referral
- value
- joinDate

**Sample Data Types:**
- id: string
- image: string
- name: string
- status: string
- location: string
- verified: boolean
- referral: object
- value: number
- joinDate: string

### keywords
**Columns (8):**
- id
- keyword
- description
- category
- priority
- status
- created_at
- email_user

**Sample Data Types:**
- id: number
- keyword: string
- description: string
- category: string
- priority: string
- status: string
- created_at: string
- email_user: string

## Inaccessible Tables

- data_scraping_google_maps: relation "public.data_scraping_google_maps" does not exist
- data_scraping_instagram: relation "public.data_scraping_instagram" does not exist
- keyword_assignments: relation "public.keyword_assignments" does not exist
- kol_data: relation "public.kol_data" does not exist
- statistics: relation "public.statistics" does not exist
- users: relation "public.users" does not exist

## Next Steps

1. Review existing tables above
2. Check if Instagram tables already exist
3. Apply Instagram migration safely
