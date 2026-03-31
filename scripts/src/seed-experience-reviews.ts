import { db } from '@workspace/db';
import { experienceReviewsTable, experiencesTable } from '@workspace/db/schema';
import { eq, sql } from 'drizzle-orm';

interface ReviewData {
  userId: number;
  experienceId: number;
  rating: string;
  ratingFood: string;
  ratingHospitality: string;
  ratingAmbiance: string;
  ratingValue: string;
  ratingOverall: string;
  textEn: string;
  textAr: string;
  isVerified: boolean;
}

const REVIEWS: ReviewData[] = [
  // ── Experience 1: Private Chef Wagyu Dinner ──────────────────────────────
  {
    userId: 3, experienceId: 1,
    rating: '5.00', ratingFood: '5.00', ratingHospitality: '5.00', ratingAmbiance: '5.00', ratingValue: '4.50', ratingOverall: '5.00',
    textEn: 'An absolutely unforgettable evening. Chef Hamad presented each wagyu course with extraordinary finesse — the A5 tataki with ponzu and micro herbs was a revelation. The private setting felt truly exclusive, and the sommelier pairings elevated every bite. Worth every riyal and then some. I will be booking again for our anniversary.',
    textAr: 'أمسية لا تُنسى على الإطلاق. قدّم الشيف حماد كل طبق واغيو بتفنن استثنائي — تاتاكي A5 مع البونزو والأعشاب الدقيقة كان كشفاً حقيقياً. الجلسة الخاصة كانت حصرية بالمعنى الكامل للكلمة، وتناغم النبيذ رفع كل لقمة إلى مستوى آخر. يستحق كل ريال والمزيد. سأحجز مجدداً لمناسبة ذكرى زواجنا.',
    isVerified: true,
  },
  {
    userId: 5, experienceId: 1,
    rating: '4.80', ratingFood: '5.00', ratingHospitality: '4.80', ratingAmbiance: '4.60', ratingValue: '4.50', ratingOverall: '4.80',
    textEn: 'My partner and I did this for a special birthday dinner and it exceeded every expectation. Seven courses of pure perfection — the truffle risotto before the wagyu main was ingenious. Chef was personable and talked us through every ingredient and technique. The private dining room was intimate and beautifully lit. Only tiny gripe: it ran 20 minutes over time, but we honestly didn\'t mind.',
    textAr: 'احتفلت أنا وشريكي بهذه التجربة في عيد ميلاد خاص وتجاوزت كل توقعاتنا. سبعة أطباق من الكمال المطلق — ريزوتو الكمأة قبل طبق الواغيو الرئيسي كان ذكياً للغاية. الشيف كان ودوداً وشرح لنا كل مكوّن وأسلوب طهي. غرفة الطعام الخاصة كانت حميمة ومضاءة بشكل جميل. الملاحظة الوحيدة: تأخرت التجربة 20 دقيقة، لكننا صراحةً لم نمانع.',
    isVerified: true,
  },
  {
    userId: 8, experienceId: 1,
    rating: '5.00', ratingFood: '5.00', ratingHospitality: '5.00', ratingAmbiance: '5.00', ratingValue: '5.00', ratingOverall: '5.00',
    textEn: 'I\'ve done private chef dinners in Tokyo, London, and New York — this rivals them all. The Miyazaki A5 beef was sourced impeccably and cooked to absolute perfection. Chef spent time with us between courses, sharing the philosophy behind each dish. The dessert — a wagyu tallow canelé with salted caramel — was pure genius. Standing ovation.',
    textAr: 'جربت عشاءات الشيف الخاص في طوكيو ولندن ونيويورك — هذه التجربة تضاهيها جميعاً. لحم بقر ميازاكي A5 تم الحصول عليه بشكل لا تشوبه شائبة وطُهي بكمال تام. أمضى الشيف وقتاً معنا بين الأطباق مشاركاً الفلسفة وراء كل طبق. الحلوى — كانيليه الواغيو بالكراميل المملح — كانت عبقريةً خالصة. تحية وقوف.',
    isVerified: true,
  },
  {
    userId: 11, experienceId: 1,
    rating: '4.50', ratingFood: '4.80', ratingHospitality: '4.50', ratingAmbiance: '4.00', ratingValue: '4.00', ratingOverall: '4.50',
    textEn: 'Very impressive culinary experience. The wagyu courses were spectacular, particularly the A5 striploin with bone marrow butter. I would have liked slightly more variety in the vegetable accompaniments — they felt repetitive by course four — but the proteins were flawless. The chef was knowledgeable and engaging. Will definitely return.',
    textAr: 'تجربة طهي رائعة جداً. كانت أطباق الواغيو مذهلة، خاصةً شريحة الضلع A5 مع زبدة نخاع العظام. كنت أفضّل تنوعاً أكبر في الخضروات المصاحبة — بدت متكررة بحلول الطبق الرابع — لكن البروتينات كانت عيباً لا يُذكر. الشيف كان متعلماً وجذاباً. سأعود بالتأكيد.',
    isVerified: false,
  },

  // ── Experience 2: Omakase Sushi Masterclass ────────────────────────────
  {
    userId: 2, experienceId: 2,
    rating: '5.00', ratingFood: '5.00', ratingHospitality: '5.00', ratingAmbiance: '4.80', ratingValue: '4.80', ratingOverall: '5.00',
    textEn: 'Chef Kenji is a master of his craft. We learned the difference between nigiri techniques for different fish, how to properly season sushi rice with the right balance of vinegar and sugar, and how to read the quality of fish at market. We made 12 varieties of nigiri and a dragon roll. I now approach supermarket sushi with a whole new critical eye. Exceptional class.',
    textAr: 'الشيف كينجي متقن لفنّه. تعلمنا الفرق بين تقنيات النيغيري لأنواع السمك المختلفة، وكيفية تتبيل أرز السوشي بالتوازن الصحيح بين الخل والسكر، وكيفية قراءة جودة السمك في السوق. صنعنا 12 نوعاً من النيغيري ودراغون رول. أتعامل الآن مع سوشي السوبر ماركت بعين ناقدة جديدة كلياً. درس استثنائي.',
    isVerified: true,
  },
  {
    userId: 6, experienceId: 2,
    rating: '4.70', ratingFood: '5.00', ratingHospitality: '4.50', ratingAmbiance: '4.50', ratingValue: '4.70', ratingOverall: '4.70',
    textEn: 'I gifted this to my husband for his birthday and he absolutely loved it. Chef Kenji has a wonderful teaching style — patient, precise, and passionate about the craft. The tuna and hamachi we worked with were restaurant-grade and tasted incredible. My husband came home with a beautiful platter he had prepared himself. The pride on his face was priceless.',
    textAr: 'أهديت هذه التجربة لزوجي في عيد ميلاده وأحبها كثيراً. الشيف كينجي أسلوب تدريس رائع — صبور ودقيق وشغوف بالفن. التونة والهاماتشي التي عملنا بها كانت بمستوى المطاعم وطعمها كان رائعاً. عاد زوجي للمنزل بطبق جميل أعدّه بنفسه. الفخر على وجهه كان لا يُقدّر بثمن.',
    isVerified: true,
  },
  {
    userId: 9, experienceId: 2,
    rating: '4.90', ratingFood: '5.00', ratingHospitality: '5.00', ratingAmbiance: '4.60', ratingValue: '4.80', ratingOverall: '4.90',
    textEn: 'As someone who trained in Japanese cooking, I was skeptical about what I could learn — but Chef Kenji surprised me with his depth of knowledge. We covered rice fermentation aging, knife angles for different fish textures, and even the philosophy of umami balance in a single piece of nigiri. The group was small (6 people) which made it very personal. Highly recommended.',
    textAr: 'كشخص تدرّب على الطبخ الياباني، كنت متشككاً فيما يمكنني تعلمه — لكن الشيف كينجي فاجأني بعمق معرفته. درسنا تخمير الأرز وتعتيقه، وزوايا السكاكين لأنسجة السمك المختلفة، وحتى فلسفة توازن الأوماني في قطعة نيغيري واحدة. كانت المجموعة صغيرة (6 أشخاص) مما جعل التجربة شخصية جداً. أنصح بها بشدة.',
    isVerified: false,
  },

  // ── Experience 3: Desert Starlight Dining — Al Ula ────────────────────
  {
    userId: 1, experienceId: 3,
    rating: '5.00', ratingFood: '5.00', ratingHospitality: '5.00', ratingAmbiance: '5.00', ratingValue: '4.80', ratingOverall: '5.00',
    textEn: 'Dining under the Al Ula stars is one of the most magical experiences I\'ve ever had. The sandstone formations lit by warm torchlight, a sky absolutely blanketed in stars, and six courses of refined Saudi and international cuisine. The lamb ouzi slow-cooked in the desert oven was otherworldly. Every detail — the hand-embroidered tablecloths, the oud player, the rose water hand wash — was curated with love.',
    textAr: 'تناول الطعام تحت نجوم العُلا هو من أكثر التجارب سحراً في حياتي. التكوينات الحجرية الرملية المضاءة بضوء المشاعل الدافئ، وسماء مكللة بالنجوم، وستة أطباق من المطبخ السعودي والعالمي المتطور. خروف الأوزي المطبوخ ببطء في فرن الصحراء كان من عالم آخر. كل تفصيل — المفارش المطرزة يدوياً، وعازف العود، وغسيل اليدين بماء الورد — كان منسقاً بحب.',
    isVerified: true,
  },
  {
    userId: 4, experienceId: 3,
    rating: '5.00', ratingFood: '4.80', ratingHospitality: '5.00', ratingAmbiance: '5.00', ratingValue: '4.60', ratingOverall: '5.00',
    textEn: 'This isn\'t just dinner — it\'s a full sensory journey. Arriving by 4x4 to watch the sunset paint the Hijaz mountains gold, then sitting down to an eight-course feast as the Milky Way emerges overhead... there are no words for it. The bedouin guides were extraordinary storytellers. The prices are steep but this is genuinely a bucket-list experience. My wife cried at the sheer beauty of it.',
    textAr: 'هذه ليست مجرد عشاء — إنها رحلة حسية كاملة. الوصول بسيارة رباعية الدفع لمشاهدة الغروب يطلي جبال الحجاز بالذهب، ثم الجلوس لتناول ثمانية أطباق بينما تظهر مجرة درب التبانة فوق رؤوسنا... لا توجد كلمات لوصف ذلك. الأدلاء البدويون كانوا رواةً استثنائيين. الأسعار مرتفعة لكن هذه تجربة من قائمة الأمنيات بحق. بكت زوجتي من جمالها المطلق.',
    isVerified: true,
  },
  {
    userId: 12, experienceId: 3,
    rating: '4.60', ratingFood: '4.50', ratingHospitality: '4.80', ratingAmbiance: '5.00', ratingValue: '4.20', ratingOverall: '4.60',
    textEn: 'The setting is incomparable — no other dining experience I\'ve tried comes close to the ambiance of Al Ula at night. The food was excellent (the date leaf-smoked lamb is a standout), though one course was somewhat unremarkable. The team made extraordinary effort to accommodate my dietary restrictions without any fuss. Would definitely return with family.',
    textAr: 'البيئة لا مثيل لها — لا تقترب أي تجربة طعام أخرى جربتها من أجواء العُلا ليلاً. كان الطعام ممتازاً (خروف المدخن بأوراق التمر لافت للنظر)، وإن كان طبق واحد أقل إثارةً بعض الشيء. بذل الفريق جهداً استثنائياً لمراعاة قيودي الغذائية دون أي تعقيد. سأعود بالتأكيد مع العائلة.',
    isVerified: false,
  },

  // ── Experience 4: Levantine Mezze & Bread Workshop ────────────────────
  {
    userId: 7, experienceId: 4,
    rating: '4.80', ratingFood: '5.00', ratingHospitality: '4.80', ratingAmbiance: '4.60', ratingValue: '5.00', ratingOverall: '4.80',
    textEn: 'I never knew making hummus was such an art form. Chef Armine walked us through the process of using dried chickpeas soaked overnight, which gives a completely different depth than canned. We learned to make man\'oushe dough by feel, bake it on a saj, and blend six different dips from scratch. Came home with a notebook full of secrets and a belly full of mezze.',
    textAr: 'لم أكن أعلم أن صنع الحمص هو شكل فني بحد ذاته. أرشدتنا الشيف أرميني خلال عملية استخدام الحمص المجفف المنقوع طوال الليل، مما يعطي عمقاً مختلفاً كلياً عن المعلّب. تعلمنا عجن المعجون بالإحساس، وخبزه على الصاج، ومزج ستة صلصات مختلفة من الصفر. عدت للمنزل بدفتر مليء بالأسرار وبطن مليء بالمازة.',
    isVerified: true,
  },
  {
    userId: 10, experienceId: 4,
    rating: '4.90', ratingFood: '5.00', ratingHospitality: '5.00', ratingAmbiance: '4.70', ratingValue: '4.90', ratingOverall: '4.90',
    textEn: 'Chef Armine brings such warmth and generosity to this class. We started with a tour of her spice pantry and she explained the origin stories of Levantine cuisine. The bread-making was the highlight — stretching the dough over the saj and watching it puff up is pure joy. We ate everything we made, together, around a big table. Felt like being welcomed into someone\'s home.',
    textAr: 'تجلب الشيف أرميني دفئاً وكرماً رائعاً لهذا الدرس. بدأنا بجولة في مخزن توابلها وشرحت قصص أصول المطبخ الشامي. كان صنع الخبز هو النقطة الأكثر إبهاراً — مد العجينة فوق الصاج ومشاهدتها تنتفخ هو فرح نقي. أكلنا كل ما صنعناه، معاً، حول طاولة كبيرة. شعرنا كأننا نُرحَّب بنا في بيت شخص عزيز.',
    isVerified: true,
  },
  {
    userId: 3, experienceId: 4,
    rating: '4.40', ratingFood: '4.50', ratingHospitality: '4.50', ratingAmbiance: '4.30', ratingValue: '4.60', ratingOverall: '4.40',
    textEn: 'Really enjoyable workshop for someone who loves Middle Eastern food. We covered hummus, baba ganoush, labneh, three styles of man\'oushe, and kibbeh. My hands still smell of za\'atar and I couldn\'t be happier about it. The class size of 8 was perfect — enough energy, but you got personal attention. A few tips felt rushed near the end but overall a wonderful experience.',
    textAr: 'ورشة ممتعة جداً لمن يحب الطعام الشرقي. تناولنا الحمص والباباغنوش واللبنة وثلاثة أنواع من المعجنات والكبة. لا تزال يداي تفوحان برائحة الزعتر ولا شيء يسعدني أكثر. حجم الفصل المكون من 8 أشخاص كان مثالياً — طاقة كافية مع اهتمام شخصي. بعض النصائح بدت متسرعة في نهاية الدرس لكن التجربة رائعة بشكل عام.',
    isVerified: false,
  },

  // ── Experience 5: Dammam Corniche Seafood Grill ────────────────────────
  {
    userId: 2, experienceId: 5,
    rating: '4.70', ratingFood: '4.80', ratingHospitality: '4.80', ratingAmbiance: '4.60', ratingValue: '4.80', ratingOverall: '4.70',
    textEn: 'The Gulf breeze, the sunset over the Arabian Sea, and a table full of freshly caught seafood grilled over charcoal — this is what summer dining in the Eastern Province is about. The hammour with lemon and dill butter was outstanding. Our host Priya was knowledgeable about each fish variety and patiently answered every question. The grilled prawns came alive with her homemade tamarind sauce.',
    textAr: 'نسيم الخليج وغروب الشمس على بحر العرب وطاولة مليئة بالمأكولات البحرية الطازجة المشوية على الفحم — هذا ما يعنيه تناول الطعام صيفاً في المنطقة الشرقية. كان الهامور مع الليمون وزبدة الشبت رائعاً. مضيفتنا بريا كانت على دراية بكل نوع من السمك وأجابت بصبر على كل سؤال. الروبيان المشوي تألّق مع صلصة التمر الهندي المصنوعة منزلياً.',
    isVerified: true,
  },
  {
    userId: 8, experienceId: 5,
    rating: '4.50', ratingFood: '4.60', ratingHospitality: '4.40', ratingAmbiance: '4.50', ratingValue: '4.60', ratingOverall: '4.50',
    textEn: 'Lovely outdoor dining experience along Dammam Corniche. The seafood platter was enormous — fresh shrimp, clams, hammour, king fish — all grilled beautifully. We went on a Thursday evening and watched the whole city come alive along the waterfront. The spiced corn on the cob was an unexpected highlight. Only downside was the wind made some of the candles blow out repeatedly.',
    textAr: 'تجربة طعام خارجية رائعة على كورنيش الدمام. كان طبق المأكولات البحرية ضخماً — روبيان طازج وبلح البحر وهامور وكنعد — كلها مشوية بشكل رائع. ذهبنا في مساء الخميس وشاهدنا المدينة كلها تنبعث حياةً على الواجهة البحرية. الذرة المتبلة كانت مفاجأة سعيدة. الجانب السلبي الوحيد كان أن الريح أطفأت بعض الشموع بشكل متكرر.',
    isVerified: false,
  },
  {
    userId: 11, experienceId: 5,
    rating: '4.90', ratingFood: '5.00', ratingHospitality: '4.80', ratingAmbiance: '4.80', ratingValue: '4.80', ratingOverall: '4.90',
    textEn: 'Best seafood experience I\'ve had outside of a five-star hotel — and honestly, it beat most of those too. Everything was sourced that morning from the Dammam fish market. The whole grilled safi with herb chermoula was magnificent. Priya personally grilled each piece to order and paired each fish with a different house-made condiment. Small group of 10 meant it felt intimate. Will be back monthly.',
    textAr: 'أفضل تجربة مأكولات بحرية خارج فندق خمس نجوم جربتها — وصراحةً تفوقت على معظمها. كل شيء كان مصدره سوق الدمام للأسماك في الصباح. السافي الكامل المشوي مع شيرمولا الأعشاب كان رائعاً. قامت بريا شخصياً بشوي كل قطعة حسب الطلب وجمعت كل سمكة مع صلصة منزلية مختلفة. مجموعة صغيرة من 10 أشخاص جعلت التجربة حميمة. سأعود شهرياً.',
    isVerified: true,
  },

  // ── Experience 6: Makkah Heritage Dates & Qahwa Journey ───────────────
  {
    userId: 4, experienceId: 6,
    rating: '4.80', ratingFood: '5.00', ratingHospitality: '5.00', ratingAmbiance: '4.60', ratingValue: '5.00', ratingOverall: '4.80',
    textEn: 'This experience opened my eyes to the incredible world of Saudi dates. We tasted 14 varieties — from the buttery Sukkari to the complex, caramel-dark Khudri — paired with three styles of qahwa: plain, saffron-infused, and cardamom-heavy. Our guide explained the sacred significance of dates in Islamic culture and the history of Al Hijaz coffee trade routes. Deeply educational and profoundly delicious.',
    textAr: 'فتحت هذه التجربة عيني على عالم التمور السعودية الرائع. تذوقنا 14 نوعاً — من السكري الزبداني إلى الخضري الغامق الكراميلي المعقد — مقترنةً بثلاثة أنواع من القهوة: سادة ومنقوعة بالزعفران وغنية بالهيل. شرح مرشدنا الأهمية الدينية للتمور في الثقافة الإسلامية وتاريخ طرق تجارة قهوة الحجاز. تجربة تعليمية عميقة ولذيذة بشكل عميق.',
    isVerified: true,
  },
  {
    userId: 9, experienceId: 6,
    rating: '4.60', ratingFood: '4.70', ratingHospitality: '4.80', ratingAmbiance: '4.40', ratingValue: '4.90', ratingOverall: '4.60',
    textEn: 'A beautiful and underrated cultural experience. The guide was a third-generation date farmer and his passion for the craft was infectious. We learned about the harvesting calendar, the traditional drying and pressing methods for date syrup (dibs), and how the Hejazi coffee ritual differs from Najdi traditions. Came away with a box of Ajwa dates and a recipe for saffron qahwa I\'ll treasure.',
    textAr: 'تجربة ثقافية جميلة ومقللة من شأنها. كان المرشد مزارع تمر من الجيل الثالث وشغفه بالحرفة كان معدياً. تعلمنا عن تقويم الحصاد وطرق التجفيف والعصر التقليدية لدبس التمر، وكيف يختلف طقس القهوة الحجازية عن التقاليد النجدية. غادرت بصندوق من تمر عجوة ووصفة قهوة بالزعفران سأعتز بها.',
    isVerified: false,
  },

  // ── Experience 7: Madinah Traditional Feast — Al Anbariyah ───────────
  {
    userId: 1, experienceId: 7,
    rating: '5.00', ratingFood: '5.00', ratingHospitality: '5.00', ratingAmbiance: '5.00', ratingValue: '4.80', ratingOverall: '5.00',
    textEn: 'Joining a Madinah family for iftar was the most moving food experience of my life. Seated on a traditional carpet in the courtyard, we broke fast with Zamzam water and dates before a feast that took three days to prepare: harees, thareed, kabsa with lamb, and a tray of Madinah sweets including tamr bil loz and sugary ghorayebah. The hospitality was from another era entirely.',
    textAr: 'الانضمام إلى عائلة مدنية لتناول الإفطار كان من أكثر تجارب الطعام تأثيراً في حياتي. جلسنا على سجادة تقليدية في الفناء وأفطرنا بماء زمزم وتمر قبل وليمة استغرق إعدادها ثلاثة أيام: هريس وثريد وكبسة بالخروف وصينية من حلويات المدينة منها التمر باللوز والغريبة السكرية. الضيافة كانت من عصر آخر كلياً.',
    isVerified: true,
  },
  {
    userId: 6, experienceId: 7,
    rating: '4.90', ratingFood: '5.00', ratingHospitality: '5.00', ratingAmbiance: '4.70', ratingValue: '4.80', ratingOverall: '4.90',
    textEn: 'The grandmother of the host family prepared everything and she was simply magnificent — a true keeper of culinary heritage. The thareed had depth of flavor I\'ve never encountered in any restaurant version. She explained how the bread is left to absorb the stew overnight for maximum flavor. The Hijazi spice blend she uses is a closely guarded family recipe. A privilege to witness and taste.',
    textAr: 'أعدّت جدة العائلة المضيفة كل شيء وكانت ببساطة رائعة — حارسة حقيقية للتراث الطهوي. كان للثريد عمق نكهة لم أصادفه في أي نسخة مطعمية. شرحت كيف يُترك الخبز لامتصاص الحساء طوال الليل لتحقيق أقصى نكهة. مزيج التوابل الحجازي الذي تستخدمه هو وصفة عائلية مكتومة. امتياز حقيقي أن تشهده وتتذوقه.',
    isVerified: true,
  },
  {
    userId: 10, experienceId: 7,
    rating: '4.70', ratingFood: '4.80', ratingHospitality: '5.00', ratingAmbiance: '4.50', ratingValue: '4.80', ratingOverall: '4.70',
    textEn: 'One of the most authentic cultural dining experiences available in Saudi. Sitting in a traditional Madinah home, eating food prepared with generations of knowledge, listening to the family share stories of the city\'s culinary heritage. The harees was delicately spiced and the lamb fell apart at the gentlest touch. Highly recommend for anyone wanting to go beyond tourist dining.',
    textAr: 'من أكثر تجارب الطعام الثقافية الأصيلة المتاحة في المملكة. الجلوس في منزل مدني تقليدي وتناول طعام أُعد بمعرفة متراكمة عبر الأجيال والاستماع إلى العائلة وهي تشارك قصص التراث الطهوي للمدينة. كان الهريس متبلاً بدقة والخروف يتفتت بأخف لمسة. أنصح بها بشدة لمن يريد تجاوز مطاعم السياحة.',
    isVerified: false,
  },

  // ── Experience 8: Jeddah Rooftop Dinner with Red Sea Views ────────────
  {
    userId: 5, experienceId: 8,
    rating: '4.90', ratingFood: '4.80', ratingHospitality: '5.00', ratingAmbiance: '5.00', ratingValue: '4.70', ratingOverall: '4.90',
    textEn: 'The view alone is worth the price of admission. Watching the Red Sea shimmer at golden hour while sipping fresh mint lemonade and nibbling on hamour ceviche — this is Jeddah living at its finest. The four-course menu leaned into local seafood with global technique: sea bass crudo with jalapeño oil, slow-braised hammour, and a rosewater-infused panna cotta. The warm Hejazi bread served throughout was phenomenal.',
    textAr: 'المشهد وحده يستحق سعر التجربة. مشاهدة البحر الأحمر يتألق عند الغروب الذهبي بينما ترتشف ليموناد النعناع الطازج وتتناول سيفيتشي الهامور — هذا هو عيش جدة في أرقى صوره. تضمنت قائمة الأطباق الأربعة المأكولات البحرية المحلية مع تقنية عالمية: كرودو السيباس مع زيت الهلبيني، وهامور مطهو ببطء، وبانا كوتا بالماء الوردي. الخبز الحجازي الدافئ المقدَّم طوال العشاء كان استثنائياً.',
    isVerified: true,
  },
  {
    userId: 3, experienceId: 8,
    rating: '4.80', ratingFood: '4.70', ratingHospitality: '4.90', ratingAmbiance: '5.00', ratingValue: '4.60', ratingOverall: '4.80',
    textEn: 'Celebrated our 10th anniversary here and it was everything we hoped for and more. The rooftop overlooks the old city and Al Balad with the corniche beyond — a panorama unlike anywhere else in the Kingdom. Service was attentive without being intrusive. The octopus with preserved lemon and harissa was the finest starter I\'ve eaten this year. Dessert platter had five miniatures, all exquisite.',
    textAr: 'احتفلنا بذكرى زواجنا العاشرة هنا وكانت كل ما أملناه وأكثر. يطل السطح على المدينة القديمة والبلد والكورنيش خلفه — بانوراما لا مثيل لها في أي مكان آخر في المملكة. الخدمة كانت حاضرة دون أن تكون متطفلة. الأخطبوط مع الليمون المحفوظ والهريسة كان أرقى مقبلات تناولتها هذا العام. طبق الحلويات ضم خمس مصغرات، كلها رائعة.',
    isVerified: true,
  },
  {
    userId: 12, experienceId: 8,
    rating: '4.50', ratingFood: '4.40', ratingHospitality: '4.60', ratingAmbiance: '5.00', ratingValue: '4.30', ratingOverall: '4.50',
    textEn: 'The ambiance is genuinely spectacular — there\'s nowhere else in Jeddah quite like this rooftop. The food was good but not quite at the level I expected for the price point; the main course (grilled hammour) was slightly overcooked. That said, the starters and desserts more than made up for it, and the sunset timing was perfectly orchestrated. Would return for special occasions.',
    textAr: 'الأجواء رائعة بصدق — لا يوجد مكان آخر في جدة مثل هذا السطح. كان الطعام جيداً لكن ليس بالمستوى الذي توقعته مقابل السعر؛ كان الطبق الرئيسي (هامور مشوي) طُهي قليلاً أكثر من اللازم. مع ذلك، المقبلات والحلويات عوّضت عن ذلك وأكثر، وكان توقيت الغروب منسقاً بشكل مثالي. سأعود للمناسبات الخاصة.',
    isVerified: false,
  },

  // ── Experience 9: Riyadh Kabsa & Mandi Cooking Masterclass ───────────
  {
    userId: 7, experienceId: 9,
    rating: '5.00', ratingFood: '5.00', ratingHospitality: '5.00', ratingAmbiance: '4.80', ratingValue: '5.00', ratingOverall: '5.00',
    textEn: 'Chef Mohammed is a treasure. He learned from his grandmother and her grandmother before her, and that lineage of knowledge comes through in every spice blend and every piece of rice. We made kabsa from scratch — toasting the whole spices, building the onion-tomato base, layering the chicken, getting the rice-to-water ratio exact. Then a whole mandi lamb in the underground tandoor. I\'ve been making kabsa for years and still learned fundamentals I\'d never known.',
    textAr: 'الشيف محمد كنز حقيقي. تعلّم من جدته والدة جدته قبلها، وهذا الإرث المعرفي يظهر في كل مزيج توابل وكل حبة أرز. صنعنا الكبسة من الصفر — تحميص التوابل الكاملة وبناء قاعدة البصل والطماطم وتطبيق الدجاج وضبط نسبة الأرز للماء بدقة. ثم خروف مندي كامل في التنور الأرضي. أصنع الكبسة منذ سنوات ومع ذلك تعلمت أساسيات لم أعرفها قط.',
    isVerified: true,
  },
  {
    userId: 2, experienceId: 9,
    rating: '4.80', ratingFood: '5.00', ratingHospitality: '4.80', ratingAmbiance: '4.60', ratingValue: '5.00', ratingOverall: '4.80',
    textEn: 'As an expat living in Riyadh for three years, understanding the national dish at this level changed my relationship with Saudi cuisine entirely. Chef Mohammed explained why Najdi kabsa differs from Eastern Province kabsa, and how each tribe historically used different spice ratios based on their trade route access. Then we cooked both versions and tasted them side by side. Absolutely fascinating and genuinely delicious.',
    textAr: 'كمغترب أعيش في الرياض منذ ثلاث سنوات، غيّر فهم الطبق الوطني على هذا المستوى علاقتي بالمطبخ السعودي كلياً. شرح الشيف محمد لماذا تختلف كبسة نجد عن كبسة المنطقة الشرقية، وكيف استخدمت كل قبيلة تاريخياً نسباً مختلفة من التوابل بناءً على وصولها لطرق التجارة. ثم طبخنا كلا الإصدارين وتذوقناهما جنباً إلى جنب. فاتن حقاً ولذيذ بشكل حقيقي.',
    isVerified: true,
  },
  {
    userId: 5, experienceId: 9,
    rating: '4.70', ratingFood: '4.80', ratingHospitality: '4.70', ratingAmbiance: '4.50', ratingValue: '4.80', ratingOverall: '4.70',
    textEn: 'My teenage son and I did this together and it\'s become one of our favourite shared memories. Chef Mohammed has a gift for making everyone feel like a natural cook. We made kabsa rice that was perfectly separated grain by grain, a hammour mandi, and shawarma-style chicken for comparison. The homemade daqoos sauce (Saudi tomato relish) recipe alone was worth the whole class. Highly recommend for families.',
    textAr: 'قمت بهذه التجربة مع ابني المراهق وأصبحت من أحب ذكرياتنا المشتركة. الشيف محمد يمتلك موهبة في جعل الجميع يشعر أنه طباخ طبيعي. صنعنا أرز الكبسة المتفرق حبة حبة بشكل مثالي، وهامور مندي، ودجاجاً على طريقة الشاورما للمقارنة. وصفة صلصة الدقوس المنزلية (صلصة الطماطم السعودية) وحدها كانت تستحق الدرس كله. أنصح للعائلات.',
    isVerified: false,
  },

  // ── Experience 10: Diriyah Night Street Food Walk ─────────────────────
  {
    userId: 9, experienceId: 10,
    rating: '4.90', ratingFood: '4.80', ratingHospitality: '5.00', ratingAmbiance: '5.00', ratingValue: '5.00', ratingOverall: '4.90',
    textEn: 'Our guide Abdullah brought the alleys of At-Turaif to life in a way no museum could. We wove through illuminated passages, stopped at twelve food stalls, and ate everything from shawarma to saleeg to freshly spun candy floss dusted with rose water. The falafel from the elderly man at stall seven has ruined all other falafel for me forever. Finished with karak at a centuries-old teahouse. Extraordinary.',
    textAr: 'أحيا مرشدنا عبدالله أزقة الطريف بطريقة لا يستطيع أي متحف فعلها. تجولنا عبر ممرات مضاءة وتوقفنا عند اثني عشر بسطة طعام وأكلنا من الشاورما إلى السليق إلى حلوى الغزل المطبوخة طازجاً ومرشوشة بماء الورد. الفلافل من الرجل العجوز في البسطة السابعة دمّر كل الفلافل الأخرى بالنسبة لي إلى الأبد. انتهينا بكرك في بيت شاي عمره قرون. استثنائي.',
    isVerified: true,
  },
  {
    userId: 6, experienceId: 10,
    rating: '4.70', ratingFood: '4.70', ratingHospitality: '4.80', ratingAmbiance: '4.90', ratingValue: '5.00', ratingOverall: '4.70',
    textEn: 'Diriyah at night is magical enough on its own — add a knowledgeable local guide and 12 street food stops and you have an unmissable evening. We learned how each vendor\'s recipe reflects their regional background within Saudi Arabia: the madfoon vendor was from Tabuk, the jareesh lady from Majmaah. The stories woven through the meal made every bite more meaningful. Best value experience on Tabaq.',
    textAr: 'الدرعية ليلاً ساحرة بحد ذاتها — أضف مرشداً محلياً واسع المعرفة و12 محطة طعام شارعي ولديك أمسية لا تُفوَّت. تعلمنا كيف تعكس وصفة كل بائع خلفيته الإقليمية داخل المملكة: بائع المدفون كان من تبوك وسيدة الجريش من المجمعة. القصص المنسوجة خلال الوجبة جعلت كل لقمة ذات معنى أعمق. أفضل تجربة قيمةً على طبق.',
    isVerified: true,
  },
  {
    userId: 4, experienceId: 10,
    rating: '4.80', ratingFood: '4.90', ratingHospitality: '4.70', ratingAmbiance: '4.80', ratingValue: '4.80', ratingOverall: '4.80',
    textEn: 'This two-hour walk through Diriyah was the highlight of our Riyadh trip. The route takes you through the UNESCO heritage site at a pace that lets you absorb the history while eating — we tried 14 different dishes across the walk. The standout: a vendor selling tangy khameer bread with fresh butter that had been made that morning at dawn. The whole group bonded over the shared experience.',
    textAr: 'كانت هذه الجولة الساعتين في الدرعية أبرز ما في رحلتنا إلى الرياض. يأخذك المسار عبر موقع التراث العالمي بوتيرة تتيح لك استيعاب التاريخ أثناء الأكل — جربنا 14 طبقاً مختلفاً على امتداد الجولة. الأكثر بروزاً: بائع يبيع خبز الخمير الحامض مع زبدة طازجة كانت قد خُضّت في فجر ذلك الصباح. تواصلت المجموعة بأكملها من خلال التجربة المشتركة.',
    isVerified: false,
  },
];

