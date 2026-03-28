import {
  db,
  pool,
  countriesTable,
  citiesTable,
  categoriesTable,
  occasionsTable,
  usersTable,
  restaurantsTable,
  restaurantCategoriesTable,
  restaurantOccasionsTable,
  openingHoursTable,
  menusTable,
  menuSectionsTable,
  dishesTable,
} from "@workspace/db";

async function seed() {
  console.log("🌱 Seeding database...");

  // Countries
  const [sa, ae] = await db
    .insert(countriesTable)
    .values([
      { nameEn: "Saudi Arabia", nameAr: "المملكة العربية السعودية", code: "SA", flag: "🇸🇦" },
      { nameEn: "United Arab Emirates", nameAr: "الإمارات العربية المتحدة", code: "AE", flag: "🇦🇪" },
      { nameEn: "Kuwait", nameAr: "الكويت", code: "KW", flag: "🇰🇼" },
      { nameEn: "Bahrain", nameAr: "البحرين", code: "BH", flag: "🇧🇭" },
    ])
    .returning();

  console.log("✅ Countries seeded");

  // Cities
  const cities = await db
    .insert(citiesTable)
    .values([
      { nameEn: "Riyadh", nameAr: "الرياض", countryId: sa.id, latitude: 24.7136, longitude: 46.6753 },
      { nameEn: "Jeddah", nameAr: "جدة", countryId: sa.id, latitude: 21.4858, longitude: 39.1925 },
      { nameEn: "Dammam", nameAr: "الدمام", countryId: sa.id, latitude: 26.4207, longitude: 50.0888 },
      { nameEn: "Makkah", nameAr: "مكة المكرمة", countryId: sa.id, latitude: 21.3891, longitude: 39.8579 },
      { nameEn: "Madinah", nameAr: "المدينة المنورة", countryId: sa.id, latitude: 24.4539, longitude: 39.6015 },
      { nameEn: "Dubai", nameAr: "دبي", countryId: ae.id, latitude: 25.2048, longitude: 55.2708 },
      { nameEn: "Abu Dhabi", nameAr: "أبوظبي", countryId: ae.id, latitude: 24.4539, longitude: 54.3773 },
    ])
    .returning();

  const riyadh = cities[0];
  const jeddah = cities[1];
  const dammam = cities[2];
  const dubai = cities[5];

  console.log("✅ Cities seeded");

  // Categories
  const cats = await db
    .insert(categoriesTable)
    .values([
      { nameEn: "Saudi", nameAr: "سعودي", icon: "🫕", slug: "saudi" },
      { nameEn: "Mediterranean", nameAr: "متوسطي", icon: "🥙", slug: "mediterranean" },
      { nameEn: "Indian", nameAr: "هندي", icon: "🍛", slug: "indian" },
      { nameEn: "Italian", nameAr: "إيطالي", icon: "🍝", slug: "italian" },
      { nameEn: "Japanese", nameAr: "ياباني", icon: "🍣", slug: "japanese" },
      { nameEn: "Turkish", nameAr: "تركي", icon: "🥙", slug: "turkish" },
      { nameEn: "Levantine", nameAr: "شامي", icon: "🧆", slug: "levantine" },
      { nameEn: "American", nameAr: "أمريكي", icon: "🍔", slug: "american" },
      { nameEn: "Seafood", nameAr: "مأكولات بحرية", icon: "🦞", slug: "seafood" },
      { nameEn: "Steakhouse", nameAr: "مشويات", icon: "🥩", slug: "steakhouse" },
      { nameEn: "Cafe & Bakery", nameAr: "مقهى ومخبز", icon: "☕", slug: "cafe-bakery" },
      { nameEn: "Desserts", nameAr: "حلويات", icon: "🍰", slug: "desserts" },
    ])
    .returning();

  console.log("✅ Categories seeded");

  // Occasions
  const occs = await db
    .insert(occasionsTable)
    .values([
      { nameEn: "Family Dinner", nameAr: "عشاء عائلي", icon: "👨‍👩‍👧‍👦", slug: "family-dinner" },
      { nameEn: "Business Lunch", nameAr: "غداء عمل", icon: "💼", slug: "business-lunch" },
      { nameEn: "Romantic Date", nameAr: "موعد رومانسي", icon: "🌹", slug: "romantic-date" },
      { nameEn: "Birthday Celebration", nameAr: "احتفال بعيد الميلاد", icon: "🎂", slug: "birthday" },
      { nameEn: "Healthy Dining", nameAr: "طعام صحي", icon: "🥗", slug: "healthy" },
      { nameEn: "Group Gathering", nameAr: "تجمع جماعي", icon: "🎉", slug: "group-gathering" },
      { nameEn: "Breakfast", nameAr: "إفطار", icon: "🌅", slug: "breakfast" },
      { nameEn: "Ramadan Iftar", nameAr: "إفطار رمضان", icon: "🌙", slug: "ramadan-iftar" },
    ])
    .returning();

  console.log("✅ Occasions seeded");

  // Default user (stub auth)
  await db.insert(usersTable).values({
    nameEn: "Food Explorer",
    nameAr: "مستكشف الطعام",
    phone: "+966500000001",
    isVerified: true,
    points: 1250,
    level: 3,
    levelTitle: "Gourmet",
    cityId: riyadh.id,
  });

  console.log("✅ Default user seeded");

  // Restaurants
  const restaurants = await db
    .insert(restaurantsTable)
    .values([
      {
        nameEn: "Najd Village",
        nameAr: "قرية نجد",
        descriptionEn: "Authentic Saudi cuisine in a traditional Najdi setting. Experience the rich flavors of the Arabian Peninsula.",
        descriptionAr: "مطبخ سعودي أصيل في بيئة نجدية تقليدية. استمتع بالنكهات الغنية لشبه الجزيرة العربية.",
        slug: "najd-village-riyadh",
        coverImageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=500&fit=crop",
        priceTier: "upscale",
        avgRating: 4.8,
        reviewCount: 342,
        isVerified: true,
        isFeatured: true,
        cityId: riyadh.id,
        countryId: sa.id,
        address: "Olaya District, Riyadh",
        hasParking: true,
        hasPrivateRoom: true,
        isHalal: true,
        phone: "+966112345678",
      },
      {
        nameEn: "Reem Al Bawadi",
        nameAr: "ريم البوادي",
        descriptionEn: "A celebration of authentic Emirati and Gulf flavors. Famous for its traditional hospitality.",
        descriptionAr: "احتفال بالنكهات الإماراتية والخليجية الأصيلة. مشهور بضيافته التقليدية.",
        slug: "reem-al-bawadi-riyadh",
        coverImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop",
        priceTier: "mid",
        avgRating: 4.5,
        reviewCount: 218,
        isVerified: true,
        isFeatured: true,
        cityId: riyadh.id,
        countryId: sa.id,
        address: "King Fahd Road, Riyadh",
        hasParking: true,
        hasOutdoorSeating: true,
        isHalal: true,
        phone: "+966113456789",
      },
      {
        nameEn: "Sushi Sama",
        nameAr: "سوشي ساما",
        descriptionEn: "Premium Japanese cuisine with the freshest ingredients. Omakase and à la carte available.",
        descriptionAr: "مطبخ ياباني فاخر بأجود المكونات. يتوفر أوماكاسي وقائمة طعام عادية.",
        slug: "sushi-sama-riyadh",
        coverImageUrl: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&h=500&fit=crop",
        priceTier: "fine_dining",
        avgRating: 4.9,
        reviewCount: 156,
        isVerified: true,
        isFeatured: true,
        cityId: riyadh.id,
        countryId: sa.id,
        address: "Al Nakheel Mall, Riyadh",
        hasParking: true,
        hasPrivateRoom: true,
        isHalal: false,
        phone: "+966114567890",
      },
      {
        nameEn: "Lusin",
        nameAr: "لوسين",
        descriptionEn: "Elegant Armenian-Mediterranean restaurant with stunning ambiance and exquisite flavors.",
        descriptionAr: "مطعم أرمني-متوسطي أنيق بأجواء رائعة ونكهات راقية.",
        slug: "lusin-riyadh",
        coverImageUrl: "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=800&h=500&fit=crop",
        priceTier: "upscale",
        avgRating: 4.7,
        reviewCount: 289,
        isVerified: true,
        isFeatured: true,
        cityId: riyadh.id,
        countryId: sa.id,
        address: "Granada Business Park, Riyadh",
        hasParking: true,
        hasOutdoorSeating: true,
        isHalal: true,
        phone: "+966115678901",
      },
      {
        nameEn: "Spice Route",
        nameAr: "طريق البهارات",
        descriptionEn: "A journey through the flavors of India and Southeast Asia. Aromatic spices, rich curries.",
        descriptionAr: "رحلة عبر نكهات الهند وجنوب شرق آسيا. بهارات عطرة وكاري غني.",
        slug: "spice-route-jeddah",
        coverImageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=500&fit=crop",
        priceTier: "mid",
        avgRating: 4.6,
        reviewCount: 412,
        isVerified: true,
        isFeatured: false,
        cityId: jeddah.id,
        countryId: sa.id,
        address: "Al Balad District, Jeddah",
        hasParking: false,
        hasOutdoorSeating: true,
        isHalal: true,
        phone: "+966126789012",
      },
      {
        nameEn: "Al Tazaj",
        nameAr: "الطازج",
        descriptionEn: "Famous for grilled chicken and traditional broasted specialties across Saudi Arabia.",
        descriptionAr: "مشهور بالدجاج المشوي والمبروستد التقليدي في جميع أنحاء المملكة العربية السعودية.",
        slug: "al-tazaj-dammam",
        coverImageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&h=500&fit=crop",
        priceTier: "budget",
        avgRating: 4.3,
        reviewCount: 891,
        isVerified: true,
        isFeatured: false,
        cityId: dammam.id,
        countryId: sa.id,
        address: "King Saud Street, Dammam",
        hasParking: true,
        isHalal: true,
        phone: "+966138901234",
      },
      {
        nameEn: "Nobu",
        nameAr: "نوبو",
        descriptionEn: "World-renowned Japanese restaurant with signature new-style Japanese cuisine.",
        descriptionAr: "مطعم ياباني ذو شهرة عالمية مع المطبخ الياباني الحديث المميز.",
        slug: "nobu-riyadh",
        coverImageUrl: "https://images.unsplash.com/photo-1562802378-063ec186a863?w=800&h=500&fit=crop",
        priceTier: "fine_dining",
        avgRating: 4.8,
        reviewCount: 203,
        isVerified: true,
        isFeatured: true,
        cityId: riyadh.id,
        countryId: sa.id,
        address: "Four Seasons Hotel, Riyadh",
        hasParking: true,
        hasPrivateRoom: true,
        isHalal: false,
        phone: "+966117890123",
      },
      {
        nameEn: "Karak House",
        nameAr: "بيت الكرك",
        descriptionEn: "The ultimate karak chai experience with Gulf-style breakfast and light bites.",
        descriptionAr: "تجربة شاي الكرك المثلى مع فطور خليجي ومقبلات خفيفة.",
        slug: "karak-house-riyadh",
        coverImageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=500&fit=crop",
        priceTier: "budget",
        avgRating: 4.4,
        reviewCount: 567,
        isVerified: true,
        isFeatured: false,
        cityId: riyadh.id,
        countryId: sa.id,
        address: "Al Malaz, Riyadh",
        hasOutdoorSeating: true,
        isHalal: true,
        phone: "+966119012345",
      },
    ])
    .returning();

  console.log("✅ Restaurants seeded");

  // Restaurant categories
  const [najd, reemBawadi, sushiSama, lusin, spiceRoute, alTazaj, nobu, karak] = restaurants;
  const [saudiCat, medCat, indianCat, italianCat, japaneseCat, turkishCat, levantineCat, americanCat, seafoodCat, steakCat, cafeCat, dessertCat] = cats;
  const [familyOcc, businessOcc, romanticOcc, birthdayOcc, healthyOcc, groupOcc, breakfastOcc, ramadanOcc] = occs;

  await db.insert(restaurantCategoriesTable).values([
    { restaurantId: najd.id, categoryId: saudiCat.id },
    { restaurantId: reemBawadi.id, categoryId: levantineCat.id },
    { restaurantId: reemBawadi.id, categoryId: medCat.id },
    { restaurantId: sushiSama.id, categoryId: japaneseCat.id },
    { restaurantId: sushiSama.id, categoryId: seafoodCat.id },
    { restaurantId: lusin.id, categoryId: medCat.id },
    { restaurantId: spiceRoute.id, categoryId: indianCat.id },
    { restaurantId: alTazaj.id, categoryId: saudiCat.id },
    { restaurantId: nobu.id, categoryId: japaneseCat.id },
    { restaurantId: nobu.id, categoryId: seafoodCat.id },
    { restaurantId: karak.id, categoryId: cafeCat.id },
  ]);

  // Restaurant occasions
  await db.insert(restaurantOccasionsTable).values([
    { restaurantId: najd.id, occasionId: familyOcc.id },
    { restaurantId: najd.id, occasionId: ramadanOcc.id },
    { restaurantId: najd.id, occasionId: groupOcc.id },
    { restaurantId: reemBawadi.id, occasionId: familyOcc.id },
    { restaurantId: reemBawadi.id, occasionId: groupOcc.id },
    { restaurantId: sushiSama.id, occasionId: romanticOcc.id },
    { restaurantId: sushiSama.id, occasionId: businessOcc.id },
    { restaurantId: lusin.id, occasionId: romanticOcc.id },
    { restaurantId: lusin.id, occasionId: birthdayOcc.id },
    { restaurantId: spiceRoute.id, occasionId: familyOcc.id },
    { restaurantId: nobu.id, occasionId: romanticOcc.id },
    { restaurantId: nobu.id, occasionId: businessOcc.id },
    { restaurantId: nobu.id, occasionId: birthdayOcc.id },
    { restaurantId: karak.id, occasionId: breakfastOcc.id },
    { restaurantId: karak.id, occasionId: groupOcc.id },
  ]);

  console.log("✅ Restaurant categories and occasions seeded");

  // Opening hours for Najd Village (all week)
  const hoursData = [];
  for (const restaurantId of [najd.id, reemBawadi.id, sushiSama.id, lusin.id, nobu.id]) {
    for (let day = 0; day <= 6; day++) {
      hoursData.push({
        restaurantId,
        dayOfWeek: day,
        openTime: "12:00",
        closeTime: "23:30",
        isClosed: false,
      });
    }
  }
  for (let day = 0; day <= 6; day++) {
    hoursData.push({ restaurantId: karak.id, dayOfWeek: day, openTime: "07:00", closeTime: "01:00", isClosed: false });
    hoursData.push({ restaurantId: alTazaj.id, dayOfWeek: day, openTime: "11:00", closeTime: "00:00", isClosed: false });
  }
  await db.insert(openingHoursTable).values(hoursData);

  console.log("✅ Opening hours seeded");

  // Menus and dishes
  // Najd Village menu
  const [najdMenu] = await db.insert(menusTable).values({
    restaurantId: najd.id,
    nameEn: "Main Menu",
    nameAr: "القائمة الرئيسية",
    type: "food",
    isActive: true,
    displayOrder: 1,
  }).returning();

  const [najdSection1, najdSection2] = await db.insert(menuSectionsTable).values([
    { menuId: najdMenu.id, nameEn: "Starters", nameAr: "المقبلات", displayOrder: 1 },
    { menuId: najdMenu.id, nameEn: "Main Course", nameAr: "الأطباق الرئيسية", displayOrder: 2 },
  ]).returning();

  await db.insert(dishesTable).values([
    {
      restaurantId: najd.id,
      menuSectionId: najdSection1.id,
      nameEn: "Harees",
      nameAr: "هريس",
      descriptionEn: "Traditional wheat and meat porridge slow-cooked to perfection.",
      descriptionAr: "عصيدة القمح واللحم التقليدية المطهية ببطء حتى الإتقان.",
      price: "35.00",
      imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop",
      isAvailable: true,
      isHalal: true,
      avgRating: "4.7",
      reviewCount: 89,
      popularityScore: "92.5",
    },
    {
      restaurantId: najd.id,
      menuSectionId: najdSection1.id,
      nameEn: "Jareesh",
      nameAr: "جريش",
      descriptionEn: "Crushed wheat cooked with milk and butter, a classic Saudi staple.",
      descriptionAr: "القمح المجروش مطهو بالحليب والزبدة، من أساسيات المطبخ السعودي.",
      price: "30.00",
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
      isAvailable: true,
      isHalal: true,
      avgRating: "4.5",
      reviewCount: 67,
      popularityScore: "88.0",
    },
    {
      restaurantId: najd.id,
      menuSectionId: najdSection2.id,
      nameEn: "Kabsa",
      nameAr: "كبسة",
      descriptionEn: "Saudi Arabia's national dish — aromatic basmati rice with tender slow-cooked lamb.",
      descriptionAr: "الطبق الوطني السعودي — أرز بسمتي عطري مع لحم الضأن الطري المطهو ببطء.",
      price: "85.00",
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop",
      isAvailable: true,
      isHalal: true,
      avgRating: "4.9",
      reviewCount: 203,
      popularityScore: "98.2",
    },
    {
      restaurantId: najd.id,
      menuSectionId: najdSection2.id,
      nameEn: "Mandi",
      nameAr: "مندي",
      descriptionEn: "Tender meat and rice slow-cooked in a tandoor oven with aromatic spices.",
      descriptionAr: "لحم وأرز طري مطهو ببطء في فرن الطندور مع بهارات عطرة.",
      price: "90.00",
      imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
      isAvailable: true,
      isHalal: true,
      avgRating: "4.8",
      reviewCount: 178,
      popularityScore: "95.5",
    },
  ]);

  // Sushi Sama menu
  const [sushiMenu] = await db.insert(menusTable).values({
    restaurantId: sushiSama.id,
    nameEn: "Sushi Menu",
    nameAr: "قائمة السوشي",
    type: "food",
    isActive: true,
    displayOrder: 1,
  }).returning();

  const [sushiSection] = await db.insert(menuSectionsTable).values({
    menuId: sushiMenu.id, nameEn: "Signature Rolls", nameAr: "الرولات المميزة", displayOrder: 1,
  }).returning();

  await db.insert(dishesTable).values([
    {
      restaurantId: sushiSama.id,
      menuSectionId: sushiSection.id,
      nameEn: "Dragon Roll",
      nameAr: "رول التنين",
      descriptionEn: "Shrimp tempura topped with avocado and spicy mayo.",
      descriptionAr: "روبيان تمبورا مع أفوكادو ومايونيز حار.",
      price: "65.00",
      imageUrl: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&h=300&fit=crop",
      isAvailable: true,
      isHalal: false,
      avgRating: "4.9",
      reviewCount: 124,
      popularityScore: "96.5",
    },
    {
      restaurantId: sushiSama.id,
      menuSectionId: sushiSection.id,
      nameEn: "Spicy Tuna Roll",
      nameAr: "رول التونة الحارة",
      descriptionEn: "Fresh tuna with spicy mayo and cucumber.",
      descriptionAr: "تونة طازجة مع مايونيز حار وخيار.",
      price: "55.00",
      imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop",
      isAvailable: true,
      isHalal: false,
      avgRating: "4.7",
      reviewCount: 98,
      popularityScore: "91.0",
    },
    {
      restaurantId: nobu.id,
      menuSectionId: null,
      nameEn: "Black Cod Miso",
      nameAr: "سمك القد الأسود بالميسو",
      descriptionEn: "Nobu's signature dish: black cod marinated in sweet miso.",
      descriptionAr: "الطبق المميز لنوبو: سمك القد الأسود المتبل بالميسو الحلو.",
      price: "195.00",
      imageUrl: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400&h=300&fit=crop",
      isAvailable: true,
      isHalal: false,
      avgRating: "5.0",
      reviewCount: 87,
      popularityScore: "99.0",
    },
    {
      restaurantId: spiceRoute.id,
      menuSectionId: null,
      nameEn: "Butter Chicken",
      nameAr: "دجاج بالزبدة",
      descriptionEn: "Creamy tomato-based curry with tender tandoori chicken.",
      descriptionAr: "كاري كريمي بالطماطم مع دجاج الطندور الطري.",
      price: "52.00",
      imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=300&fit=crop",
      isAvailable: true,
      isHalal: true,
      isVegetarian: false,
      avgRating: "4.8",
      reviewCount: 156,
      popularityScore: "94.0",
    },
    {
      restaurantId: karak.id,
      menuSectionId: null,
      nameEn: "Karak Chai",
      nameAr: "شاي الكرك",
      descriptionEn: "The legendary Gulf-style spiced milk tea brewed to perfection.",
      descriptionAr: "الشاي الحليب الخليجي المتبل الأسطوري المعدّ بإتقان.",
      price: "12.00",
      imageUrl: "https://images.unsplash.com/photo-1561336526-2914f13ceb36?w=400&h=300&fit=crop",
      isAvailable: true,
      isHalal: true,
      isVegetarian: true,
      avgRating: "4.6",
      reviewCount: 389,
      popularityScore: "97.5",
    },
  ]);

  console.log("✅ Menus and dishes seeded");
  console.log("\n🎉 Database seeded successfully!");

  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
