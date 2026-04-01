-- Tabaq Database Seed Script
-- Run with: psql $DATABASE_URL -f scripts/seed.sql

-- ── Countries ──────────────────────────────────────────────────────────────
INSERT INTO countries (name_en, name_ar, code, flag)
VALUES ('Saudi Arabia', 'المملكة العربية السعودية', 'SA', '🇸🇦')
ON CONFLICT (code) DO NOTHING;

-- ── Cities ─────────────────────────────────────────────────────────────────
INSERT INTO cities (name_en, name_ar, country_id, latitude, longitude)
SELECT name_en, name_ar, c.id, lat, lon FROM (VALUES
  ('Riyadh',  'الرياض',             24.7136, 46.6753),
  ('Jeddah',  'جدة',                21.4858, 39.1925),
  ('Dammam',  'الدمام',             26.4207, 50.0888),
  ('Mecca',   'مكة المكرمة',        21.3891, 39.8579),
  ('Medina',  'المدينة المنورة',    24.5247, 39.5692),
  ('NEOM',    'نيوم',               28.0339, 35.3083),
  ('AlUla',   'العُلا',             26.6196, 37.9221),
  ('Khobar',  'الخبر',              26.2172, 50.1971)
) AS v(name_en, name_ar, lat, lon)
CROSS JOIN countries c WHERE c.code = 'SA'
ON CONFLICT DO NOTHING;

-- ── Categories ─────────────────────────────────────────────────────────────
INSERT INTO categories (name_en, name_ar, icon, slug) VALUES
  ('Saudi',       'سعودي',              '🇸🇦', 'saudi'),
  ('Grills',      'مشاوي',              '🔥',  'grills'),
  ('Seafood',     'مأكولات بحرية',       '🦞', 'seafood'),
  ('Asian',       'آسيوي',              '🍜', 'asian'),
  ('Italian',     'إيطالي',             '🍝', 'italian'),
  ('Burgers',     'برجر',               '🍔', 'burgers'),
  ('Pizza',       'بيتزا',              '🍕', 'pizza'),
  ('Healthy',     'صحي',                '🥗', 'healthy'),
  ('Desserts',    'حلويات',             '🍰', 'desserts'),
  ('Café',        'كافيه',              '☕', 'cafe'),
  ('Sushi',       'سوشي',               '🍱', 'sushi'),
  ('Levantine',   'شامي',               '🫔', 'levantine'),
  ('Indian',      'هندي',               '🍛', 'indian'),
  ('Turkish',     'تركي',               '🥙', 'turkish'),
  ('Mexican',     'مكسيكي',             '🌮', 'mexican'),
  ('Fine Dining', 'فاين دايننج',         '✨', 'fine-dining')
ON CONFLICT (slug) DO NOTHING;

-- ── Occasions ──────────────────────────────────────────────────────────────
INSERT INTO occasions (name_en, name_ar, icon, slug) VALUES
  ('Romantic Date',    'موعد رومانسي',    '❤️',   'romantic'),
  ('Family Gathering', 'تجمع عائلي',      '👨‍👩‍👧‍👦', 'family'),
  ('Business Lunch',   'غداء عمل',        '💼',   'business'),
  ('Birthday',         'عيد ميلاد',       '🎂',   'birthday'),
  ('Celebration',      'احتفال',           '🥂',   'celebration'),
  ('Casual Hangout',   'لقاء غير رسمي',   '😊',   'casual'),
  ('Breakfast',        'فطور',             '🌅',   'breakfast'),
  ('Late Night',       'ليلي',             '🌙',   'late-night')
ON CONFLICT (slug) DO NOTHING;

-- ── Restaurants ────────────────────────────────────────────────────────────
INSERT INTO restaurants (
  ref_code, name_en, name_ar, slug, description_en, description_ar,
  cover_image_url, price_tier, avg_rating, review_count, follower_count,
  is_verified, is_featured, is_active, is_halal,
  city_id, country_id, address, phone,
  has_parking, has_outdoor_seating, has_private_room,
  latitude, longitude
)
SELECT
  v.ref_code, v.name_en, v.name_ar, v.slug, v.description_en, v.description_ar,
  v.cover_image_url, v.price_tier::price_tier, v.avg_rating, v.review_count, v.follower_count,
  v.is_verified, v.is_featured, v.is_active, v.is_halal,
  ct.id, co.id, v.address, v.phone,
  v.has_parking, v.has_outdoor_seating, v.has_private_room,
  v.latitude, v.longitude
