BEGIN;

-- ── 1. Logo URLs for all 12 restaurants ──────────────────────────────────────
UPDATE restaurants SET logo_url = 'https://ui-avatars.com/api/?name=NV&background=8B4513&color=fff&size=200&bold=true&rounded=true' WHERE id = 1;
UPDATE restaurants SET logo_url = 'https://ui-avatars.com/api/?name=NP&background=1a1a2e&color=c9a84c&size=200&bold=true&rounded=true' WHERE id = 2;
UPDATE restaurants SET logo_url = 'https://ui-avatars.com/api/?name=SH&background=e8385a&color=fff&size=200&bold=true&rounded=true' WHERE id = 3;
UPDATE restaurants SET logo_url = 'https://ui-avatars.com/api/?name=MI&background=2d6a4f&color=fff&size=200&bold=true&rounded=true' WHERE id = 4;
UPDATE restaurants SET logo_url = 'https://ui-avatars.com/api/?name=AB&background=d62828&color=fff&size=200&bold=true&rounded=true' WHERE id = 5;
UPDATE restaurants SET logo_url = 'https://ui-avatars.com/api/?name=KS&background=023e8a&color=fff&size=200&bold=true&rounded=true' WHERE id = 6;
UPDATE restaurants SET logo_url = 'https://ui-avatars.com/api/?name=GH&background=3d405b&color=fff&size=200&bold=true&rounded=true' WHERE id = 7;
UPDATE restaurants SET logo_url = 'https://ui-avatars.com/api/?name=CL&background=c77dff&color=fff&size=200&bold=true&rounded=true' WHERE id = 8;
UPDATE restaurants SET logo_url = 'https://ui-avatars.com/api/?name=GB&background=2d6a4f&color=fff&size=200&bold=true&rounded=true' WHERE id = 9;
UPDATE restaurants SET logo_url = 'https://ui-avatars.com/api/?name=CB&background=6d4c41&color=fff&size=200&bold=true&rounded=true' WHERE id = 10;
UPDATE restaurants SET logo_url = 'https://ui-avatars.com/api/?name=BS&background=0077b6&color=fff&size=200&bold=true&rounded=true' WHERE id = 11;
UPDATE restaurants SET logo_url = 'https://ui-avatars.com/api/?name=SR&background=e76f51&color=fff&size=200&bold=true&rounded=true' WHERE id = 12;

-- ── 2. Nakheel Palace dishes (section 4=Starters, 5=Main Course, 6=Desserts) ──
INSERT INTO dishes (restaurant_id, menu_section_id, name_en, name_ar, description_en, description_ar, price, currency, image_url, is_available, is_halal, is_tabaq_star, is_bestseller, is_most_ordered, is_chef_choice, popularity_score) VALUES
(2, 4, 'Wagyu Carpaccio', 'كاربتشيو الواغيو',
 'Thinly sliced A5 Wagyu beef with truffle oil, capers, and parmesan shavings',
 'شرائح رقيقة من لحم الواغيو A5 مع زيت الكمأة والكبر وشريحات البارميزان',
 195.00, 'SAR', 'https://images.unsplash.com/photo-1544025162-d7669f9f3df4?w=500&q=80',
 true, true, true, true, false, false, 92),

(2, 4, 'Lobster Bisque', 'حساء الجراد البحري',
 'Velvety lobster bisque with cognac cream, chives, and grilled lobster claw',
 'حساء جراد بحري كريمي مع كريمة الكونياك والثوم المعمر وكف الجراد المشوي',
 145.00, 'SAR', 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80',
 true, true, false, true, false, false, 88),

(2, 4, 'Foie Gras Torchon', 'كبد الإوز بالزبدة',
 'Pan-seared duck foie gras with brioche toast, fig jam, and aged balsamic',
 'كبد بط مشوي مع خبز البريوش ومربى التين وخل البلسميك المعتق',
 210.00, 'SAR', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&q=80',
 true, true, false, false, false, true, 75),

