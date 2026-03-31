import { db, pool, blogCategoriesTable, blogPostsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function seedBlog() {
  console.log("🌱 Seeding blog data...");

  const [adminUser] = await db.select().from(usersTable).where(eq(usersTable.isAdmin, true)).limit(1);
  if (!adminUser) {
    console.log("⚠️  No admin user found, skipping blog seed");
    await pool.end();
    return;
  }

  const existingCats = await db.select().from(blogCategoriesTable).limit(1);
  if (existingCats.length > 0) {
    console.log("✅ Blog data already seeded, skipping");
    await pool.end();
    return;
  }

  const cats = await db.insert(blogCategoriesTable).values([
    { nameEn: "Dining Guides", nameAr: "أدلة الطعام", slug: "dining-guides", color: "#e23744", descriptionEn: "Expert guides to the best dining experiences", descriptionAr: "أدلة خبراء لأفضل تجارب الطعام" },
    { nameEn: "Chef Stories", nameAr: "قصص الطهاة", slug: "chef-stories", color: "#f59e0b", descriptionEn: "Behind the scenes with Saudi Arabia's top chefs", descriptionAr: "خلف الكواليس مع أفضل طهاة المملكة" },
    { nameEn: "Food Culture", nameAr: "ثقافة الطعام", slug: "food-culture", color: "#10b981", descriptionEn: "Exploring the rich culinary heritage of the Gulf", descriptionAr: "استكشاف التراث الغني لمطبخ الخليج" },
    { nameEn: "New Openings", nameAr: "افتتاحات جديدة", slug: "new-openings", color: "#8b5cf6", descriptionEn: "The hottest new restaurants in Saudi Arabia", descriptionAr: "أحدث المطاعم في المملكة العربية السعودية" },
    { nameEn: "Experiences", nameAr: "التجارب", slug: "experiences", color: "#3b82f6", descriptionEn: "Unique culinary experiences and events", descriptionAr: "تجارب وفعاليات طهوية فريدة" },
  ]).returning();

  const [guideCat, chefCat, cultureCat, openingCat, expCat] = cats;
  const now = new Date();

  await db.insert(blogPostsTable).values([
    {
      authorId: adminUser.id,
      categoryId: guideCat.id,
      titleEn: "The Ultimate Guide to Fine Dining in Riyadh 2026",
      titleAr: "الدليل الشامل لتناول الطعام الفاخر في الرياض 2026",
      slug: "ultimate-fine-dining-guide-riyadh-2026",
      excerptEn: "From award-winning Omakase experiences to intimate tasting menus, we round up the most exceptional fine dining destinations Riyadh has to offer this year.",
      excerptAr: "من تجارب الأوماكاسي الحائزة على جوائز إلى قوائم التذوق الحميمة، نستعرض أبرز وجهات الطعام الفاخر التي تقدمها الرياض هذا العام.",
      contentEn: `<h2>Riyadh's Fine Dining Revolution</h2><p>The Saudi capital has undergone a remarkable culinary transformation. Where once the city was known primarily for local staples, it now boasts a world-class dining scene that rivals Dubai, London, and Tokyo.</p><h3>1. Nobu Riyadh — The Japanese Legend</h3><p>Nestled inside the iconic Four Seasons Hotel, Nobu Riyadh continues to set the gold standard for Japanese cuisine in the Kingdom. Chef Nobuyuki Matsuhisa's signature Black Cod Miso remains the dish every visitor must try.</p><h3>2. Sushi Sama — Omakase Perfection</h3><p>Hidden in the heart of Al Nakheel Mall, Sushi Sama offers the city's most exclusive Omakase experience. Chef Kenji sources his fish daily, ensuring that each 12-course journey is an exercise in perfection.</p><h3>3. Lusin — Armenian Soul in Riyadh</h3><p>An elegant Armenian-Mediterranean restaurant that has quietly become one of Riyadh's most beloved dining destinations. The Granada Business Park setting is stunning, but it's the food that keeps guests returning.</p>`,
      contentAr: `<h2>ثورة الطعام الفاخر في الرياض</h2><p>شهدت العاصمة السعودية تحولاً طهوياً مذهلاً. في حين كانت المدينة تُعرف في الماضي أساساً بمأكولاتها المحلية، فإنها تضم اليوم مشهداً طعاماً عالمي المستوى يضاهي دبي ولندن وطوكيو.</p><h3>1. نوبو الرياض — الأسطورة اليابانية</h3><p>يواصل نوبو الرياض، المتواجد داخل فندق فور سيزونز الشهير، وضع المعيار الذهبي للمطبخ الياباني في المملكة.</p>`,
      coverImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=630&fit=crop",
      status: "published" as const,
      isFeatured: true,
      readTimeMinutes: 8,
      tags: ["fine dining", "riyadh", "2026", "guide"],
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: adminUser.id,
      categoryId: cultureCat.id,
      titleEn: "Saudi Food Culture: A Journey Through Najdi Cuisine",
      titleAr: "ثقافة الطعام السعودي: رحلة عبر مطبخ نجد",
      slug: "saudi-food-culture-najdi-cuisine",
      excerptEn: "Discover the ancient traditions, spice routes, and family recipes that have shaped the rich tapestry of Najdi cuisine over centuries.",
      excerptAr: "اكتشف التقاليد العريقة وطرق التوابل والوصفات العائلية التي شكّلت النسيج الغني لمطبخ نجد على مدى قرون.",
      contentEn: `<h2>The Heart of Saudi Cuisine</h2><p>Najdi cuisine is the culinary soul of Saudi Arabia — a testament to centuries of Bedouin tradition, trade routes, and the warmth of Arabian hospitality. At its core, this is food built around communal eating, generous portions, and the honest flavors of the land.</p><h3>The Holy Trinity: Rice, Meat, and Spice</h3><p>The three pillars of Najdi cooking are rice, slow-cooked meat, and a carefully balanced spice blend. Dishes like Kabsa (slow-cooked lamb or chicken with spiced rice), Jareesh (crushed wheat slow-cooked with broth and spices), and Harees (wheat and meat porridge) have been feeding families for generations.</p><h3>Where to Experience Authentic Najdi Food</h3><p>For the most authentic experience, head to Najd Village in Riyadh — a stunning recreation of a traditional Najdi village that serves these heritage dishes in the setting they deserve.</p>`,
      contentAr: `<h2>قلب المطبخ السعودي</h2><p>المطبخ النجدي هو الروح الطهوية للمملكة العربية السعودية — شاهد على قرون من التقاليد البدوية وطرق التجارة ودفء الضيافة العربية.</p>`,
      coverImageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=630&fit=crop",
      status: "published" as const,
      isFeatured: true,
      readTimeMinutes: 6,
      tags: ["saudi cuisine", "najd", "culture", "heritage"],
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: adminUser.id,
      categoryId: chefCat.id,
      titleEn: "Meet Chef Kenji: The Man Behind Riyadh's Best Omakase",
      titleAr: "تعرف على الشيف كينجي: الرجل وراء أفضل أوماكاسي في الرياض",
      slug: "chef-kenji-riyadh-omakase-interview",
      excerptEn: "We sit down with Chef Kenji Tanaka of Sushi Sama to talk about his journey from Osaka to Riyadh, the philosophy of Omakase, and what makes Saudi diners unique.",
      excerptAr: "نجلس مع الشيف كينجي تاناكا من سوشي ساما للحديث عن رحلته من أوساكا إلى الرياض وفلسفة الأوماكاسي.",
      contentEn: `<h2>From Osaka to Riyadh</h2><p>Chef Kenji Tanaka never imagined he'd be spending his days in the Saudi capital when he started his culinary journey in a small sushi counter in Osaka's Dotonbori district. Twenty years and three Michelin stars later, he's helming what many consider the best Japanese restaurant in the Arabian Peninsula.</p><p>"Riyadh surprised me," he says, carefully slicing a piece of fatty tuna with surgical precision. "The guests here, they are passionate. They travel. They eat in Tokyo, in London. They come here knowing what they want, and they're not afraid to tell me."</p><h3>The Omakase Philosophy</h3><p>For Chef Kenji, Omakase is not simply a menu format — it's a conversation. "When someone sits at my counter and says 'Chef, please' — they're giving me the greatest gift a diner can give. Their trust."</p>`,
      contentAr: `<h2>من أوساكا إلى الرياض</h2><p>لم يتخيل الشيف كينجي تاناكا أنه سيقضي أيامه في العاصمة السعودية عندما بدأ رحلته الطهوية في كاونتر سوشي صغير في حي دوتونبوري بأوساكا.</p>`,
      coverImageUrl: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=1200&h=630&fit=crop",
      status: "published" as const,
      isFeatured: false,
      readTimeMinutes: 7,
      tags: ["chef interview", "sushi", "omakase", "japanese"],
      publishedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: adminUser.id,
      categoryId: openingCat.id,
      titleEn: "5 Most Anticipated Restaurant Openings in Saudi Arabia — Q2 2026",
      titleAr: "5 افتتاحات مطاعم الأكثر ترقباً في المملكة العربية السعودية — الربع الثاني 2026",
      slug: "most-anticipated-restaurant-openings-q2-2026",
      excerptEn: "From a rooftop Mediterranean concept in NEOM to a boundary-pushing modernist Saudi kitchen in Diriyah, here are the five openings every food lover is watching.",
      excerptAr: "من مفهوم متوسطي على السطح في نيوم إلى مطبخ سعودي حداثي مبتكر في الدرعية، إليك الافتتاحات الخمسة التي يترقبها كل محب للطعام.",
      contentEn: `<h2>Saudi Arabia's Restaurant Scene Heats Up</h2><p>The Kingdom's culinary ambitions are accelerating faster than ever, with global hospitality groups and local homegrown talent competing for space in a market that's hungry — quite literally — for world-class experiences.</p><h3>1. Altitude — NEOM's First Fine Dining Destination</h3><p>Set to open on the observation deck of The Line's first completed residential tower, Altitude will offer a 12-course modernist tasting menu with views across the Gulf of Aqaba. The team behind Copenhagen's acclaimed Geranium is consulting on the concept.</p><h3>2. Bait Al Mandi — Heritage Reimagined in Diriyah</h3><p>Located within the new Diriyah heritage district, this concept takes traditional Saudi Mandi and elevates it using wood-fire techniques imported from Argentina and local wagyu beef.</p>`,
      contentAr: `<h2>مشهد المطاعم في المملكة العربية السعودية يتسخن</h2><p>تتسارع الطموحات الطهوية للمملكة بشكل غير مسبوق، مع تنافس مجموعات الضيافة العالمية والمواهب المحلية على مساحة في سوق جائع — بالمعنى الحرفي — للتجارب العالمية.</p>`,
      coverImageUrl: "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=1200&h=630&fit=crop",
      status: "published" as const,
      isFeatured: true,
      readTimeMinutes: 5,
      tags: ["new openings", "2026", "restaurants", "saudi arabia"],
      publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: adminUser.id,
      categoryId: guideCat.id,
      titleEn: "Jeddah Dining Guide: Where Locals Actually Eat",
      titleAr: "دليل الطعام في جدة: أين يأكل السكان المحليون فعلاً",
      slug: "jeddah-dining-guide-where-locals-eat",
      excerptEn: "Skip the tourist traps. We asked Jeddawi food lovers for their honest picks — the hidden gems, the legendary street food stops, and the restaurants that have been feeding families for decades.",
      excerptAr: "تجاوز الأماكن السياحية. سألنا محبي الطعام الجداويين عن اختياراتهم الصادقة — الجواهر الخفية، وأماكن الطعام الشارعي الأسطورية.",
      contentEn: `<h2>Jeddah: Saudi Arabia's Culinary Capital</h2><p>While Riyadh gets most of the headlines, food lovers who've explored both cities will tell you that Jeddah's dining scene has a depth, diversity, and soul that's hard to match. As a port city and historical crossroads of trade, Jeddah has been absorbing culinary influences from across the Red Sea, the Hejaz, and the wider Arab world for centuries.</p><h3>Al-Balad: The Old City's Hidden Restaurants</h3><p>The UNESCO World Heritage-listed Al-Balad district is more than ancient architecture — it's home to some of the city's most characterful restaurants. Duck into Mandi Al-Sham for a slow-cooked lamb experience that's been drawing locals since 1987.</p>`,
      contentAr: `<h2>جدة: العاصمة الطهوية للمملكة العربية السعودية</h2><p>بينما تحظى الرياض بمعظم العناوين الإخبارية، سيخبرك محبو الطعام الذين استكشفوا المدينتين أن مشهد الطعام في جدة يتميز بعمق وتنوع وروح يصعب مضاهاتها.</p>`,
      coverImageUrl: "https://images.unsplash.com/photo-1562802378-063ec186a863?w=1200&h=630&fit=crop",
      status: "published" as const,
      isFeatured: false,
      readTimeMinutes: 9,
      tags: ["jeddah", "dining guide", "local tips", "hidden gems"],
      publishedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: adminUser.id,
      categoryId: expCat.id,
      titleEn: "The 7 Best Food Experiences in Saudi Arabia Right Now",
      titleAr: "أفضل 7 تجارب طعام في المملكة العربية السعودية الآن",
      slug: "best-food-experiences-saudi-arabia-2026",
      excerptEn: "Beyond the restaurant table — these immersive culinary experiences are transforming how Saudi Arabia thinks about food.",
      excerptAr: "ما وراء طاولة المطعم — هذه التجارب الطهوية الغامرة تغيّر طريقة تفكير المملكة العربية السعودية في الطعام.",
      contentEn: `<h2>Saudi Arabia's Experience Economy</h2><p>The Kingdom's Vision 2030 has unlocked a new era of experiential dining — where food is not just sustenance but a story, a performance, and a cultural bridge. Here are the seven experiences redefining what it means to eat well in Saudi Arabia.</p><h3>1. Traditional Najdi Feast in a Private Majlis — Najd Village, Riyadh</h3><p>Dress in traditional attire, recline on cushioned majlis seating, and experience a four-hour feast that traces the culinary journey of the Najd region. This isn't dinner — it's a living piece of Saudi heritage.</p><h3>2. Master Sushi Class with Chef Kenji — Sushi Sama, Riyadh</h3><p>Learn the art of Nigiri, Hosomaki, and Uramaki directly from one of the best sushi chefs in the Arabian Peninsula. Limited to 6 participants per session.</p>`,
      contentAr: `<h2>اقتصاد التجربة في المملكة العربية السعودية</h2><p>أطلقت رؤية المملكة 2030 حقبة جديدة من تجارب الطعام الغامرة — حيث الطعام ليس مجرد غذاء بل قصة وعرض وجسر ثقافي.</p>`,
      coverImageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=630&fit=crop",
      status: "published" as const,
      isFeatured: false,
      readTimeMinutes: 6,
      tags: ["experiences", "food experiences", "saudi arabia", "vision 2030"],
      publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  ]);

  console.log("✅ Blog categories and posts seeded");
  console.log("\n🎉 Blog data seeded successfully!");

  await pool.end();
}

seedBlog().catch((err) => {
  console.error("❌ Blog seed failed:", err);
  process.exit(1);
});
