import pg from 'pg';
const { Client } = pg;

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

// Step 1: Insert catering/buffet menus
const menusResult = await c.query(`
  INSERT INTO menus (restaurant_id, type, name_en, name_ar, description_en, description_ar, is_active)
  VALUES
    (1,  'catering', 'Najd Village Catering',      'خدمة تقديم طعام نجد قرية',  'Authentic Saudi cuisine catering for weddings & corporate events', 'تقديم طعام سعودي أصيل للأعراس والفعاليات', true),
    (2,  'buffet',   'Nakheel Palace Buffet',       'بوفيه نخيل بالاس',           'Premium Najdi & Gulf buffet spreads for large gatherings',         'بوفيه نجدي وخليجي فاخر للتجمعات الكبيرة', true),
    (7,  'catering', 'The Grill House Catering',    'خدمة تقديم طعام ذا غريل',   'Live grill stations & BBQ catering for all occasions',             'محطات شواء حية وكباب لجميع المناسبات', true),
    (8,  'buffet',   'Casa Levant Buffet',          'بوفيه كاسا ليفانت',          'Levantine mezze & mains buffet service',                           'بوفيه مقبلات شامية وأطباق رئيسية', true),
    (4,  'catering', 'Maestro Italian Catering',    'خدمة تقديم طعام مايسترو',    'Upscale Italian catering with live pasta station',                 'تقديم طعام إيطالي راقٍ مع محطة باستا مباشرة', true),
    (12, 'catering', 'Spice Route India Catering',  'خدمة تقديم طعام سبايس روت', 'Authentic Indian cuisine with live tandoor stations',               'مطبخ هندي أصيل مع محطات تندوري حية', true)
  RETURNING id, restaurant_id, name_en
`);
const menus = menusResult.rows;
console.log('Created menus:', menus.map(m => `${m.id}: ${m.name_en}`).join(', '));