(2, 5, 'Wagyu Tomahawk 1kg', 'توماهوك الواغيو كيلو',
 'Dry-aged A4 Wagyu tomahawk, rosemary jus, roasted garlic mash, truffle butter',
 'ريش واغيو A4 مع صلصة إكليل الجبل وهريس الثوم المحمص وزبدة الكمأة',
 650.00, 'SAR', 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&q=80',
 true, true, true, true, true, false, 98),

(2, 5, 'Whole Grilled Turbot', 'سمك الترابط المشوي',
 'Wild-caught turbot with lemon beurre blanc, samphire, and heritage tomatoes',
 'سمك ترابط طبيعي مع صلصة الزبدة والليمون والطماطم التراثية',
 420.00, 'SAR', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80',
 true, true, false, true, false, false, 85),

(2, 5, 'Lamb Rack Provençale', 'رف الضأن بالأعشاب',
 'Herb-crusted rack of lamb, ratatouille, olive tapenade, and natural jus',
 'رف ضأن مغطى بالأعشاب مع راتاتوي وزيتون مطحون والمرق الطبيعي',
 385.00, 'SAR', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&q=80',
 true, true, false, false, false, false, 80),

(2, 6, 'Valrhona Chocolate Soufflé', 'سوفليه شوكولاتة فالرونا',
 'Warm dark chocolate soufflé with vanilla crème anglaise and praline ice cream',
 'سوفليه شوكولاتة داكنة دافئة مع كريمة فانيليا وآيس كريم البراليني',
 95.00, 'SAR', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&q=80',
 true, true, true, true, false, true, 94),

(2, 6, 'Arabic Mille-Feuille', 'ميل فوي عربي',
 'Layers of cardamom pastry cream, rose water jelly, and gold leaf',
 'طبقات من كريمة الهيل وجيلي ماء الورد وورق الذهب',
 85.00, 'SAR', 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500&q=80',
 true, true, false, true, false, false, 88);

-- ── 3. Add image URLs to dishes missing them ──────────────────────────────────
-- Najd Village
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80' WHERE id = 2;  -- Murtabak
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80'  WHERE id = 5;  -- Harees

-- Sushi Hana
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'  WHERE id = 6;   -- Edamame
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&q=80'  WHERE id = 7;   -- Miso Soup
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&q=80'  WHERE id = 10;  -- Wagyu Teppanyaki
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500&q=80' WHERE id = 11; -- Mochi

-- Maestro Italian
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=500&q=80' WHERE id = 33; -- Bruschetta
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80'  WHERE id = 35; -- Margherita

-- Al Baik Express
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80'  WHERE id = 37; -- Fish Sandwich

-- Kana Sushi
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1553621042-f6e14be02cc2?w=500&q=80'  WHERE id = 39; -- Spicy Tuna Roll

-- The Grill House
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'   WHERE id = 12; -- Burrata Salad
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1544025162-d7669f9f3df4?w=500&q=80'   WHERE id = 14; -- Wagyu Tomahawk
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&q=80'   WHERE id = 15; -- Molten Chocolate

-- Casa Levant
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&q=80' WHERE id = 28; -- Mixed Grill
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1555951015-6da899b5c2cd?w=500&q=80'   WHERE id = 29; -- Kunafa

-- Green Bowl
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80' WHERE id = 21; -- Grilled Chicken Salad
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=500&q=80' WHERE id = 22; -- Açaí Bowl
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=500&q=80' WHERE id = 23; -- Green Detox Juice

-- Café Bateel
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=500&q=80' WHERE id = 17; -- Avocado Toast
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80' WHERE id = 18; -- Signature Latte
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80' WHERE id = 19; -- Date & Walnut Cake

-- Bahar Seafood
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80' WHERE id = 25; -- Mixed Seafood Grill
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80'   WHERE id = 26; -- Seafood Soup

-- Spice Route India
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80' WHERE id = 31; -- Lamb Biryani
UPDATE dishes SET image_url = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80' WHERE id = 32; -- Samosa Platter

COMMIT;