FROM (VALUES
  (
    'TBQ-RST-2026-000001', 'Najd Village', 'قرية نجد', 'najd-village',
    'An iconic Saudi restaurant offering traditional Najdi cuisine in a village-style atmosphere with authentic decor and warm hospitality.',
    'مطعم سعودي أيقوني يقدم المطبخ النجدي التقليدي في أجواء القرية مع ديكور أصيل وضيافة دافئة.',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
    'upscale', 4.7, 1243, 8900, true, true, true, true,
    'Riyadh', '+966112345678', true, true, true, 24.7136, 46.6753
  ),
  (
    'TBQ-RST-2026-000002', 'Nakheel Palace', 'قصر النخيل', 'nakheel-palace',
    'A luxurious fine dining experience inspired by the splendor of ancient Arabian palaces.',
    'تجربة طعام فاخرة مستوحاة من روعة القصور العربية القديمة.',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80',
    'fine_dining', 4.9, 687, 12300, true, true, true, true,
    'Riyadh', '+966112345679', true, false, true, 24.7250, 46.6935
  ),
  (
    'TBQ-RST-2026-000003', 'Sushi Hana', 'سوشي هانا', 'sushi-hana',
    'Premium Japanese cuisine with the finest sushi, sashimi, and teppanyaki in a sleek, modern ambiance.',
    'مطبخ ياباني فاخر مع أفضل السوشي والساشيمي والتيبانياكي في أجواء عصرية أنيقة.',
    'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80',
    'upscale', 4.6, 934, 7800, true, true, true, true,
    'Riyadh', '+966112345680', true, false, false, 24.6915, 46.6832
  ),
  (
    'TBQ-RST-2026-000004', 'Maestro Italian', 'ماستيرو إيطالي', 'maestro-italian',
    'Authentic Italian cuisine prepared by master chefs, featuring handmade pasta and wood-fired pizza.',
    'مطبخ إيطالي أصيل يعده أمهر الطهاة، مع باستا محلية الصنع وبيتزا من الفرن الخشبي.',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
    'upscale', 4.5, 1120, 6500, true, false, true, true,
    'Jeddah', '+966122345678', true, true, false, 21.5010, 39.1920
  ),
  (
    'TBQ-RST-2026-000005', 'Al Baik Express', 'البيك إكسبريس', 'al-baik-express',
    'The iconic Saudi fast food chain known for its legendary broasted chicken, fresh seafood, and crispy fries.',
    'سلسلة الوجبات السريعة السعودية الأيقونية المشهورة بدجاجها البروستد الأسطوري.',
    'https://images.unsplash.com/photo-1562967914-608f82629710?w=1200&q=80',
    'budget', 4.8, 15400, 45000, true, true, true, true,
    'Jeddah', '+966122345679', true, false, false, 21.4858, 39.1925
  ),
  (
    'TBQ-RST-2026-000006', 'Kana Sushi', 'كانا سوشي', 'kana-sushi',
    'Contemporary sushi bar with creative fusion rolls, fresh catches, and a vibrant atmosphere.',
    'بار سوشي عصري مع رولات مبتكرة وأسماك طازجة وأجواء رائعة.',
    'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=1200&q=80',
    'mid', 4.4, 782, 5200, true, false, true, true,
    'Dammam', '+966133345678', true, true, false, 26.4207, 50.0888
  ),
  (
    'TBQ-RST-2026-000007', 'The Grill House', 'جريل هاوس', 'the-grill-house',
    'Premium steakhouse with the finest cuts of USDA and Wagyu beef, expertly grilled to perfection.',
    'مطعم ستيك فاخر يقدم أجود قطع اللحم الأمريكي والواغيو، مشوية باحتراف.',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&q=80',
    'fine_dining', 4.8, 891, 9100, true, true, true, true,
    'Riyadh', '+966112345681', true, false, true, 24.7090, 46.6540
  ),
  (
    'TBQ-RST-2026-000008', 'Casa Levant', 'كاسا ليفانت', 'casa-levant',
    'Authentic Levantine flavors from Lebanon and Syria, featuring mezze platters, grills, and traditional sweets.',
    'نكهات شامية أصيلة من لبنان وسوريا، مع ألواح المازة والمشاوي والحلويات التقليدية.',
    'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=1200&q=80',
    'mid', 4.5, 1056, 6800, true, false, true, true,
    'Riyadh', '+966112345682', true, true, false, 24.6805, 46.7132
  ),
  (
    'TBQ-RST-2026-000009', 'Green Bowl', 'جرين بول', 'green-bowl',
    'Your go-to destination for nutritious, delicious healthy bowls, salads, and cold-pressed juices.',
    'وجهتك المثالية للأطباق الصحية اللذيذة والسلطات والعصائر الطازجة.',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80',
    'mid', 4.3, 643, 4200, true, false, true, true,
    'Riyadh', '+966112345683', true, true, false, 24.7453, 46.6270
  ),
  (
    'TBQ-RST-2026-000010', 'Café Bateel', 'مقهى باتيل', 'cafe-bateel',
    'The luxury Saudi café brand celebrated for its premium organic dates, artisan coffees, and gourmet pastries.',
    'علامة المقهى السعودية الفاخرة المشهورة بالتمور العضوية الفاخرة والقهوة الحرفية.',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&q=80',
    'upscale', 4.6, 2340, 18000, true, true, true, true,
    'Riyadh', '+966112345684', true, false, false, 24.7118, 46.6750
  ),
  (
    'TBQ-RST-2026-000011', 'Bahar Seafood', 'بحر للمأكولات البحرية', 'bahar-seafood',
    'Fresh catch from Saudi and Gulf waters, grilled, fried, or served in rich seafood broths.',
    'صيد طازج من المياه السعودية والخليجية، مشوي أو مقلي أو في مرق بحري غني.',
    'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=1200&q=80',
    'upscale', 4.7, 1108, 7600, true, true, true, true,
    'Jeddah', '+966122345680', true, true, false, 21.5010, 39.1200
  ),
  (
    'TBQ-RST-2026-000012', 'Spice Route India', 'طريق التوابل الهندي', 'spice-route-india',
    'Vibrant Indian cuisine from Mumbai to Kerala, with tandoori specialties, curries, and biryanis.',
    'مطبخ هندي نابض من مومباي إلى كيرالا، مع تخصصات التندوري والكاري والبرياني.',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80',
    'mid', 4.4, 876, 5500, true, false, true, true,
    'Riyadh', '+966112345685', true, false, false, 24.7550, 46.7200
  )
) AS v(
  ref_code, name_en, name_ar, slug, description_en, description_ar,
  cover_image_url, price_tier, avg_rating, review_count, follower_count,
  is_verified, is_featured, is_active, is_halal,
  city_name, phone, has_parking, has_outdoor_seating, has_private_room,
  latitude, longitude
)
JOIN cities ct ON ct.name_en = v.city_name
JOIN countries co ON co.code = 'SA'
ON CONFLICT (slug) DO NOTHING;

