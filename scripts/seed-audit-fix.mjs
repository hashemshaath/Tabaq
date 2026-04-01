/**
 * Tabaq Platform Audit Fix Seed
 * Adds reviews, tags, follows, stories; syncs denormalized counts
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let Pool;
try {
  Pool = require('/home/runner/workspace/node_modules/.pnpm/node_modules/pg').Pool;
} catch {
  Pool = require('pg').Pool;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const q = (sql, params) => pool.query(sql, params);

console.log('🔧 Starting comprehensive audit fix...\n');

// ── 1. NEW REVIEWS ────────────────────────────────────────────────────────────
const reviews = [
  // Restaurant 1 - Najd Village
  { u:3, r:1, o:5.0, f:5.0, s:4.5, a:5.0, v:4.5, en:"Najd Village is the gold standard for traditional Saudi cuisine. The Jareesh was perfect — creamy and aromatic. The majlis-style seating adds so much to the experience.", ar:"نجد فيليدج هو المعيار الذهبي للمطبخ السعودي الأصيل. كان الجريش مثالياً - كريمي وعطري. يضيف المجلس الكثير للتجربة.", days:120 },
  { u:5, r:1, o:4.5, f:4.5, s:4.5, a:5.0, v:4.0, en:"Beautiful ambiance, very authentic Saudi food. The Lamb Mansaf was tender and flavorful. Service could be slightly faster but overall a wonderful experience.", ar:"أجواء رائعة وطعام سعودي أصيل جداً. كان لحم المنسف طرياً ولذيذاً. الخدمة يمكن أن تكون أسرع قليلاً.", days:90 },
  { u:9, r:1, o:5.0, f:5.0, s:5.0, a:4.5, v:4.5, en:"One of Riyadh's finest. The Saleeg was cooked to perfection. A must-visit for anyone who loves traditional Saudi flavors.", ar:"أحد أفضل مطاعم الرياض. طُبخ الأرز بالدجاج باتقان. زيارة لا غنى عنها لمحبي النكهات السعودية الأصيلة.", days:60 },
  // Restaurant 2 - Nakheel Palace
  { u:2, r:2, o:5.0, f:5.0, s:5.0, a:5.0, v:4.5, en:"An unparalleled fine dining experience. Chef's Table at Nakheel was breathtaking. Every dish was a masterpiece. Worth every riyal.", ar:"تجربة طعام راقية لا مثيل لها. كانت طاولة الشيف في نخيل مذهلة. كل طبق كان تحفة فنية.", days:100 },
  { u:6, r:2, o:5.0, f:5.0, s:5.0, a:5.0, v:4.0, en:"Nakheel Palace sets the bar for luxury dining in Saudi Arabia. Flawless service, exquisite food, and an atmosphere that is simply magical.", ar:"يضع نخيل بالاس المعيار للعشاء الفاخر في المملكة. خدمة لا تشوبها شائبة وطعام رفيع وأجواء ساحرة.", days:75 },
  { u:4, r:2, o:4.5, f:5.0, s:4.5, a:5.0, v:4.0, en:"Genuinely one of the best dining experiences I've had. Ingredients are top quality. Slightly pricey but worth it for a special occasion.", ar:"واحدة من أفضل تجارب العشاء التي مررت بها. المكونات عالية الجودة. مكلف قليلاً لكنه يستحق.", days:50 },
  { u:9, r:2, o:5.0, f:5.0, s:5.0, a:5.0, v:4.5, en:"The Chef's Table experience here is something truly special. I have dined in Michelin-starred restaurants and Nakheel holds its own. Exceptional.", ar:"تجربة طاولة الشيف هنا شيء مميز حقاً. تناولت طعامي في مطاعم ميشلان ونخيل في مستواها.", days:30 },
  // Restaurant 3 - Sushi Hana
  { u:2, r:3, o:5.0, f:5.0, s:4.0, a:4.5, v:4.5, en:"Best sushi in Riyadh, hands down. The salmon nigiri was so fresh it melted in my mouth. The dragon roll was creative and perfectly balanced.", ar:"أفضل سوشي في الرياض بلا منازع. كان سمك السلمون طازجاً جداً حتى ذاب في فمي.", days:80 },
  { u:5, r:3, o:4.5, f:4.5, s:4.5, a:4.0, v:4.5, en:"Very authentic Japanese flavors. The miso soup was warming and the sushi quality is consistently high. Great for Japanese food lovers.", ar:"نكهات يابانية أصيلة جداً. كانت حساء ميسو دافئة وجودة السوشي عالية باستمرار.", days:55 },
  { u:7, r:3, o:4.5, f:5.0, s:4.0, a:4.0, v:4.0, en:"The Wagyu teppanyaki here is extraordinary. Watching the chef cook tableside is entertainment in itself.", ar:"الواغيو تيباناكي هنا استثنائي. مشاهدة الشيف يطبخ على الطاولة ترفيه في حد ذاته.", days:40 },
  { u:9, r:3, o:4.5, f:4.5, s:4.5, a:4.5, v:4.0, en:"Solid Japanese restaurant. The mochi ice cream is a perfect end to the meal. Sushi Hana delivers every time.", ar:"مطعم ياباني ثابت. آيس كريم موتشي هو نهاية مثالية للوجبة.", days:15 },
  // Restaurant 4 - Maestro Italian
  { u:2, r:4, o:4.5, f:5.0, s:4.0, a:4.5, v:4.0, en:"Maestro has the best pasta in the city. The burrata salad was creamy and fresh. Definitely coming back for their truffle dishes.", ar:"لدى ماستيرو أفضل المعكرونة في المدينة. كانت سلطة البوراتا كريمية وطازجة.", days:110 },
  { u:3, r:4, o:4.5, f:4.5, s:4.5, a:4.0, v:4.0, en:"Authentic Italian flavors. The wood-fired pizza is excellent and the risotto is perfectly cooked.", ar:"نكهات إيطالية أصيلة. البيتزا من الفرن الحجري ممتازة والريزوتو مطبوخ باتقان.", days:85 },
  { u:5, r:4, o:4.0, f:4.5, s:4.0, a:4.0, v:4.0, en:"Good Italian food. The tiramisu is a highlight — light and perfectly sweet. Fresh pasta dishes throughout.", ar:"طعام إيطالي جيد. التيراميسو هو النقطة المضيئة - خفيف وحلو بشكل مثالي.", days:45 },
  { u:7, r:4, o:4.5, f:4.5, s:5.0, a:4.0, v:4.0, en:"The service at Maestro is outstanding. The beef carpaccio is a standout starter and the mains are all excellent.", ar:"الخدمة في ماستيرو رائعة. كارباتشيو اللحم البقري هو مقبلات مميزة والأطباق الرئيسية كلها ممتازة.", days:20 },
  // Restaurant 5 - Al Baik Express
  { u:2, r:5, o:5.0, f:5.0, s:4.5, a:4.0, v:5.0, en:"Al Baik is iconic for a reason. The fried chicken is crispy, juicy, and perfectly spiced. The garlic sauce is addictive.", ar:"البيك مميز لسبب. الدجاج المقلي مقرمش وطري ومتبل بشكل مثالي. الصلصة بالثوم إدمانية.", days:70 },
  { u:6, r:5, o:5.0, f:5.0, s:4.0, a:3.5, v:5.0, en:"A Saudi institution. The shrimp meals are underrated — the shrimp is plump and the breading is seasoned perfectly.", ar:"مؤسسة سعودية. وجبات الجمبري مقللة من قيمتها - الجمبري ممتلئ والتحميص متبل بشكل مثالي.", days:35 },
  { u:8, r:5, o:4.5, f:5.0, s:4.0, a:3.5, v:5.0, en:"Classic Al Baik. Always consistent — perfectly golden and juicy chicken. The value is unbeatable anywhere in Saudi.", ar:"البيك الكلاسيكي. دائماً متسق - ذهبي وطري بشكل مثالي. لا يمكن مقارنة القيمة في أي مكان.", days:10 },
  // Restaurant 6 - Kana Sushi
  { u:2, r:6, o:4.5, f:4.5, s:4.0, a:4.5, v:4.5, en:"Kana Sushi offers a great creative twist on Japanese cuisine. The fusion rolls are inventive and delicious.", ar:"تقدم كانا سوشي لمسة إبداعية رائعة على المطبخ الياباني. اللفائف المبتكرة مبدعة ولذيذة.", days:95 },
  { u:4, r:6, o:4.5, f:4.5, s:4.0, a:4.0, v:4.0, en:"Quality sushi at reasonable prices. The spicy tuna roll is a must-order.", ar:"سوشي جودة عالية بأسعار معقولة. لفة التونة الحارة يجب طلبها.", days:65 },
  { u:9, r:6, o:4.0, f:4.0, s:4.0, a:4.5, v:4.0, en:"Consistently good sushi. The salmon avocado roll is my go-to. Service is friendly and prompt.", ar:"سوشي جيد باستمرار. لفة السلمون بالأفوكادو هي اختياري المفضل. الخدمة ودية وسريعة.", days:25 },
  // Restaurant 7 - The Grill House
  { u:3, r:7, o:5.0, f:5.0, s:5.0, a:4.5, v:4.0, en:"The USDA Prime Ribeye here is exceptional. The crust is perfect and inside is cooked exactly as ordered. The bone marrow starter is a must-try.", ar:"ضلع بيف USDA برايم هنا استثنائي. القشرة مثالية والداخل مطبوخ تماماً كما طُلب.", days:115 },
  { u:6, r:7, o:5.0, f:5.0, s:4.5, a:5.0, v:4.5, en:"The best steak house in Riyadh. The Wagyu Tomahawk is a showstopper. I celebrate every special occasion here.", ar:"أفضل مطعم شرائح اللحم في الرياض. توماهوك واغيو مذهل. أحتفل بكل مناسبة خاصة هنا.", days:88 },
  { u:8, r:7, o:4.5, f:5.0, s:4.5, a:4.5, v:4.0, en:"Excellent grill restaurant. The steaks are always spot on — properly rested and seasoned. The truffle fries are world-class.", ar:"مطعم شواء ممتاز. شرائح اللحم دائماً في محلها. البطاطس بالكمأة عالمية المستوى.", days:52 },
  { u:9, r:7, o:5.0, f:5.0, s:5.0, a:4.5, v:4.5, en:"The Grill House is in a league of its own. Every cut of meat is perfectly prepared. The service is knowledgeable.", ar:"The Grill House في مستوى خاص به. كل قطعة لحم محضرة بشكل مثالي. الخدمة على دراية.", days:22 },
  // Restaurant 8 - Casa Levant
  { u:2, r:8, o:5.0, f:5.0, s:4.5, a:4.5, v:4.5, en:"Casa Levant captures the soul of Levantine cooking beautifully. The mezze spread is incredible — fresh, vibrant, and generous portions.", ar:"تجسد كاسا ليفانت روح الطبخ الشامي بشكل جميل. مجموعة المقبلات لا تصدق - طازجة وزاهية.", days:130 },
  { u:5, r:8, o:4.5, f:4.5, s:4.0, a:4.5, v:4.0, en:"Great Lebanese and Syrian food. The fattoush is refreshing and the mixed grill is well-spiced. Good for groups.", ar:"طعام لبناني وسوري رائع. الفتوش منعش والمشاوي المشكلة متبلة بشكل جيد.", days:72 },
  { u:7, r:8, o:4.5, f:5.0, s:4.0, a:4.0, v:4.5, en:"The hummus at Casa Levant is the best I've had outside Lebanon. Smooth, creamy, drizzled with premium olive oil.", ar:"الحمص في كاسا ليفانت هو الأفضل الذي تناولته خارج لبنان. ناعم وكريمي ومرشوش بزيت زيتون فاخر.", days:38 },
  { u:9, r:8, o:4.5, f:4.5, s:4.5, a:4.5, v:4.0, en:"Consistent quality every visit. The kibbeh is handmade. The baklava to finish is heavenly.", ar:"جودة ثابتة في كل زيارة. الكبة مصنوعة يدوياً. البقلاوة للنهاية سماوية.", days:12 },
  // Restaurant 9 - Green Bowl
  { u:2, r:9, o:4.5, f:4.5, s:4.0, a:4.0, v:4.5, en:"Finally a healthy restaurant that doesn't compromise on taste! The power bowl is filling and nutritious.", ar:"أخيراً مطعم صحي لا يتنازل عن الطعم! وعاء الطاقة مشبع ومغذٍ.", days:105 },
  { u:4, r:9, o:4.5, f:4.5, s:4.0, a:4.0, v:4.0, en:"Green Bowl is my weekly go-to for healthy eating. The avocado toast is creamy and perfectly topped.", ar:"Green Bowl هو وجهتي الأسبوعية للأكل الصحي. خبز الأفوكادو المحمص كريمي ومزين بشكل مثالي.", days:62 },
  { u:6, r:9, o:4.0, f:4.0, s:4.5, a:4.0, v:4.0, en:"Solid healthy eating spot. Great variety — vegan options, high-protein bowls, and fresh juices.", ar:"مكان جيد للأكل الصحي. تنوع رائع - خيارات نباتية وأوعية غنية بالبروتين وعصائر طازجة.", days:28 },
  { u:8, r:9, o:4.0, f:4.0, s:4.0, a:3.5, v:4.0, en:"Good healthy food. The acai bowl is refreshing and the grain bowls are filling. Reasonable prices.", ar:"طعام صحي جيد. وعاء الأكاي منعش وأوعية الحبوب مشبعة. أسعار معقولة.", days:8 },
  // Restaurant 10 - Café Bateel
  { u:3, r:10, o:5.0, f:5.0, s:5.0, a:5.0, v:4.0, en:"Café Bateel is a true gem. The date & walnut cake is extraordinary. The coffee is consistently excellent.", ar:"كافيه باتيل جوهرة حقيقية. كعكة التمر والجوز استثنائية. القهوة ممتازة باستمرار.", days:145 },
  { u:5, r:10, o:4.5, f:5.0, s:4.5, a:5.0, v:4.0, en:"Everything here is of impeccable quality. The Bateel dates are legendary and incorporated beautifully into every dish.", ar:"كل شيء هنا بجودة لا تشوبها شائبة. تمور باتيل أسطورية ومدمجة بشكل جميل في كل طبق.", days:98 },
  { u:7, r:10, o:4.5, f:4.5, s:4.5, a:5.0, v:4.0, en:"A luxurious cafe experience. The latte is rich and perfectly balanced. Perfect for business meetings or catching up with friends.", ar:"تجربة كافيه فاخرة. اللاتيه غني ومتوازن بشكل مثالي. مثالية لاجتماعات الأعمال.", days:57 },
  { u:9, r:10, o:4.5, f:5.0, s:4.5, a:4.5, v:4.0, en:"Bateel never disappoints. The signature latte with date syrup is unique and delicious.", ar:"باتيل لا تخيب أبداً. لاتيه المميز بشراب التمر فريد ولذيذ.", days:18 },
  // Restaurant 11 - Bahar Seafood
  { u:2, r:11, o:5.0, f:5.0, s:4.5, a:4.0, v:4.5, en:"The freshest seafood in Riyadh. The grilled hammour was cooked to perfection — flaky, moist, and perfectly seasoned.", ar:"أطازج المأكولات البحرية في الرياض. كان الهامور المشوي مطبوخاً باتقان - متقشراً ورطباً.", days:92 },
  { u:6, r:11, o:5.0, f:5.0, s:4.5, a:4.5, v:4.5, en:"Outstanding seafood restaurant. The lobster thermidor is rich and indulgent. Highly recommend for seafood lovers.", ar:"مطعم مأكولات بحرية بارز. الكركند ثيرميدور غني ومبهج. أوصي به بشدة لمحبي المأكولات البحرية.", days:47 },
  { u:9, r:11, o:4.5, f:5.0, s:4.5, a:4.0, v:4.5, en:"Bahar knows their seafood. The prawn cocktail starter is generous and fresh. The mixed grill is all excellent quality.", ar:"يعرف بحر مأكولاتهم البحرية. مقبلات كوكتيل الجمبري سخية وطازجة. المشاوي المشكلة بجودة ممتازة.", days:16 },
  // Restaurant 12 - Spice Route India
  { u:2, r:12, o:4.5, f:5.0, s:4.0, a:4.0, v:4.5, en:"Incredible Indian flavors. The butter chicken is rich and perfectly spiced. The naan is fresh and pillowy. Excellent value.", ar:"نكهات هندية لا تصدق. الدجاج بالزبدة غني ومتبل بشكل مثالي. الخبز طازج وطري.", days:125 },
  { u:4, r:12, o:4.0, f:4.5, s:4.0, a:4.0, v:4.5, en:"Spice Route delivers authentic Indian cuisine. The biryani is fragrant and flavorful. The dal makhani is a standout.", ar:"يقدم Spice Route مطبخاً هندياً أصيلاً. البرياني عطري ولذيذ. دال ماخاني هو الأبرز.", days:78 },
  { u:6, r:12, o:4.5, f:4.5, s:4.0, a:4.0, v:4.0, en:"A great escape to Indian flavors in Riyadh. The tandoori chicken is smoky and delicious.", ar:"هروب رائع إلى النكهات الهندية في الرياض. الدجاج التندوري مدخن ولذيذ.", days:42 },
  { u:9, r:12, o:4.5, f:4.5, s:4.5, a:4.0, v:4.5, en:"Consistently good Indian food. The korma is mild and creamy. The samosas are crispy and filled generously.", ar:"طعام هندي جيد باستمرار. الكورما خفيفة وكريمية. السمبوسة مقرمشة ومحشوة بسخاء.", days:11 },
];

let reviewsAdded = 0;
for (const rev of reviews) {
  const d = new Date(); d.setDate(d.getDate() - rev.days);
  const visitDate = d.toISOString().split('T')[0];
  try {
    const res = await q(`
      INSERT INTO reviews (user_id, restaurant_id, rating_overall, rating_food, rating_service, rating_ambiance, rating_value, text_en, text_ar, visit_date, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()-($11||' days')::interval)
      ON CONFLICT DO NOTHING
    `, [rev.u, rev.r, rev.o, rev.f, rev.s, rev.a, rev.v, rev.en, rev.ar, visitDate, rev.days]);
    if (res.rowCount > 0) reviewsAdded++;
  } catch (e) { console.error(`  Review failed (u${rev.u}→r${rev.r}):`, e.message); }
}
console.log(`✅ Added ${reviewsAdded} new reviews (${reviews.length} attempted)\n`);

// ── 2. SYNC RESTAURANT STATS ────────────────────────────────────────────────
console.log('Syncing restaurant avg_rating and review_count...');
const syncRes = await q(`
  UPDATE restaurants r
  SET 
    avg_rating = ROUND((SELECT AVG(rv.rating_overall) FROM reviews rv WHERE rv.restaurant_id = r.id)::numeric, 2),
    review_count = (SELECT COUNT(*) FROM reviews rv WHERE rv.restaurant_id = r.id),
    updated_at = NOW()
  WHERE EXISTS (SELECT 1 FROM reviews rv WHERE rv.restaurant_id = r.id)
  RETURNING id, name_en, avg_rating, review_count
`);
for (const row of syncRes.rows) {
  console.log(`  ${row.name_en}: ${row.avg_rating}★ (${row.review_count} reviews)`);
}
console.log();

// ── 3. CREDIBILITY SCORES ────────────────────────────────────────────────────
console.log('Computing user credibility scores...');
await q(`
  UPDATE users u
  SET credibility_score = LEAST(1.0, GREATEST(0.0, (
    CASE WHEN u.is_verified THEN 0.2 ELSE 0 END +
    LEAST(0.5, (SELECT COUNT(*)::numeric FROM reviews rv WHERE rv.user_id = u.id) * 0.07) +
    LEAST(0.2, u.points::numeric / 50000.0) +
    CASE WHEN u.username IS NOT NULL THEN 0.05 ELSE 0 END +
    CASE WHEN u.avatar_url IS NOT NULL THEN 0.05 ELSE 0 END
  )))
`);
const credRes = await q('SELECT name_en, username, credibility_score FROM users WHERE id > 1 ORDER BY credibility_score DESC');
for (const row of credRes.rows) {
  console.log(`  ${row.name_en} (@${row.username}): ${Number(row.credibility_score).toFixed(2)}`);
}
console.log();

// ── 4. TAGS ────────────────────────────────────────────────────────────────────
console.log('Seeding tags...');
const tags = [
  { en:'Family Friendly', ar:'مناسب للعائلات', slug:'family-friendly' },
  { en:'Outdoor Seating', ar:'جلوس خارجي', slug:'outdoor-seating' },
  { en:'Fine Dining', ar:'طعام راقٍ', slug:'fine-dining' },
  { en:'Halal', ar:'حلال', slug:'halal' },
  { en:'Vegetarian Friendly', ar:'صديق للنباتيين', slug:'vegetarian-friendly' },
  { en:'Live Music', ar:'موسيقى حية', slug:'live-music' },
  { en:'Private Dining', ar:'غرفة خاصة', slug:'private-dining' },
  { en:'Late Night', ar:'ليلي', slug:'late-night' },
  { en:'Breakfast', ar:'فطور', slug:'breakfast' },
  { en:'Best Value', ar:'أفضل قيمة', slug:'best-value' },
  { en:'Rooftop', ar:'على السطح', slug:'rooftop' },
  { en:'Waterfront', ar:'على الواجهة البحرية', slug:'waterfront' },
];
for (const t of tags) {
  await q(`INSERT INTO tags (name_en, name_ar, slug, is_active) VALUES ($1,$2,$3,true) ON CONFLICT (slug) DO NOTHING`, [t.en, t.ar, t.slug]);
}
const tagRows = await q('SELECT id, slug FROM tags');
const tm = Object.fromEntries(tagRows.rows.map(t => [t.slug, t.id]));
console.log(`✅ ${tagRows.rows.length} tags exist\n`);

// ── 5. RESTAURANT TAGS ─────────────────────────────────────────────────────────
console.log('Linking restaurant tags...');
const colCheck = await q(`SELECT column_name FROM information_schema.columns WHERE table_name='restaurant_tags'`);
if (colCheck.rows.length > 0) {
  console.log('  restaurant_tags cols:', colCheck.rows.map(r=>r.column_name).join(', '));
  const rtLinks = [
    [1, tm['family-friendly']], [1, tm['halal']], [1, tm['private-dining']],
    [2, tm['fine-dining']], [2, tm['private-dining']], [2, tm['live-music']],
    [3, tm['fine-dining']], [3, tm['late-night']],
    [4, tm['fine-dining']], [4, tm['outdoor-seating']], [4, tm['private-dining']],
    [5, tm['halal']], [5, tm['best-value']], [5, tm['family-friendly']],
    [6, tm['late-night']], [6, tm['outdoor-seating']],
    [7, tm['fine-dining']], [7, tm['private-dining']], [7, tm['live-music']],
    [8, tm['family-friendly']], [8, tm['outdoor-seating']], [8, tm['halal']],
    [9, tm['vegetarian-friendly']], [9, tm['breakfast']], [9, tm['best-value']],
    [10, tm['breakfast']], [10, tm['late-night']],
    [11, tm['family-friendly']], [11, tm['halal']], [11, tm['outdoor-seating']],
    [12, tm['halal']], [12, tm['vegetarian-friendly']], [12, tm['best-value']],
  ];
  for (const [rid, tid] of rtLinks) {
    if (!rid || !tid) continue;
    try { await q(`INSERT INTO restaurant_tags (restaurant_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [rid, tid]); }
    catch (e) { /* skip */ }
  }
  console.log('✅ Restaurant tags linked\n');
} else {
  console.log('  restaurant_tags table has no columns — skipping\n');
}