async function updateExperienceStats(experienceId: number) {
  const reviews = await db
    .select({ rating: experienceReviewsTable.ratingOverall })
    .from(experienceReviewsTable)
    .where(eq(experienceReviewsTable.experienceId, experienceId));

  if (reviews.length === 0) return;

  const avg = reviews.reduce((sum, r) => sum + parseFloat(r.rating ?? '0'), 0) / reviews.length;
  await db
    .update(experiencesTable)
    .set({
      avgRating: avg.toFixed(2) as any,
      reviewCount: reviews.length,
    })
    .where(eq(experiencesTable.id, experienceId));
}

async function main() {
  console.log('Seeding experience reviews...');

  // Clear existing reviews
  await db.delete(experienceReviewsTable);
  console.log('  Cleared existing reviews');

  for (const r of REVIEWS) {
    await db.insert(experienceReviewsTable).values({
      userId: r.userId,
      experienceId: r.experienceId,
      rating: r.rating as any,
      ratingFood: r.ratingFood as any,
      ratingHospitality: r.ratingHospitality as any,
      ratingAmbiance: r.ratingAmbiance as any,
      ratingValue: r.ratingValue as any,
      ratingOverall: r.ratingOverall as any,
      textEn: r.textEn,
      textAr: r.textAr,
      isVerified: r.isVerified,
    });
    console.log(`  ✓ Experience ${r.experienceId} — user ${r.userId} (${r.rating}★)`);
  }

  // Update avgRating and reviewCount for all experiences
  const expIds = [...new Set(REVIEWS.map(r => r.experienceId))];
  for (const eid of expIds) {
    await updateExperienceStats(eid);
  }
  console.log('\nUpdated experience ratings/counts.');

  console.log(`\nDone — ${REVIEWS.length} reviews seeded across ${expIds.length} experiences.`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
