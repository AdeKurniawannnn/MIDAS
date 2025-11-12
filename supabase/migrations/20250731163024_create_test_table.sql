-- Create a test table to demonstrate programmatic table creation
CREATE TABLE IF NOT EXISTS public.test_programmatic_table (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    priority INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_programmatic_table_name ON public.test_programmatic_table(name);
CREATE INDEX IF NOT EXISTS idx_test_programmatic_table_status ON public.test_programmatic_table(status);
CREATE INDEX IF NOT EXISTS idx_test_programmatic_table_created_at ON public.test_programmatic_table(created_at);

-- Enable Row Level Security
ALTER TABLE public.test_programmatic_table ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Allow public read access" ON public.test_programmatic_table
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert" ON public.test_programmatic_table
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update" ON public.test_programmatic_table
    FOR UPDATE USING (true);

-- Create a function to execute arbitrary SQL (for programmatic table creation)
CREATE OR REPLACE FUNCTION public.execute_sql(query TEXT)
RETURNS TEXT AS $$
BEGIN
    EXECUTE query;
    RETURN 'Query executed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a more specific function for creating tables dynamically
CREATE OR REPLACE FUNCTION public.create_dynamic_table(
    table_name TEXT,
    table_schema TEXT
) RETURNS TEXT AS $$
BEGIN
    -- Validate table name to prevent SQL injection
    IF table_name !~ '^[a-zA-Z][a-zA-Z0-9_]*$' THEN
        RETURN 'Error: Invalid table name format';
    END IF;
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I (%s)', table_name, table_schema);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    
    RETURN 'Table ' || table_name || ' created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error creating table: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on table and columns
COMMENT ON TABLE public.test_programmatic_table IS 'Test table created programmatically to demonstrate Supabase CLI functionality';
COMMENT ON COLUMN public.test_programmatic_table.name IS 'Name of the test item';
COMMENT ON COLUMN public.test_programmatic_table.description IS 'Description of the test item';
COMMENT ON COLUMN public.test_programmatic_table.status IS 'Status of the item (active, inactive, pending)';
COMMENT ON COLUMN public.test_programmatic_table.priority IS 'Priority level (1-5, where 1 is highest)';
COMMENT ON COLUMN public.test_programmatic_table.metadata IS 'Additional metadata stored as JSONB';