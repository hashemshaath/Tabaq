import { db } from "@workspace/db";
import {
  usersTable,
  offersTable,
  reviewsTable,
  bookingsTable,
  contractsTable,
  transactionsTable,
  invoicesTable,
  adminMessagesTable,
  restaurantsTable,
  dishesTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const now = new Date();
const day = (n: number) => { const d = new Date(now); d.setDate(d.getDate() + n); return d; };
const past = (n: number) => day(-n);

async function main() {
  console.log("🌱 Seeding comprehensive data...\n");

  // ─── 0. Ensure admin user exists and has isAdmin flag ─────────────
  console.log("👤 Setting up admin user...");
  const [existingAdmin] = await db.select({ id: usersTable.id, isAdmin: usersTable.isAdmin })
    .from(usersTable).where(eq(usersTable.id, 1));
  if (existingAdmin) {
    if (!existingAdmin.isAdmin) {
      await db.update(usersTable).set({ isAdmin: true, isOwner: true, updatedAt: new Date() }).where(eq(usersTable.id, 1));
      console.log("  ✅ User #1 promoted to admin + owner");
    } else {
      console.log("  ⏭️  User #1 already admin");
    }
  } else {
    const [created] = await db.insert(usersTable).values({
      phone: "+966500000001",
      nameEn: "Admin User",
      nameAr: "المشرف",
      isAdmin: true,
      isOwner: true,
      isVerified: true,
      level: 10,
      levelTitle: "Culinary Legend",
      preferredLanguage: "en",
    }).returning({ id: usersTable.id });
    console.log(`  ✅ Admin user created with id ${created.id}`);
  }

  // ─── 0b. Mark some dishes as Tabaq Stars ──────────────────────────
  console.log("\n⭐ Marking Tabaq Star dishes...");
  const tabaqStarIds = [1, 3, 5, 8, 12, 15];
  for (const dishId of tabaqStarIds) {
    const [existing] = await db.select({ id: dishesTable.id }).from(dishesTable).where(eq(dishesTable.id, dishId));
    if (existing) {
      await db.update(dishesTable).set({ isTabaqStar: true, avgRating: "4.8", reviewCount: 45 }).where(eq(dishesTable.id, dishId));
      console.log(`  ✅ Dish #${dishId} marked as Tabaq Star`);
    }
  }

  // ─── 1. Seed approved active offers ───────────────────────────────────
  console.log("📦 Creating offers...");
  const offerData = [
    {
      restaurantId: 1, titleEn: "50% Off 4-Course Set Menu for Two", titleAr: "خصم 50% على قائمة الطعام المكونة من 4 أطباق لشخصين",
      descriptionEn: "Indulge in a magnificent 4-course set menu for two at Najd Village — Saudi Arabia's most celebrated traditional dining. Includes welcome mezze, signature mains, dessert platter, and soft drinks.",
      descriptionAr: "استمتع بقائمة طعام رائعة مكونة من 4 أطباق لشخصين في قرية نجد — أشهر تجربة مطاعم تقليدية في المملكة. تشمل مقبلات الترحيب والأطباق الرئيسية المميزة وطبق الحلوى والمشروبات.",
      imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop",
      originalPrice: "380", discountPercent: "50", discountedPrice: "190", currency: "SAR",
      validFrom: past(1), validUntil: day(60), totalCapacity: 80, remainingCapacity: 62,
      isActive: true, approvalStatus: "approved" as const,
    },
    {
      restaurantId: 3, titleEn: "40% Off Omakase Dinner Experience", titleAr: "خصم 40% على تجربة عشاء أوماكاسي",
      descriptionEn: "Experience the finest Japanese Omakase at Sushi Sama. Chef Kenji curates 12 seasonal courses using freshest daily-imported fish. Includes sake amuse-bouche, 3 nigiri courses, signature roll, and seasonal dessert.",
      descriptionAr: "اختبر أرقى أوماكاسي ياباني في سوشي ساما. يختار الشيف كنجي 12 طبقاً موسمياً يومياً من أطازج الأسماك المستوردة. يشمل مقبلات الساكي و3 دورات نيغيري ورول مميز وحلوى.",
      imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900&h=600&fit=crop",
      originalPrice: "650", discountPercent: "40", discountedPrice: "390", currency: "SAR",
      validFrom: past(1), validUntil: day(45), totalCapacity: 30, remainingCapacity: 18,
      isActive: true, approvalStatus: "approved" as const,
    },
    {
      restaurantId: 4, titleEn: "35% Off Mediterranean Tasting Menu", titleAr: "خصم 35% على قائمة التذوق المتوسطية",
      descriptionEn: "Lusin's celebrated 7-dish tasting menu takes you on a culinary journey across the Mediterranean coast. Each dish is paired with a recommended non-alcoholic beverage by our sommelier.",
      descriptionAr: "تأخذك قائمة التذوق المشهورة في لوسين المكونة من 7 أطباق في رحلة طهي عبر الساحل المتوسطي. يتم إقران كل طبق بمشروب لا كحولي موصى به من خبير المشروبات.",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=900&h=600&fit=crop",
      originalPrice: "420", discountPercent: "35", discountedPrice: "273", currency: "SAR",
      validFrom: past(1), validUntil: day(30), totalCapacity: 60, remainingCapacity: 44,
      isActive: true, approvalStatus: "approved" as const,
    },
    {
      restaurantId: 7, titleEn: "30% Off Nobu Signature Lunch", titleAr: "خصم 30% على غداء نوبو المميز",
      descriptionEn: "Discover Nobu's world-famous Japanese-Peruvian fusion at a special weekend lunch price. Includes black cod miso, yellowtail sashimi jalapeño, signature rock shrimp tempura, and dessert.",
      descriptionAr: "اكتشف مزيج نوبو الياباني البيروفي الأشهر عالمياً بسعر غداء خاص في نهاية الأسبوع. يشمل القد الأسود بالميزو وسمك الذيل الأصفر والجمبري المقرمش والحلوى.",
      imageUrl: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=900&h=600&fit=crop",
      originalPrice: "490", discountPercent: "30", discountedPrice: "343", currency: "SAR",
      validFrom: past(1), validUntil: day(21), totalCapacity: 40, remainingCapacity: 27,
      isActive: true, approvalStatus: "approved" as const,
    },
    {
      restaurantId: 5, titleEn: "45% Off Spice Route Feast for Four", titleAr: "خصم 45% على وليمة طريق التوابل لأربعة أشخاص",
      descriptionEn: "Bring the family for an authentic North Indian feast — curries, breads, rice dishes, and desserts served family-style. Perfect for celebrations and gatherings.",
      descriptionAr: "اصطحب عائلتك لوليمة هندية شمالية أصيلة — كاري وخبز وأطباق أرز وحلويات تُقدَّم بأسلوب عائلي. مثالية للاحتفالات والتجمعات.",
      imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=900&h=600&fit=crop",
      originalPrice: "560", discountPercent: "45", discountedPrice: "308", currency: "SAR",
      validFrom: past(1), validUntil: day(90), totalCapacity: 100, remainingCapacity: 71,
      isActive: true, approvalStatus: "approved" as const,
    },
    {
      restaurantId: 2, titleEn: "25% Off Levantine Brunch for Two", titleAr: "خصم 25% على برنش شامي لشخصين",
      descriptionEn: "Start your weekend right with Reem Al Bawadi's legendary Levantine brunch. A generous mezze spread followed by your choice of mains — fattoush, hummus, falafel, grilled meats and freshly baked bread.",
      descriptionAr: "ابدأ عطلتك مع برنش ريم البوادي الشامي الأسطوري. مجموعة كريمة من المقبلات تليها وجبتك المختارة — فتوش، حمص، فلافل، لحوم مشوية وخبز طازج.",
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&h=600&fit=crop",
      originalPrice: "310", discountPercent: "25", discountedPrice: "233", currency: "SAR",
      validFrom: past(1), validUntil: day(75), totalCapacity: 120, remainingCapacity: 94,
      isActive: true, approvalStatus: "approved" as const,
    },
  ];

  for (const od of offerData) {
    const existing = await db.select({ id: offersTable.id }).from(offersTable)
      .where(and(eq(offersTable.titleEn, od.titleEn), eq(offersTable.restaurantId, od.restaurantId)));
    if (existing.length) { console.log(`  ⏭️  Offer already exists: ${od.titleEn}`); continue; }
    const [o] = await db.insert(offersTable).values(od).returning({ id: offersTable.id });
    const refCode = `TBQ-OFR-2026-${String(o.id).padStart(6, "0")}`;
    await db.update(offersTable).set({ refCode }).where(eq(offersTable.id, o.id));
    console.log(`  ✅ Offer: ${od.titleEn} → ${refCode}`);
  }

  // ─── 2. Seed reviews ──────────────────────────────────────────────────
  console.log("\n💬 Creating reviews...");
  const reviewData = [
    { userId: 1, restaurantId: 1, ratingOverall: "4.9", ratingFood: "5.0", ratingService: "4.8", ratingAmbiance: "5.0", ratingValue: "4.7", textEn: "Absolutely extraordinary! The lamb mansaf was cooked to perfection — falling off the bone with that beautiful saffron-infused broth. The traditional Najdi décor is stunning. Service was impeccable.", textAr: "رائع تماماً! كان المنسف مطهواً على أكمل وجه. الديكور النجدي التقليدي رائع والخدمة كانت لا تشوبها شائبة.", visitDate: "2026-03-15", likeCount: 24 },
    { userId: 1, restaurantId: 1, ratingOverall: "4.7", ratingFood: "4.8", ratingService: "4.9", ratingAmbiance: "4.5", ratingValue: "4.4", textEn: "One of the best Saudi dining experiences in Riyadh. The mutabbaq and slow-roasted whole lamb were highlights. Staff was knowledgeable and extremely accommodating.", textAr: "واحدة من أفضل تجارب الأكل السعودي في الرياض. المطبق والخروف المشوي ببطء كانا من أبرز الأطباق.", visitDate: "2026-03-10", likeCount: 17 },
    { userId: 1, restaurantId: 1, ratingOverall: "5.0", ratingFood: "5.0", ratingService: "5.0", ratingAmbiance: "5.0", ratingValue: "4.9", textEn: "If you visit Riyadh, this is non-negotiable. The harees and jareesh were authentic like nothing outside a Saudi home kitchen. The private majlis room for family dinner is absolutely worth it.", textAr: "إذا زرت الرياض، هذا غير قابل للتفاوض. الهريس والجريش أصيلان كما في المطبخ المنزلي السعودي.", visitDate: "2026-02-28", likeCount: 31 },
    { userId: 1, restaurantId: 2, ratingOverall: "4.6", ratingFood: "4.7", ratingService: "4.5", ratingAmbiance: "4.6", ratingValue: "4.8", textEn: "The hummus here is in a league of its own — creamy, perfectly seasoned with a generous drizzle of olive oil. The mixed grill was generous and well-marinated. Great value.", textAr: "الحمص هنا في مستوى آخر — كريمي ومتبل بشكل مثالي مع رذاذ سخي من زيت الزيتون. قيمة ممتازة.", visitDate: "2026-03-20", likeCount: 12 },
    { userId: 1, restaurantId: 2, ratingOverall: "4.4", ratingFood: "4.5", ratingService: "4.3", ratingAmbiance: "4.4", ratingValue: "4.6", textEn: "A solid Levantine restaurant. The fattoush was fresh and crispy, the shawarma excellent. Portions are very generous. Will return for the weekend brunch.", textAr: "مطعم شامي ممتاز. الفتوش طازج ومقرمش والشاورما رائعة. الحصص وافرة جداً.", visitDate: "2026-03-12", likeCount: 8 },
    { userId: 1, restaurantId: 3, ratingOverall: "4.9", ratingFood: "5.0", ratingService: "4.9", ratingAmbiance: "4.8", ratingValue: "4.7", textEn: "The omakase experience here is world-class. Chef Kenji sources his fish directly from Tsukiji market twice a week. Each course was a revelation — the tuna trio and wagyu hand roll were extraordinary.", textAr: "تجربة الأوماكاسي هنا ذات مستوى عالمي. يستورد الشيف كنجي سمكه مباشرة من سوق تسوكيجي مرتين أسبوعياً.", visitDate: "2026-03-22", likeCount: 29 },
    { userId: 1, restaurantId: 3, ratingOverall: "4.8", ratingFood: "4.9", ratingService: "4.7", ratingAmbiance: "5.0", ratingValue: "4.6", textEn: "Absolutely love the intimate counter seating — you can watch every course being prepared in front of you. The seasonal uni and otoro were melt-in-your-mouth perfection.", textAr: "أحب الجلوس على الكاونتر الحميمي — يمكنك مشاهدة تحضير كل طبق أمامك. القنفذ البحري والتونة الدهنية تذوب في الفم.", visitDate: "2026-03-08", likeCount: 21 },
    { userId: 1, restaurantId: 4, ratingOverall: "4.7", ratingFood: "4.8", ratingService: "4.7", ratingAmbiance: "4.9", ratingValue: "4.5", textEn: "Lusin set a new standard for Mediterranean fine dining for me. The beet salad with labneh was stunning, and the sea bass was cooked to absolute perfection.", textAr: "وضعت لوسين معياراً جديداً للمطبخ المتوسطي الفاخر. سلطة البنجر مع اللبنة رائعة وسمك القاروص مطهو على أكمل وجه.", visitDate: "2026-03-18", likeCount: 15 },
    { userId: 1, restaurantId: 4, ratingOverall: "4.6", ratingFood: "4.7", ratingService: "4.8", ratingAmbiance: "4.6", ratingValue: "4.4", textEn: "Came for a business dinner and Lusin exceeded all expectations. The tasting menu was well-paced. The chocolate fondant dessert was the perfect ending.", textAr: "جئت لعشاء عمل وفاقت لوسين كل التوقعات. قائمة التذوق كانت بوتيرة جيدة.", visitDate: "2026-02-20", likeCount: 11 },
    { userId: 1, restaurantId: 5, ratingOverall: "4.6", ratingFood: "4.8", ratingService: "4.4", ratingAmbiance: "4.5", ratingValue: "4.9", textEn: "Exceptional Indian food in Jeddah! The butter chicken was rich and complex, and the garlic naan freshly made and pillowy. Great value especially for groups.", textAr: "طعام هندي استثنائي في جدة! دجاج الزبدة غني ومعقد والخبز بالثوم طازج وطري.", visitDate: "2026-03-25", likeCount: 19 },
    { userId: 1, restaurantId: 5, ratingOverall: "4.5", ratingFood: "4.6", ratingService: "4.4", ratingAmbiance: "4.3", ratingValue: "4.8", textEn: "The Dal Makhani here is made fresh daily — thick, creamy and perfectly smoky from slow-cooking in a clay pot overnight. The lamb rogan josh was tender and deeply flavored.", textAr: "دال ماخاني يُحضَّر طازجاً يومياً — كثيف وكريمي وذو نكهة دخانية مثالية.", visitDate: "2026-03-05", likeCount: 9 },
    { userId: 1, restaurantId: 6, ratingOverall: "4.4", ratingFood: "4.5", ratingService: "4.3", ratingAmbiance: "4.2", ratingValue: "5.0", textEn: "Best grilled chicken in Dammam, period. The charcoal flavor is authentic and portion sizes are enormous. The garlic sauce alone is worth the trip.", textAr: "أفضل دجاج مشوي في الدمام. نكهة الفحم أصيلة وأحجام الحصص ضخمة. صلصة الثوم وحدها تستحق الزيارة.", visitDate: "2026-03-17", likeCount: 7 },
    { userId: 1, restaurantId: 6, ratingOverall: "4.3", ratingFood: "4.4", ratingService: "4.2", ratingAmbiance: "4.1", ratingValue: "4.9", textEn: "Consistent quality every single time. The quarter chicken combo with rice and salad is unbeatable value. Fast service even during peak hours. A Dammam institution.", textAr: "جودة متسقة في كل مرة. مجموعة ربع الدجاج مع الأرز والسلطة لا تُبارى من حيث القيمة.", visitDate: "2026-03-01", likeCount: 5 },
    { userId: 1, restaurantId: 7, ratingOverall: "4.9", ratingFood: "5.0", ratingService: "4.9", ratingAmbiance: "5.0", ratingValue: "4.6", textEn: "The black cod miso is legendary for a reason — silky, perfectly lacquered, dissolving on the tongue. The yellowtail jalapeño starter set the perfect tone. One of the best dining experiences in Saudi Arabia.", textAr: "القد الأسود بالميزو أسطوري — حريري ومطلي بشكل مثالي ويذوب على اللسان. من أفضل التجارب في المملكة.", visitDate: "2026-03-23", likeCount: 33 },
    { userId: 1, restaurantId: 7, ratingOverall: "4.8", ratingFood: "4.9", ratingService: "4.7", ratingAmbiance: "4.9", ratingValue: "4.5", textEn: "Nobu Riyadh never disappoints. The signature bento box for lunch is a masterclass in balance. The interior design is sleek and romantic.", textAr: "نوبو الرياض لا يخيب الظن أبداً. صندوق الغداء المميز درس في التوازن. التصميم الداخلي أنيق ورومانسي.", visitDate: "2026-02-14", likeCount: 28 },
    { userId: 1, restaurantId: 8, ratingOverall: "4.4", ratingFood: "4.5", ratingService: "4.4", ratingAmbiance: "4.3", ratingValue: "4.8", textEn: "The karak tea here is addictive — spiced perfectly and incredibly smooth. The fresh regag bread paired with labneh and honey is a simple but divine breakfast combo.", textAr: "شاي الكرك هنا إدماني — متبل بشكل مثالي وناعم. خبز الرقاق الطازج مع اللبنة والعسل بسيط لكنه رائع.", visitDate: "2026-03-24", likeCount: 14 },
    { userId: 1, restaurantId: 8, ratingOverall: "4.5", ratingFood: "4.6", ratingService: "4.4", ratingAmbiance: "4.4", ratingValue: "4.9", textEn: "A proper hidden gem! The bateel dates with karak is a combo made in heaven. Staff are warm and welcoming. Great spot for an afternoon break.", textAr: "جوهرة مخفية حقيقية! تمر البطيل مع الكرك توليفة رائعة. موظفون دافئون ومرحبون.", visitDate: "2026-03-19", likeCount: 11 },
  ];

  for (const review of reviewData) {
    const exists = await db.select({ id: reviewsTable.id }).from(reviewsTable)
      .where(and(eq(reviewsTable.restaurantId, review.restaurantId), eq(reviewsTable.userId, review.userId)));
    if (exists.length >= 2) { continue; }
    await db.insert(reviewsTable).values(review);
    console.log(`  ✅ Review for restaurant ${review.restaurantId}`);
  }

  // Update restaurant avgRating and reviewCount from seeded reviews
  for (const rId of [1,2,3,4,5,6,7,8]) {
    const allRevs = await db.select({ rating: reviewsTable.ratingOverall })
      .from(reviewsTable).where(eq(reviewsTable.restaurantId, rId));
    if (!allRevs.length) continue;
    const avg = allRevs.reduce((s, r) => s + parseFloat(r.rating as string), 0) / allRevs.length;
    await db.update(restaurantsTable)
      .set({ avgRating: avg.toFixed(2) as any, reviewCount: allRevs.length })
      .where(eq(restaurantsTable.id, rId));
  }
  console.log("  ✅ Restaurant ratings updated from real reviews");

  // ─── 3. Seed bookings ─────────────────────────────────────────────────
  console.log("\n📅 Creating bookings...");
  const bookingData = [
    { userId: 1, restaurantId: 1, date: "2026-04-05", time: "19:30", partySize: 4, status: "confirmed" as const, specialRequests: "Window table please, celebrating anniversary", referenceCode: "TBQ-BKG-2026-00001" },
    { userId: 1, restaurantId: 3, date: "2026-04-12", time: "20:00", partySize: 2, status: "confirmed" as const, specialRequests: "Omakase counter seats preferred", referenceCode: "TBQ-BKG-2026-00002" },
    { userId: 1, restaurantId: 7, date: "2026-04-18", time: "21:00", partySize: 6, status: "pending" as const, specialRequests: "Business dinner, private room needed", referenceCode: "TBQ-BKG-2026-00003" },
    { userId: 1, restaurantId: 2, date: "2026-03-22", time: "13:00", partySize: 3, status: "completed" as const, specialRequests: null, referenceCode: "TBQ-BKG-2026-00004" },
    { userId: 1, restaurantId: 4, date: "2026-03-15", time: "19:00", partySize: 2, status: "completed" as const, specialRequests: "Vegetarian options please", referenceCode: "TBQ-BKG-2026-00005" },
    { userId: 1, restaurantId: 1, date: "2026-03-01", time: "20:30", partySize: 8, status: "completed" as const, specialRequests: "Birthday celebration — please arrange a small cake", referenceCode: "TBQ-BKG-2026-00006" },
    { userId: 1, restaurantId: 5, date: "2026-02-28", time: "13:30", partySize: 5, status: "completed" as const, specialRequests: null, referenceCode: "TBQ-BKG-2026-00007" },
    { userId: 1, restaurantId: 8, date: "2026-02-14", time: "10:00", partySize: 2, status: "cancelled" as const, specialRequests: null, referenceCode: "TBQ-BKG-2026-00008" },
    { userId: 1, restaurantId: 7, date: "2026-05-10", time: "20:00", partySize: 4, status: "confirmed" as const, specialRequests: "Tasting menu for all guests", referenceCode: "TBQ-BKG-2026-00009" },
    { userId: 1, restaurantId: 6, date: "2026-04-20", time: "13:00", partySize: 6, status: "pending" as const, specialRequests: "Family lunch, need high chairs x2", referenceCode: "TBQ-BKG-2026-00010" },
  ];
  for (const booking of bookingData) {
    const exists = await db.select({ id: bookingsTable.id })
      .from(bookingsTable).where(eq(bookingsTable.referenceCode, booking.referenceCode));
    if (exists.length) { console.log(`  ⏭️  Booking ${booking.referenceCode} already exists`); continue; }
    await db.insert(bookingsTable).values(booking);
    console.log(`  ✅ Booking ${booking.referenceCode}: ${booking.status} at restaurant ${booking.restaurantId}`);
  }

  // ─── 4. Seed contracts ────────────────────────────────────────────────
  console.log("\n📝 Creating contracts...");
  const contractData = [
    { refCode: "TBQ-CTR-2026-000001", restaurantId: 1, status: "active" as const, paymentModel: "full_collection" as const, commissionPercent: "12.00", settlementDays: 7, validFrom: new Date("2026-01-01"), validUntil: new Date("2026-12-31"), notes: "Premium partnership — Najd Village flagship contract", approvedById: 1, approvedAt: new Date("2026-01-01") },
    { refCode: "TBQ-CTR-2026-000002", restaurantId: 2, status: "active" as const, paymentModel: "partial_collection" as const, commissionPercent: "15.00", partialCollectionPercent: "30.00", settlementDays: 14, validFrom: new Date("2026-02-01"), validUntil: new Date("2026-12-31"), notes: "Reem Al Bawadi — standard partnership", approvedById: 1, approvedAt: new Date("2026-02-01") },
    { refCode: "TBQ-CTR-2026-000003", restaurantId: 3, status: "active" as const, paymentModel: "full_collection" as const, commissionPercent: "10.00", settlementDays: 7, validFrom: new Date("2026-01-15"), validUntil: new Date("2026-12-31"), notes: "Sushi Sama — premium fine dining rate", approvedById: 1, approvedAt: new Date("2026-01-15") },
    { refCode: "TBQ-CTR-2026-000004", restaurantId: 7, status: "active" as const, paymentModel: "direct_payment" as const, commissionPercent: "8.00", settlementDays: 30, validFrom: new Date("2026-03-01"), validUntil: new Date("2027-02-28"), notes: "Nobu Riyadh — luxury tier, low commission, direct payment", approvedById: 1, approvedAt: new Date("2026-03-01") },
    { refCode: "TBQ-CTR-2026-000005", restaurantId: 4, status: "active" as const, paymentModel: "full_collection" as const, commissionPercent: "13.50", settlementDays: 7, validFrom: new Date("2026-02-15"), validUntil: new Date("2026-12-31"), notes: "Lusin Mediterranean — standard rate", approvedById: 1, approvedAt: new Date("2026-02-15") },
    { refCode: "TBQ-CTR-2026-000006", restaurantId: 5, status: "draft" as const, paymentModel: "partial_collection" as const, commissionPercent: "18.00", partialCollectionPercent: "40.00", settlementDays: 21, notes: "Spice Route Jeddah — awaiting owner signature" },
  ];
  for (const contract of contractData) {
    const exists = await db.select({ id: contractsTable.id })
      .from(contractsTable).where(eq(contractsTable.refCode, contract.refCode));
    if (exists.length) { console.log(`  ⏭️  Contract ${contract.refCode} already exists`); continue; }
    await db.insert(contractsTable).values(contract);
    console.log(`  ✅ Contract ${contract.refCode} for restaurant ${contract.restaurantId}`);
  }

  // ─── 5. Seed transactions ─────────────────────────────────────────────
  console.log("\n💳 Creating transactions...");
  const txData = [
    { refCode: "TBQ-TXN-2026-000001", restaurantId: 1, userId: 1, type: "voucher_sale" as const, status: "completed" as const, grossAmount: "190.00", commissionPercent: "12.00", commissionAmount: "22.80", netAmount: "167.20", currency: "SAR", notes: "Voucher sale — 50% Off 4-Course Set Menu" },
    { refCode: "TBQ-TXN-2026-000002", restaurantId: 3, userId: 1, type: "voucher_sale" as const, status: "completed" as const, grossAmount: "390.00", commissionPercent: "10.00", commissionAmount: "39.00", netAmount: "351.00", currency: "SAR", notes: "Voucher sale — 40% Off Omakase Dinner" },
    { refCode: "TBQ-TXN-2026-000003", restaurantId: 1, userId: 1, type: "voucher_sale" as const, status: "completed" as const, grossAmount: "190.00", commissionPercent: "12.00", commissionAmount: "22.80", netAmount: "167.20", currency: "SAR", notes: "Voucher sale — 50% Off Set Menu #2" },
    { refCode: "TBQ-TXN-2026-000004", restaurantId: 7, userId: 1, type: "voucher_sale" as const, status: "pending" as const, grossAmount: "343.00", commissionPercent: "8.00", commissionAmount: "27.44", netAmount: "315.56", currency: "SAR", notes: "Voucher sale — 30% Off Nobu Lunch" },
    { refCode: "TBQ-TXN-2026-000005", restaurantId: 4, userId: 1, type: "voucher_sale" as const, status: "completed" as const, grossAmount: "273.00", commissionPercent: "13.50", commissionAmount: "36.86", netAmount: "236.15", currency: "SAR", notes: "Voucher sale — 35% Off Mediterranean Menu" },
    { refCode: "TBQ-TXN-2026-000006", restaurantId: 2, userId: 1, type: "voucher_sale" as const, status: "completed" as const, grossAmount: "233.00", commissionPercent: "15.00", commissionAmount: "34.95", netAmount: "198.05", currency: "SAR", notes: "Voucher sale — 25% Off Levantine Brunch" },
    { refCode: "TBQ-TXN-2026-000007", restaurantId: 1, userId: 1, type: "voucher_refund" as const, status: "completed" as const, grossAmount: "-190.00", commissionPercent: "12.00", commissionAmount: "-22.80", netAmount: "-167.20", currency: "SAR", notes: "Voucher refund — customer request" },
    { refCode: "TBQ-TXN-2026-000008", restaurantId: 3, userId: 1, type: "voucher_sale" as const, status: "completed" as const, grossAmount: "390.00", commissionPercent: "10.00", commissionAmount: "39.00", netAmount: "351.00", currency: "SAR", notes: "Voucher sale — Omakase #2" },
  ];
  for (const tx of txData) {
    const exists = await db.select({ id: transactionsTable.id })
      .from(transactionsTable).where(eq(transactionsTable.refCode, tx.refCode));
    if (exists.length) { continue; }
    await db.insert(transactionsTable).values(tx);
    console.log(`  ✅ Transaction ${tx.refCode}: ${tx.grossAmount} SAR`);
  }

  // ─── 6. Seed invoices ─────────────────────────────────────────────────
  console.log("\n🧾 Creating invoices...");
  const invoiceData = [
    {
      refCode: "TBQ-INV-2026-000001", restaurantId: 1, status: "paid" as const,
      periodStart: new Date("2026-02-01"), periodEnd: new Date("2026-02-28"),
      totalGrossAmount: "380.00", totalCommissionAmount: "45.60", totalNetAmount: "334.40",
      currency: "SAR", totalTransactions: 2,
      dueDate: new Date("2026-03-08"), paidAt: new Date("2026-03-07"),
      notes: "February 2026 settlement — 2 transactions"
    },
    {
      refCode: "TBQ-INV-2026-000002", restaurantId: 3, status: "paid" as const,
      periodStart: new Date("2026-02-01"), periodEnd: new Date("2026-02-28"),
      totalGrossAmount: "780.00", totalCommissionAmount: "78.00", totalNetAmount: "702.00",
      currency: "SAR", totalTransactions: 2,
      dueDate: new Date("2026-03-08"), paidAt: new Date("2026-03-06"),
      notes: "February 2026 settlement — 2 transactions"
    },
    {
      refCode: "TBQ-INV-2026-000003", restaurantId: 4, status: "sent" as const,
      periodStart: new Date("2026-03-01"), periodEnd: new Date("2026-03-31"),
      totalGrossAmount: "273.00", totalCommissionAmount: "36.86", totalNetAmount: "236.15",
      currency: "SAR", totalTransactions: 1,
      dueDate: new Date("2026-04-08"),
      notes: "March 2026 settlement"
    },
    {
      refCode: "TBQ-INV-2026-000004", restaurantId: 2, status: "overdue" as const,
      periodStart: new Date("2026-01-15"), periodEnd: new Date("2026-02-14"),
      totalGrossAmount: "233.00", totalCommissionAmount: "34.95", totalNetAmount: "198.05",
      currency: "SAR", totalTransactions: 1,
      dueDate: new Date("2026-03-01"),
      notes: "January settlement — OVERDUE"
    },
  ];
  for (const inv of invoiceData) {
    const exists = await db.select({ id: invoicesTable.id })
      .from(invoicesTable).where(eq(invoicesTable.refCode, inv.refCode));
    if (exists.length) { continue; }
    await db.insert(invoicesTable).values(inv);
    console.log(`  ✅ Invoice ${inv.refCode}: ${inv.status} — SAR ${inv.totalNetAmount}`);
  }

  // ─── 7. Seed admin messages ───────────────────────────────────────────
  console.log("\n📨 Creating admin messages...");
  const msgData = [
    {
      refCode: "TBQ-MSG-2026-000001", restaurantId: 1, adminUserId: 1,
      subject: "Offer Review — Action Required",
      body: "Dear Najd Village team, we have reviewed your offer submission and need a few clarifications. Please ensure the description accurately reflects the set menu contents including beverage inclusions. Once updated, your offer will be approved within 24 hours.",
      type: "offer_feedback", isRead: true
    },
    {
      refCode: "TBQ-MSG-2026-000002", restaurantId: 2, adminUserId: 1,
      subject: "Invoice TBQ-INV-2026-000004 Overdue",
      body: "This is a reminder that invoice TBQ-INV-2026-000004 is now overdue. The outstanding balance of SAR 198.05 was due on March 1, 2026. Please arrange payment at your earliest convenience to avoid service interruption.",
      type: "invoice", isRead: false
    },
    {
      refCode: "TBQ-MSG-2026-000003", restaurantId: 3, adminUserId: 1,
      subject: "Contract Renewal — Coming Up",
      body: "Your current contract with Tabaq is due for annual review in Q4 2026. Based on your exceptional performance metrics, we would like to discuss a preferential renewal rate. Our partnerships team will be in touch soon.",
      type: "contract", isRead: false
    },
    {
      refCode: "TBQ-MSG-2026-000004", restaurantId: 7, adminUserId: 1,
      subject: "Welcome to Tabaq — Contract Active",
      body: "Congratulations! Your Tabaq partnership is now live. Your direct payment contract at 8% commission reflects Nobu Riyadh's premium position on the platform. We look forward to a very successful partnership.",
      type: "general", isRead: true
    },
  ];
  for (const msg of msgData) {
    const exists = await db.select({ id: adminMessagesTable.id })
      .from(adminMessagesTable).where(eq(adminMessagesTable.refCode, msg.refCode));
    if (exists.length) { continue; }
    await db.insert(adminMessagesTable).values(msg);
    console.log(`  ✅ Message ${msg.refCode}: ${msg.subject}`);
  }

  console.log("\n✅ All seeding complete!");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