// Step 2: Insert packages
const packages = [
  // Najd Village (menus[0])
  {
    menu_id: menus[0].id,
    name_en: 'Al Kabsa Royal Feast', name_ar: 'ضيافة الكبسة الملكية',
    description_en: 'Traditional Saudi kabsa, jareesh & mutabbaq spread with all accompaniments and Arabic coffee',
    description_ar: 'كبسة سعودية وجريش ومطبق مع جميع المرافقات والقهوة العربية',
    price_per_person: 85, min_guests: 50, max_guests: 300,
    image_url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop',
    included_dishes: JSON.stringify([
      { en: 'Lamb Kabsa', ar: 'كبسة لحم' }, { en: 'Chicken Mandi', ar: 'مندي دجاج' },
      { en: 'Jareesh', ar: 'جريش' }, { en: 'Harees', ar: 'هريس' },
      { en: 'Dates & Sweets', ar: 'تمور وحلوى' },
    ]),
  },
  {
    menu_id: menus[0].id,
    name_en: 'Najd Ceremonial Package', name_ar: 'باقة نجد الاحتفالية',
    description_en: 'Full ceremonial Saudi dining with live coffee station, mixed grill and traditional desserts',
    description_ar: 'تجربة طعام سعودية احتفالية كاملة مع محطة قهوة ومشاوي وحلوى تقليدية',
    price_per_person: 120, min_guests: 100, max_guests: 500,
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    included_dishes: JSON.stringify([
      { en: 'Mixed Grill', ar: 'مشاوي مشكلة' }, { en: 'Kabsa Al-Lahm', ar: 'كبسة اللحم' },
      { en: 'Mutabbaq', ar: 'مطبق' }, { en: 'Arabic Coffee', ar: 'قهوة عربية' },
      { en: 'Assorted Desserts', ar: 'حلويات متنوعة' },
    ]),
  },
  // Nakheel Palace (menus[1])
  {
    menu_id: menus[1].id,
    name_en: 'Gulf Splendour Buffet', name_ar: 'بوفيه روعة الخليج',
    description_en: 'Elaborate Gulf buffet with cold mezze, hot mains, seafood & live kunafa dessert station',
    description_ar: 'بوفيه خليجي متكامل مع مقبلات وأطباق ساخنة ومأكولات بحرية ومحطة كنافة',
    price_per_person: 95, min_guests: 80, max_guests: 400,
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop',
    included_dishes: JSON.stringify([
      { en: 'Shrimp Biryani', ar: 'برياني ربيان' }, { en: 'Lamb Ouzi', ar: 'أوزي ضاني' },
      { en: 'Fattoush & Salads', ar: 'فتوش وسلطات' }, { en: 'Kunafa Station', ar: 'محطة كنافة' },
    ]),
  },
  {
    menu_id: menus[1].id,
    name_en: 'Premium Gala Buffet', name_ar: 'بوفيه الغالا المميز',
    description_en: 'Live cooking stations, international salads, premium seafood counter & elaborate dessert buffet',
    description_ar: 'محطات طبخ مباشر وسلطات دولية ومنضدة مأكولات بحرية وبوفيه حلوى',
    price_per_person: 145, min_guests: 150, max_guests: 800,
    image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
    included_dishes: JSON.stringify([
      { en: 'Lobster & Shrimp', ar: 'جراد وربيان' }, { en: 'Carved Roast Lamb', ar: 'ضاني محمر' },
      { en: 'Sushi Counter', ar: 'منضدة سوشي' }, { en: 'Live Pasta Station', ar: 'محطة باستا' },
      { en: 'Dessert Buffet', ar: 'بوفيه حلوى' },
    ]),
  },
  // The Grill House (menus[2])
  {
    menu_id: menus[2].id,
    name_en: 'Backyard BBQ Package', name_ar: 'باقة الشواء المنزلي',
    description_en: 'Live BBQ stations with mixed grills, corn, salads and sides — ideal for outdoor gatherings',
    description_ar: 'محطات شواء حية مع مشاوي مشكلة وذرة وسلطات — مثالية للتجمعات الخارجية',
    price_per_person: 70, min_guests: 30, max_guests: 200,
    image_url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop',
    included_dishes: JSON.stringify([
      { en: 'Mixed Grill Platter', ar: 'طبق مشاوي مشكلة' }, { en: 'Smoked Ribs', ar: 'أضلاع مدخنة' },
      { en: 'Grilled Corn', ar: 'ذرة مشوية' }, { en: 'Coleslaw & Salads', ar: 'سلطات' },
    ]),
  },
  {
    menu_id: menus[2].id,
    name_en: 'Corporate Grill Elite', name_ar: 'شواء النخبة للشركات',
    description_en: 'Premium live grill with butler service, Wagyu skewers and whole grilled lamb — for corporate events',
    description_ar: 'شواء حي مميز مع خدمة باتلر وأسياخ واغيو وخروف مشوي للفعاليات الشركات',
    price_per_person: 110, min_guests: 50, max_guests: 300,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop',
    included_dishes: JSON.stringify([
      { en: 'Wagyu Beef Skewers', ar: 'أسياخ واغيو' }, { en: 'Whole Grilled Lamb', ar: 'خروف مشوي كامل' },
      { en: 'Grilled Vegetables', ar: 'خضروات مشوية' }, { en: 'Artisan Breads', ar: 'خبز حرفي' },
    ]),
  },
  // Casa Levant (menus[3])
  {
    menu_id: menus[3].id,
    name_en: 'Levantine Mezze Buffet', name_ar: 'بوفيه مقبلات شامية',
    description_en: 'Extensive cold & hot mezze spread with grilled meats and traditional Levantine desserts',
    description_ar: 'تشكيلة واسعة من المقبلات الباردة والساخنة مع المشاوي والحلوى الشامية',
    price_per_person: 75, min_guests: 40, max_guests: 250,
    image_url: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600&h=400&fit=crop',
    included_dishes: JSON.stringify([
      { en: 'Hummus & Mutabbal', ar: 'حمص ومتبل' }, { en: 'Fatayer Assortment', ar: 'فطاير متنوعة' },
      { en: 'Grilled Meats', ar: 'لحوم مشوية' }, { en: 'Knafeh', ar: 'كنافة' },
    ]),
  },
  // Maestro Italian (menus[4])
  {
    menu_id: menus[4].id,
    name_en: 'La Festa Italiana', name_ar: 'لا فيستا إيطاليانا',
    description_en: 'Rustic Italian catering with live pasta station, antipasti, risotto and classic tiramisu',
    description_ar: 'تقديم طعام إيطالي مع محطة باستا مباشرة ومقبلات وريزوتو وتيراميسو',
    price_per_person: 130, min_guests: 40, max_guests: 200,
    image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop',
    included_dishes: JSON.stringify([
      { en: 'Live Pasta Station', ar: 'محطة باستا مباشرة' }, { en: 'Bruschetta & Antipasti', ar: 'بروشيتا ومقبلات' },
      { en: 'Risotto', ar: 'ريزوتو' }, { en: 'Tiramisu', ar: 'تيراميسو' },
    ]),
  },
  // Spice Route India (menus[5])
  {
    menu_id: menus[5].id,
    name_en: 'Tandoor Night', name_ar: 'ليلة التندور',
    description_en: 'Live tandoor experience with butter chicken, garlic naan, mango lassi and Indian sweets',
    description_ar: 'تجربة تندور مباشرة مع دجاج بالزبدة وخبز نان بالثوم ولاسي مانجو وحلوى هندية',
    price_per_person: 80, min_guests: 40, max_guests: 300,
    image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop',
    included_dishes: JSON.stringify([
      { en: 'Butter Chicken', ar: 'دجاج بالزبدة' }, { en: 'Dal Makhani', ar: 'عدس مقلي' },
      { en: 'Garlic Naan', ar: 'نان بالثوم' }, { en: 'Mango Lassi', ar: 'لاسي مانجو' },
      { en: 'Gulab Jamun', ar: 'جلاب جامون' },
    ]),
  },
  {
    menu_id: menus[5].id,
    name_en: 'Royal Indian Feast', name_ar: 'وليمة هندية ملكية',
    description_en: 'Banquet-style royal Indian catering with dum biryani, seekh kebab and live cooking stations',
    description_ar: 'تقديم طعام هندي ملكي بأسلوب بنكيت مع برياني دم وكباب سيخ ومحطات طبخ مباشر',
    price_per_person: 105, min_guests: 80, max_guests: 400,
    image_url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=400&fit=crop',
    included_dishes: JSON.stringify([
      { en: 'Dum Biryani', ar: 'برياني دم' }, { en: 'Shahi Paneer', ar: 'بانير شاهي' },
      { en: 'Seekh Kebab', ar: 'كباب سيخ' }, { en: 'Raita & Chutneys', ar: 'رايتا وصلصات' },
      { en: 'Kheer', ar: 'خير' },
    ]),
  },
];

for (const pkg of packages) {
  await c.query(`
    INSERT INTO menu_packages (menu_id, name_en, name_ar, description_en, description_ar,
      price_per_person, min_guests, max_guests, currency, image_url, included_dishes, is_active)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'SAR',$9,$10::jsonb,true)
  `, [pkg.menu_id, pkg.name_en, pkg.name_ar, pkg.description_en, pkg.description_ar,
      pkg.price_per_person, pkg.min_guests, pkg.max_guests, pkg.image_url, pkg.included_dishes]);
}

console.log(`Inserted ${packages.length} catering packages.`);
await c.end();
