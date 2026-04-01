/**
 * Tabaq Database Seed Script
 * Run with: node --require dotenv/config scripts/seed.mjs
 * Or: DATABASE_URL="..." node scripts/seed.mjs
 */

// Use the pg library from the pnpm store
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);

// Try to find pg from the pnpm virtual store
let Pool;
try {
  Pool = require('/home/runner/workspace/node_modules/.pnpm/node_modules/pg').Pool;
} catch {
  try {
    Pool = require('pg').Pool;
  } catch {
    console.error('Could not load pg. Trying from lib/db...');
    process.exit(1);
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('ssl') ? { rejectUnauthorized: false } : false,
});

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

async function seed() {
  console.log('🌱 Starting Tabaq database seed...\n');

  // ── Countries ─────────────────────────────────────────────────────────────
  console.log('📍 Seeding countries...');
  await query(`
    INSERT INTO countries (name_en, name_ar, code, flag)
    VALUES ('Saudi Arabia', 'المملكة العربية السعودية', 'SA', '🇸🇦')
    ON CONFLICT (code) DO NOTHING
  `);

  // ── Cities ────────────────────────────────────────────────────────────────
  console.log('🏙️  Seeding cities...');
  const cities = [
    ['Riyadh',  'الرياض',            24.7136, 46.6753],
    ['Jeddah',  'جدة',               21.4858, 39.1925],
    ['Dammam',  'الدمام',            26.4207, 50.0888],
    ['Mecca',   'مكة المكرمة',       21.3891, 39.8579],
    ['Medina',  'المدينة المنورة',   24.5247, 39.5692],
    ['NEOM',    'نيوم',              28.0339, 35.3083],
    ['AlUla',   'العُلا',            26.6196, 37.9221],
    ['Khobar',  'الخبر',             26.2172, 50.1971],
  ];
  const { rows: [country] } = await query(`SELECT id FROM countries WHERE code = 'SA'`);
  for (const [nameEn, nameAr, lat, lon] of cities) {
    await query(
      `INSERT INTO cities (name_en, name_ar, country_id, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
      [nameEn, nameAr, country.id, lat, lon]
    );
  }

  // ── Categories ────────────────────────────────────────────────────────────
  console.log('🏷️  Seeding categories...');
  const categories = [
    ['Saudi',       'سعودي',             '🇸🇦', 'saudi'],
    ['Grills',      'مشاوي',             '🔥',  'grills'],
    ['Seafood',     'مأكولات بحرية',      '🦞', 'seafood'],
    ['Asian',       'آسيوي',             '🍜', 'asian'],
    ['Italian',     'إيطالي',            '🍝', 'italian'],
    ['Burgers',     'برجر',              '🍔', 'burgers'],
    ['Pizza',       'بيتزا',             '🍕', 'pizza'],
    ['Healthy',     'صحي',               '🥗', 'healthy'],
    ['Desserts',    'حلويات',            '🍰', 'desserts'],
    ['Café',        'كافيه',             '☕', 'cafe'],
    ['Sushi',       'سوشي',              '🍱', 'sushi'],
    ['Levantine',   'شامي',              '🫔', 'levantine'],
    ['Indian',      'هندي',              '🍛', 'indian'],
    ['Turkish',     'تركي',              '🥙', 'turkish'],
    ['Mexican',     'مكسيكي',            '🌮', 'mexican'],
    ['Fine Dining', 'فاين دايننج',        '✨', 'fine-dining'],
  ];
  for (const [nameEn, nameAr, icon, slug] of categories) {
    await query(
      `INSERT INTO categories (name_en, name_ar, icon, slug) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING`,
      [nameEn, nameAr, icon, slug]
    );
  }

  // ── Occasions ─────────────────────────────────────────────────────────────
  console.log('🎉 Seeding occasions...');
  const occasions = [
    ['Romantic Date',    'موعد رومانسي',    '❤️',   'romantic'],
    ['Family Gathering', 'تجمع عائلي',      '👨‍👩‍👧‍👦', 'family'],
    ['Business Lunch',   'غداء عمل',        '💼',   'business'],
    ['Birthday',         'عيد ميلاد',       '🎂',   'birthday'],
    ['Celebration',      'احتفال',           '🥂',   'celebration'],
    ['Casual Hangout',   'لقاء غير رسمي',   '😊',   'casual'],
    ['Breakfast',        'فطور',             '🌅',   'breakfast'],
    ['Late Night',       'ليلي',             '🌙',   'late-night'],
  ];
  for (const [nameEn, nameAr, icon, slug] of occasions) {
    await query(
      `INSERT INTO occasions (name_en, name_ar, icon, slug) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING`,
      [nameEn, nameAr, icon, slug]
    );
  }

  // ── Restaurants ───────────────────────────────────────────────────────────
  console.log('🍽️  Seeding restaurants...');
  const { rows: [riyadh] }  = await query(`SELECT id FROM cities WHERE name_en = 'Riyadh'`);
  const { rows: [jeddah] }  = await query(`SELECT id FROM cities WHERE name_en = 'Jeddah'`);
  const { rows: [dammam] }  = await query(`SELECT id FROM cities WHERE name_en = 'Dammam'`);

  const restaurants = [
    {
      refCode: 'TBQ-RST-2026-000001', slug: 'najd-village',
      nameEn: 'Najd Village', nameAr: 'قرية نجد',
      descEn: 'An iconic Saudi restaurant offering traditional Najdi cuisine in a village-style atmosphere with authentic decor and warm hospitality.',
      descAr: 'مطعم سعودي أيقوني يقدم المطبخ النجدي التقليدي في أجواء القرية مع ديكور أصيل وضيافة دافئة.',
      cover: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
      tier: 'upscale', rating: 4.7, reviews: 1243, followers: 8900,
      cityId: riyadh.id, phone: '+966112345678',
      parking: true, outdoor: true, private: true, lat: 24.7136, lon: 46.6753,
    },
    {
      refCode: 'TBQ-RST-2026-000002', slug: 'nakheel-palace',
      nameEn: 'Nakheel Palace', nameAr: 'قصر النخيل',
      descEn: 'A luxurious fine dining experience inspired by the splendor of ancient Arabian palaces.',
      descAr: 'تجربة طعام فاخرة مستوحاة من روعة القصور العربية القديمة.',
      cover: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80',
      tier: 'fine_dining', rating: 4.9, reviews: 687, followers: 12300,
      cityId: riyadh.id, phone: '+966112345679',
      parking: true, outdoor: false, private: true, lat: 24.7250, lon: 46.6935,
    },
    {
      refCode: 'TBQ-RST-2026-000003', slug: 'sushi-hana',
      nameEn: 'Sushi Hana', nameAr: 'سوشي هانا',
      descEn: 'Premium Japanese cuisine with the finest sushi, sashimi, and teppanyaki in a sleek, modern ambiance.',
      descAr: 'مطبخ ياباني فاخر مع أفضل السوشي والساشيمي والتيبانياكي في أجواء عصرية أنيقة.',
      cover: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80',
      tier: 'upscale', rating: 4.6, reviews: 934, followers: 7800,
      cityId: riyadh.id, phone: '+966112345680',
      parking: true, outdoor: false, private: false, lat: 24.6915, lon: 46.6832,
    },
    {
      refCode: 'TBQ-RST-2026-000004', slug: 'maestro-italian',
      nameEn: 'Maestro Italian', nameAr: 'ماستيرو إيطالي',
      descEn: 'Authentic Italian cuisine prepared by master chefs, featuring handmade pasta and wood-fired pizza.',
      descAr: 'مطبخ إيطالي أصيل يعده أمهر الطهاة، مع باستا محلية الصنع وبيتزا من الفرن الخشبي.',
      cover: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
      tier: 'upscale', rating: 4.5, reviews: 1120, followers: 6500,
      cityId: jeddah.id, phone: '+966122345678',
      parking: true, outdoor: true, private: false, lat: 21.5010, lon: 39.1920,
    },
    {
      refCode: 'TBQ-RST-2026-000005', slug: 'al-baik-express',
      nameEn: 'Al Baik Express', nameAr: 'البيك إكسبريس',
      descEn: 'The iconic Saudi fast food chain known for its legendary broasted chicken, fresh seafood, and crispy fries.',
      descAr: 'سلسلة الوجبات السريعة السعودية الأيقونية المشهورة بدجاجها البروستد الأسطوري.',
      cover: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=1200&q=80',
      tier: 'budget', rating: 4.8, reviews: 15400, followers: 45000,
      cityId: jeddah.id, phone: '+966122345679',
      parking: true, outdoor: false, private: false, lat: 21.4858, lon: 39.1925,
    },
    {
      refCode: 'TBQ-RST-2026-000006', slug: 'kana-sushi',
      nameEn: 'Kana Sushi', nameAr: 'كانا سوشي',
      descEn: 'Contemporary sushi bar with creative fusion rolls, fresh catches, and a vibrant atmosphere.',
      descAr: 'بار سوشي عصري مع رولات مبتكرة وأسماك طازجة وأجواء رائعة.',
      cover: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=1200&q=80',
      tier: 'mid', rating: 4.4, reviews: 782, followers: 5200,
      cityId: dammam.id, phone: '+966133345678',
      parking: true, outdoor: true, private: false, lat: 26.4207, lon: 50.0888,
    },
    {
      refCode: 'TBQ-RST-2026-000007', slug: 'the-grill-house',
      nameEn: 'The Grill House', nameAr: 'جريل هاوس',
      descEn: 'Premium steakhouse with the finest cuts of USDA and Wagyu beef, expertly grilled to perfection.',
      descAr: 'مطعم ستيك فاخر يقدم أجود قطع اللحم الأمريكي والواغيو، مشوية باحتراف.',
      cover: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&q=80',
      tier: 'fine_dining', rating: 4.8, reviews: 891, followers: 9100,
      cityId: riyadh.id, phone: '+966112345681',
      parking: true, outdoor: false, private: true, lat: 24.7090, lon: 46.6540,
    },
    {
      refCode: 'TBQ-RST-2026-000008', slug: 'casa-levant',
      nameEn: 'Casa Levant', nameAr: 'كاسا ليفانت',
      descEn: 'Authentic Levantine flavors from Lebanon and Syria, featuring mezze platters, grills, and traditional sweets.',
      descAr: 'نكهات شامية أصيلة من لبنان وسوريا، مع ألواح المازة والمشاوي والحلويات التقليدية.',
      cover: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=1200&q=80',
      tier: 'mid', rating: 4.5, reviews: 1056, followers: 6800,
      cityId: riyadh.id, phone: '+966112345682',
      parking: false, outdoor: true, private: false, lat: 24.6805, lon: 46.7132,
    },
    {
      refCode: 'TBQ-RST-2026-000009', slug: 'green-bowl',
      nameEn: 'Green Bowl', nameAr: 'جرين بول',
      descEn: 'Your go-to destination for nutritious, delicious healthy bowls, salads, and cold-pressed juices.',
      descAr: 'وجهتك المثالية للأطباق الصحية اللذيذة والسلطات والعصائر الطازجة.',
      cover: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80',
      tier: 'mid', rating: 4.3, reviews: 643, followers: 4200,
      cityId: riyadh.id, phone: '+966112345683',
      parking: false, outdoor: true, private: false, lat: 24.7453, lon: 46.6270,
    },
    {
      refCode: 'TBQ-RST-2026-000010', slug: 'cafe-bateel',
      nameEn: 'Café Bateel', nameAr: 'مقهى باتيل',
      descEn: 'The luxury Saudi café brand celebrated for its premium organic dates, artisan coffees, and gourmet pastries.',
      descAr: 'علامة المقهى السعودية الفاخرة المشهورة بالتمور العضوية الفاخرة والقهوة الحرفية.',
      cover: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&q=80',
      tier: 'upscale', rating: 4.6, reviews: 2340, followers: 18000,
      cityId: riyadh.id, phone: '+966112345684',
      parking: true, outdoor: false, private: false, lat: 24.7118, lon: 46.6750,
    },
    {
      refCode: 'TBQ-RST-2026-000011', slug: 'bahar-seafood',
      nameEn: 'Bahar Seafood', nameAr: 'بحر للمأكولات البحرية',
      descEn: 'Fresh catch from Saudi and Gulf waters, grilled, fried, or served in rich seafood broths.',
      descAr: 'صيد طازج من المياه السعودية والخليجية، مشوي أو مقلي أو في مرق بحري غني.',
      cover: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=1200&q=80',
      tier: 'upscale', rating: 4.7, reviews: 1108, followers: 7600,
      cityId: jeddah.id, phone: '+966122345680',
      parking: true, outdoor: true, private: false, lat: 21.5010, lon: 39.1200,
    },
    {
      refCode: 'TBQ-RST-2026-000012', slug: 'spice-route-india',
      nameEn: 'Spice Route India', nameAr: 'طريق التوابل الهندي',
      descEn: 'Vibrant Indian cuisine from Mumbai to Kerala, with tandoori specialties, curries, and biryanis.',
      descAr: 'مطبخ هندي نابض من مومباي إلى كيرالا، مع تخصصات التندوري والكاري والبرياني.',
      cover: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80',
      tier: 'mid', rating: 4.4, reviews: 876, followers: 5500,
      cityId: riyadh.id, phone: '+966112345685',
      parking: false, outdoor: false, private: false, lat: 24.7550, lon: 46.7200,
    },
  ];

  for (const r of restaurants) {
    await query(
      `INSERT INTO restaurants (
        ref_code, name_en, name_ar, slug, description_en, description_ar,
        cover_image_url, price_tier, avg_rating, review_count, follower_count,
        is_verified, is_featured, is_active, is_halal,
        city_id, country_id, phone,
        has_parking, has_outdoor_seating, has_private_room,
        latitude, longitude
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,true,true,true,$12,$13,$14,$15,$16,$17,$18,$19)
      ON CONFLICT (slug) DO NOTHING`,
      [
        r.refCode, r.nameEn, r.nameAr, r.slug, r.descEn, r.descAr,
        r.cover, r.tier, r.rating, r.reviews, r.followers,
        r.cityId, country.id, r.phone,
        r.parking, r.outdoor, r.private, r.lat, r.lon,
      ]
    );
  }

  // ── Restaurant–Category Links ──────────────────────────────────────────────
  console.log('🔗 Linking categories...');
  const restaurantCategories = [
    ['najd-village',     'saudi'],
    ['najd-village',     'grills'],
    ['nakheel-palace',   'fine-dining'],
    ['nakheel-palace',   'saudi'],
    ['nakheel-palace',   'levantine'],
    ['sushi-hana',       'sushi'],
    ['sushi-hana',       'asian'],
    ['maestro-italian',  'italian'],
    ['al-baik-express',  'grills'],
    ['kana-sushi',       'sushi'],
    ['the-grill-house',  'grills'],
    ['the-grill-house',  'fine-dining'],
    ['casa-levant',      'levantine'],
    ['green-bowl',       'healthy'],
    ['cafe-bateel',      'cafe'],
    ['cafe-bateel',      'desserts'],
    ['bahar-seafood',    'seafood'],
    ['spice-route-india','indian'],
  ];
  for (const [rslug, cslug] of restaurantCategories) {
    await query(
      `INSERT INTO restaurant_categories (restaurant_id, category_id)
       SELECT r.id, c.id FROM restaurants r, categories c
       WHERE r.slug = $1 AND c.slug = $2
       ON CONFLICT DO NOTHING`,
      [rslug, cslug]
    );
  }

  // ── Restaurant–Occasion Links ─────────────────────────────────────────────
  console.log('🎉 Linking occasions...');
  const restaurantOccasions = [
    ['najd-village',    'family'],
    ['najd-village',    'celebration'],
    ['nakheel-palace',  'romantic'],
    ['nakheel-palace',  'business'],
    ['nakheel-palace',  'birthday'],
    ['sushi-hana',      'romantic'],
    ['sushi-hana',      'casual'],
    ['the-grill-house', 'business'],
    ['the-grill-house', 'celebration'],
    ['casa-levant',     'family'],
    ['casa-levant',     'casual'],
    ['cafe-bateel',     'business'],
    ['cafe-bateel',     'casual'],
    ['green-bowl',      'casual'],
    ['green-bowl',      'breakfast'],
  ];
  for (const [rslug, oslug] of restaurantOccasions) {
    await query(
      `INSERT INTO restaurant_occasions (restaurant_id, occasion_id)
       SELECT r.id, o.id FROM restaurants r, occasions o
       WHERE r.slug = $1 AND o.slug = $2
       ON CONFLICT DO NOTHING`,
      [rslug, oslug]
    );
  }

  // ── Opening Hours ─────────────────────────────────────────────────────────
  console.log('🕐 Seeding opening hours...');
  const { rows: allRestaurants } = await query(`SELECT id FROM restaurants`);
  for (const { id } of allRestaurants) {
    for (let day = 0; day <= 6; day++) {
      await query(
        `INSERT INTO opening_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
         VALUES ($1, $2, $3, $4, false) ON CONFLICT DO NOTHING`,
        [id, day, day === 5 ? '12:00' : '11:00', '23:30']
      );
    }
  }

  // ── Menus ─────────────────────────────────────────────────────────────────
  console.log('📋 Seeding menus and sections...');
  for (const { id } of allRestaurants) {
    await query(
      `INSERT INTO menus (restaurant_id, name_en, name_ar, type, is_active, display_order)
       VALUES ($1, 'Main Menu', 'القائمة الرئيسية', 'food', true, 0) ON CONFLICT DO NOTHING`,
      [id]
    );
  }

  // ── Menu Sections ─────────────────────────────────────────────────────────
  const { rows: allMenus } = await query(`SELECT id FROM menus`);
  const sections = [
    ['Starters',    'المقبلات',       0],
    ['Main Course', 'الطبق الرئيسي', 1],
    ['Desserts',    'الحلويات',       2],
  ];
  for (const { id } of allMenus) {
    for (const [nameEn, nameAr, order] of sections) {
      await query(
        `INSERT INTO menu_sections (menu_id, name_en, name_ar, display_order)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [id, nameEn, nameAr, order]
      );
    }
  }

  // ── Dishes ────────────────────────────────────────────────────────────────
  console.log('🍜 Seeding dishes...');
  const dishes = [
    // Najd Village
    { rslug:'najd-village',     section:'Starters',    nameEn:'Jareesh',                   nameAr:'جريش',                    descEn:'Traditional crushed wheat cooked with lamb and spices',            descAr:'قمح مطحون تقليدي مطهو مع لحم الضأن والبهارات',                  price:45,  img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80', star:true,  most:false, best:true,  chef:false, pop:95 },
    { rslug:'najd-village',     section:'Starters',    nameEn:'Murtabak',                  nameAr:'مرطبك',                   descEn:'Stuffed pancake with egg, lamb, and onion',                        descAr:'فطيرة محشوة بالبيض واللحم والبصل',                               price:38,  img:null,   star:false, most:false, best:false, chef:false, pop:70 },
    { rslug:'najd-village',     section:'Main Course', nameEn:'Lamb Mansaf',               nameAr:'منسف لحم ضأن',            descEn:'Tender lamb in fermented dried yogurt sauce over fragrant rice', descAr:'لحم ضأن طري في صلصة اللبن المجفف مع الأرز العطر',               price:185, img:'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80', star:true,  most:true,  best:true,  chef:false, pop:98 },
    { rslug:'najd-village',     section:'Main Course', nameEn:'Saleeg Rice with Chicken',  nameAr:'أرز سليق بالدجاج',        descEn:'Creamy milk-cooked rice topped with roasted chicken',              descAr:'أرز كريمي مطهو بالحليب مع دجاج مشوي',                           price:95,  img:'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=500&q=80', star:false, most:false, best:true,  chef:false, pop:85 },
    { rslug:'najd-village',     section:'Desserts',    nameEn:'Harees',                    nameAr:'هريس',                    descEn:'Slow-cooked wheat and lamb, a Ramadan classic',                    descAr:'هريسة القمح واللحم المطهو ببطء',                                 price:28,  img:null,   star:false, most:false, best:false, chef:false, pop:60 },
    // Sushi Hana
    { rslug:'sushi-hana',       section:'Starters',    nameEn:'Edamame',                   nameAr:'أدامامي',                 descEn:'Steamed young soybeans with sea salt',                             descAr:'فول الصويا المسلوق بملح البحر',                                  price:22,  img:null,   star:false, most:false, best:false, chef:false, pop:55 },
    { rslug:'sushi-hana',       section:'Starters',    nameEn:'Miso Soup',                 nameAr:'شوربة ميسو',              descEn:'Traditional Japanese miso broth with tofu and wakame',             descAr:'حساء الميسو الياباني التقليدي مع التوفو',                        price:18,  img:null,   star:false, most:false, best:false, chef:false, pop:50 },
    { rslug:'sushi-hana',       section:'Main Course', nameEn:'Salmon Nigiri (6 pcs)',      nameAr:'نيجيري سلمون (٦ قطع)',   descEn:'Premium Atlantic salmon over hand-pressed sushi rice',             descAr:'سلمون أطلنطي فاخر على أرز السوشي المضغوط يدوياً',               price:85,  img:'https://images.unsplash.com/photo-1553621042-f6e147245754?w=500&q=80', star:true,  most:false, best:true,  chef:false, pop:96 },
    { rslug:'sushi-hana',       section:'Main Course', nameEn:'Dragon Roll',               nameAr:'درغون رول',               descEn:'Shrimp tempura inside, avocado and eel sauce on top',              descAr:'جمبري تمبورا من الداخل، أفوكادو وصلصة الإيل من الأعلى',          price:72,  img:'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=500&q=80', star:false, most:false, best:true,  chef:false, pop:88 },
    { rslug:'sushi-hana',       section:'Main Course', nameEn:'Wagyu Teppanyaki',          nameAr:'واغيو تيبانياكي',         descEn:'A5 Wagyu beef cooked tableside on the iron griddle',               descAr:'لحم واغيو A5 مطهو على الطاولة على الشواية الحديدية',             price:380, img:null,   star:true,  most:false, best:false, chef:true,  pop:92 },
    { rslug:'sushi-hana',       section:'Desserts',    nameEn:'Mochi Ice Cream',           nameAr:'موشي آيس كريم',           descEn:'Japanese rice cake filled with premium matcha ice cream',          descAr:'كعكة الأرز اليابانية محشوة بآيس كريم الماتشا الفاخر',            price:32,  img:null,   star:false, most:false, best:false, chef:false, pop:65 },
    // The Grill House
    { rslug:'the-grill-house',  section:'Starters',    nameEn:'Burrata Salad',             nameAr:'سلطة بوراتا',             descEn:'Fresh burrata with heritage tomatoes, basil oil, and balsamic',   descAr:'بوراتا طازجة مع طماطم موروثة وزيت الريحان',                     price:68,  img:null,   star:false, most:false, best:false, chef:false, pop:72 },
    { rslug:'the-grill-house',  section:'Main Course', nameEn:'USDA Prime Ribeye 400g',    nameAr:'ريب آي USDA برايم ٤٠٠ غ', descEn:'Prime USDA ribeye, dry-aged 35 days, cooked to your preference', descAr:'ريب آي USDA برايم، ناضج جافاً ٣٥ يوماً',                        price:420, img:'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&q=80', star:true,  most:true,  best:true,  chef:false, pop:99 },
    { rslug:'the-grill-house',  section:'Main Course', nameEn:'Wagyu Tomahawk',            nameAr:'واغيو توماهوك',           descEn:'Japanese Wagyu tomahawk for two, served tableside',                descAr:'واغيو ياباني توماهوك رائع لشخصين',                               price:890, img:null,   star:true,  most:false, best:false, chef:true,  pop:95 },
    { rslug:'the-grill-house',  section:'Desserts',    nameEn:'Molten Chocolate',          nameAr:'صلصة الشوكولاتة',         descEn:'Warm Belgian chocolate fondant with vanilla bean ice cream',       descAr:'فوندان بلجيكي دافئ مع آيس كريم الفانيلا',                       price:58,  img:null,   star:false, most:false, best:false, chef:false, pop:80 },
    // Café Bateel
    { rslug:'cafe-bateel',      section:'Starters',    nameEn:'Organic Date Platter',      nameAr:'طبق التمور العضوية',      descEn:'A curated selection of premium organic Medjool, Sukkari, and Ajwa dates', descAr:'تشكيلة من تمور المجدول والسكري والعجوة العضوية الفاخرة',   price:85,  img:'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=500&q=80', star:true,  most:false, best:true,  chef:false, pop:94 },
    { rslug:'cafe-bateel',      section:'Starters',    nameEn:'Avocado Toast',             nameAr:'توست الأفوكادو',           descEn:'Sourdough toast with smashed avocado, poached egg, and dukkah',   descAr:'توست عجين المعجون مع أفوكادو مهروس وبيض مسلوق',                 price:62,  img:null,   star:false, most:false, best:false, chef:false, pop:70 },
    { rslug:'cafe-bateel',      section:'Main Course', nameEn:'Signature Bateel Latte',    nameAr:'لاتيه باتيل المميز',      descEn:'Artisan single-origin espresso with velvety steamed milk',         descAr:'إسبريسو حرفي أحادي الأصل مع حليب مبخر مخملي وشراب التمر',      price:32,  img:null,   star:false, most:false, best:true,  chef:false, pop:90 },
    { rslug:'cafe-bateel',      section:'Desserts',    nameEn:'Date & Walnut Cake',        nameAr:'كيكة التمر والجوز',       descEn:'Moist date and walnut sponge with caramel date glaze',             descAr:'إسفنجة التمر والجوز الرطبة مع تزجيج التمر الكراميلي',           price:45,  img:null,   star:true,  most:false, best:false, chef:false, pop:88 },
    // Green Bowl
    { rslug:'green-bowl',       section:'Main Course', nameEn:'Power Bowl',                nameAr:'باور بول',                descEn:'Quinoa, roasted sweet potato, chickpeas, tahini, and fresh herbs', descAr:'كينوا وبطاطا حلوة محمصة وحمص وطحينة وأعشاب طازجة',             price:68,  img:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80', star:false, most:false, best:true,  chef:false, pop:92 },
    { rslug:'green-bowl',       section:'Main Course', nameEn:'Grilled Chicken Salad',     nameAr:'سلطة الدجاج المشوي',      descEn:'Char-grilled chicken breast on mixed greens with lemon vinaigrette', descAr:'صدر دجاج مشوي على خضار مشكلة مع صلصة الليمون',               price:72,  img:null,   star:false, most:false, best:false, chef:false, pop:78 },
    { rslug:'green-bowl',       section:'Main Course', nameEn:'Açaí Bowl',                 nameAr:'آساي بول',                descEn:'Organic açaí blend topped with granola, banana, and mixed berries', descAr:'مزيج آساي عضوي مع جرانولا وموز وتوت مشكل',                    price:58,  img:null,   star:false, most:false, best:false, chef:false, pop:75 },
    { rslug:'green-bowl',       section:'Starters',    nameEn:'Green Detox Juice',         nameAr:'عصير ديتوكس أخضر',       descEn:'Cold-pressed kale, cucumber, celery, green apple, and ginger',    descAr:'كيل وخيار وكرفس وتفاح أخضر وزنجبيل معصور بارداً',              price:35,  img:null,   star:false, most:false, best:false, chef:false, pop:68 },
    // Bahar Seafood
    { rslug:'bahar-seafood',    section:'Main Course', nameEn:'Hammour Bil Za\'tar',       nameAr:'هامور بالزعتر',           descEn:'Fresh grouper with thyme crust and lemon butter sauce',            descAr:'هامور طازج بقشرة الزعتر وصلصة زبدة الليمون',                   price:145, img:'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=500&q=80', star:true,  most:true,  best:true,  chef:false, pop:97 },
    { rslug:'bahar-seafood',    section:'Main Course', nameEn:'Mixed Seafood Grill',       nameAr:'مشاوي بحرية مشكلة',       descEn:'Platter of grilled prawns, lobster, hammour, and calamari',        descAr:'طبق من الجمبري والكركند والهامور والكاليماري المشوي',             price:280, img:null,   star:false, most:false, best:false, chef:false, pop:88 },
    { rslug:'bahar-seafood',    section:'Starters',    nameEn:'Seafood Soup',              nameAr:'شوربة بحرية',             descEn:'Rich traditional Gulf seafood broth with fresh catch',             descAr:'حساء بحري خليجي تقليدي غني مع أسماك طازجة',                    price:45,  img:null,   star:false, most:false, best:false, chef:false, pop:72 },
    // Casa Levant
    { rslug:'casa-levant',      section:'Starters',    nameEn:'Mezze Platter',             nameAr:'طبق المازة',              descEn:'Hummus, baba ghanoush, fattoush, and warm pita bread',             descAr:'حمص وبابا غنوج وفتوش وخبز بيتا دافئ',                          price:85,  img:'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=500&q=80', star:true,  most:false, best:true,  chef:false, pop:93 },
    { rslug:'casa-levant',      section:'Main Course', nameEn:'Mixed Grill',               nameAr:'مشاوي مشكلة',             descEn:'Skewers of kafta, shish tawook, and lamb chops',                   descAr:'سيخ كفتة وشيش طاووق وضلوع الضأن',                               price:165, img:null,   star:false, most:true,  best:true,  chef:false, pop:91 },
    { rslug:'casa-levant',      section:'Desserts',    nameEn:'Kunafa',                    nameAr:'كنافة',                   descEn:'Traditional Palestinian dessert with cheese and syrup',             descAr:'الكنافة الفلسطينية التقليدية مع الجبن والقطر',                   price:45,  img:null,   star:true,  most:false, best:false, chef:false, pop:87 },
    // Spice Route India
    { rslug:'spice-route-india', section:'Main Course', nameEn:'Chicken Tikka Masala',    nameAr:'تكا ماسالا دجاج',         descEn:'Tender chicken in creamy tomato masala sauce',                     descAr:'دجاج طري في صلصة ماسالا الطماطم الكريمية',                      price:88,  img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80', star:false, most:true,  best:true,  chef:false, pop:93 },
    { rslug:'spice-route-india', section:'Main Course', nameEn:'Lamb Biryani',            nameAr:'برياني لحم ضأن',          descEn:'Fragrant basmati rice cooked with tender lamb and whole spices',   descAr:'أرز بسمتي عطر مطهو مع لحم ضأن طري وبهارات',                    price:110, img:null,   star:false, most:false, best:true,  chef:false, pop:90 },
    { rslug:'spice-route-india', section:'Starters',   nameEn:'Samosa Platter',           nameAr:'طبق السمبوسة',            descEn:'Crispy vegetable and meat samosas with mint chutney',              descAr:'سمبوسة خضار ولحم مقرمشة مع صلصة النعناع',                       price:38,  img:null,   star:false, most:false, best:false, chef:false, pop:75 },
    // Maestro Italian
    { rslug:'maestro-italian',  section:'Starters',    nameEn:'Bruschetta Trio',           nameAr:'بروشيتا ثلاثية',          descEn:'Three styles of bruschetta: tomato basil, truffle, and burrata',   descAr:'ثلاثة أنواع من البروشيتا: طماطم وريحان وكمأ وبوراتا',          price:55,  img:null,   star:false, most:false, best:false, chef:false, pop:72 },
    { rslug:'maestro-italian',  section:'Main Course', nameEn:'Handmade Tagliatelle',      nameAr:'تاليتيلي محلي الصنع',     descEn:'Handmade pasta with slow-braised wagyu bolognese sauce',           descAr:'باستا محلية الصنع مع صلصة البولونيز من الواغيو المطهو ببطء',    price:125, img:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&q=80', star:true,  most:true,  best:true,  chef:false, pop:95 },
    { rslug:'maestro-italian',  section:'Main Course', nameEn:'Margherita Napoletana',     nameAr:'مارغريتا نابوليتانا',     descEn:'San Marzano tomatoes, fresh mozzarella di bufala, basil',         descAr:'طماطم سان مارزانو وموتزاريلا جاموس طازجة وريحان',               price:85,  img:null,   star:false, most:false, best:true,  chef:false, pop:85 },
    // Al Baik Express
    { rslug:'al-baik-express',  section:'Main Course', nameEn:'Broasted Chicken Meal',     nameAr:'وجبة دجاج بروستد',        descEn:'Legendary crispy broasted chicken with special Al Baik sauce',    descAr:'دجاج بروستد مقرمش أسطوري مع صلصة البيك الخاصة',                price:39,  img:'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=80', star:true,  most:true,  best:true,  chef:false, pop:99 },
    { rslug:'al-baik-express',  section:'Main Course', nameEn:'Fish Sandwich',             nameAr:'سندويش سمك',              descEn:'Crispy fried fish fillet with tartar sauce in a toasted bun',      descAr:'فيليه سمك مقلي مقرمش مع صلصة تارتار في خبزة محمصة',            price:22,  img:null,   star:false, most:false, best:true,  chef:false, pop:90 },
    // Kana Sushi
    { rslug:'kana-sushi',       section:'Main Course', nameEn:'Rainbow Roll',              nameAr:'رينبو رول',               descEn:'California roll topped with assorted sashimi and avocado',        descAr:'رول كاليفورنيا مع ساشيمي متنوع وأفوكادو',                       price:68,  img:'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=500&q=80', star:false, most:true,  best:true,  chef:false, pop:88 },
    { rslug:'kana-sushi',       section:'Main Course', nameEn:'Spicy Tuna Roll',           nameAr:'رول التونة الحارة',       descEn:'Fresh tuna with spicy mayo, cucumber, and crispy tempura flakes', descAr:'تونة طازجة مع مايو حار وخيار وشرائح تمبورا مقرمشة',             price:52,  img:null,   star:false, most:false, best:false, chef:false, pop:75 },
  ];

  for (const d of dishes) {
    await query(
      `INSERT INTO dishes (
        restaurant_id, menu_section_id, name_en, name_ar, description_en, description_ar,
        price, currency, image_url, is_available, is_halal,
        is_tabaq_star, is_most_ordered, is_bestseller, is_chef_choice, popularity_score
      )
      SELECT r.id, ms.id, $3, $4, $5, $6, $7, 'SAR', $8, true, true, $9, $10, $11, $12, $13
      FROM restaurants r
      JOIN menus m ON m.restaurant_id = r.id
      JOIN menu_sections ms ON ms.menu_id = m.id AND ms.name_en = $2
      WHERE r.slug = $1
      LIMIT 1`,
      [d.rslug, d.section, d.nameEn, d.nameAr, d.descEn, d.descAr, d.price, d.img, d.star, d.most, d.best, d.chef, d.pop]
    );
  }

  // ── Blog Categories ───────────────────────────────────────────────────────
  console.log('📝 Seeding blog categories...');
  const blogCats = [
    ['Dining Guides',   'أدلة الطعام',    'dining-guides',   'Curated guides to the best dining experiences', '#e23744'],
    ['Chef Stories',    'قصص الطهاة',     'chef-stories',    'Stories from Saudi Arabia\'s top chefs',         '#f59e0b'],
    ['Food Trends',     'اتجاهات الطعام', 'food-trends',     'The latest food and dining trends',             '#10b981'],
    ['Restaurant News', 'أخبار المطاعم',  'restaurant-news', 'Latest news from the restaurant industry',      '#6366f1'],
    ['Recipes',         'وصفات',           'recipes',         'Authentic recipes from top restaurants',        '#ec4899'],
  ];
  for (const [nameEn, nameAr, slug, descEn, color] of blogCats) {
    await query(
      `INSERT INTO blog_categories (name_en, name_ar, slug, description_en, color)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (slug) DO NOTHING`,
      [nameEn, nameAr, slug, descEn, color]
    );
  }

  // ── Blog Posts ────────────────────────────────────────────────────────────
  console.log('📰 Seeding blog posts...');
  const { rows: firstUser } = await query(`SELECT id FROM users ORDER BY id LIMIT 1`);
  if (firstUser.length > 0) {
    const userId = firstUser[0].id;
    const blogPosts = [
      {
        catSlug: 'dining-guides',
        titleEn: 'The Ultimate Guide to Riyadh\'s Fine Dining Scene 2026',
        titleAr: 'الدليل الشامل لمطاعم الفاين دايننج في الرياض 2026',
        slug: 'riyadh-fine-dining-guide-2026',
        excerptEn: 'From iconic Saudi palaces to contemporary international restaurants, Riyadh\'s dining scene has never been more exciting.',
        excerptAr: 'من القصور السعودية الأيقونية إلى المطاعم الدولية المعاصرة، مشهد الطعام في الرياض لم يكن أكثر إثارة.',
        contentEn: '<h2>Riyadh\'s Culinary Renaissance</h2><p>The Saudi capital has undergone a remarkable transformation in its dining scene. With Vision 2030, world-class chefs have flocked to Riyadh, creating an ecosystem that rivals Dubai and Paris.</p><p>Nakheel Palace stands at the pinnacle of Riyadh\'s fine dining, offering an unparalleled blend of traditional Saudi hospitality and contemporary culinary artistry. From the moment you enter, the ambiance whisks you away to a world of Arabian grandeur.</p><p>The Grill House continues to set the standard for premium steakhouses in the Kingdom, with their legendary USDA Prime dry-aged ribeye and the show-stopping Wagyu Tomahawk served tableside.</p>',
        contentAr: '<h2>نهضة الطهي في الرياض</h2><p>شهدت العاصمة السعودية تحولاً ملحوظاً في مشهد الطعام مع رؤية 2030، حيث تدفق طهاة على مستوى عالمي إلى الرياض.</p><p>يتصدر قصر النخيل قمة مطاعم الفاين دايننج في الرياض، حيث يقدم مزيجاً لا مثيل له من الضيافة السعودية التقليدية وفن الطهو المعاصر.</p>',
        coverUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
        featured: true, readTime: 8, tags: '["riyadh","fine-dining","saudi-cuisine"]',
        publishedAt: '2026-01-15',
      },
      {
        catSlug: 'dining-guides',
        titleEn: 'Best Seafood Restaurants in Jeddah — 2026',
        titleAr: 'أفضل مطاعم المأكولات البحرية في جدة — 2026',
        slug: 'jeddah-seafood-restaurants-2026',
        excerptEn: 'Jeddah\'s coastal location makes it Saudi Arabia\'s seafood capital. Here are the top spots for fresh Red Sea catch.',
        excerptAr: 'موقع جدة الساحلي يجعلها عاصمة المأكولات البحرية. إليك أفضل الأماكن للاستمتاع بصيد البحر الأحمر.',
        contentEn: '<h2>Jeddah by the Sea</h2><p>Dining on fresh seafood while overlooking the Red Sea is a unique Jeddah experience that no food lover should miss. The city\'s proximity to some of the world\'s most biodiverse coral reefs means the seafood here is truly exceptional.</p><p>Bahar Seafood leads our list with fresh catch delivered daily from local fishermen. Their Hammour Bil Za\'tar — grouper with a fragrant thyme crust and lemon butter sauce — is a must-order.</p>',
        contentAr: '<h2>جدة على البحر</h2><p>تناول المأكولات البحرية الطازجة مع إطلالة على البحر الأحمر تجربة جدة الفريدة التي لا يجب أن يفوتها أي محب للطعام.</p><p>يتصدر مطعم بحر قائمتنا بصيد طازج يُجلب يومياً من الصيادين المحليين.</p>',
        coverUrl: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=1200&q=80',
        featured: true, readTime: 6, tags: '["jeddah","seafood","red-sea"]',
        publishedAt: '2026-02-20',
      },
      {
        catSlug: 'food-trends',
        titleEn: 'The Rise of Healthy Dining in Saudi Arabia',
        titleAr: 'صعود الطعام الصحي في المملكة العربية السعودية',
        slug: 'healthy-dining-saudi-arabia-2026',
        excerptEn: 'Health-conscious dining is no longer niche in Saudi Arabia. Discover how the restaurant scene is embracing nutritious options.',
        excerptAr: 'لم يعد الطعام الصحي مفهوماً متخصصاً في المملكة. اكتشف كيف يتبنى مشهد المطاعم خيارات مغذية.',
        contentEn: '<h2>A Health Revolution</h2><p>Saudi Arabia\'s younger generation is driving a significant shift toward healthier dining. Today\'s diners seek balanced, nutritious options that don\'t sacrifice flavor. Green Bowl has been at the forefront of this movement, proving that healthy can be delicious.</p><p>From quinoa power bowls to cold-pressed juices and açaí blends, the healthy dining segment grew by 45% in 2025 and shows no signs of slowing down.</p>',
        contentAr: '<h2>ثورة صحية</h2><p>الجيل السعودي الشاب يقود تحولاً كبيراً نحو الطعام الصحي. يبحث متناولو الطعام اليوم عن خيارات متوازنة ومغذية لا تضحي بالنكهة.</p><p>كان جرين بول في طليعة هذه الحركة، مثبتاً أن الصحي يمكن أن يكون لذيذاً.</p>',
        coverUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80',
        featured: false, readTime: 5, tags: '["healthy-eating","wellness","food-trends"]',
        publishedAt: '2026-03-10',
      },
    ];

    for (const p of blogPosts) {
      const { rows: [cat] } = await query(`SELECT id FROM blog_categories WHERE slug = $1`, [p.catSlug]);
      if (cat) {
        await query(
          `INSERT INTO blog_posts (
            author_id, category_id, title_en, title_ar, slug,
            excerpt_en, excerpt_ar, content_en, content_ar,
            cover_image_url, status, is_featured, read_time_minutes,
            tags, published_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'published',$11,$12,$13::jsonb,$14::timestamp)
          ON CONFLICT (slug) DO NOTHING`,
          [
            userId, cat.id, p.titleEn, p.titleAr, p.slug,
            p.excerptEn, p.excerptAr, p.contentEn, p.contentAr,
            p.coverUrl, p.featured, p.readTime, p.tags, p.publishedAt,
          ]
        );
      }
    }
  } else {
    console.log('  ⚠️  No users found — skipping blog posts (create an account first)');
  }

  // ── Offers ────────────────────────────────────────────────────────────────
  console.log('🎫 Seeding offers...');
  const offers = [
    {
      refCode: 'TBQ-OFF-2026-000001', rslug: 'najd-village',
      titleEn: 'Saudi Night Feast — 20% Off', titleAr: 'وليمة الليل السعودية — خصم ٢٠٪',
      descEn: 'Enjoy 20% off the full menu every Thursday evening at Najd Village.',
      descAr: 'استمتع بخصم ٢٠٪ على كامل القائمة كل مساء خميس في قرية نجد.',
      img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
      discountPercent: 20, originalPrice: 200, discountedPrice: 160,
    },
    {
      refCode: 'TBQ-OFF-2026-000002', rslug: 'sushi-hana',
      titleEn: 'Sushi for Two Set', titleAr: 'طقم سوشي لاثنين',
      descEn: 'Share the love with our romantic Sushi for Two set — 24 premium pieces.',
      descAr: 'شارك الحب مع طقم سوشي لاثنين الرومانسي — ٢٤ قطعة فاخرة.',
      img: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80',
      discountPercent: 15, originalPrice: 350, discountedPrice: 299,
    },
    {
      refCode: 'TBQ-OFF-2026-000003', rslug: 'the-grill-house',
      titleEn: 'Weekend Brunch — 15% Off', titleAr: 'برانش نهاية الأسبوع — خصم ١٥٪',
      descEn: 'Treat yourself to our legendary weekend brunch with 15% off for groups of 4+.',
      descAr: 'دلّل نفسك ببرانش نهاية الأسبوع الأسطوري مع خصم ١٥٪ لمجموعات ٤ أو أكثر.',
      img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80',
      discountPercent: 15, originalPrice: 400, discountedPrice: 340,
    },
    {
      refCode: 'TBQ-OFF-2026-000004', rslug: 'cafe-bateel',
      titleEn: 'Afternoon Tea Set', titleAr: 'طقم الشاي بعد الظهر',
      descEn: 'Enjoy a luxurious afternoon tea with our premium date selection and pastries.',
      descAr: 'استمتع بشاي بعد الظهر الفاخر مع تمورنا المميزة والمعجنات.',
      img: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80',
      discountPercent: 10, originalPrice: 180, discountedPrice: 162,
    },
    {
      refCode: 'TBQ-OFF-2026-000005', rslug: 'bahar-seafood',
      titleEn: 'Seafood Family Platter', titleAr: 'طبق المأكولات البحرية للعائلة',
      descEn: 'Fresh seafood platter for 4, including lobster, prawns, and hammour.',
      descAr: 'طبق مأكولات بحرية طازجة لـ 4 أشخاص، يشمل كركند وجمبري وهامور.',
      img: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&q=80',
      discountPercent: 12, originalPrice: 650, discountedPrice: 572,
    },
  ];

  for (const o of offers) {
    await query(
      `INSERT INTO offers (
        ref_code, restaurant_id, title_en, title_ar, description_en, description_ar,
        image_url, discount_percent, original_price, discounted_price, currency,
        valid_from, valid_until, is_active, approval_status
      )
      SELECT $1, r.id, $2, $3, $4, $5, $6, $7, $8, $9, 'SAR',
        '2026-01-01'::timestamp, '2026-12-31'::timestamp, true, 'approved'
      FROM restaurants r WHERE r.slug = $10
      ON CONFLICT (ref_code) DO NOTHING`,
      [o.refCode, o.titleEn, o.titleAr, o.descEn, o.descAr, o.img,
       o.discountPercent, o.originalPrice, o.discountedPrice, o.rslug]
    );
  }

  console.log('\n✅ Seed complete! Summary:');
  const counts = await Promise.all([
    query('SELECT COUNT(*) FROM countries'),
    query('SELECT COUNT(*) FROM cities'),
    query('SELECT COUNT(*) FROM categories'),
    query('SELECT COUNT(*) FROM occasions'),
    query('SELECT COUNT(*) FROM restaurants'),
    query('SELECT COUNT(*) FROM dishes'),
    query('SELECT COUNT(*) FROM blog_posts'),
    query('SELECT COUNT(*) FROM offers'),
  ]);
  const labels = ['Countries', 'Cities', 'Categories', 'Occasions', 'Restaurants', 'Dishes', 'Blog Posts', 'Offers'];
  counts.forEach((r, i) => console.log(`  ${labels[i]}: ${r.rows[0].count}`));

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  pool.end();
  process.exit(1);
});