// ── 6. USER FOLLOWS ─────────────────────────────────────────────────────────
console.log('Seeding user follows...');
const ufCols = await q(`SELECT column_name FROM information_schema.columns WHERE table_name='user_follows'`);
console.log('  user_follows cols:', ufCols.rows.map(r=>r.column_name).join(', '));

const ufLinks = [
  [3,6],[3,9],[3,2],  // Faisal follows Sara, Khalid, Noura
  [9,3],[9,6],[9,7],  // Khalid follows Faisal, Sara, Abdullah
  [6,2],[6,3],[6,4],  // Sara follows Noura, Faisal, Lama
  [2,6],[2,9],        // Noura follows Sara, Khalid
  [4,6],[4,2],        // Lama follows Sara, Noura
  [5,9],[5,3],        // Tariq follows Khalid, Faisal
  [7,3],[7,6],        // Abdullah follows Faisal, Sara
  [8,2],[8,6],        // Reem follows Noura, Sara
];

const hasStatus = ufCols.rows.some(r => r.column_name === 'status');
for (const [fr, fo] of ufLinks) {
  try {
    if (hasStatus) {
      await q(`INSERT INTO user_follows (follower_id, following_id, status, created_at) VALUES ($1,$2,'accepted',NOW()) ON CONFLICT DO NOTHING`, [fr, fo]);
    } else {
      await q(`INSERT INTO user_follows (follower_id, following_id, created_at) VALUES ($1,$2,NOW()) ON CONFLICT DO NOTHING`, [fr, fo]);
    }
  } catch (e) { console.error('  uf error:', e.message); }
}
console.log(`✅ User follows seeded\n`);

