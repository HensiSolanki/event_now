-- Sample data for testing Places API
-- Run this after migrations to have test data

-- Insert sample categories (if not already present)
INSERT INTO place_categories (name, slug, description, color, is_active, sort_order, created_at, updated_at)
VALUES 
('Restaurants', 'restaurants', 'Find the best restaurants in town', '#FF5733', 1, 1, NOW(), NOW()),
('Bars & Clubs', 'bars-clubs', 'Nightlife and entertainment venues', '#33C1FF', 1, 2, NOW(), NOW()),
('Sports Venues', 'sports-venues', 'Sports and fitness locations', '#33FF57', 1, 3, NOW(), NOW()),
('Live Music', 'live-music', 'Live music and concert venues', '#FF33C1', 1, 4, NOW(), NOW()),
('Cafes', 'cafes', 'Coffee shops and cafes', '#FFC733', 1, 5, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=name;

-- Insert sample places
INSERT INTO places (
    category_id, name, slug, description, location, 
    latitude, longitude, pricing, price_range_min, price_range_max,
    opening_time, closing_time, is_open_24_7, operating_days,
    phone, email, website,
    average_rating, total_ratings, is_featured, is_active, view_count,
    created_at, updated_at
) VALUES 
(
    1, 'The Grand Bistro', 'the-grand-bistro',
    'An elegant fine dining restaurant offering contemporary cuisine with a focus on local, seasonal ingredients. Perfect for special occasions.',
    '123 Main Street, Downtown, City Center, 12345',
    40.7128, -74.0060, 'expensive', 50.00, 150.00,
    '17:00:00', '23:00:00', 0, '["tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]',
    '+1-555-0101', 'info@grandbistro.com', 'https://grandbistro.com',
    4.50, 0, 1, 1, 0, NOW(), NOW()
),
(
    1, 'Pizza Paradise', 'pizza-paradise',
    'Family-friendly Italian restaurant serving authentic wood-fired pizzas and pasta dishes.',
    '456 Oak Avenue, Westside, 12346',
    40.7580, -73.9855, 'moderate', 15.00, 40.00,
    '11:00:00', '22:00:00', 0, '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]',
    '+1-555-0102', 'hello@pizzaparadise.com', 'https://pizzaparadise.com',
    4.20, 0, 1, 1, 0, NOW(), NOW()
),
(
    2, 'Skyline Lounge', 'skyline-lounge',
    'Rooftop bar with stunning city views, craft cocktails, and live DJ sets on weekends.',
    '789 High Street, 20th Floor, Downtown, 12347',
    40.7589, -73.9851, 'expensive', 30.00, 100.00,
    '18:00:00', '02:00:00', 0, '["thursday", "friday", "saturday"]',
    '+1-555-0103', 'reservations@skylinelounge.com', 'https://skylinelounge.com',
    4.70, 0, 1, 1, 0, NOW(), NOW()
),
(
    3, 'FitZone Gym', 'fitzone-gym',
    'Modern fitness center with state-of-the-art equipment, group classes, and personal training services.',
    '321 Fitness Road, Midtown, 12348',
    40.7614, -73.9776, 'moderate', 30.00, 80.00,
    '06:00:00', '22:00:00', 0, '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]',
    '+1-555-0104', 'info@fitzonegym.com', 'https://fitzonegym.com',
    4.30, 0, 0, 1, 0, NOW(), NOW()
),
(
    4, 'Blue Note Jazz Club', 'blue-note-jazz-club',
    'Legendary jazz club featuring world-class musicians in an intimate setting. Dinner and drinks available.',
    '131 West 3rd Street, Greenwich Village, 12349',
    40.7308, -74.0008, 'expensive', 40.00, 120.00,
    '19:00:00', '01:00:00', 0, '["wednesday", "thursday", "friday", "saturday", "sunday"]',
    '+1-555-0105', 'bookings@bluenotejazz.com', 'https://bluenotejazz.com',
    4.80, 0, 1, 1, 0, NOW(), NOW()
),
(
    5, 'Brew & Bean Cafe', 'brew-bean-cafe',
    'Cozy neighborhood cafe serving artisanal coffee, fresh pastries, and light meals. Free WiFi available.',
    '555 Coffee Lane, East Side, 12350',
    40.7489, -73.9680, 'budget', 5.00, 20.00,
    '07:00:00', '19:00:00', 0, '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]',
    '+1-555-0106', 'hello@brewbean.com', 'https://brewbean.com',
    4.40, 0, 0, 1, 0, NOW(), NOW()
),
(
    1, 'Sushi Master', 'sushi-master',
    'Traditional Japanese sushi restaurant with an experienced chef and fresh daily selections.',
    '888 Harbor Drive, Waterfront, 12351',
    40.7061, -74.0087, 'expensive', 60.00, 180.00,
    '12:00:00', '22:00:00', 0, '["tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]',
    '+1-555-0107', 'reservations@sushimaster.com', 'https://sushimaster.com',
    4.60, 0, 1, 1, 0, NOW(), NOW()
),
(
    2, 'The Underground', 'the-underground',
    'Alternative music venue and bar hosting indie bands, DJ nights, and open mic sessions.',
    '222 Basement Street, Arts District, 12352',
    40.7282, -73.9942, 'moderate', 10.00, 40.00,
    '20:00:00', '03:00:00', 0, '["friday", "saturday"]',
    '+1-555-0108', 'bookings@theunderground.com', 'https://theunderground.com',
    4.10, 0, 0, 1, 0, NOW(), NOW()
),
(
    5, 'Morning Glory Bakery', 'morning-glory-bakery',
    'Artisan bakery specializing in sourdough bread, croissants, and custom cakes.',
    '777 Bakery Boulevard, Old Town, 12353',
    40.7396, -73.9893, 'budget', 3.00, 25.00,
    '06:00:00', '18:00:00', 0, '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]',
    '+1-555-0109', 'orders@morningglory.com', 'https://morningglory.com',
    4.50, 0, 0, 1, 0, NOW(), NOW()
),
(
    1, 'Taco Fiesta', 'taco-fiesta',
    'Vibrant Mexican restaurant serving authentic tacos, burritos, and margaritas in a festive atmosphere.',
    '999 Sunset Boulevard, West End, 12354',
    40.7831, -73.9712, 'budget', 8.00, 30.00,
    '11:00:00', '23:00:00', 0, '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]',
    '+1-555-0110', 'info@tacofiesta.com', 'https://tacofiesta.com',
    4.35, 0, 0, 1, 0, NOW(), NOW()
);

-- Note: Images and ratings can be added via API after this
-- Use the POST /api/auth/places/:id/images endpoint to upload images
-- Use the POST /api/auth/places/:id/ratings endpoint to add ratings

SELECT 'Sample data inserted successfully!' as message;
SELECT COUNT(*) as total_places FROM places;

