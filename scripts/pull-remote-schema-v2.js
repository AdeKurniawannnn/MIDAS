const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing required environment variables');
    process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function pullRemoteSchema() {
    try {
        console.log('🔍 Connecting to remote Supabase instance...');
        console.log('URL:', supabaseUrl);
        
        // Try to get existing tables by attempting to query known tables from your types
        const knownTables = [
            'contacts',
            'data_scraping_google_maps', 
            'data_scraping_instagram',
            'keyword_assignments',
            'keywords',
            'kol_data',
            'statistics',
            'users' // from auth schema but might be accessible
        ];
        
        const existingTables = [];
        const tableSchemas = {};
        
        console.log('📋 Testing table access...');
        
        for (const tableName of knownTables) {
            try {
                console.log(`  Testing ${tableName}...`);
                
                // Try to get the first row to understand structure
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);
                
                if (!error) {
                    existingTables.push(tableName);
                    
                    // Get column information by examining the returned data structure
                    if (data && data.length > 0) {
                        const columns = Object.keys(data[0]);
                        tableSchemas[tableName] = {
                            accessible: true,
                            columns: columns,
                            sampleData: data[0]
                        };
                        console.log(`    ✅ ${tableName} - Found ${columns.length} columns`);
                    } else {
                        // Table exists but is empty
                        tableSchemas[tableName] = {
                            accessible: true,
                            columns: [],
                            sampleData: null
                        };
                        console.log(`    ✅ ${tableName} - Empty table`);
                    }
                } else {
                    console.log(`    ❌ ${tableName} - ${error.message}`);
                    tableSchemas[tableName] = {
                        accessible: false,
                        error: error.message
                    };
                }
                
            } catch (err) {
                console.log(`    ❌ ${tableName} - ${err.message}`);
                tableSchemas[tableName] = {
                    accessible: false,
                    error: err.message
                };
            }
        }
        
        console.log(`\n✅ Found ${existingTables.length} accessible tables:`);
        existingTables.forEach(table => console.log(`  - ${table}`));
        
        // Generate schema summary
        const schemaData = {
            accessible_tables: existingTables,
            table_schemas: tableSchemas,
            timestamp: new Date().toISOString(),
            supabase_url: supabaseUrl
        };
        
        // Write detailed schema to file
        const schemaPath = path.join(__dirname, '../current-remote-schema.json');
        fs.writeFileSync(schemaPath, JSON.stringify(schemaData, null, 2));
        
        // Create readable summary
        let summary = `# Current Remote Database Schema\n`;
        summary += `Generated: ${new Date().toISOString()}\n`;
        summary += `Database: ${supabaseUrl}\n\n`;
        summary += `## Accessible Tables (${existingTables.length})\n\n`;
        
        existingTables.forEach(tableName => {
            const schema = tableSchemas[tableName];
            summary += `### ${tableName}\n`;
            
            if (schema.columns && schema.columns.length > 0) {
                summary += `**Columns (${schema.columns.length}):**\n`;
                schema.columns.forEach(col => {
                    summary += `- ${col}\n`;
                });
                
                if (schema.sampleData) {
                    summary += `\n**Sample Data Types:**\n`;
                    Object.entries(schema.sampleData).forEach(([key, value]) => {
                        const type = value === null ? 'null' : typeof value;
                        summary += `- ${key}: ${type}\n`;
                    });
                }
            } else {
                summary += `**Status:** Empty table\n`;
            }
            summary += '\n';
        });
        
        if (existingTables.length < knownTables.length) {
            summary += `## Inaccessible Tables\n\n`;
            knownTables.forEach(tableName => {
                if (!existingTables.includes(tableName)) {
                    const schema = tableSchemas[tableName];
                    summary += `- ${tableName}: ${schema.error}\n`;
                }
            });
            summary += '\n';
        }
        
        summary += `## Next Steps\n\n`;
        summary += `1. Review existing tables above\n`;
        summary += `2. Check if Instagram tables already exist\n`;
        summary += `3. Apply Instagram migration safely\n`;
        
        const summaryPath = path.join(__dirname, '../current-remote-schema.md');
        fs.writeFileSync(summaryPath, summary);
        
        console.log('\n✅ Schema analysis complete!');
        console.log(`📄 Detailed data: ${schemaPath}`);
        console.log(`📋 Summary: ${summaryPath}`);
        
        // Check if Instagram tables already exist
        const instagramTables = [
            'instagram_hashtags',
            'instagram_posts', 
            'instagram_locations',
            'instagram_music_info',
            'instagram_post_hashtags',
            'instagram_post_mentions',
            'instagram_search_queries'
        ];
        
        console.log('\n🔍 Checking for existing Instagram tables...');
        const existingInstagramTables = [];
        
        for (const tableName of instagramTables) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);
                
                if (!error) {
                    existingInstagramTables.push(tableName);
                    console.log(`  ✅ ${tableName} - Already exists`);
                } else {
                    console.log(`  ❌ ${tableName} - Not found`);
                }
            } catch (err) {
                console.log(`  ❌ ${tableName} - Not found`);
            }
        }
        
        if (existingInstagramTables.length > 0) {
            console.log(`\n⚠️  Warning: ${existingInstagramTables.length} Instagram tables already exist!`);
            console.log('You may want to review the migration before applying.');
        } else {
            console.log('\n✅ No Instagram tables found - safe to apply migration');
        }
        
        return schemaData;
        
    } catch (err) {
        console.error('❌ Error pulling schema:', err.message);
    }
}

pullRemoteSchema();