-- ── Restaurant–Category Links ───────────────────────────────────────────────
INSERT INTO restaurant_categories (restaurant_id, category_id)
SELECT r.id, c.id FROM (VALUES
  ('najd-village',    'saudi'),
  ('najd-village',    'grills'),
  ('nakheel-palace',  'fine-dining'),
  ('nakheel-palace',  'saudi'),
  ('nakheel-palace',  'levantine'),
  ('sushi-hana',      'sushi'),
  ('sushi-hana',      'asian'),
  ('maestro-italian', 'italian'),
  ('al-baik-express', 'grills'),
  ('kana-sushi',      'sushi'),
  ('the-grill-house', 'grills'),
  ('the-grill-house', 'fine-dining'),
  ('casa-levant',     'levantine'),
  ('green-bowl',      'healthy'),
  ('cafe-bateel',     'cafe'),
  ('cafe-bateel',     'desserts'),
  ('bahar-seafood',   'seafood'),
  ('spice-route-india','indian')
) AS v(rslug, cslug)
JOIN restaurants r ON r.slug = v.rslug
JOIN categories c ON c.slug = v.cslug
ON CONFLICT DO NOTHING;

-- ── Restaurant–Occasion Links ──────────────────────────────────────────────
INSERT INTO restaurant_occasions (restaurant_id, occasion_id)
SELECT r.id, o.id FROM (VALUES
  ('najd-village',   'family'),
  ('najd-village',   'celebration'),
  ('nakheel-palace', 'romantic'),
  ('nakheel-palace', 'business'),
  ('nakheel-palace', 'birthday'),
  ('sushi-hana',     'romantic'),
  ('sushi-hana',     'casual'),
  ('the-grill-house','business'),
  ('the-grill-house','celebration'),
  ('casa-levant',    'family'),
  ('casa-levant',    'casual'),
  ('cafe-bateel',    'business'),
  ('cafe-bateel',    'casual'),
  ('green-bowl',     'casual'),
  ('green-bowl',     'breakfast')
) AS v(rslug, oslug)
JOIN restaurants r ON r.slug = v.rslug
JOIN occasions o ON o.slug = v.oslug
ON CONFLICT DO NOTHING;

