/**
 * Tabaq Database Seed Script
 * Run with: pnpm --filter @workspace/db run seed
 * (or: npx tsx scripts/seed.ts from project root)
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  countriesTable,
  citiesTable,
  categoriesTable,
  occasionsTable,
  restaurantsTable,
  restaurantCategoriesTable,
  restaurantOccasionsTable,
  openingHoursTable,
  menusTable,
  menuSectionsTable,
  dishesTable,
  blogCategoriesTable,
  blogPostsTable,
  offersTable,
  usersTable,
} from "../lib/db/src/schema/index.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log("🌱 Starting database seed...\n");

  // ── 1. Countries ───────────────────────────────────────────────────────────
  console.log("🌍 Seeding countries...");
  const [sa] = await db.insert(countriesTable).values([
    { nameEn: "Saudi Arabia", nameAr: "المملكة العربية السعودية", code: "SA", flag: "🇸🇦" },
  ]).onConflictDoNothing().returning();

  const saudiArabiaId = sa?.id ?? 1;

  // ── 2. Cities ──────────────────────────────────────────────────────────────
  console.log("🏙️  Seeding cities...");
  const insertedCities = await db.insert(citiesTable).values([
    { nameEn: "Riyadh",    nameAr: "الرياض",      countryId: saudiArabiaId, latitude: 24.7136, longitude: 46.6753 },
    { nameEn: "Jeddah",    nameAr: "جدة",          countryId: saudiArabiaId, latitude: 21.4858, longitude: 39.1925 },
    { nameEn: "Dammam",    nameAr: "الدمام",       countryId: saudiArabiaId, latitude: 26.4207, longitude: 50.0888 },
    { nameEn: "Mecca",     nameAr: "مكة المكرمة",  countryId: saudiArabiaId, latitude: 21.3891, longitude: 39.8579 },
    { nameEn: "Medina",    nameAr: "المدينة المنورة", countryId: saudiArabiaId, latitude: 24.5247, longitude: 39.5692 },
    { nameEn: "NEOM",      nameAr: "نيوم",          countryId: saudiArabiaId, latitude: 28.0339, longitude: 35.3083 },
    { nameEn: "AlUla",     nameAr: "العُلا",        countryId: saudiArabiaId, latitude: 26.6196, longitude: 37.9221 },
    { nameEn: "Khobar",    nameAr: "الخبر",         countryId: saudiArabiaId, latitude: 26.2172, longitude: 50.1971 },
  ]).onConflictDoNothing().returning();

  const riyadhId   = insertedCities.find(c => c.nameEn === "Riyadh")?.id   ?? 1;
  const jeddahId   = insertedCities.find(c => c.nameEn === "Jeddah")?.id   ?? 2;
  const dammamId   = insertedCities.find(c => c.nameEn === "Dammam")?.id   ?? 3;

  // ── 3. Categories ──────────────────────────────────────────────────────────
  console.log("🍴 Seeding categories...");
  const insertedCats = await db.insert(categoriesTable).values([
    { nameEn: "Saudi",        nameAr: "سعودي",          icon: "🇸🇦", slug: "saudi" },
    { nameEn: "Grills",       nameAr: "مشاوي",           icon: "🔥", slug: "grills" },
    { nameEn: "Seafood",      nameAr: "مأكولات بحرية",    icon: "🦞", slug: "seafood" },
    { nameEn: "Asian",        nameAr: "آسيوي",            icon: "🍜", slug: "asian" },
    { nameEn: "Italian",      nameAr: "إيطالي",           icon: "🍝", slug: "italian" },
    { nameEn: "Burgers",      nameAr: "برجر",             icon: "🍔", slug: "burgers" },
    { nameEn: "Pizza",        nameAr: "بيتزا",            icon: "🍕", slug: "pizza" },
    { nameEn: "Healthy",      nameAr: "صحي",              icon: "🥗", slug: "healthy" },
    { nameEn: "Desserts",     nameAr: "حلويات",           icon: "🍰", slug: "desserts" },
    { nameEn: "Café",         nameAr: "كافيه",            icon: "☕", slug: "cafe" },
    { nameEn: "Sushi",        nameAr: "سوشي",             icon: "🍱", slug: "sushi" },
    { nameEn: "Levantine",    nameAr: "شامي",             icon: "🫔", slug: "levantine" },
    { nameEn: "Indian",       nameAr: "هندي",             icon: "🍛", slug: "indian" },
    { nameEn: "Turkish",      nameAr: "تركي",             icon: "🥙", slug: "turkish" },
    { nameEn: "Mexican",      nameAr: "مكسيكي",           icon: "🌮", slug: "mexican" },
    { nameEn: "Fine Dining",  nameAr: "فاين دايننج",      icon: "✨", slug: "fine-dining" },
  ]).onConflictDoNothing().returning();

  const catBySlug = Object.fromEntries(insertedCats.map(c => [c.slug, c.id]));

  // ── 4. Occasions ───────────────────────────────────────────────────────────
  console.log("🎉 Seeding occasions...");
  const insertedOccs = await db.insert(occasionsTable).values([
    { nameEn: "Romantic Date",   nameAr: "موعد رومانسي",    icon: "❤️",  slug: "romantic" },
    { nameEn: "Family Gathering",nameAr: "تجمع عائلي",       icon: "👨‍👩‍👧‍👦", slug: "family" },
    { nameEn: "Business Lunch",  nameAr: "غداء عمل",         icon: "💼",  slug: "business" },
    { nameEn: "Birthday",        nameAr: "عيد ميلاد",        icon: "🎂",  slug: "birthday" },
    { nameEn: "Celebration",     nameAr: "احتفال",            icon: "🥂",  slug: "celebration" },
    { nameEn: "Casual Hangout",  nameAr: "لقاء غير رسمي",    icon: "😊",  slug: "casual" },
    { nameEn: "Breakfast",       nameAr: "فطور",              icon: "🌅",  slug: "breakfast" },
    { nameEn: "Late Night",      nameAr: "ليلي",              icon: "🌙",  slug: "late-night" },
  ]).onConflictDoNothing().returning();

  const occBySlug = Object.fromEntries(insertedOccs.map(o => [o.slug, o.id]));

  // ── 5. Restaurants ─────────────────────────────────────────────────────────
  console.log("🏪 Seeding restaurants...");
  const restaurants = await db.insert(restaurantsTable).values([
    {
      refCode: "TBQ-RST-2026-000001",
      nameEn: "Najd Village", nameAr: "قرية نجد",
      slug: "najd-village",
      descriptionEn: "An iconic Saudi restaurant offering traditional Najdi cuisine in a village-style atmosphere with authentic decor and warm hospitality.",
      descriptionAr: "مطعم سعودي أيقوني يقدم المطبخ النجدي التقليدي في أجواء القرية مع ديكور أصيل وضيافة دافئة.",
      coverImageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
      priceTier: "upscale",
      avgRating: 4.7,
      reviewCount: 1243,
      followerCount: 8900,
      isVerified: true, isFeatured: true, isActive: true, isHalal: true,
      cityId: riyadhId, countryId: saudiArabiaId,
      address: "Olaya District, Riyadh", phone: "+966112345678",
      hasParking: true, hasOutdoorSeating: true, hasPrivateRoom: true,
      latitude: 24.7136, longitude: 46.6753,
    },
    {
      refCode: "TBQ-RST-2026-000002",
      nameEn: "Nakheel Palace", nameAr: "قصر النخيل",
      slug: "nakheel-palace",
      descriptionEn: "A luxurious fine dining experience inspired by the splendor of ancient Arabian palaces, serving elevated Saudi and Levantine cuisine.",
      descriptionAr: "تجربة طعام فاخرة مستوحاة من روعة القصور العربية، تقدم المطبخ السعودي والشامي الراقي.",
      coverImageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80",
      priceTier: "fine_dining",
      avgRating: 4.9, reviewCount: 687, followerCount: 12300,
      isVerified: true, isFeatured: true, isActive: true, isHalal: true,
      cityId: riyadhId, countryId: saudiArabiaId,
      address: "King Fahd Road, Riyadh", phone: "+966112345679",
      hasParking: true, hasPrivateRoom: true,
      latitude: 24.7250, longitude: 46.6935,
    },
    {
      refCode: "TBQ-RST-2026-000003",
      nameEn: "Sushi Hana", nameAr: "سوشي هانا",
      slug: "sushi-hana",
      descriptionEn: "Premium Japanese cuisine with the finest sushi, sashimi, and teppanyaki in a sleek, modern ambiance.",
      descriptionAr: "مطبخ ياباني فاخر مع أفضل السوشي والساشيمي والتيبانياكي في أجواء عصرية أنيقة.",
      coverImageUrl: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80",
      priceTier: "upscale",
      avgRating: 4.6, reviewCount: 934, followerCount: 7800,
      isVerified: true, isFeatured: true, isActive: true, isHalal: true,
      cityId: riyadhId, countryId: saudiArabiaId,
      address: "Tahlia Street, Riyadh", phone: "+966112345680",
      hasParking: true, hasOutdoorSeating: false,
      latitude: 24.6915, longitude: 46.6832,
    },
    {
      refCode: "TBQ-RST-2026-000004",
      nameEn: "Maestro Italian", nameAr: "ماستيرو إيطالي",
      slug: "maestro-italian",
      descriptionEn: "Authentic Italian cuisine prepared by master chefs, featuring handmade pasta, wood-fired pizza, and fine Italian wines.",
      descriptionAr: "مطبخ إيطالي أصيل يعده أمهر الطهاة، مع باستا محلية الصنع وبيتزا من الفرن الخشبي.",
      coverImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
      priceTier: "upscale",
      avgRating: 4.5, reviewCount: 1120, followerCount: 6500,
      isVerified: true, isFeatured: false, isActive: true, isHalal: true,
      cityId: jeddahId, countryId: saudiArabiaId,
      address: "Al-Andalus Mall, Jeddah", phone: "+966122345678",
      hasParking: true, hasOutdoorSeating: true,
      latitude: 21.5010, longitude: 39.1920,
    },
    {
      refCode: "TBQ-RST-2026-000005",
      nameEn: "Al Baik Express", nameAr: "البيك إكسبريس",
      slug: "al-baik-express",
      descriptionEn: "The iconic Saudi fast food chain known for its legendary broasted chicken, fresh seafood, and crispy fries.",
      descriptionAr: "سلسلة الوجبات السريعة السعودية الأيقونية المشهورة بدجاجها البروستد الأسطوري.",
      coverImageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?w=1200&q=80",
      priceTier: "budget",
      avgRating: 4.8, reviewCount: 15400, followerCount: 45000,
      isVerified: true, isFeatured: true, isActive: true, isHalal: true,
      cityId: jeddahId, countryId: saudiArabiaId,
      address: "Multiple Locations, Jeddah", phone: "+966122345679",
      hasParking: true,
      latitude: 21.4858, longitude: 39.1925,
    },
    {
      refCode: "TBQ-RST-2026-000006",
      nameEn: "Kana Sushi", nameAr: "كانا سوشي",
      slug: "kana-sushi",
      descriptionEn: "Contemporary sushi bar with creative fusion rolls, fresh catches, and a vibrant atmosphere perfect for dining out.",
      descriptionAr: "بار سوشي عصري مع رولات مبتكرة وأسماك طازجة وأجواء رائعة مثالية لتجربة تناول الطعام.",
      coverImageUrl: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=1200&q=80",
      priceTier: "mid",
      avgRating: 4.4, reviewCount: 782, followerCount: 5200,
      isVerified: true, isFeatured: false, isActive: true, isHalal: true,
      cityId: dammamId, countryId: saudiArabiaId,
      address: "Corniche Road, Dammam", phone: "+966133345678",
      hasParking: true, hasOutdoorSeating: true,
      latitude: 26.4207, longitude: 50.0888,
    },
    {
      refCode: "TBQ-RST-2026-000007",
      nameEn: "The Grill House", nameAr: "جريل هاوس",
      slug: "the-grill-house",
      descriptionEn: "Premium steakhouse with the finest cuts of USDA and Wagyu beef, expertly grilled to perfection.",
      descriptionAr: "مطعم ستيك فاخر يقدم أجود قطع اللحم الأمريكي والواغيو، مشوية باحتراف.",
      coverImageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&q=80",
      priceTier: "fine_dining",
      avgRating: 4.8, reviewCount: 891, followerCount: 9100,
      isVerified: true, isFeatured: true, isActive: true, isHalal: true,
      cityId: riyadhId, countryId: saudiArabiaId,
      address: "Diplomatic Quarter, Riyadh", phone: "+966112345681",
      hasParking: true, hasPrivateRoom: true,
      latitude: 24.7090, longitude: 46.6540,
    },
    {
      refCode: "TBQ-RST-2026-000008",
      nameEn: "Casa Levant", nameAr: "كاسا ليفانت",
      slug: "casa-levant",
      descriptionEn: "Authentic Levantine flavors from Lebanon and Syria, featuring mezze platters, grills, and traditional sweets.",
      descriptionAr: "نكهات شامية أصيلة من لبنان وسوريا، مع ألواح المازة والمشاوي والحلويات التقليدية.",
      coverImageUrl: "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=1200&q=80",
      priceTier: "mid",
      avgRating: 4.5, reviewCount: 1056, followerCount: 6800,
      isVerified: true, isFeatured: false, isActive: true, isHalal: true,
      cityId: riyadhId, countryId: saudiArabiaId,
      address: "Al-Sulai District, Riyadh", phone: "+966112345682",
      hasParking: true, hasOutdoorSeating: true,
      latitude: 24.6805, longitude: 46.7132,
    },
    {
      refCode: "TBQ-RST-2026-000009",
      nameEn: "Green Bowl", nameAr: "جرين بول",
      slug: "green-bowl",
      descriptionEn: "Your go-to destination for nutritious, delicious healthy bowls, salads, and cold-pressed juices.",
      descriptionAr: "وجهتك المثالية للأطباق الصحية اللذيذة والسلطات والعصائر الطازجة.",
      coverImageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80",
      priceTier: "mid",
      avgRating: 4.3, reviewCount: 643, followerCount: 4200,
      isVerified: true, isFeatured: false, isActive: true, isHalal: true,
      cityId: riyadhId, countryId: saudiArabiaId,
      address: "Hittin District, Riyadh", phone: "+966112345683",
      hasParking: true, hasOutdoorSeating: true,
      latitude: 24.7453, longitude: 46.6270,
    },
    {
      refCode: "TBQ-RST-2026-000010",
      nameEn: "Café Bateel", nameAr: "مقهى باتيل",
      slug: "cafe-bateel",
      descriptionEn: "The luxury Saudi café brand celebrated for its premium organic dates, artisan coffees, and gourmet pastries.",
      descriptionAr: "علامة المقهى السعودية الفاخرة المشهورة بالتمور العضوية الفاخرة والقهوة الحرفية.",
      coverImageUrl: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&q=80",
      priceTier: "upscale",
      avgRating: 4.6, reviewCount: 2340, followerCount: 18000,
      isVerified: true, isFeatured: true, isActive: true, isHalal: true,
      cityId: riyadhId, countryId: saudiArabiaId,
      address: "Kingdom Centre, Riyadh", phone: "+966112345684",
      hasParking: true, hasOutdoorSeating: false,
      latitude: 24.7118, longitude: 46.6750,
    },
    {
      refCode: "TBQ-RST-2026-000011",
      nameEn: "Bahar Seafood", nameAr: "بحر للمأكولات البحرية",
      slug: "bahar-seafood",
      descriptionEn: "Fresh catch from Saudi and Gulf waters, grilled, fried, or served in rich seafood broths and stews.",
      descriptionAr: "صيد طازج من المياه السعودية والخليجية، مشوي أو مقلي أو في مرق بحري غني.",
      coverImageUrl: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=1200&q=80",
      priceTier: "upscale",
      avgRating: 4.7, reviewCount: 1108, followerCount: 7600,
      isVerified: true, isFeatured: true, isActive: true, isHalal: true,
      cityId: jeddahId, countryId: saudiArabiaId,
      address: "Corniche Road, Jeddah", phone: "+966122345680",
      hasParking: true, hasOutdoorSeating: true,
      latitude: 21.5010, longitude: 39.1200,
    },
    {
      refCode: "TBQ-RST-2026-000012",
      nameEn: "Spice Route India", nameAr: "طريق التوابل الهندي",
      slug: "spice-route-india",
      descriptionEn: "Vibrant Indian cuisine from Mumbai to Kerala, with tandoori specialties, curries, and biryanis.",
      descriptionAr: "مطبخ هندي نابض من مومباي إلى كيرالا، مع تخصصات التندوري والكاري والبرياني.",
      coverImageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80",
      priceTier: "mid",
      avgRating: 4.4, reviewCount: 876, followerCount: 5500,
      isVerified: true, isFeatured: false, isActive: true, isHalal: true,
      cityId: riyadhId, countryId: saudiArabiaId,
      address: "Al-Nakheel District, Riyadh", phone: "+966112345685",
      hasParking: true,
      latitude: 24.7550, longitude: 46.7200,
    },
  ]).onConflictDoNothing().returning();

  console.log(`   ✓ Inserted ${restaurants.length} restaurants`);

  // ── 6. Restaurant–Category links ──────────────────────────────────────────
  console.log("🔗 Linking categories to restaurants...");
  const rId = (slug: string) => restaurants.find(r => r.slug === slug)?.id;
  const cId = (s: string) => catBySlug[s];
  const oId = (s: string) => occBySlug[s];

  const catLinks = [
    { restaurantId: rId("najd-village")!,    categoryId: cId("saudi")! },
    { restaurantId: rId("najd-village")!,    categoryId: cId("grills")! },
    { restaurantId: rId("nakheel-palace")!,  categoryId: cId("fine-dining")! },
    { restaurantId: rId("nakheel-palace")!,  categoryId: cId("saudi")! },
    { restaurantId: rId("nakheel-palace")!,  categoryId: cId("levantine")! },
    { restaurantId: rId("sushi-hana")!,      categoryId: cId("sushi")! },
    { restaurantId: rId("sushi-hana")!,      categoryId: cId("asian")! },
    { restaurantId: rId("maestro-italian")!, categoryId: cId("italian")! },
    { restaurantId: rId("al-baik-express")!, categoryId: cId("grills")! },
    { restaurantId: rId("kana-sushi")!,      categoryId: cId("sushi")! },
    { restaurantId: rId("the-grill-house")!, categoryId: cId("grills")! },
    { restaurantId: rId("the-grill-house")!, categoryId: cId("fine-dining")! },
    { restaurantId: rId("casa-levant")!,     categoryId: cId("levantine")! },
    { restaurantId: rId("green-bowl")!,      categoryId: cId("healthy")! },
    { restaurantId: rId("cafe-bateel")!,     categoryId: cId("cafe")! },
    { restaurantId: rId("cafe-bateel")!,     categoryId: cId("desserts")! },
    { restaurantId: rId("bahar-seafood")!,   categoryId: cId("seafood")! },
    { restaurantId: rId("spice-route-india")!,categoryId: cId("indian")! },
  ].filter(l => l.restaurantId && l.categoryId);

  await db.insert(restaurantCategoriesTable).values(catLinks as any).onConflictDoNothing();

  // ── 7. Occasion links ──────────────────────────────────────────────────────
  const occLinks = [
    { restaurantId: rId("najd-village")!,    occasionId: oId("family")! },
    { restaurantId: rId("najd-village")!,    occasionId: oId("celebration")! },
    { restaurantId: rId("nakheel-palace")!,  occasionId: oId("romantic")! },
    { restaurantId: rId("nakheel-palace")!,  occasionId: oId("business")! },
    { restaurantId: rId("nakheel-palace")!,  occasionId: oId("birthday")! },
    { restaurantId: rId("sushi-hana")!,      occasionId: oId("romantic")! },
    { restaurantId: rId("sushi-hana")!,      occasionId: oId("casual")! },
    { restaurantId: rId("the-grill-house")!, occasionId: oId("business")! },
    { restaurantId: rId("the-grill-house")!, occasionId: oId("celebration")! },
    { restaurantId: rId("casa-levant")!,     occasionId: oId("family")! },
    { restaurantId: rId("casa-levant")!,     occasionId: oId("casual")! },
    { restaurantId: rId("cafe-bateel")!,     occasionId: oId("business")! },
    { restaurantId: rId("cafe-bateel")!,     occasionId: oId("casual")! },
  ].filter(l => l.restaurantId && l.occasionId);

  await db.insert(restaurantOccasionsTable).values(occLinks as any).onConflictDoNothing();

  // ── 8. Opening Hours (for first few restaurants) ───────────────────────────
  console.log("🕐 Seeding opening hours...");
  const hoursData: any[] = [];
  for (const rst of restaurants.slice(0, 6)) {
    for (let day = 0; day <= 6; day++) {
      const isFriday = day === 5;
      hoursData.push({
        restaurantId: rst.id,
        dayOfWeek: day,
        openTime: isFriday ? "12:00" : "11:00",
        closeTime: "23:30",
        isClosed: false,
      });
    }
  }
  await db.insert(openingHoursTable).values(hoursData).onConflictDoNothing();

  // ── 9. Menus & Sections & Dishes ──────────────────────────────────────────
  console.log("🍽️  Seeding menus and dishes...");

  for (const rst of restaurants) {
    const [menu] = await db.insert(menusTable).values({
      restaurantId: rst.id,
      nameEn: "Main Menu",
      nameAr: "القائمة الرئيسية",
      type: "food",
      isActive: true,
      displayOrder: 0,
    }).onConflictDoNothing().returning();

    if (!menu) continue;

    // Two sections per restaurant
    const sections = await db.insert(menuSectionsTable).values([
      { menuId: menu.id, nameEn: "Starters", nameAr: "المقبلات", displayOrder: 0 },
      { menuId: menu.id, nameEn: "Main Course", nameAr: "الطبق الرئيسي", displayOrder: 1 },
      { menuId: menu.id, nameEn: "Desserts", nameAr: "الحلويات", displayOrder: 2 },
    ]).onConflictDoNothing().returning();

    const [starters, mains, desserts] = sections;

    // Dishes based on restaurant type
    const dishData = getDishesForRestaurant(rst.slug, menu.id, starters?.id, mains?.id, desserts?.id);
    if (dishData.length > 0) {
      await db.insert(dishesTable).values(dishData).onConflictDoNothing();
    }
  }

  // ── 10. Blog Categories ────────────────────────────────────────────────────
  console.log("📝 Seeding blog...");
  const [blogCat1, blogCat2, blogCat3] = await db.insert(blogCategoriesTable).values([
    { nameEn: "Dining Guides",    nameAr: "أدلة الطعام",      slug: "dining-guides",    color: "#e23744", descriptionEn: "Curated guides to the best dining experiences in Saudi Arabia" },
    { nameEn: "Chef Stories",     nameAr: "قصص الطهاة",       slug: "chef-stories",     color: "#f59e0b" },
    { nameEn: "Food Trends",      nameAr: "اتجاهات الطعام",   slug: "food-trends",      color: "#10b981" },
    { nameEn: "Restaurant News",  nameAr: "أخبار المطاعم",    slug: "restaurant-news",  color: "#6366f1" },
    { nameEn: "Recipes",          nameAr: "وصفات",             slug: "recipes",          color: "#ec4899" },
  ]).onConflictDoNothing().returning();

  // Create a system user for blog posts if needed
  const [sysUser] = await db.select().from(usersTable).limit(1);
  if (sysUser && blogCat1) {
    await db.insert(blogPostsTable).values([
      {
        authorId: sysUser.id,
        categoryId: blogCat1.id,
        titleEn: "The Ultimate Guide to Riyadh's Fine Dining Scene",
        titleAr: "الدليل الشامل لمطاعم الفاين دايننج في الرياض",
        slug: "riyadh-fine-dining-guide-2026",
        excerptEn: "From iconic Saudi palaces to contemporary international restaurants, Riyadh's dining scene has never been more exciting. Discover the best tables in the capital.",
        excerptAr: "من القصور السعودية الأيقونية إلى المطاعم الدولية المعاصرة، مشهد الطعام في الرياض لم يكن أكثر إثارة من أي وقت مضى.",
        contentEn: `<h2>Riyadh's Culinary Renaissance</h2><p>The Saudi capital has undergone a remarkable transformation in its dining scene over the past few years. With Vision 2030 opening up new possibilities for entertainment and hospitality, world-class chefs and restaurateurs have flocked to Riyadh, creating a dining ecosystem that rivals Dubai, Paris, and New York.</p><h2>Where to Eat</h2><p>Nakheel Palace stands at the pinnacle of Riyadh's fine dining, offering an unparalleled blend of traditional Saudi hospitality and contemporary culinary artistry. The restaurant's sprawling complex, inspired by ancient Najdi palaces, sets the stage for an evening you'll never forget.</p><p>Najd Village offers a more traditional approach, with its village-style architecture and classic Saudi dishes prepared using centuries-old recipes. The lamb mansaf and saleeg rice remain some of the most beloved dishes in the city.</p><h2>The Riyadh Dining Experience</h2><p>What makes Riyadh dining unique is the seamless blend of authentic Saudi hospitality with global culinary excellence. Guests are treated to an experience that engages all senses — from the aromatic oud incense at entry, to the traditional Saudi coffee served between courses.</p>`,
        contentAr: `<h2>نهضة الطهي في الرياض</h2><p>شهدت العاصمة السعودية تحولاً ملحوظاً في مشهد الطعام خلال السنوات الأخيرة. مع رؤية 2030 التي فتحت إمكانيات جديدة للترفيه والضيافة، توافد الطهاة ورجال الأعمال العالميون إلى الرياض.</p>`,
        status: "published",
        isFeatured: true,
        readTimeMinutes: 8,
        tags: ["riyadh", "fine-dining", "saudi-cuisine", "restaurants"],
        publishedAt: new Date("2026-01-15"),
        coverImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
      },
      {
        authorId: sysUser.id,
        categoryId: blogCat1?.id,
        titleEn: "Best Seafood Restaurants in Jeddah — 2026 Edition",
        titleAr: "أفضل مطاعم المأكولات البحرية في جدة — نسخة 2026",
        slug: "jeddah-seafood-restaurants-2026",
        excerptEn: "Jeddah's coastal location makes it Saudi Arabia's seafood capital. Here are the top spots to enjoy the freshest catch from the Red Sea.",
        excerptAr: "موقع جدة الساحلي يجعلها عاصمة المأكولات البحرية في المملكة. إليك أفضل الأماكن للاستمتاع بأطازج صيد البحر الأحمر.",
        contentEn: `<h2>Jeddah by the Sea</h2><p>There's something magical about dining on fresh seafood while overlooking the Red Sea. Jeddah's Corniche, stretching for miles along the coast, is home to some of the finest seafood restaurants in the region.</p><h2>Top Picks</h2><p>Bahar Seafood leads our list with its commitment to freshness — fish delivered daily from local fishermen, prepared with both traditional Gulf techniques and contemporary flair. The hammour bil za'tar (grouper with thyme) is a must-order.</p>`,
        contentAr: `<h2>جدة على البحر</h2><p>هناك شيء سحري في تناول المأكولات البحرية الطازجة مع إطلالة على البحر الأحمر.</p>`,
        status: "published",
        isFeatured: true,
        readTimeMinutes: 6,
        tags: ["jeddah", "seafood", "red-sea", "restaurants"],
        publishedAt: new Date("2026-02-20"),
        coverImageUrl: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=1200&q=80",
      },
      {
        authorId: sysUser.id,
        categoryId: blogCat3?.id,
        titleEn: "The Rise of Healthy Dining in Saudi Arabia",
        titleAr: "صعود الطعام الصحي في المملكة العربية السعودية",
        slug: "healthy-dining-saudi-arabia-2026",
        excerptEn: "Health-conscious dining is no longer a niche concept in Saudi Arabia. Explore how the Kingdom's restaurant scene is embracing nutritious, delicious options.",
        excerptAr: "لم يعد الطعام الصحي مفهوماً متخصصاً في المملكة. اكتشف كيف يتبنى مشهد المطاعم خيارات مغذية ولذيذة.",
        contentEn: `<h2>A Health Revolution</h2><p>Saudi Arabia's younger generation is driving a significant shift in dining preferences. Gone are the days when a meal out meant only traditional heavy fare. Today's diners are seeking balanced, nutritious options that don't sacrifice flavor.</p>`,
        contentAr: `<h2>ثورة صحية</h2><p>الجيل السعودي الشاب يقود تحولاً كبيراً في تفضيلات الطعام.</p>`,
        status: "published",
        isFeatured: false,
        readTimeMinutes: 5,
        tags: ["healthy-eating", "wellness", "saudi-food-trends"],
        publishedAt: new Date("2026-03-10"),
        coverImageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80",
      },
    ]).onConflictDoNothing();
  }

  // ── 11. Offers ─────────────────────────────────────────────────────────────
  console.log("🎫 Seeding offers...");
  if (restaurants.length >= 3) {
    await db.insert(offersTable).values([
      {
        refCode: "TBQ-OFF-2026-000001",
        restaurantId: restaurants[0].id,
        titleEn: "Saudi Night Feast — 20% Off",
        titleAr: "وليمة الليل السعودية — خصم ٢٠٪",
        descriptionEn: "Enjoy 20% off the full menu every Thursday evening at Najd Village. Experience traditional Saudi cuisine in authentic surroundings.",
        descriptionAr: "استمتع بخصم ٢٠٪ على كامل القائمة كل مساء خميس في قرية نجد.",
        discountType: "percentage",
        discountValue: "20",
        currency: "SAR",
        minOrderValue: "150",
        validFrom: new Date("2026-01-01"),
        validUntil: new Date("2026-12-31"),
        isActive: true,
        isFeatured: true,
        approvalStatus: "approved",
        imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
        totalVouchersIssued: 0,
        voucherLimit: 500,
      },
      {
        refCode: "TBQ-OFF-2026-000002",
        restaurantId: restaurants[2].id,
        titleEn: "Sushi for Two — SAR 199",
        titleAr: "سوشي لاثنين — ١٩٩ ريال",
        descriptionEn: "Share the love with our romantic Sushi for Two set — 24 premium pieces including tuna, salmon, and prawn nigiri.",
        descriptionAr: "شارك الحب مع طقم سوشي لاثنين الرومانسي — ٢٤ قطعة فاخرة.",
        discountType: "fixed",
        discountValue: "50",
        currency: "SAR",
        minOrderValue: "0",
        validFrom: new Date("2026-01-01"),
        validUntil: new Date("2026-06-30"),
        isActive: true,
        isFeatured: true,
        approvalStatus: "approved",
        imageUrl: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80",
        totalVouchersIssued: 0,
        voucherLimit: 200,
      },
      {
        refCode: "TBQ-OFF-2026-000003",
        restaurantId: restaurants[6].id,
        titleEn: "Weekend Brunch — 15% Off",
        titleAr: "برانش نهاية الأسبوع — خصم ١٥٪",
        descriptionEn: "Treat yourself to our legendary weekend brunch at The Grill House with 15% off for groups of 4 or more.",
        descriptionAr: "دلّل نفسك ببرانش نهاية الأسبوع الأسطوري في جريل هاوس مع خصم ١٥٪ لمجموعات ٤ أو أكثر.",
        discountType: "percentage",
        discountValue: "15",
        currency: "SAR",
        minOrderValue: "300",
        validFrom: new Date("2026-01-01"),
        validUntil: new Date("2026-12-31"),
        isActive: true,
        isFeatured: false,
        approvalStatus: "approved",
        imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80",
        totalVouchersIssued: 0,
        voucherLimit: 300,
      },
    ]).onConflictDoNothing();
  }

  console.log("\n✅ Database seeded successfully!");
  console.log(`   • ${restaurants.length} restaurants`);
  console.log(`   • ${insertedCats.length} categories`);
  console.log(`   • ${insertedOccs.length} occasions`);
  console.log(`   • 3 blog posts`);
  console.log(`   • 3 offers`);

  await pool.end();
}

function getDishesForRestaurant(
  slug: string,
  menuId: number,
  starterSectionId?: number,
  mainSectionId?: number,
  dessertSectionId?: number,
): any[] {
  const common = { currency: "SAR", isAvailable: true, isHalal: true };

  const bySlug: Record<string, any[]> = {
    "najd-village": [
      { menuId, menuSectionId: starterSectionId, nameEn: "Jareesh", nameAr: "جريش", descriptionEn: "Traditional crushed wheat cooked with lamb and spices", descriptionAr: "قمح مطحون تقليدي مطهو مع لحم الضأن والبهارات", price: "45.00", imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80", isTabaqStar: true, isBestseller: true, popularityScore: "95" },
      { menuId, menuSectionId: starterSectionId, nameEn: "Murtabak", nameAr: "مرطبك", descriptionEn: "Stuffed pancake with egg, lamb, and onion", descriptionAr: "فطيرة محشوة بالبيض واللحم والبصل", price: "38.00", imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80" },
      { menuId, menuSectionId: mainSectionId, nameEn: "Lamb Mansaf", nameAr: "منسف لحم ضأن", descriptionEn: "Jordan's national dish — tender lamb in fermented dried yogurt sauce over fragrant rice", descriptionAr: "الطبق الوطني الأردني — لحم ضأن طري في صلصة اللبن المجفف مع الأرز العطر", price: "185.00", imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80", isTabaqStar: true, isMostOrdered: true, popularityScore: "98" },
      { menuId, menuSectionId: mainSectionId, nameEn: "Saleeg Rice with Chicken", nameAr: "أرز سليق بالدجاج", descriptionEn: "Creamy milk-cooked rice topped with roasted chicken and served with bone broth", descriptionAr: "أرز كريمي مطهو بالحليب مع دجاج مشوي ومرق العظام", price: "95.00", imageUrl: "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=500&q=80", isBestseller: true },
      { menuId, menuSectionId: dessertSectionId, nameEn: "Harees", nameAr: "هريس", descriptionEn: "Slow-cooked wheat and lamb dessert, a Ramadan classic", descriptionAr: "هريسة القمح واللحم المطهو ببطء، كلاسيكية رمضانية", price: "28.00" },
    ],
    "sushi-hana": [
      { menuId, menuSectionId: starterSectionId, nameEn: "Edamame", nameAr: "أدامامي", descriptionEn: "Steamed young soybeans with sea salt", descriptionAr: "فول الصويا المسلوق بملح البحر", price: "22.00" },
      { menuId, menuSectionId: starterSectionId, nameEn: "Miso Soup", nameAr: "شوربة ميسو", descriptionEn: "Traditional Japanese miso broth with tofu and wakame", descriptionAr: "حساء الميسو الياباني التقليدي مع التوفو والواكامي", price: "18.00" },
      { menuId, menuSectionId: mainSectionId, nameEn: "Salmon Nigiri (6 pcs)", nameAr: "نيجيري سلمون (٦ قطع)", descriptionEn: "Premium Atlantic salmon over hand-pressed sushi rice", descriptionAr: "سلمون أطلنطي فاخر على أرز السوشي المضغوط يدوياً", price: "85.00", isTabaqStar: true, isBestseller: true, popularityScore: "96" },
      { menuId, menuSectionId: mainSectionId, nameEn: "Dragon Roll", nameAr: "درغون رول", descriptionEn: "Shrimp tempura inside, avocado and eel sauce on top", descriptionAr: "جمبري تمبورا من الداخل، أفوكادو وصلصة الإيل من الأعلى", price: "72.00", isBestseller: true },
      { menuId, menuSectionId: mainSectionId, nameEn: "Wagyu Teppanyaki", nameAr: "واغيو تيبانياكي", descriptionEn: "A5 Wagyu beef cooked tableside on the iron griddle", descriptionAr: "لحم واغيو A5 مطهو على الطاولة على الشواية الحديدية", price: "380.00", isTabaqStar: true, isChefChoice: true },
      { menuId, menuSectionId: dessertSectionId, nameEn: "Mochi Ice Cream", nameAr: "موشي آيس كريم", descriptionEn: "Japanese rice cake filled with premium matcha ice cream", descriptionAr: "كعكة الأرز اليابانية محشوة بآيس كريم الماتشا الفاخر", price: "32.00" },
    ],
    "the-grill-house": [
      { menuId, menuSectionId: starterSectionId, nameEn: "Burrata Salad", nameAr: "سلطة بوراتا", descriptionEn: "Fresh burrata with heritage tomatoes, basil oil, and balsamic reduction", descriptionAr: "بوراتا طازجة مع طماطم موروثة وزيت الريحان والخل البلسمي", price: "68.00" },
      { menuId, menuSectionId: mainSectionId, nameEn: "USDA Prime Ribeye 400g", nameAr: "ريب آي USDA برايم ٤٠٠ جرام", descriptionEn: "Prime USDA ribeye, dry-aged 35 days, cooked to your preferred temperature", descriptionAr: "ريب آي USDA برايم، ناضج جافاً ٣٥ يوماً، مطهو حسب تفضيلك", price: "420.00", isTabaqStar: true, isBestseller: true, popularityScore: "99" },
      { menuId, menuSectionId: mainSectionId, nameEn: "Wagyu Tomahawk", nameAr: "واغيو توماهوك", descriptionEn: "Show-stopping Japanese Wagyu tomahawk for two, served tableside", descriptionAr: "واغيو ياباني توماهوك رائع لشخصين، يُقدّم على الطاولة", price: "890.00", isTabaqStar: true, isChefChoice: true },
      { menuId, menuSectionId: mainSectionId, nameEn: "Surf & Turf", nameAr: "ستيك وجمبري", descriptionEn: "USDA Prime tenderloin with grilled tiger prawns and truffle butter", descriptionAر: "فيليه USDA برايم مع جمبري نمري مشوي وزبدة الكمأة", price: "380.00" },
      { menuId, menuSectionId: dessertSectionId, nameEn: "Molten Chocolate", nameAr: "صلصة الشوكولاتة", descriptionEn: "Warm Belgian chocolate fondant with vanilla bean ice cream", descriptionAr: "فوندان بلجيكي دافئ مع آيس كريم الفانيلا", price: "58.00" },
    ],
    "cafe-bateel": [
      { menuId, menuSectionId: starterSectionId, nameEn: "Organic Date Platter", nameAr: "طبق التمور العضوية", descriptionEn: "A curated selection of premium organic Medjool, Sukkari, and Ajwa dates", descriptionAر: "تشكيلة مختارة من تمور المجدول والسكري والعجوة العضوية الفاخرة", price: "85.00", isTabaqStar: true, isBestseller: true },
      { menuId, menuSectionId: starterSectionId, nameEn: "Avocado Toast", nameAر: "توست الأفوكادو", descriptionEn: "Sourdough toast with smashed avocado, poached egg, and dukkah", descriptionAر: "توست عجين المعجون مع أفوكادو مهروس وبيض مسلوق ودقة", price: "62.00" },
      { menuId, menuSectionId: mainSectionId, nameEn: "Signature Bateel Latte", nameAر: "لاتيه باتيل المميز", descriptionEn: "Artisan single-origin espresso with velvety steamed milk and date syrup", descriptionAر: "إسبريسو حرفي أحادي الأصل مع حليب مبخر مخملي وشراب التمر", price: "32.00", isBestseller: true },
      { menuId, menuSectionId: dessertSectionId, nameEn: "Date & Walnut Cake", nameAر: "كيكة التمر والجوز", descriptionEn: "Moist date and walnut sponge with caramel date glaze", descriptionAر: "إسفنجة التمر والجوز الرطبة مع تزجيج التمر الكراميلي", price: "45.00", isTabaqStar: true },
    ],
    "green-bowl": [
      { menuId, menuSectionId: mainSectionId, nameEn: "Power Bowl", nameAر: "باور بول", descriptionEn: "Quinoa, roasted sweet potato, chickpeas, tahini, and fresh herbs", descriptionAر: "كينوا وبطاطا حلوة محمصة وحمص وطحينة وأعشاب طازجة", price: "68.00", isHealthy: true, isVegetarian: true, isBestseller: true },
      { menuId, menuSectionId: mainSectionId, nameEn: "Grilled Chicken Salad", nameAر: "سلطة الدجاج المشوي", descriptionEn: "Char-grilled chicken breast on mixed greens with lemon vinaigrette", descriptionAر: "صدر دجاج مشوي على خضار مشكلة مع صلصة الليمون", price: "72.00", isHealthy: true },
      { menuId, menuSectionId: mainSectionId, nameEn: "Açaí Bowl", nameAر: "آساي بول", descriptionEn: "Organic açaí blend topped with granola, banana, and mixed berries", descriptionAر: "مزيج آساي عضوي مع جرانولا وموز وتوت مشكل", price: "58.00", isVegetarian: true, isVegan: true },
      { menuId, menuSectionId: mainSectionId, nameEn: "Green Detox Juice", nameAر: "عصير ديتوكس أخضر", descriptionEn: "Cold-pressed kale, cucumber, celery, green apple, and ginger", descriptionAر: "كيل وخيار وكرفس وتفاح أخضر وزنجبيل معصور بارداً", price: "35.00", isHealthy: true, isVegan: true },
    ],
  };

  const dishes = bySlug[slug] ?? [
    { menuId, menuSectionId: starterSectionId, nameEn: "Chef's Starter", nameAر: "مقبلة الشيف", descriptionEn: "Daily selection by our head chef", descriptionAر: "اختيار يومي من الشيف الرئيسي", price: "45.00" },
    { menuId, menuSectionId: mainSectionId, nameEn: "Chef's Special", nameAر: "خاص الشيف", descriptionEn: "Our signature main course, prepared fresh daily", descriptionAر: "طبقنا الرئيسي المميز، يُحضّر طازجاً يومياً", price: "120.00", isBestseller: true },
    { menuId, menuSectionId: dessertSectionId, nameEn: "Dessert of the Day", nameAر: "حلوى اليوم", descriptionEn: "Ask your server for today's selection", descriptionAر: "اسأل النادل عن اختيار اليوم", price: "35.00" },
  ];

  return dishes.map(d => ({ ...common, popularityScore: d.popularityScore ?? "50", ...d }));
}

seed().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
