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
        
        // Test connection first
        const { data: testData, error: testError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .limit(1);
            
        if (testError) {
            console.error('❌ Connection failed:', testError.message);
            return;
        }
        
        console.log('✅ Connection successful!');
        
        // Get all tables in public schema
        console.log('📋 Fetching table list...');
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_type')
            .eq('table_schema', 'public')
            .order('table_name');
            
        if (tablesError) {
            console.error('Error fetching tables:', tablesError);
            return;
        }
        
        console.log('📊 Found tables:');
        tables.forEach(table => {
            console.log(`  - ${table.table_name} (${table.table_type})`);
        });
        
        // Get all columns for each table
        console.log('\n🔍 Fetching table schemas...');
        const { data: columns, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select(`
                table_name,
                column_name,
                data_type,
                is_nullable,
                column_default,
                ordinal_position
            `)
            .eq('table_schema', 'public')
            .order('table_name')
            .order('ordinal_position');
            
        if (columnsError) {
            console.error('Error fetching columns:', columnsError);
            return;
        }
        
        // Get constraints (primary keys, foreign keys, etc.)
        console.log('🔗 Fetching constraints...');
        const { data: constraints, error: constraintsError } = await supabase
            .from('information_schema.table_constraints')
            .select(`
                table_name,
                constraint_name,
                constraint_type
            `)
            .eq('table_schema', 'public');
            
        if (constraintsError) {
            console.error('Error fetching constraints:', constraintsError);
        }
        
        // Get indexes
        console.log('📇 Fetching indexes...');
        const { data: indexes, error: indexesError } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    indexdef
                FROM pg_indexes 
                WHERE schemaname = 'public'
                ORDER BY tablename, indexname;
            `
        });
        
        // Generate schema summary
        const schemaData = {
            tables: tables || [],
            columns: columns || [],
            constraints: constraints || [],
            indexes: indexes?.data || [],
            timestamp: new Date().toISOString()
        };
        
        // Write schema to file
        const schemaPath = path.join(__dirname, '../current-remote-schema.json');
        fs.writeFileSync(schemaPath, JSON.stringify(schemaData, null, 2));
        
        // Also create a readable summary
        let summary = `# Current Remote Database Schema\n`;
        summary += `Generated: ${new Date().toISOString()}\n`;
        summary += `Database: ${supabaseUrl}\n\n`;
        
        // Group columns by table
        const tableColumns = {};
        columns.forEach(col => {
            if (!tableColumns[col.table_name]) {
                tableColumns[col.table_name] = [];
            }
            tableColumns[col.table_name].push(col);
        });
        
        summary += `## Tables (${tables.length})\n\n`;
        tables.forEach(table => {
            summary += `### ${table.table_name}\n`;
            const cols = tableColumns[table.table_name] || [];
            cols.forEach(col => {
                const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
                summary += `- ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}\n`;
            });
            summary += '\n';
        });
        
        if (constraints && constraints.length > 0) {
            summary += `## Constraints\n\n`;
            constraints.forEach(constraint => {
                summary += `- ${constraint.table_name}.${constraint.constraint_name}: ${constraint.constraint_type}\n`;
            });
            summary += '\n';
        }
        
        const summaryPath = path.join(__dirname, '../current-remote-schema.md');
        fs.writeFileSync(summaryPath, summary);
        
        console.log('\n✅ Schema pulled successfully!');
        console.log(`📄 JSON data: ${schemaPath}`);
        console.log(`📋 Summary: ${summaryPath}`);
        
        return schemaData;
        
    } catch (err) {
        console.error('❌ Error pulling schema:', err.message);
    }
}

pullRemoteSchema();