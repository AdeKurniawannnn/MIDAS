-- =============================================
-- MIDAS Database Seed Data
-- Sample data for development and testing
-- =============================================

-- Note: This seed data will only run in local development
-- Production data should be managed through the application

-- Insert sample contacts (if table is empty)
INSERT INTO public.contacts (name, email, company, message, status) 
SELECT * FROM (VALUES
    ('John Doe', 'john@example.com', 'Tech Corp', 'Interested in digital marketing services', 'new'),
    ('Jane Smith', 'jane@startup.io', 'Startup Inc', 'Need help with social media strategy', 'contacted'),
    ('Bob Wilson', 'bob@business.com', 'Wilson Business', 'Looking for performance marketing solutions', 'new')
) AS v(name, email, company, message, status)
WHERE NOT EXISTS (SELECT 1 FROM public.contacts LIMIT 1);

-- Insert sample keyword categories
INSERT INTO public.keywords (keyword, description, category, priority, status, tags, search_volume, difficulty, cpc, competition)
SELECT * FROM (VALUES
    ('digital marketing', 'Main service keyword', 'services', 5, 'active', ARRAY['marketing', 'digital'], 12000, 75, 2.50, 'high'),
    ('social media management', 'Social media services', 'services', 4, 'active', ARRAY['social', 'management'], 8500, 65, 1.80, 'medium'),
    ('SEO optimization', 'Search engine optimization', 'services', 4, 'active', ARRAY['seo', 'optimization'], 15000, 80, 3.20, 'high'),
    ('content marketing', 'Content creation and strategy', 'services', 3, 'active', ARRAY['content', 'marketing'], 7200, 60, 1.90, 'medium'),
    ('influencer marketing', 'KOL and influencer campaigns', 'services', 3, 'active', ARRAY['influencer', 'kol'], 4500, 55, 2.10, 'medium')
) AS v(keyword, description, category, priority, status, tags, search_volume, difficulty, cpc, competition)
WHERE NOT EXISTS (SELECT 1 FROM public.keywords LIMIT 1);

-- Insert sample Google Maps data
INSERT INTO public.data_scraping_google_maps (
    inputUrl, placeName, address, phoneNumber, website, rating, reviewCount, 
    category, hours, description, coordinates, user_id
)
SELECT * FROM (VALUES
    ('https://maps.google.com/place1', 'Sample Restaurant', '123 Main St, City', '+1234567890', 'www.restaurant.com', '4.5', '150', 'Restaurant', '9AM-10PM', 'Great local restaurant', '40.7128,-74.0060', 'sample-user'),
    ('https://maps.google.com/place2', 'Local Cafe', '456 Oak Ave, City', '+1234567891', 'www.cafe.com', '4.2', '87', 'Cafe', '7AM-6PM', 'Cozy neighborhood cafe', '40.7129,-74.0061', 'sample-user'),
    ('https://maps.google.com/place3', 'Beauty Salon', '789 Pine St, City', '+1234567892', 'www.salon.com', '4.7', '203', 'Beauty Salon', '9AM-8PM', 'Full service beauty salon', '40.7130,-74.0062', 'sample-user')
) AS v(inputUrl, placeName, address, phoneNumber, website, rating, reviewCount, category, hours, description, coordinates, user_id)
WHERE NOT EXISTS (SELECT 1 FROM public.data_scraping_google_maps LIMIT 1);

-- Insert sample Instagram data
INSERT INTO public.data_scraping_instagram (
    username, full_name, bio, followers_count, following_count, posts_count,
    is_verified, is_private, category, tags, engagement_rate, user_id
)
SELECT * FROM (VALUES
    ('foodie_blogger', 'Sarah Food Blogger', 'Sharing delicious recipes and food adventures 🍽️', 25000, 1200, 450, false, false, 'Food', ARRAY['food', 'recipes', 'blogger'], 3.25, 'sample-user'),
    ('tech_reviewer', 'Mike Tech Reviews', 'Latest tech reviews and unboxings 📱💻', 45000, 800, 320, true, false, 'Technology', ARRAY['tech', 'reviews', 'gadgets'], 4.15, 'sample-user'),
    ('fitness_guru', 'Fit Life Coach', 'Your daily dose of fitness motivation 💪', 32000, 950, 680, false, false, 'Fitness', ARRAY['fitness', 'health', 'motivation'], 5.80, 'sample-user')
) AS v(username, full_name, bio, followers_count, following_count, posts_count, is_verified, is_private, category, tags, engagement_rate, user_id)
WHERE NOT EXISTS (SELECT 1 FROM public.data_scraping_instagram LIMIT 1);

-- Insert sample KOL data
INSERT INTO public.kol_data (
    name, platform, username, followers_count, engagement_rate, category, 
    location, contact_info, rates, status
)
SELECT * FROM (VALUES
    ('Sarah Johnson', 'instagram', 'foodie_blogger', 25000, 3.25, 'Food & Lifestyle', 'New York, USA', '{"email": "sarah@example.com", "phone": "+1234567890"}', '{"post": 500, "story": 200, "reel": 800}', 'active'),
    ('Mike Chen', 'instagram', 'tech_reviewer', 45000, 4.15, 'Technology', 'San Francisco, USA', '{"email": "mike@example.com", "phone": "+1234567891"}', '{"post": 1200, "story": 400, "reel": 1500}', 'active'),
    ('Lisa Workout', 'instagram', 'fitness_guru', 32000, 5.80, 'Fitness & Health', 'Los Angeles, USA', '{"email": "lisa@example.com", "phone": "+1234567892"}', '{"post": 800, "story": 300, "reel": 1000}', 'active')
) AS v(name, platform, username, followers_count, engagement_rate, category, location, contact_info, rates, status)
WHERE NOT EXISTS (SELECT 1 FROM public.kol_data LIMIT 1);

-- Insert sample statistics
INSERT INTO public.statistics (table_name, metric_name, metric_value, metadata)
SELECT * FROM (VALUES
    ('keywords', 'total_count', 5, '{"period": "current"}'),
    ('data_scraping_google_maps', 'total_count', 3, '{"period": "current"}'),
    ('data_scraping_instagram', 'total_count', 3, '{"period": "current"}'),
    ('kol_data', 'total_count', 3, '{"period": "current"}'),
    ('contacts', 'total_count', 3, '{"period": "current"}')
) AS v(table_name, metric_name, metric_value, metadata)
WHERE NOT EXISTS (SELECT 1 FROM public.statistics LIMIT 1);