-- ── Opening Hours (all restaurants, daily) ─────────────────────────────────
INSERT INTO opening_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
SELECT r.id, d.day, 
  CASE WHEN d.day = 5 THEN '12:00' ELSE '11:00' END,
  '23:30', false
FROM restaurants r
CROSS JOIN (VALUES (0),(1),(2),(3),(4),(5),(6)) AS d(day)
ON CONFLICT DO NOTHING;

-- ── Menus ──────────────────────────────────────────────────────────────────
INSERT INTO menus (restaurant_id, name_en, name_ar, type, is_active, display_order)
SELECT id, 'Main Menu', 'القائمة الرئيسية', 'food', true, 0
FROM restaurants
ON CONFLICT DO NOTHING;

-- ── Menu Sections ──────────────────────────────────────────────────────────
INSERT INTO menu_sections (menu_id, name_en, name_ar, display_order)
SELECT m.id, s.name_en, s.name_ar, s.ord
FROM menus m
CROSS JOIN (VALUES
  ('Starters',     'المقبلات',          0),
  ('Main Course',  'الطبق الرئيسي',     1),
  ('Desserts',     'الحلويات',          2)
) AS s(name_en, name_ar, ord)
ON CONFLICT DO NOTHING;

-- ── Dishes ─────────────────────────────────────────────────────────────────
-- Najd Village dishes
INSERT INTO dishes (
  restaurant_id, menu_section_id, name_en, name_ar, description_en, description_ar,
  price, currency, image_url, is_available, is_halal, is_tabaq_star, is_most_ordered,
  is_bestseller, is_chef_choice, popularity_score
)
SELECT
  r.id, ms.id,
  v.name_en, v.name_ar, v.description_en, v.description_ar,
  v.price, 'SAR', v.image_url, true, true,
  v.is_star, v.is_most, v.is_best, v.is_chef, v.pop
