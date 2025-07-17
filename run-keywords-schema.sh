#!/bin/bash

# Script to run the keywords schema in Supabase

echo "🚀 Running Keywords Schema Setup..."
echo ""
echo "You need to provide your Supabase database connection details."
echo "You can find these in your Supabase dashboard under Settings > Database"
echo ""

# Prompt for database details
read -p "Enter your Supabase database host (e.g., db.xxxxx.supabase.co): " DB_HOST
read -p "Enter your database password: " -s DB_PASSWORD
echo ""

# Database name is usually 'postgres'
DB_NAME="postgres"
DB_USER="postgres"
DB_PORT="5432"

# Construct the connection string
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Run the schema
echo ""
echo "📊 Creating keywords management tables..."

if command -v psql &> /dev/null; then
    psql "${DATABASE_URL}" -f supabase-keywords-schema-final.sql
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Keywords schema created successfully!"
        echo ""
        echo "📋 Created tables:"
        echo "  - data_scraping_google_maps"
        echo "  - keywords"
        echo "  - keyword_instagram_assignments"
        echo "  - keyword_google_maps_assignments"
        echo "  - keyword_scraping_jobs"
        echo ""
        echo "🎉 You can now use the Keywords Management System!"
    else
        echo ""
        echo "❌ Error creating schema. Please check your connection details."
    fi
else
    echo "❌ psql is not installed. Please install PostgreSQL client tools."
    echo ""
    echo "To install on macOS:"
    echo "  brew install postgresql"
    echo ""
    echo "Alternatively, run the SQL directly in Supabase dashboard SQL Editor."
fi