// ── 7. RESTAURANT FOLLOWS ─────────────────────────────────────────────────────
console.log('Seeding restaurant follows...');
const rfLinks = [
  [3,1],[3,7],[3,2],[9,2],[9,7],[9,11],
  [6,9],[6,10],[6,3],[2,10],[2,1],[2,11],
  [4,5],[4,9],[4,12],[5,7],[5,5],[5,1],
  [7,4],[7,8],[8,10],[8,11],[7,2],[9,1],
];
for (const [uid, rid] of rfLinks) {
  try {
    await q(`INSERT INTO restaurant_follows (user_id, restaurant_id, follow_type, created_at) VALUES ($1,$2,'all',NOW()) ON CONFLICT DO NOTHING`, [uid, rid]);
  } catch (e) { /* skip */ }
}
// Sync follower counts
await q(`
  UPDATE restaurants r SET follower_count = (SELECT COUNT(*) FROM restaurant_follows rf WHERE rf.restaurant_id = r.id)
`);
console.log(`✅ Restaurant follows seeded\n`);

// ── 8. REVIEW LIKES ────────────────────────────────────────────────────────────
console.log('Seeding review likes...');
const allRevs = await q('SELECT id, user_id FROM reviews ORDER BY id');
let likesAdded = 0;
const likerPool = [2,3,4,5,6,7,8,9];
for (const rev of allRevs.rows) {
  const likers = likerPool.filter(uid => uid !== rev.user_id).slice(0, 3);
  for (const liker of likers) {
    try {
      const res = await q(`INSERT INTO review_likes (review_id, user_id, created_at) VALUES ($1,$2,NOW()) ON CONFLICT DO NOTHING`, [rev.id, liker]);
      if (res.rowCount > 0) likesAdded++;
    } catch (e) { /* skip */ }
  }
}
await q(`UPDATE reviews r SET like_count = (SELECT COUNT(*) FROM review_likes rl WHERE rl.review_id = r.id)`);
console.log(`✅ Added ${likesAdded} review likes\n`);

