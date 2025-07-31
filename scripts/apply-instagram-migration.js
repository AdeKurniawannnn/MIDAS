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

async function applyInstagramMigration() {
    try {
        console.log('🚀 Starting Instagram migration...');
        console.log('Database:', supabaseUrl);
        
        // Load migration file
        const migrationPath = path.join(__dirname, '../supabase/migrations/20250731203000_instagram_scraper_schema_clean.sql');
        
        if (!fs.existsSync(migrationPath)) {
            console.error('❌ Migration file not found:', migrationPath);
            return;
        }
        
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        console.log(`📄 Migration loaded: ${migrationSQL.length} characters`);
        
        // Split into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Found ${statements.length} SQL statements to execute`);
        
        let successCount = 0;
        let failureCount = 0;
        const failures = [];
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            const shortStatement = statement.substring(0, 80).replace(/\s+/g, ' ') + '...';
            
            console.log(`\n[${i + 1}/${statements.length}] Executing: ${shortStatement}`);
            
            try {
                // Use raw SQL execution through rpc
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql: statement + ';'
                });
                
                if (error) {
                    console.error(`❌ Failed: ${error.message}`);
                    failures.push({
                        statement: i + 1,
                        sql: shortStatement,
                        error: error.message
                    });
                    failureCount++;
                    
                    // Continue with other statements unless it's a critical error
                    if (error.message.includes('permission denied') || 
                        error.message.includes('does not exist') && statement.includes('auth.')) {
                        console.log('⚠️  Continuing despite error...');
                    }
                } else {
                    console.log('✅ Success');
                    successCount++;
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
        
        if (failures.length > 0) {
            console.log('\n❌ Failed statements:');
            failures.forEach(failure => {
                console.log(`  ${failure.statement}: ${failure.error}`);
            });
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

applyInstagramMigration();