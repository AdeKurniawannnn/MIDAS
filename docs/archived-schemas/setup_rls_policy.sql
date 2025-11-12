ALTER TABLE "Contact" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for all users" ON "Contact"
FOR INSERT
TO public
WITH CHECK (true);

-- Enable RLS on data_scraping_instagram table
ALTER TABLE "data_scraping_instagram" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all rows
CREATE POLICY "Allow authenticated users to read all rows" ON "data_scraping_instagram"
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert their own data
CREATE POLICY "Allow authenticated users to insert their own data" ON "data_scraping_instagram"
FOR INSERT
TO authenticated
WITH CHECK (true);