// ── 9. RESTAURANT STORIES ─────────────────────────────────────────────────────
console.log('Seeding restaurant stories...');
const imgBase = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop';
const stories = [
  { rest:1, user:3, en:'Had an incredible night at Najd Village. The traditional majlis setting and aromatic Jareesh made it unforgettable! 🇸🇦', ar:'قضيت ليلة لا تنسى في نجد فيليدج. المجلس التقليدي والجريش العطري جعلاها لا تُنسى!', days:14, views:312, likes:28 },
  { rest:2, user:9, en:"Chef's Table at Nakheel was pure magic. Every course was a masterpiece. ✨", ar:'طاولة الشيف في نخيل كانت سحراً خالصاً. كل مرحلة كانت تحفة فنية.', days:21, views:587, likes:54 },
  { rest:5, user:4, en:'Al Baik never disappoints! The classic crispy chicken with garlic sauce is my comfort food. 🍗', ar:'البيك لا يخيب أبداً! الدجاج المقرمش الكلاسيكي مع صلصة الثوم هو طعامي المريح.', days:7, views:843, likes:91 },
  { rest:7, user:6, en:'The Wagyu Tomahawk at The Grill House is absolutely STUNNING. Worth every riyal. 🥩🔥', ar:'توماهوك واغيو في The Grill House مذهل تماماً. يستحق كل ريال.', days:30, views:421, likes:47 },
  { rest:10, user:2, en:"Café Bateel's signature latte with date syrup is luxury in a cup. ☕🌴", ar:'لاتيه باتيل المميز مع شراب التمر فخامة في كوب.', days:5, views:263, likes:31 },
  { rest:11, user:8, en:'Bahar Seafood — the freshest hammour in Riyadh. The seafood platter for 4 is absolutely spectacular! 🦞', ar:'بحر للمأكولات البحرية - أطازج الهامور في الرياض. طبق المأكولات البحرية لـ4 أشخاص مذهل!', days:11, views:189, likes:22 },
];
for (const s of stories) {
  const d = new Date(); d.setDate(d.getDate() - s.days);
  try {
    await q(`
      INSERT INTO restaurant_stories (restaurant_id, user_id, caption_en, caption_ar, media_urls, media_type, status, view_count, like_count, created_at, approved_at)
      VALUES ($1,$2,$3,$4,$5,'photo','approved',$6,$7,$8,$8) ON CONFLICT DO NOTHING
    `, [s.rest, s.user, s.en, s.ar, JSON.stringify([imgBase]), s.views, s.likes, d.toISOString()]);
  } catch (e) { console.error('  Story error:', e.message); }
}
console.log('✅ Stories seeded\n');

// ── FINAL SUMMARY ─────────────────────────────────────────────────────────────
const [rv, uf, rf, tg, st, rl] = await Promise.all([
  q('SELECT COUNT(*) FROM reviews'),
  q('SELECT COUNT(*) FROM user_follows'),
  q('SELECT COUNT(*) FROM restaurant_follows'),
  q('SELECT COUNT(*) FROM tags'),
  q("SELECT COUNT(*) FROM restaurant_stories WHERE status='approved'"),
  q('SELECT COUNT(*) FROM review_likes'),
]);
console.log('═══════════════════════════════════');
console.log('FINAL DATABASE STATS:');
console.log(`  Reviews:             ${rv.rows[0].count}`);
console.log(`  Review likes:        ${rl.rows[0].count}`);
console.log(`  User follows:        ${uf.rows[0].count}`);
console.log(`  Restaurant follows:  ${rf.rows[0].count}`);
console.log(`  Tags:                ${tg.rows[0].count}`);
console.log(`  Stories (approved):  ${st.rows[0].count}`);
console.log('═══════════════════════════════════');

await pool.end();
console.log('\n✅ All done!');
