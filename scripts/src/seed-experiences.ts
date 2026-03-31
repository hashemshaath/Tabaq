import { db } from "@workspace/db";
import { experiencesTable, experienceSlotsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🎪 Seeding additional experiences...");

  const newExperiences = [
    {
      refCode: "EXP-SEED-005",
      slug: "dammam-corniche-seafood-grill",
      titleEn: "Dammam Corniche Seafood Grill",
      titleAr: "شواء المأكولات البحرية على كورنيش الدمام",
      descriptionEn: "An open-air beachside grilling experience on the Dammam Corniche at sunset. A local pitmaster grills the freshest Gulf catch — hammour, shrimp, and lobster — over charcoal, served with saffron rice and tangy tamarind dips. Cool sea breeze included.",
      descriptionAr: "تجربة شواء في الهواء الطلق على شاطئ كورنيش الدمام عند الغروب. يشوي خبير محلي أطيب صيد الخليج — الهامور والروبيان والكركند — على الفحم، ويُقدَّم مع الأرز بالزعفران وصلصات التمر الهندي اللذيذة.",
      category: "outdoor",
      hostUserId: 1,
      city: "Dammam",
      cityId: 3,
      address: "Dammam Corniche, Al Shati District, Dammam",
      latitude: 26.4207,
      longitude: 50.0888,
      durationMinutes: 150,
      pricePerPerson: "220",
      depositAmount: "70",
      capacity: 18,
      primaryImageUrl: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=600&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",
      ],
      highlights: ["Gulf Catch Grilled Fresh", "Saffron Rice", "Sunset Setting", "Tamarind Dips"],
      tags: ["seafood", "grill", "outdoor", "dammam", "corniche", "gulf"],
      avgRating: 4.6,
      reviewCount: 18,
      status: "active",
    },
    {
      refCode: "EXP-SEED-006",
      slug: "makkah-heritage-dates-qahwa",
      titleEn: "Makkah Heritage Dates & Qahwa Journey",
      titleAr: "رحلة التمور التراثية والقهوة العربية — مكة المكرمة",
      descriptionEn: "Explore the rich culture of Arabian dates and Saudi coffee in the historic district of Makkah. A guided 2-hour tasting journey through 12 date varieties from across the Kingdom, paired with traditional Arabic qahwa brewed with cardamom and saffron. Includes a take-home gift box.",
      descriptionAr: "استكشف الثقافة الغنية للتمور العربية والقهوة السعودية في الحي التاريخي بمكة المكرمة. رحلة تذوق موجهة لمدة ساعتين عبر 12 صنفاً من التمور من مختلف أنحاء المملكة، مقرونة بقهوة عربية مثلى محضرة بالهيل والزعفران. يشمل صندوق هدايا للأخذ.",
      category: "cultural",
      hostUserId: 1,
      city: "Makkah",
      cityId: 4,
      address: "Al Zaher District, Makkah",
      latitude: 21.3891,
      longitude: 39.8579,
      durationMinutes: 120,
      pricePerPerson: "145",
      depositAmount: "50",
      capacity: 20,
      primaryImageUrl: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800&h=600&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&h=600&fit=crop",
      ],
      highlights: ["12 Date Varieties", "Qahwa with Saffron", "Gift Box Included", "Cultural History"],
      tags: ["dates", "qahwa", "cultural", "makkah", "heritage", "coffee"],
      avgRating: 4.8,
      reviewCount: 22,
      status: "active",
    },
    {
      refCode: "EXP-SEED-007",
      slug: "madinah-traditional-feast",
      titleEn: "Madinah Traditional Feast — Al Anbariyah",
      titleAr: "وليمة المدينة التراثية — العنبرية",
      descriptionEn: "A truly authentic Madinah dining experience in a restored Al Anbariyah heritage house. A 5-course feast of Hijazi cuisine: slow-cooked mutton jareesh, saleeg rice with camel milk, matazeez stew, and fresh Madinah dates for dessert. Stories of the city woven into every course.",
      descriptionAr: "تجربة مائدة مدنية أصيلة في منزل تراثي مُرمَّم في العنبرية. وليمة من 5 أطباق من المطبخ الحجازي: جريش الخروف، أرز السليق بحليب الإبل، مرق المطازيز، وتمر المدينة الطازج للحلوى. تُحكى حكايات المدينة مع كل طبق.",
      category: "heritage",
      hostUserId: 1,
      city: "Madinah",
      cityId: 5,
      address: "Al Anbariyah District, Madinah",
      latitude: 24.4686,
      longitude: 39.6112,
      durationMinutes: 180,
      pricePerPerson: "260",
      depositAmount: "80",
      capacity: 14,
      primaryImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop",
      ],
      highlights: ["5-Course Hijazi Feast", "Heritage House Setting", "Camel Milk Saleeg", "Cultural Storytelling"],
      tags: ["hijazi", "heritage", "madinah", "traditional", "saleeg", "jareesh"],
      avgRating: 4.9,
      reviewCount: 14,
      status: "active",
    },
    {
      refCode: "EXP-SEED-008",
      slug: "jeddah-rooftop-dinner-red-sea",
      titleEn: "Jeddah Rooftop Dinner with Red Sea Views",
      titleAr: "عشاء على السطح مع إطلالات البحر الأحمر — جدة",
      descriptionEn: "Dine 18 floors above the Red Sea on one of Jeddah's most dramatic private rooftops. A curated 4-course seafood and mezze menu is served at golden hour as the city lights up below. Live Arabic violin sets the mood. Maximum 10 guests for a truly intimate evening.",
      descriptionAr: "تناول العشاء على ارتفاع 18 طاباً فوق البحر الأحمر على أحد أكثر الأسطح الخاصة إثارة في جدة. تُقدَّم قائمة مختارة من 4 أطباق من المأكولات البحرية والمزة عند غسق اليوم بينما تضيء المدينة أسفلنا. موسيقى الكمان العربية تضفي الأجواء.",
      category: "fine_dining",
      hostUserId: 1,
      city: "Jeddah",
      cityId: 2,
      address: "Al Corniche District, Jeddah",
      latitude: 21.5433,
      longitude: 39.1728,
      durationMinutes: 180,
      pricePerPerson: "380",
      depositAmount: "120",
      capacity: 10,
      primaryImageUrl: "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&h=600&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=600&fit=crop",
      ],
      highlights: ["Red Sea Panorama", "Golden Hour Service", "Live Arabic Violin", "Private Rooftop"],
      tags: ["rooftop", "red-sea", "fine-dining", "jeddah", "romantic", "seafood"],
      avgRating: 4.8,
      reviewCount: 19,
      status: "active",
    },
    {
      refCode: "EXP-SEED-009",
      slug: "riyadh-kabsa-masterclass",
      titleEn: "Riyadh Kabsa & Mandi Cooking Masterclass",
      titleAr: "ورشة طبخ الكبسة والمندي — الرياض",
      descriptionEn: "Master Saudi Arabia's most beloved dishes in this 3-hour hands-on class. Chef Nora Al-Harbi guides you through the secrets of authentic kabsa and mandi — from the spice blend to the slow-cooking method and the proper layering of rice. Lunch is what you cook.",
      descriptionAr: "أتقن أشهر أطباق المملكة العربية السعودية في هذه الورشة العملية لمدة 3 ساعات. تُرشدك الشيف نورة الحربي عبر أسرار الكبسة والمندي الأصيلة — من خلطة البهارات إلى طريقة الطهي الببطيء وتقطير الأرز. الغداء هو ما تطهو.",
      category: "cooking_class",
      hostUserId: 1,
      city: "Riyadh",
      cityId: 1,
      address: "Al Nakheel District, Riyadh",
      latitude: 24.7136,
      longitude: 46.6753,
      durationMinutes: 180,
      pricePerPerson: "240",
      depositAmount: "75",
      capacity: 10,
      primaryImageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",
      ],
      highlights: ["Authentic Spice Blending", "Slow-Cook Method", "Eat What You Make", "Take-Home Recipe Card"],
      tags: ["kabsa", "mandi", "cooking", "saudi-cuisine", "riyadh", "masterclass"],
      avgRating: 4.7,
      reviewCount: 34,
      status: "active",
    },
    {
      refCode: "EXP-SEED-010",
      slug: "riyadh-diriyah-street-food-tour",
      titleEn: "Diriyah Night Street Food Walk",
      titleAr: "جولة طعام الشارع الليلية في الدرعية",
      descriptionEn: "A guided 2-hour evening walk through the reborn Diriyah quarter, sampling 8 stops of traditional and contemporary Saudi street food — mutabbaq, sambusak, shawaya skewers, fresh tamarind drinks, and aseeda pudding. Small group of max 12, your guide shares stories of the UNESCO site.",
      descriptionAr: "جولة مسائية موجهة لمدة ساعتين في حي الدرعية المتجدد، مع تذوق 8 محطات من أكل الشارع السعودي التقليدي والمعاصر — المطبق، السمبوسك، أسياخ الشواية، مشروبات التمر الهندي الطازجة، والعصيدة.",
      category: "street_food",
      hostUserId: 1,
      city: "Riyadh",
      cityId: 1,
      address: "Diriyah Heritage Quarter, Riyadh",
      latitude: 24.7347,
      longitude: 46.5738,
      durationMinutes: 120,
      pricePerPerson: "165",
      depositAmount: "55",
      capacity: 12,
      primaryImageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",
      ],
      highlights: ["8-Stop Tasting Route", "UNESCO Heritage Site", "Mutabbaq & Sambusak", "Small Group Max 12"],
      tags: ["street-food", "diriyah", "walking-tour", "riyadh", "traditional", "heritage"],
      avgRating: 4.6,
      reviewCount: 41,
      status: "active",
    },
  ];

  for (const exp of newExperiences) {
    const existing = await db
      .select({ id: experiencesTable.id })
      .from(experiencesTable)
      .where(eq(experiencesTable.refCode, exp.refCode));

    if (existing.length) {
      console.log(`  ⏭️  ${exp.refCode} already exists`);
      continue;
    }

    const [newExp] = await db
      .insert(experiencesTable)
      .values(exp)
      .returning({ id: experiencesTable.id });

    console.log(`  ✅ Experience: ${exp.titleEn}`);

    const slotBase = new Date();
    const slotDays = [2, 5, 9, 13, 16, 20];
    for (const daysAhead of slotDays) {
      const slotDate = new Date(slotBase);
      slotDate.setDate(slotDate.getDate() + daysAhead);
      await db.insert(experienceSlotsTable).values({
        experienceId: newExp.id,
        date: slotDate.toISOString().split("T")[0],
        startTime: "19:00",
        endTime: "22:00",
        capacity: exp.capacity,
        remainingCapacity: exp.capacity,
        isActive: true,
        isCancelled: false,
        bookedCount: 0,
      });
    }
    console.log(`     ↳ 6 upcoming slots added`);
  }

  console.log("\n✅ Done seeding experiences!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