FROM restaurants r
JOIN menus m ON m.restaurant_id = r.id
JOIN menu_sections ms ON ms.menu_id = m.id AND ms.name_en = v.section
CROSS JOIN (VALUES
  -- Najd Village
  ('Jareesh', 'جريش', 'Traditional crushed wheat cooked with lamb and spices', 'قمح مطحون تقليدي مطهو مع لحم الضأن والبهارات', 45.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80', 'Starters', true, false, true, false, 95.0, 'najd-village'),
  ('Murtabak', 'مرطبك', 'Stuffed pancake with egg, lamb, and onion', 'فطيرة محشوة بالبيض واللحم والبصل', 38.00, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80', 'Starters', false, false, false, false, 70.0, 'najd-village'),
  ('Lamb Mansaf', 'منسف لحم ضأن', 'Tender lamb in fermented dried yogurt sauce over fragrant rice', 'لحم ضأن طري في صلصة اللبن المجفف مع الأرز العطر', 185.00, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80', 'Main Course', true, true, true, false, 98.0, 'najd-village'),
  ('Saleeg Rice with Chicken', 'أرز سليق بالدجاج', 'Creamy milk-cooked rice topped with roasted chicken', 'أرز كريمي مطهو بالحليب مع دجاج مشوي', 95.00, 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=500&q=80', 'Main Course', false, false, true, false, 85.0, 'najd-village'),
  ('Harees', 'هريس', 'Slow-cooked wheat and lamb, a Ramadan classic', 'هريسة القمح واللحم المطهو ببطء', 28.00, NULL, 'Desserts', false, false, false, false, 60.0, 'najd-village'),
  -- Sushi Hana
  ('Edamame', 'أدامامي', 'Steamed young soybeans with sea salt', 'فول الصويا المسلوق بملح البحر', 22.00, NULL, 'Starters', false, false, false, false, 55.0, 'sushi-hana'),
  ('Miso Soup', 'شوربة ميسو', 'Traditional Japanese miso broth with tofu and wakame', 'حساء الميسو الياباني التقليدي مع التوفو', 18.00, NULL, 'Starters', false, false, false, false, 50.0, 'sushi-hana'),
  ('Salmon Nigiri (6 pcs)', 'نيجيري سلمون (٦ قطع)', 'Premium Atlantic salmon over hand-pressed sushi rice', 'سلمون أطلنطي فاخر على أرز السوشي المضغوط يدوياً', 85.00, 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=500&q=80', 'Main Course', true, false, true, false, 96.0, 'sushi-hana'),
  ('Dragon Roll', 'درغون رول', 'Shrimp tempura inside, avocado and eel sauce on top', 'جمبري تمبورا من الداخل، أفوكادو وصلصة الإيل من الأعلى', 72.00, 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=500&q=80', 'Main Course', false, false, true, false, 88.0, 'sushi-hana'),
  ('Wagyu Teppanyaki', 'واغيو تيبانياكي', 'A5 Wagyu beef cooked tableside on the iron griddle', 'لحم واغيو A5 مطهو على الطاولة على الشواية الحديدية', 380.00, NULL, 'Main Course', true, false, false, true, 92.0, 'sushi-hana'),
  ('Mochi Ice Cream', 'موشي آيس كريم', 'Japanese rice cake filled with premium matcha ice cream', 'كعكة الأرز اليابانية محشوة بآيس كريم الماتشا الفاخر', 32.00, NULL, 'Desserts', false, false, false, false, 65.0, 'sushi-hana'),
  -- The Grill House
  ('Burrata Salad', 'سلطة بوراتا', 'Fresh burrata with heritage tomatoes, basil oil, and balsamic reduction', 'بوراتا طازجة مع طماطم موروثة وزيت الريحان', 68.00, NULL, 'Starters', false, false, false, false, 72.0, 'the-grill-house'),
  ('USDA Prime Ribeye 400g', 'ريب آي USDA برايم ٤٠٠ جرام', 'Prime USDA ribeye, dry-aged 35 days, cooked to your preferred temperature', 'ريب آي USDA برايم، ناضج جافاً ٣٥ يوماً', 420.00, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&q=80', 'Main Course', true, true, true, false, 99.0, 'the-grill-house'),
  ('Wagyu Tomahawk', 'واغيو توماهوك', 'Show-stopping Japanese Wagyu tomahawk for two, served tableside', 'واغيو ياباني توماهوك رائع لشخصين', 890.00, NULL, 'Main Course', true, false, false, true, 95.0, 'the-grill-house'),
  ('Molten Chocolate', 'صلصة الشوكولاتة', 'Warm Belgian chocolate fondant with vanilla bean ice cream', 'فوندان بلجيكي دافئ مع آيس كريم الفانيلا', 58.00, NULL, 'Desserts', false, false, false, false, 80.0, 'the-grill-house'),
  -- Café Bateel
  ('Organic Date Platter', 'طبق التمور العضوية', 'A curated selection of premium organic Medjool, Sukkari, and Ajwa dates', 'تشكيلة مختارة من تمور المجدول والسكري والعجوة العضوية الفاخرة', 85.00, 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=500&q=80', 'Starters', true, false, true, false, 94.0, 'cafe-bateel'),
  ('Avocado Toast', 'توست الأفوكادو', 'Sourdough toast with smashed avocado, poached egg, and dukkah', 'توست عجين المعجون مع أفوكادو مهروس وبيض مسلوق', 62.00, NULL, 'Starters', false, false, false, false, 70.0, 'cafe-bateel'),
  ('Signature Bateel Latte', 'لاتيه باتيل المميز', 'Artisan single-origin espresso with velvety steamed milk and date syrup', 'إسبريسو حرفي أحادي الأصل مع حليب مبخر مخملي وشراب التمر', 32.00, NULL, 'Main Course', false, false, true, false, 90.0, 'cafe-bateel'),
  ('Date & Walnut Cake', 'كيكة التمر والجوز', 'Moist date and walnut sponge with caramel date glaze', 'إسفنجة التمر والجوز الرطبة مع تزجيج التمر الكراميلي', 45.00, NULL, 'Desserts', true, false, false, false, 88.0, 'cafe-bateel'),
  -- Green Bowl
  ('Power Bowl', 'باور بول', 'Quinoa, roasted sweet potato, chickpeas, tahini, and fresh herbs', 'كينوا وبطاطا حلوة محمصة وحمص وطحينة وأعشاب طازجة', 68.00, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80', 'Main Course', false, false, true, false, 92.0, 'green-bowl'),
  ('Grilled Chicken Salad', 'سلطة الدجاج المشوي', 'Char-grilled chicken breast on mixed greens with lemon vinaigrette', 'صدر دجاج مشوي على خضار مشكلة مع صلصة الليمون', 72.00, NULL, 'Main Course', false, false, false, false, 78.0, 'green-bowl'),
  ('Açaí Bowl', 'آساي بول', 'Organic açaí blend topped with granola, banana, and mixed berries', 'مزيج آساي عضوي مع جرانولا وموز وتوت مشكل', 58.00, NULL, 'Main Course', false, false, false, false, 75.0, 'green-bowl'),
  ('Green Detox Juice', 'عصير ديتوكس أخضر', 'Cold-pressed kale, cucumber, celery, green apple, and ginger', 'كيل وخيار وكرفس وتفاح أخضر وزنجبيل معصور بارداً', 35.00, NULL, 'Starters', false, false, false, false, 68.0, 'green-bowl'),
  -- Bahar Seafood
  ('Hammour Bil Za''tar', 'هامور بالزعتر', 'Fresh grouper with thyme crust, lemon butter sauce', 'هامور طازج بقشرة الزعتر وصلصة زبدة الليمون', 145.00, 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=500&q=80', 'Main Course', true, true, true, false, 97.0, 'bahar-seafood'),
  ('Mixed Seafood Grill', 'مشاوي بحرية مشكلة', 'Platter of grilled prawns, lobster, hammour, and calamari', 'طبق من الجمبري والكركند والهامور والكاليماري المشوي', 280.00, NULL, 'Main Course', false, false, false, false, 88.0, 'bahar-seafood'),
  ('Seafood Soup', 'شوربة بحرية', 'Rich traditional Gulf seafood broth with fresh catch', 'حساء بحري خليجي تقليدي غني مع أسماك طازجة', 45.00, NULL, 'Starters', false, false, false, false, 72.0, 'bahar-seafood'),
  -- Casa Levant
  ('Mezze Platter', 'طبق المازة', 'Hummus, baba ghanoush, fattoush, and warm pita bread', 'حمص وبابا غنوج وفتوش وخبز بيتا دافئ', 85.00, 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=500&q=80', 'Starters', true, false, true, false, 93.0, 'casa-levant'),
  ('Mixed Grill', 'مشاوي مشكلة', 'Skewers of kafta, shish tawook, and lamb chops', 'سيخ كفتة وشيش طاووق وضلوع الضأن', 165.00, NULL, 'Main Course', false, true, true, false, 91.0, 'casa-levant'),
  ('Kunafa', 'كنافة', 'Traditional Palestinian dessert with cheese and syrup', 'الكنافة الفلسطينية التقليدية مع الجبن والقطر', 45.00, NULL, 'Desserts', true, false, false, false, 87.0, 'casa-levant'),
  -- Spice Route India
  ('Chicken Tikka Masala', 'تكا ماسالا دجاج', 'Tender chicken in creamy tomato masala sauce', 'دجاج طري في صلصة ماسالا الطماطم الكريمية', 88.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80', 'Main Course', false, true, true, false, 93.0, 'spice-route-india'),
  ('Lamb Biryani', 'برياني لحم ضأن', 'Fragrant basmati rice cooked with tender lamb and whole spices', 'أرز بسمتي عطر مطهو مع لحم ضأن طري وبهارات', 110.00, NULL, 'Main Course', false, false, true, false, 90.0, 'spice-route-india'),
  ('Samosa Platter', 'طبق السمبوسة', 'Crispy vegetable and meat samosas with mint chutney', 'سمبوسة خضار ولحم مقرمشة مع صلصة النعناع', 38.00, NULL, 'Starters', false, false, false, false, 75.0, 'spice-route-india')
) AS v(name_en, name_ar, description_en, description_ar, price, image_url, section, is_star, is_most, is_best, is_chef, pop, rslug)
WHERE r.slug = v.rslug
ON CONFLICT DO NOTHING;

-- Generic dishes for remaining restaurants
INSERT INTO dishes (
  restaurant_id, menu_section_id, name_en, name_ar, description_en, description_ar,
  price, currency, is_available, is_halal, is_bestseller, popularity_score
)
SELECT
  r.id, ms.id,
  v.name_en, v.name_ar, v.desc_en, v.desc_ar,
  v.price, 'SAR', true, true, true, 75.0
FROM restaurants r
JOIN menus m ON m.restaurant_id = r.id
JOIN menu_sections ms ON ms.menu_id = m.id AND ms.name_en = 'Main Course'
CROSS JOIN (VALUES
  ('Chef''s Special', 'خاص الشيف', 'Our signature main course, prepared fresh daily', 'طبقنا الرئيسي المميز، يُحضّر طازجاً يومياً', 120.00)
) AS v(name_en, name_ar, desc_en, desc_ar, price)
WHERE r.slug NOT IN ('najd-village','sushi-hana','the-grill-house','cafe-bateel','green-bowl','bahar-seafood','casa-levant','spice-route-india')
ON CONFLICT DO NOTHING;

-- ── Blog Categories ─────────────────────────────────────────────────────────
INSERT INTO blog_categories (name_en, name_ar, slug, description_en, color)
VALUES
  ('Dining Guides',    'أدلة الطعام',     'dining-guides',    'Curated guides to the best dining experiences', '#e23744'),
  ('Chef Stories',     'قصص الطهاة',      'chef-stories',     'Stories from Saudi Arabia''s top chefs',         '#f59e0b'),
  ('Food Trends',      'اتجاهات الطعام',  'food-trends',      'The latest food and dining trends',             '#10b981'),
  ('Restaurant News',  'أخبار المطاعم',   'restaurant-news',  'Latest news from the restaurant industry',      '#6366f1'),
  ('Recipes',          'وصفات',            'recipes',          'Authentic recipes from top restaurants',        '#ec4899')
ON CONFLICT (slug) DO NOTHING;

-- ── Blog Posts (using first user as author) ─────────────────────────────────
INSERT INTO blog_posts (
  author_id, category_id, title_en, title_ar, slug,
  excerpt_en, excerpt_ar, content_en, content_ar,
  cover_image_url, status, is_featured, read_time_minutes,
  tags, published_at
)
SELECT
  u.id, bc.id,
  v.title_en, v.title_ar, v.slug,
  v.excerpt_en, v.excerpt_ar, v.content_en, v.content_ar,
  v.cover_url, 'published', v.is_featured, v.read_time,
  v.tags::jsonb, v.pub_date::timestamp
FROM users u
CROSS JOIN (VALUES
  (
    'dining-guides',
    'The Ultimate Guide to Riyadh''s Fine Dining Scene',
    'الدليل الشامل لمطاعم الفاين دايننج في الرياض',
    'riyadh-fine-dining-guide-2026',
    'From iconic Saudi palaces to contemporary international restaurants, Riyadh''s dining scene has never been more exciting.',
    'من القصور السعودية الأيقونية إلى المطاعم الدولية المعاصرة، مشهد الطعام في الرياض لم يكن أكثر إثارة.',
    '<h2>Riyadh''s Culinary Renaissance</h2><p>The Saudi capital has undergone a remarkable transformation in its dining scene. With Vision 2030, world-class chefs have flocked to Riyadh, creating an ecosystem that rivals Dubai and Paris.</p><p>Nakheel Palace stands at the pinnacle of Riyadh''s fine dining, offering an unparalleled blend of traditional Saudi hospitality and contemporary culinary artistry.</p>',
    '<h2>نهضة الطهي في الرياض</h2><p>شهدت العاصمة السعودية تحولاً ملحوظاً في مشهد الطعام مع رؤية 2030.</p>',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
    true, 8, '["riyadh","fine-dining","saudi-cuisine"]', '2026-01-15'
  ),
  (
    'dining-guides',
    'Best Seafood Restaurants in Jeddah — 2026',
    'أفضل مطاعم المأكولات البحرية في جدة — 2026',
    'jeddah-seafood-restaurants-2026',
    'Jeddah''s coastal location makes it Saudi Arabia''s seafood capital. Here are the top spots for fresh Red Sea catch.',
    'موقع جدة الساحلي يجعلها عاصمة المأكولات البحرية. إليك أفضل الأماكن للاستمتاع بصيد البحر الأحمر.',
    '<h2>Jeddah by the Sea</h2><p>Dining on fresh seafood while overlooking the Red Sea is a unique Jeddah experience. Bahar Seafood leads our list with fresh catch delivered daily from local fishermen.</p>',
    '<h2>جدة على البحر</h2><p>تناول المأكولات البحرية الطازجة مع إطلالة على البحر الأحمر تجربة جدة الفريدة.</p>',
    'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=1200&q=80',
    true, 6, '["jeddah","seafood","red-sea"]', '2026-02-20'
  ),
  (
    'food-trends',
    'The Rise of Healthy Dining in Saudi Arabia',
    'صعود الطعام الصحي في المملكة العربية السعودية',
    'healthy-dining-saudi-arabia-2026',
    'Health-conscious dining is no longer niche in Saudi Arabia. Discover how the restaurant scene is embracing nutritious options.',
    'لم يعد الطعام الصحي مفهوماً متخصصاً في المملكة. اكتشف كيف يتبنى مشهد المطاعم خيارات مغذية.',
    '<h2>A Health Revolution</h2><p>Saudi Arabia''s younger generation is driving a significant shift toward healthier dining. Today''s diners seek balanced, nutritious options that don''t sacrifice flavor.</p>',
    '<h2>ثورة صحية</h2><p>الجيل السعودي الشاب يقود تحولاً كبيراً نحو الطعام الصحي.</p>',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80',
    false, 5, '["healthy-eating","wellness","food-trends"]', '2026-03-10'
  )
) AS v(cat_slug, title_en, title_ar, slug, excerpt_en, excerpt_ar, content_en, content_ar, cover_url, is_featured, read_time, tags, pub_date)
JOIN blog_categories bc ON bc.slug = v.cat_slug
WHERE u.id = (SELECT MIN(id) FROM users)
ON CONFLICT (slug) DO NOTHING;

-- ── Offers ─────────────────────────────────────────────────────────────────
INSERT INTO offers (
  ref_code, restaurant_id, title_en, title_ar, description_en, description_ar,
  discount_type, discount_value, currency, min_order_value,
  valid_from, valid_until, is_active, is_featured, approval_status,
  image_url, total_vouchers_issued, voucher_limit
)
SELECT
  v.ref_code, r.id,
  v.title_en, v.title_ar, v.description_en, v.description_ar,
  v.discount_type::discount_type_enum, v.discount_value, 'SAR', v.min_order,
  '2026-01-01'::timestamp, '2026-12-31'::timestamp, true, v.is_featured, 'approved',
  v.image_url, 0, 500
FROM (VALUES
  ('TBQ-OFF-2026-000001', 'najd-village',    'Saudi Night Feast — 20% Off', 'وليمة الليل السعودية — خصم ٢٠٪', 'Enjoy 20% off the full menu every Thursday evening at Najd Village.', 'استمتع بخصم ٢٠٪ على كامل القائمة كل مساء خميس في قرية نجد.', 'percentage', 20.0, 150.0, true, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'),
  ('TBQ-OFF-2026-000002', 'sushi-hana',      'Sushi for Two — SAR 199',      'سوشي لاثنين — ١٩٩ ريال',          'Share the love with our romantic Sushi for Two set — 24 premium pieces.',           'شارك الحب مع طقم سوشي لاثنين الرومانسي — ٢٤ قطعة فاخرة.',                     'fixed',      50.0,   0.0, true, 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80'),
  ('TBQ-OFF-2026-000003', 'the-grill-house', 'Weekend Brunch — 15% Off',     'برانش نهاية الأسبوع — خصم ١٥٪',  'Treat yourself to our legendary weekend brunch with 15% off for groups of 4+.', 'دلّل نفسك ببرانش نهاية الأسبوع الأسطوري مع خصم ١٥٪ لمجموعات ٤ أو أكثر.', 'percentage', 15.0, 300.0, false, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80'),
  ('TBQ-OFF-2026-000004', 'cafe-bateel',     'Afternoon Tea Set',            'طقم الشاي بعد الظهر',              'Enjoy a luxurious afternoon tea with our premium date selection and pastries.', 'استمتع بشاي بعد الظهر الفاخر مع تمورنا المميزة والمعجنات.', 'percentage', 10.0, 100.0, true, 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80'),
  ('TBQ-OFF-2026-000005', 'bahar-seafood',   'Seafood Platter for Family',   'طبق المأكولات البحرية للعائلة',   'Fresh seafood platter for 4, including lobster, prawns, and hammour.',           'طبق مأكولات بحرية طازجة لـ 4 أشخاص، يشمل كركند وجمبري وهامور.', 'fixed', 80.0, 500.0, true, 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&q=80')
) AS v(ref_code, rslug, title_en, title_ar, description_en, description_ar, discount_type, discount_value, min_order, is_featured, image_url)
JOIN restaurants r ON r.slug = v.rslug
ON CONFLICT (ref_code) DO NOTHING;
