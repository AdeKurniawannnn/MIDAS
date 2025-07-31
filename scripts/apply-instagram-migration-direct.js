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

async function applyInstagramMigrationDirect() {
    try {
        console.log('🚀 Starting Instagram migration (Direct API approach)...');
        console.log('Database:', supabaseUrl);
        
        // Load migration file
        const migrationPath = path.join(__dirname, '../supabase/migrations/20250731203000_instagram_scraper_schema_clean.sql');
        
        if (!fs.existsSync(migrationPath)) {
            console.error('❌ Migration file not found:', migrationPath);
            return;
        }
        
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        console.log(`📄 Migration loaded: ${migrationSQL.length} characters`);
        
        // Instead of using exec_sql, we'll execute the raw SQL directly
        // This approach uses the REST API's ability to execute SQL
        
        console.log('🔧 Executing migration via direct REST API call...');
        
        // Use fetch to call the REST API directly with SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
            method: 'POST',
            headers: {
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                query: migrationSQL
            })
        });
        
        if (!response.ok) {
            // Try alternative approach - split into individual DDL statements
            console.log('⚠️  Direct query failed, trying statement-by-statement approach...');
            
            // Split into individual statements and execute via direct HTTP calls
            const statements = migrationSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
            
            console.log(`📝 Found ${statements.length} SQL statements to execute`);
            
            let successCount = 0;
            let failureCount = 0;
            const failures = [];
            
            // Execute each statement via HTTP
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                const shortStatement = statement.substring(0, 80).replace(/\s+/g, ' ') + '...';
                
                console.log(`\n[${i + 1}/${statements.length}] Executing: ${shortStatement}`);
                
                try {
                    // Use the database REST API to execute raw SQL
                    const stmtResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
                        method: 'POST',
                        headers: {
                            'apikey': serviceRoleKey,
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            query: statement + ';'
                        })
                    });
                    
                    if (stmtResponse.ok) {
                        console.log('✅ Success');
                        successCount++;
                    } else {
                        const errorText = await stmtResponse.text();
                        console.error(`❌ Failed: ${errorText}`);
                        failures.push({
                            statement: i + 1,
                            sql: shortStatement,
                            error: errorText
                        });
                        failureCount++;
                    }
                    
                } catch (err) {
                    console.error(`❌ Exception: ${err.message}`);
                    failures.push({
                        statement: i + 1,
                        sql: shortStatement,
                        error: err.message
                    });
                    failureCount++;
                }
                
                // Small delay between statements
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            console.log('\n📊 Migration Summary:');
            console.log(`✅ Successful statements: ${successCount}`);
            console.log(`❌ Failed statements: ${failureCount}`);
            
            if (failures.length > 0 && failures.length < 10) {
                console.log('\n❌ Failed statements:');
                failures.forEach(failure => {
                    console.log(`  ${failure.statement}: ${failure.error}`);
                });
            }
        } else {
            console.log('✅ Migration executed successfully via direct query');
        }
        
        // Test if tables were created successfully
        console.log('\n🔍 Verifying Instagram tables...');
        const instagramTables = [
            'instagram_hashtags',
            'instagram_posts',
            'instagram_locations',
            'instagram_music_info',
            'instagram_post_hashtags',
            'instagram_post_mentions',
            'instagram_search_queries'
        ];
        
        const createdTables = [];
        for (const tableName of instagramTables) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);
                
                if (!error) {
                    createdTables.push(tableName);
                    console.log(`  ✅ ${tableName} - Created successfully`);
                } else {
                    console.log(`  ❌ ${tableName} - ${error.message}`);
                }
            } catch (err) {
                console.log(`  ❌ ${tableName} - ${err.message}`);
            }
        }
        
        console.log(`\n🎉 Migration completed!`);
        console.log(`📊 Created ${createdTables.length}/${instagramTables.length} Instagram tables`);
        
        if (createdTables.length === instagramTables.length) {
            console.log('✅ All Instagram tables created successfully!');
            
            // Test the bulk insert function
            console.log('\n🧪 Testing bulk insert function...');
            try {
                const testData = {
                    name: "test",
                    postsCount: 0,
                    url: "https://instagram.com/explore/tags/test/",
                    topPosts: []
                };
                
                const { data, error } = await supabase.rpc('insert_instagram_hashtag_data', {
                    p_user_id: '550e8400-e29b-41d4-a716-446655440000', // Mock UUID
                    p_search_term: 'test',
                    p_hashtag_data: testData
                });
                
                if (!error) {
                    console.log('✅ Bulk insert function working correctly');
                } else {
                    console.log('⚠️  Bulk insert function error:', error.message);
                }
                
            } catch (err) {
                console.log('⚠️  Bulk insert function test failed:', err.message);
            }
        } else {
            console.log('⚠️  Some tables failed to create. Check the errors above.');
        }
        
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    }
}

applyInstagramMigrationDirect();