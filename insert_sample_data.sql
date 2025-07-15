-- Insert sample data
INSERT INTO public.data_scraping_instagram 
  ("inputUrl", username, "followersCount", "followsCount", biography, "postsCount", 
   "highlightReelCount", "igtvVideoCount", "latestPostsTotal", "latestPostsLikes", 
   "latestPostsComments", "Url", "User_Id", gmail)
VALUES
  (
    'https://www.instagram.com/midas.id/', 
    'midas.id',
    '10000',
    '500',
    'Digital Marketing Agency 🚀',
    '150',
    '5',
    '10',
    '20',
    '500',
    '50',
    'https://www.instagram.com/midas.id/',
    'user123',
    'admin@midas.id'
  ),
  (
    'https://www.instagram.com/midasorion/', 
    'midasorion',
    '5000',
    '300',
    'Orion Project by MIDAS 🎯',
    '75',
    '3',
    '5',
    '15',
    '300',
    '30',
    'https://www.instagram.com/midasorion/',
    'user124',
    'orion@midas.id'
  ); 