import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const run = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── 1. Logo URLs for all 12 restaurants ──────────────────────────────────
    const logos = [
      { id: 1,  url: 'https://ui-avatars.com/api/?name=NV&background=8B4513&color=fff&size=200&bold=true&rounded=true&font-size=0.45' },
      { id: 2,  url: 'https://ui-avatars.com/api/?name=NP&background=1a1a2e&color=c9a84c&size=200&bold=true&rounded=true&font-size=0.45' },
      { id: 3,  url: 'https://ui-avatars.com/api/?name=SH&background=e8385a&color=fff&size=200&bold=true&rounded=true&font-size=0.45' },
      { id: 4,  url: 'https://ui-avatars.com/api/?name=MI&background=2d6a4f&color=fff&size=200&bold=true&rounded=true&font-size=0.45' },
      { id: 5,  url: 'https://ui-avatars.com/api/?name=AB&background=d62828&color=fff&size=200&bold=true&rounded=true&font-size=0.45' },
      { id: 6,  url: 'https://ui-avatars.com/api/?name=KS&background=023e8a&color=fff&size=200&bold=true&rounded=true&font-size=0.45' },
      { id: 7,  url: 'https://ui-avatars.com/api/?name=GH&background=3d405b&color=fff&size=200&bold=true&rounded=true&font-size=0.45' },
      { id: 8,  url: 'https://ui-avatars.com/api/?name=CL&background=c77dff&color=fff&size=200&bold=true&rounded=true&font-size=0.45' },
      { id: 9,  url: 'https://ui-avatars.com/api/?name=GB&background=2d6a4f&color=fff&size=200&bold=true&rounded=true&font-size=0.45' },
      { id: 10, url: 'https://ui-avatars.com/api/?name=CB&background=6d4c41&color=fff&size=200&bold=true&rounded=true&font-size=0.45' },
      { id: 11, url: 'https://ui-avatars.com/api/?name=BS&background=0077b6&color=fff&size=200&bold=true&rounded=true&font-size=0.45' },
      { id: 12, url: 'https://ui-avatars.com/api/?name=SR&background=e76f51&color=fff&size=200&bold=true&rounded=true&font-size=0.45' },
    ];
    for (const { id, url } of logos) {
      await client.query('UPDATE restaurants SET logo_url = $1 WHERE id = $2', [url, id]);
    }
    console.log('✅ Updated logo URLs for 12 restaurants');

    // ── 2. Nakheel Palace dishes (sections 4=Starters, 5=Main, 6=Desserts) ──
    const nakheelDishes = [
      // Starters – section 4
      {
        restaurantId: 2, menuSectionId: 4,
        nameEn: 'Wagyu Carpaccio', nameAr: 'كاربتشيو الواغيو',
        descEn: 'Thinly sliced A5 Wagyu beef with truffle oil, capers, and parmesan shavings',
        descAr: 'شرائح رقيقة من لحم الواغيو A5 مع زيت الكمأة والكبر وشريحات البارميزان',
        price: '195.00', isTabaqStar: true, isBestseller: true, popularityScore: 92,
        img: 'https://images.unsplash.com/photo-1544025162-d7669f9f3df4?w=500&q=80',
      },
      {
        restaurantId: 2, menuSectionId: 4,
        nameEn: 'Lobster Bisque', nameAr: 'حساء الجراد البحري',
        descEn: 'Velvety lobster bisque with cognac cream, chives, and grilled lobster claw',
        descAr: 'حساء جراد بحري كريمي مع كريمة الكونياك والثوم المعمر وكف الجراد المشوي',
        price: '145.00', isTabaqStar: false, isBestseller: true, popularityScore: 88,
        img: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80',
      },
      {
        restaurantId: 2, menuSectionId: 4,
        nameEn: 'Foie Gras Torchon', nameAr: 'كبد الإوز',
        descEn: 'Pan-seared duck foie gras with brioche toast, fig jam, and aged balsamic',
        descAr: 'كبد بط مشوي مع خبز البريوش ومربى التين وخل البلسميك المعتق',
        price: '210.00', isTabaqStar: false, isBestseller: false, popularityScore: 75,
        img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&q=80',
      },
      // Main Course – section 5
      {
        restaurantId: 2, menuSectionId: 5,
        nameEn: 'Wagyu Tomahawk (1kg)', nameAr: 'توماهوك الواغيو',
        descEn: 'Dry-aged A4 Wagyu tomahawk, rosemary jus, roasted garlic mash, truffle butter',
        descAr: 'ريش واغيو A4 مع صلصة إكليل الجبل وهريس الثوم المحمص وزبدة الكمأة',
        price: '650.00', isTabaqStar: true, isBestseller: true, popularityScore: 98, isMostOrdered: true,
        img: 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&q=80',
      },
      {
        restaurantId: 2, menuSectionId: 5,
        nameEn: 'Whole Grilled Turbot', nameAr: 'سمك الترابط المشوي كاملاً',
        descEn: 'Wild-caught turbot with lemon beurre blanc, samphire, and heritage tomatoes',
        descAr: 'سمك ترابط طبيعي مع صلصة الزبدة والليمون والطماطم التراثية',
        price: '420.00', isTabaqStar: false, isBestseller: true, popularityScore: 85,
        img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80',
      },
      {
        restaurantId: 2, menuSectionId: 5,
        nameEn: 'Lamb Rack Provençale', nameAr: 'رف الضأن بالأعشاب',
        descEn: 'Herb-crusted rack of lamb, ratatouille, olive tapenade, and natural jus',
        descAr: 'رف ضأن مغطى بالأعشاب مع راتاتوي وزيتون مطحون والمرق الطبيعي',
        price: '385.00', isTabaqStar: false, isBestseller: false, popularityScore: 80,
        img: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&q=80',
      },
      // Desserts – section 6
      {
        restaurantId: 2, menuSectionId: 6,
        nameEn: 'Valrhona Chocolate Soufflé', nameAr: 'سوفليه شوكولاتة فالرونا',
        descEn: 'Warm dark chocolate soufflé with vanilla crème anglaise and praline ice cream',
        descAr: 'سوفليه شوكولاتة داكنة دافئة مع كريمة فانيليا وآيس كريم البراليني',
        price: '95.00', isTabaqStar: true, isBestseller: true, popularityScore: 94, isChefChoice: true,
        img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&q=80',
      },
      {
        restaurantId: 2, menuSectionId: 6,
        nameEn: 'Arabic Mille-Feuille', nameAr: 'ميل فوي عربي',
        descEn: 'Layers of cardamom pastry cream, rose water jelly, and gold leaf',
        descAr: 'طبقات من كريمة الهيل وجيلي ماء الورد وورق الذهب',
        price: '85.00', isTabaqStar: false, isBestseller: true, popularityScore: 88,
        img: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500&q=80',
      },
    ];

    for (const d of nakheelDishes) {
      await client.query(`
        INSERT INTO dishes (
          restaurant_id, menu_section_id, name_en, name_ar,
          description_en, description_ar,
          price, currency, image_url,
          is_available, is_halal, is_tabaq_star, is_bestseller,
          is_most_ordered, is_chef_choice, popularity_score
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,'SAR',$8,true,true,$9,$10,$11,$12,$13)
      `, [
        d.restaurantId, d.menuSectionId, d.nameEn, d.nameAr,
        d.descEn, d.descAr, d.price, d.img,
        d.isTabaqStar ?? false, d.isBestseller ?? false,
        d.isMostOrdered ?? false, d.isChefChoice ?? false,
        d.popularityScore ?? 70,
      ]);
    }
    console.log(`✅ Added ${nakheelDishes.length} dishes for Nakheel Palace`);

    // ── 3. Add image URLs to dishes missing them ──────────────────────────────
    const dishImages = [
      // Najd Village
      { id: 2,  img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80' }, // Murtabak
      { id: 5,  img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80' }, // Harees
      // Sushi Hana
      { id: 6,  img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80' },  // Edamame
      { id: 7,  img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&q=80' },  // Miso Soup
      { id: 10, img: 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&q=80' },  // Wagyu Teppanyaki
      { id: 11, img: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500&q=80' }, // Mochi
      // Maestro Italian
      { id: 33, img: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=500&q=80' }, // Bruschetta
      { id: 35, img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80' }, // Margherita
      // Al Baik Express
      { id: 37, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80' }, // Fish Sandwich
      // Kana Sushi
      { id: 39, img: 'https://images.unsplash.com/photo-1553621042-f6e14be02cc2?w=500&q=80' },  // Spicy Tuna Roll
      // The Grill House
      { id: 12, img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80' },  // Burrata Salad
      { id: 14, img: 'https://images.unsplash.com/photo-1544025162-d7669f9f3df4?w=500&q=80' },  // Wagyu Tomahawk
      { id: 15, img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&q=80' },  // Molten Chocolate
      // Casa Levant
      { id: 28, img: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&q=80' }, // Mixed Grill
      { id: 29, img: 'https://images.unsplash.com/photo-1555951015-6da899b5c2cd?w=500&q=80' },  // Kunafa
      // Green Bowl
      { id: 21, img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80' }, // Grilled Chicken Salad
      { id: 22, img: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=500&q=80' }, // Açaí Bowl
      { id: 23, img: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=500&q=80' }, // Green Detox Juice
      // Café Bateel
      { id: 17, img: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=500&q=80' }, // Avocado Toast
      { id: 18, img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80' }, // Signature Latte
      { id: 19, img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80' }, // Date & Walnut Cake
      // Bahar Seafood
      { id: 25, img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80' }, // Mixed Seafood Grill
      { id: 26, img: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80' },  // Seafood Soup
      // Spice Route India
      { id: 31, img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80' }, // Lamb Biryani
      { id: 32, img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80' }, // Samosa Platter
    ];

    for (const { id, img } of dishImages) {
      await client.query('UPDATE dishes SET image_url = $1 WHERE id = $2', [img, id]);
    }
    console.log(`✅ Added image URLs to ${dishImages.length} dishes`);

    await client.query('COMMIT');
    console.log('\n🎉 All done!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
};

run();
