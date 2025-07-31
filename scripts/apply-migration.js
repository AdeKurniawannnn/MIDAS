const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing required environment variables:');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
    process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyMigration() {
    try {
        console.log('Loading migration file...');
        const migrationPath = path.join(__dirname, '../supabase/migrations/20250731203000_instagram_scraper_schema_clean.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('Applying migration to remote database...');
        console.log('Migration size:', migrationSQL.length, 'characters');
        
        // Execute the migration SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: migrationSQL
        });
        
        if (error) {
            console.error('Migration failed:', error);
            return;
        }
        
        console.log('✅ Migration applied successfully!');
        console.log('Response:', data);
        
    } catch (err) {
        console.error('Error applying migration:', err.message);
    }
}

// Alternative method using direct SQL execution
async function applyMigrationDirect() {
    try {
        console.log('Loading migration file...');
        const migrationPath = path.join(__dirname, '../supabase/migrations/20250731203000_instagram_scraper_schema_clean.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('Applying migration to remote database...');
        
        // Split migration into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        console.log(`Executing ${statements.length} SQL statements...`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.startsWith('--') || !statement.trim()) continue;
            
            console.log(`Executing statement ${i + 1}/${statements.length}...`);
            
            try {
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql: statement + ';'
                });
                
                if (error) {
                    console.error(`Statement ${i + 1} failed:`, error);
                    console.error('Statement:', statement.substring(0, 100) + '...');
                    continue;
                }
                
                console.log(`✅ Statement ${i + 1} completed`);
            } catch (err) {
                console.error(`Statement ${i + 1} error:`, err.message);
            }
        }
        
        console.log('✅ Migration completed!');
        
    } catch (err) {
        console.error('Error applying migration:', err.message);
    }
}

// Check if exec_sql function exists, if not use alternative approach
async function checkAndApply() {
    try {
        // Try to call a simple exec_sql first
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: 'SELECT 1 as test;'
        });
        
        if (error && error.message.includes('function "exec_sql" does not exist')) {
            console.log('exec_sql function not available, trying alternative approach...');
            console.log('Note: You may need to apply this migration manually via Supabase dashboard');
            
            // Just log the migration for manual application
            const migrationPath = path.join(__dirname, '../supabase/migrations/20250731203000_instagram_scraper_schema_clean.sql');
            const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
            
            console.log('\n=== MIGRATION SQL TO APPLY MANUALLY ===');
            console.log('Copy and paste this into your Supabase SQL editor:');
            console.log('\n' + migrationSQL);
            console.log('\n=== END MIGRATION SQL ===');
            
        } else if (error) {
            console.error('Database connection error:', error);
        } else {
            console.log('✅ Database connection successful, applying migration...');
            await applyMigration();
        }
        
    } catch (err) {
        console.error('Connection test failed:', err.message);
    }
}

checkAndApply();