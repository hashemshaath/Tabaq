import { ChefHat, Award, Star, Flame, Globe, BookOpen, Trophy } from 'lucide-react';

export interface TimelineEntry {
  year: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  icon: typeof ChefHat;
}

export interface SignatureDish {
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  image: string;
  price: string;
  restaurantId: number;
}

export interface ChefEvent {
  dateEn: string;
  dateAr: string;
  titleEn: string;
  titleAr: string;
  venueEn: string;
  venueAr: string;
  type: 'class' | 'dinner' | 'tasting' | 'masterclass';
}

export interface ChefData {
  id: number;
  nameEn: string;
  nameAr: string;
  titleEn: string;
  titleAr: string;
  nationalityEn: string;
  nationalityAr: string;
  restaurantEn: string;
  restaurantAr: string;
  restaurantId: number;
  cityEn: string;
  cityAr: string;
  cuisineEn: string;
  cuisineAr: string;
  photo: string;
  coverPhoto: string;
  coverPhoto2?: string;
  michelinStars: number;
  awards: string[];
  awardsAr: string[];
  bioShortEn: string;
  bioShortAr: string;
  bioEn: string;
  bioAr: string;
  philosophyEn: string;
  philosophyAr: string;
  quoteEn: string;
  quoteAr: string;
  specialtyEn: string;
  specialtyAr: string;
  yearsExp: number;
  featured?: boolean;
  tabaqStars?: number;
  instagram?: string;
  timeline: TimelineEntry[];
  signatureDishes: SignatureDish[];
  upcomingEvents: ChefEvent[];
  recommendedRestaurantsEn: string[];
  recommendedRestaurantsAr: string[];
  recommendedRestaurantIds: number[];
}

export const CHEFS: ChefData[] = [
  {
    id: 1,
    nameEn: 'Hamad Al-Rasheed',
    nameAr: 'حمد الراشد',
    titleEn: 'Executive Chef & Culinary Director',
    titleAr: 'الشيف التنفيذي ومدير الطهي',
    nationalityEn: 'Saudi Arabian',
    nationalityAr: 'سعودي',
    restaurantEn: 'Najd Village',
    restaurantAr: 'قرية نجد',
    restaurantId: 1,
    cityEn: 'Riyadh',
    cityAr: 'الرياض',
    cuisineEn: 'Modern Saudi',
    cuisineAr: 'سعودي حديث',
    photo: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop',
    coverPhoto: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=600&fit=crop',
    coverPhoto2: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=600&fit=crop',
    michelinStars: 1,
    awards: ['Michelin Star 2024', 'Tabaq Chef of the Year 2023', 'Arab World Best Chef 2022'],
    awardsAr: ['نجمة ميشلان 2024', 'شيف العام - طبق 2023', 'أفضل شيف في العالم العربي 2022'],
    bioShortEn: 'Hamad Al-Rasheed is the guardian of Saudi Arabia\'s most treasured flavours — a culinary storyteller who reinterprets Najdi heritage through refined, modern technique.',
    bioShortAr: 'حمد الراشد هو حارس أعظم نكهات المملكة — راوٍ طهوي يُعيد تفسير التراث النجدي عبر تقنيات حديثة راقية.',
    bioEn: 'Born in Riyadh to a family of restaurateurs, Hamad Al-Rasheed grew up surrounded by the smoky aromas of slow-cooked kabsa and the sweet perfume of qahwa. After training at Le Cordon Bleu Paris and honing his craft across Michelin-starred kitchens in London and Tokyo, he returned to the Kingdom with a singular mission: to place Saudi cuisine on the global fine-dining map.\n\nHis flagship restaurant, Najd Village, has become a pilgrimage site for food lovers across the GCC — a place where centuries-old recipes are given new life without losing the soul that defines them. Hamad\'s mastery of Maillard reactions, his obsessive sourcing of heritage grains from Al-Jouf and dates from Al-Ahsa, and his meticulous balance of dried lime, clove, and cardamom have earned him recognition from Michelin, Gault&Millau, and the Arab Culinary Institute.',
    bioAr: 'وُلد حمد الراشد في الرياض لعائلة امتهنت إدارة المطاعم، ونشأ وسط عبق الكبسة المطبوخة على نار هادئة ورائحة القهوة العربية. بعد تدريبه في لو كوردون بلو بباريس وصقل موهبته في مطابخ حائزة على نجوم ميشلان في لندن وطوكيو، عاد إلى المملكة بمهمة واحدة: وضع المطبخ السعودي على خريطة المطاعم الراقية العالمية.\n\nأصبح مطعمه قرية نجد وجهة حجّ لعشاق الطعام في منطقة الخليج — مكان تُمنح فيه الوصفات العريقة روحاً جديدة دون أن تفقد هويتها الأصيلة.',
    philosophyEn: 'Every dish must carry memory. When a guest closes their eyes after the first bite and is transported back to their grandmother\'s kitchen, that is when I know I\'ve done my job.',
    philosophyAr: 'كل طبق يجب أن يحمل ذاكرة. حين يغمض الضيف عينيه بعد أول لقمة وينتقل في خياله إلى مطبخ جدته، أعرف حينها أنني أدّيت مهمتي.',
    quoteEn: 'The spice route didn\'t just pass through Arabia — it was born here.',
    quoteAr: 'طريق التوابل لم يمرّ بالجزيرة العربية فحسب — بل وُلد هنا.',
    specialtyEn: 'Heritage grain kabsa, Slow-roasted whole lamb, Saffron & date desserts',
    specialtyAr: 'كبسة الحبوب التراثية، خروف مشوي بطيء، حلويات الزعفران والتمر',
    yearsExp: 18,
    featured: true,
    tabaqStars: 3,
    instagram: '@chef.hamad.alrasheed',
    timeline: [
      { year: '2006', titleEn: 'Culinary School, Paris', titleAr: 'مدرسة الطهي، باريس', descEn: 'Graduated with honours from Le Cordon Bleu, specialising in classic French technique.', descAr: 'تخرّج بامتياز من لو كوردون بلو متخصصاً في التقنيات الفرنسية الكلاسيكية.', icon: BookOpen },
      { year: '2009', titleEn: 'London Stage', titleAr: 'تدريب في لندن', descEn: 'Joined the brigade at a 3-Michelin-star restaurant under Chef Gordon Ramsay.', descAr: 'انضم إلى فريق مطعم حائز 3 نجوم ميشلان تحت إشراف الشيف غوردون رامزي.', icon: Award },
      { year: '2013', titleEn: 'Tokyo Immersion', titleAr: 'تجربة طوكيو', descEn: 'Spent two years in Japan studying washoku philosophy and umami layering.', descAr: 'أمضى عامين في اليابان يدرس فلسفة الواشوكو وتوازن نكهة الأومامي.', icon: Globe },
      { year: '2016', titleEn: 'Founded Najd Village', titleAr: 'تأسيس قرية نجد', descEn: 'Returned to Riyadh and opened Najd Village, redefining Saudi fine dining.', descAr: 'عاد إلى الرياض وافتتح قرية نجد، محدثاً ثورة في المطاعم السعودية الراقية.', icon: ChefHat },
      { year: '2024', titleEn: 'First Michelin Star', titleAr: 'نجمة ميشلان الأولى', descEn: 'Najd Village became the first Saudi-cuisine restaurant to earn a Michelin star.', descAr: 'أصبح قرية نجد أول مطعم للمطبخ السعودي يحصل على نجمة ميشلان.', icon: Star },
    ],
    signatureDishes: [
      { nameEn: 'Heritage Lamb on Saffron Rice', nameAr: 'خروف التراث على أرز الزعفران', descEn: 'Whole Najdi lamb slow-roasted 18 hours over frankincense wood, served on golden saffron rice with heritage dried-lime broth.', descAr: 'خروف نجدي كامل مشوي على نار خشب اللبان لـ18 ساعة، يُقدَّم على أرز الزعفران مع مرقة الليمون الحجري.', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop', price: 'SAR 320', restaurantId: 1 },
      { nameEn: 'Date & Rose Soufflé', nameAr: 'سوفليه التمر والورد', descEn: 'Medjool date soufflé with Taif rose water glaze, served with cardamom crème anglaise.', descAr: 'سوفليه تمر المجدول مع غطاء ماء ورد الطائف، يُقدَّم مع كريم أنجليز الهيل.', image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&h=400&fit=crop', price: 'SAR 85', restaurantId: 1 },
    ],
    upcomingEvents: [
      { dateEn: 'Apr 12, 2026', dateAr: '12 أبريل 2026', titleEn: 'Saudi Culinary Heritage Masterclass', titleAr: 'ماستر كلاس التراث الطهوي السعودي', venueEn: 'Najd Village Private Dining', venueAr: 'الغرفة الخاصة في قرية نجد', type: 'masterclass' },
      { dateEn: 'May 3, 2026', dateAr: '3 مايو 2026', titleEn: 'Chef\'s Table — Spring Harvest Menu', titleAr: 'طاولة الشيف — قائمة موسم الربيع', venueEn: 'Najd Village', venueAr: 'قرية نجد', type: 'dinner' },
    ],
    recommendedRestaurantsEn: ['Lusin', 'Nobu', 'Reem Al Bawadi'],
    recommendedRestaurantsAr: ['لوسين', 'نوبو', 'ريم البوادي'],
    recommendedRestaurantIds: [4, 7, 2],
  },
  {
    id: 2,
    nameEn: 'Armine Petrosian',
    nameAr: 'أرميني بيتروسيان',
    titleEn: 'Chef-Patron',
    titleAr: 'الشيف المالك',
    nationalityEn: 'Armenian-French',
    nationalityAr: 'أرمينية-فرنسية',
    restaurantEn: 'Lusin',
    restaurantAr: 'لوسين',
    restaurantId: 4,
    cityEn: 'Riyadh',
    cityAr: 'الرياض',
    cuisineEn: 'Armenian-Mediterranean',
    cuisineAr: 'أرميني-متوسطي',
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&face',
    coverPhoto: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1200&h=600&fit=crop',
    michelinStars: 0,
    awards: ['Tabaq Chef of the Year 2024', 'Best New Restaurant GCC 2023', 'World\'s 50 Best Discovery 2024'],
    awardsAr: ['شيف العام - طبق 2024', 'أفضل مطعم جديد في دول الخليج 2023', 'اكتشاف قائمة أفضل 50 مطعم عالمياً 2024'],
    bioShortEn: 'Armine brings Yerevan\'s ancient flavours to Riyadh — weaving pomegranate, walnut, and mountain herbs into dishes that feel both familiar and wholly new.',
    bioShortAr: 'تجلب أرميني نكهات يريفان العريقة إلى الرياض — تنسج الرمان والجوز وأعشاب الجبال في أطباق تبدو مألوفة وجديدة في آنٍ واحد.',
    bioEn: 'Armine Petrosian was born in Yerevan, Armenia, to a family of chefs and merchants who traded spices across the Caucasus for generations. Trained at Institut Paul Bocuse in Lyon, she carried her grandmother\'s recipes in her heart to the finest kitchens of Paris and Beirut before landing in Riyadh to open Lusin — named for the Armenian word for "moon".\n\nAt Lusin, every dish is a tribute to the ancient Silk Road culinary corridor that connected Armenia, Persia, and Arabia. Her lamb khorovats with pomegranate molasses reduction, her manti dumplings with Levantine spiced butter, and her walnut-stuffed grape leaves have made Lusin the most talked-about fine-dining destination in Riyadh since its opening in 2021.',
    bioAr: 'وُلدت أرميني بيتروسيان في يريفان بأرمينيا، لعائلة من الطهاة والتجار الذين اتّجروا في التوابل عبر القوقاز لأجيال. تدرّبت في معهد بول بوكوز بليون، وحملت وصفات جدتها في قلبها إلى أفضل مطابخ باريس وبيروت قبل أن تُحلّ في الرياض لتفتتح لوسين — الكلمة الأرمنية لـ"القمر".',
    philosophyEn: 'Food is the only language that survives the fall of empires. I cook to keep that language alive.',
    philosophyAr: 'الطعام هو اللغة الوحيدة التي تصمد أمام سقوط الإمبراطوريات. أطهو للحفاظ على هذه اللغة حيّة.',
    quoteEn: 'Every pomegranate seed holds a story. I just need to listen before I cook.',
    quoteAr: 'كل حبة رمان تحمل قصة. أحتاج فقط أن أصغي قبل أن أطهو.',
    specialtyEn: 'Lamb khorovats, Walnut-stuffed manti, Pomegranate-glazed duck',
    specialtyAr: 'خروفات الخروف، مانتي محشو بالجوز، بط مطلي بالرمان',
    yearsExp: 16,
    featured: true,
    tabaqStars: 2,
    instagram: '@chef.armine.lusin',
    timeline: [
      { year: '2008', titleEn: 'Institut Paul Bocuse, Lyon', titleAr: 'معهد بول بوكوز، ليون', descEn: 'Trained at one of France\'s most prestigious culinary academies, graduating top of her class.', descAr: 'تدرّبت في إحدى أعرق أكاديميات الطهي الفرنسية، وتخرّجت في صدارة دفعتها.', icon: BookOpen },
      { year: '2011', titleEn: 'Paris Fine Dining', titleAr: 'المطاعم الراقية في باريس', descEn: 'Worked at a 2-Michelin-star restaurant in Saint-Germain, mastering classical French-Mediterranean fusion.', descAr: 'عملت في مطعم حائز نجمتَي ميشلان في سان جيرمان، أتقنت الدمج الفرنسي-المتوسطي الكلاسيكي.', icon: Award },
      { year: '2016', titleEn: 'Beirut Chapter', titleAr: 'مرحلة بيروت', descEn: 'Led the kitchen at a celebrated Levantine restaurant in Gemmayzeh, merging Armenian and Arab flavours.', descAr: 'قادت مطبخ مطعم شامي مشهور في الجميزة، دامجة النكهات الأرمنية والعربية.', icon: Flame },
      { year: '2021', titleEn: 'Opened Lusin, Riyadh', titleAr: 'افتتاح لوسين، الرياض', descEn: 'Launched Lusin to critical acclaim, earning Best New Restaurant GCC within its first year.', descAr: 'أطلقت لوسين بإشادة نقدية واسعة، وحصدت جائزة أفضل مطعم جديد في الخليج خلال عامها الأول.', icon: ChefHat },
    ],
    signatureDishes: [
      { nameEn: 'Pomegranate Lamb Khorovats', nameAr: 'خروفات الخروف بالرمان', descEn: 'Heritage lamb marinated in pomegranate molasses, Armenian spices and dried herbs, slow-grilled over vine wood.', descAr: 'لحم خروف تراثي متبّل في دبس الرمان وتوابل أرمنية وأعشاب مجففة، مشوي ببطء على خشب الكرمة.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop', price: 'SAR 185', restaurantId: 4 },
      { nameEn: 'Walnut Manti with Saffron Butter', nameAr: 'مانتي بالجوز وزبدة الزعفران', descEn: 'Hand-crafted Armenian dumplings filled with spiced walnut and onion, finished with Levantine brown butter and sumac.', descAr: 'زلابية أرمنية مصنوعة يدوياً محشوة بالجوز المتبل والبصل، تُكمَّل بزبدة شامية محمّرة وسماق.', image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&h=400&fit=crop', price: 'SAR 95', restaurantId: 4 },
    ],
    upcomingEvents: [
      { dateEn: 'Apr 20, 2026', dateAr: '20 أبريل 2026', titleEn: 'Armenian Kitchen Secrets — Cooking Class', titleAr: 'أسرار المطبخ الأرميني — درس طهي', venueEn: 'Lusin Private Dining', venueAr: 'الغرفة الخاصة في لوسين', type: 'class' },
    ],
    recommendedRestaurantsEn: ['Najd Village', 'Nobu', 'Sushi Sama'],
    recommendedRestaurantsAr: ['قرية نجد', 'نوبو', 'سوشي سما'],
    recommendedRestaurantIds: [1, 7, 3],
  },
  {
    id: 3,
    nameEn: 'Kenji Tanaka',
    nameAr: 'كنجي تاناكا',
    titleEn: 'Head Sushi Chef',
    titleAr: 'شيف السوشي الرئيسي',
    nationalityEn: 'Japanese',
    nationalityAr: 'ياباني',
    restaurantEn: 'Sushi Sama',
    restaurantAr: 'سوشي سما',
    restaurantId: 3,
    cityEn: 'Riyadh',
    cityAr: 'الرياض',
    cuisineEn: 'Japanese',
    cuisineAr: 'ياباني',
    photo: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=400&h=400&fit=crop',
    coverPhoto: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&h=600&fit=crop',
    michelinStars: 0,
    awards: ['Best Japanese Restaurant Arabia 2024', 'Tabaq Excellence Award 2023'],
    awardsAr: ['أفضل مطعم ياباني في الجزيرة العربية 2024', 'جائزة طبق للتميز 2023'],
    bioShortEn: 'Kenji Tanaka mastered omakase under Jiro Ono\'s alumni in Ginza before bringing the purist art of Edo-mae sushi to Riyadh\'s Al Sulaimaniyah.',
    bioShortAr: 'أتقن كنجي تاناكا فن الأوماكاسي تحت تلمذة أحد خريجي جيرو أونو في غينزا قبل أن يُحضر فن سوشي إيدو-ماي الأصيل إلى السليمانية في الرياض.',
    bioEn: 'Kenji Tanaka trained for 12 years under successive sushi masters in Tokyo\'s Ginza district before his passion for international culinary exchange led him to Saudi Arabia. At Sushi Sama, Kenji has built one of the region\'s most respected omakase counters — flying Toyosu Market tuna weekly and sourcing Wagyu from certified Japanese farms. His disciplined approach to knife technique, rice temperature, and neta-shari balance has earned Sushi Sama a devoted following among Riyadh\'s most discerning diners.',
    bioAr: 'تدرّب كنجي تاناكا لمدة 12 عاماً تحت إشراف كبار مطبوخي السوشي في حي غينزا بطوكيو، قبل أن يقوده شغفه بالتبادل الطهوي الدولي إلى المملكة العربية السعودية. بنى كنجي في سوشي سما أحد أكثر موائد الأوماكاسي احتراماً في المنطقة.',
    philosophyEn: 'Sushi is 70% rice. Perfect the rice and the fish will thank you.',
    philosophyAr: 'السوشي هو 70٪ أرز. أتقن الأرز وسيشكرك السمك.',
    quoteEn: 'Silence in the kitchen means precision. Every cut is a decision.',
    quoteAr: 'الصمت في المطبخ يعني الدقة. كل قطعة هي قرار.',
    specialtyEn: 'Omakase nigiri, Wagyu gyū-tan temaki, Uni & ikura maki',
    specialtyAr: 'نيغيري أوماكاسي، تيماكي لسان واغيو، ماكي بالأوني والإيكورا',
    yearsExp: 22,
    featured: false,
    tabaqStars: 2,
    instagram: '@kenji.tabaq',
    timeline: [
      { year: '2002', titleEn: 'Apprenticeship, Ginza', titleAr: 'التدريب، غينزا', descEn: 'Began a 7-year apprenticeship under master sushi chef Hiroshi Tanaka in Tokyo.', descAr: 'بدأ تدريباً لمدة 7 سنوات تحت إشراف أستاذ السوشي هيروشي تاناكا في طوكيو.', icon: ChefHat },
      { year: '2014', titleEn: 'Dubai Opening', titleAr: 'افتتاح دبي', descEn: 'Opened a high-profile omakase counter in Dubai Marina, earning UAE Food Awards recognition.', descAr: 'افتتح مائدة أوماكاسي بارزة في مارينا دبي، ونال جوائز الغذاء الإماراتية.', icon: Award },
      { year: '2019', titleEn: 'Joined Sushi Sama', titleAr: 'انضمام لسوشي سما', descEn: 'Moved to Riyadh as Head Sushi Chef and transformed Sushi Sama into the KSA\'s top Japanese dining destination.', descAr: 'انتقل إلى الرياض كشيف سوشي رئيسي وحوّل سوشي سما إلى وجهة المطبخ الياباني الأولى في المملكة.', icon: Globe },
    ],
    signatureDishes: [
      { nameEn: '12-Course Omakase', nameAr: 'أوماكاسي 12 طبق', descEn: 'A chef\'s trust experience — 12 courses of the finest seasonal fish from Toyosu, served at the intimate counter.', descAr: 'تجربة الثقة بالشيف — 12 طبق من أجود الأسماك الموسمية من تويوسو، تُقدَّم على المائدة المباشرة.', image: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600&h=400&fit=crop', price: 'SAR 650', restaurantId: 3 },
      { nameEn: 'Wagyu Gyū-tan Temaki', nameAr: 'تيماكي لسان بقر واغيو', descEn: 'Hand-rolled temaki with Miyazaki Wagyu, yuzu kosho, and crispy negi, sealed with a touch of sesame oil.', descAr: 'تيماكي ملفوف يدوياً بواغيو ميازاكي وكوشو يوزو وبصل هش، مع لمسة من زيت السمسم.', image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&h=400&fit=crop', price: 'SAR 145', restaurantId: 3 },
    ],
    upcomingEvents: [
      { dateEn: 'May 15, 2026', dateAr: '15 مايو 2026', titleEn: 'Sushi Rolling Workshop — Beginners', titleAr: 'ورشة لف السوشي للمبتدئين', venueEn: 'Sushi Sama Kitchen', venueAr: 'مطبخ سوشي سما', type: 'class' },
    ],
    recommendedRestaurantsEn: ['Nobu', 'Lusin', 'Najd Village'],
    recommendedRestaurantsAr: ['نوبو', 'لوسين', 'قرية نجد'],
    recommendedRestaurantIds: [7, 4, 1],
  },
  {
    id: 4,
    nameEn: 'Mohammed Al-Qahtani',
    nameAr: 'محمد القحطاني',
    titleEn: 'Executive Chef',
    titleAr: 'الشيف التنفيذي',
    nationalityEn: 'Saudi Arabian',
    nationalityAr: 'سعودي',
    restaurantEn: 'Reem Al Bawadi',
    restaurantAr: 'ريم البوادي',
    restaurantId: 2,
    cityEn: 'Riyadh',
    cityAr: 'الرياض',
    cuisineEn: 'Saudi-Levantine',
    cuisineAr: 'سعودي-شامي',
    photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop',
    coverPhoto: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&h=600&fit=crop',
    michelinStars: 0,
    awards: ['Tabaq Excellence Award 2022', 'GCC Hospitality Chef of the Year 2021'],
    awardsAr: ['جائزة طبق للتميز 2022', 'شيف العام في الضيافة الخليجية 2021'],
    bioShortEn: 'Mohammed Al-Qahtani champions the bold, communal flavours of the Saudi-Levantine table — mezze, grills, and slow-braised meats that bring entire families together.',
    bioShortAr: 'محمد القحطاني يُدافع عن النكهات الجريئة والجماعية للمائدة السعودية-الشامية — المزة والمشويات واللحوم المطهية ببطء التي تجمع الأسر بأكملها.',
    bioEn: 'Mohammed Al-Qahtani grew up in Al Murabba, where every Friday lunch was a feast of communal dishes spanning the best of Saudi and Levantine tradition. After training at the Culinary Arts Academy Switzerland and staging at celebrated restaurants in Dubai and Amman, he returned to Riyadh to helm Reem Al Bawadi\'s kitchen.\n\nUnder his leadership, Reem Al Bawadi has expanded its menu to include heritage dishes rarely found outside home kitchens — mutabbaq filled with offal and herbs, madfoon lamb buried in sand pits, and a mezze selection that spans six regional traditions from Asir to Syria.',
    bioAr: 'نشأ محمد القحطاني في حي المربع، حيث كان كل غداء جمعة وليمة من الأطباق الجماعية الجامعة لأفضل ما في التراث السعودي والشامي. بعد تدريبه في أكاديمية الفنون الطهوية بسويسرا ومراحل في مطاعم مشهورة بدبي وعمّان، عاد إلى الرياض ليتولى مطبخ ريم البوادي.',
    philosophyEn: 'The best meal is the one everyone at the table remembers, not just the chef.',
    philosophyAr: 'أفضل وجبة هي التي يتذكرها الجميع على الطاولة، ليس الشيف وحده.',
    quoteEn: 'Sharing food is the oldest form of trust between human beings.',
    quoteAr: 'تقاسم الطعام هو أقدم أشكال الثقة بين البشر.',
    specialtyEn: 'Madfoon lamb, Heritage mezze platters, Mansaf with fermented jameed',
    specialtyAr: 'لحم المدفون، صحون المزة التراثية، منسف بالجميد المخمّر',
    yearsExp: 15,
    featured: false,
    tabaqStars: 2,
    instagram: '@chef.mqahtani',
    timeline: [
      { year: '2009', titleEn: 'CAAS Switzerland', titleAr: 'أكاديمية الفنون الطهوية، سويسرا', descEn: 'Graduated from the Culinary Arts Academy Switzerland with a focus on international cuisine.', descAr: 'تخرّج من أكاديمية الفنون الطهوية في سويسرا متخصصاً في المطبخ الدولي.', icon: BookOpen },
      { year: '2013', titleEn: 'Dubai & Amman Stages', titleAr: 'مراحل في دبي وعمّان', descEn: 'Staged at two celebrated Levantine restaurants across the GCC, deepening his regional knowledge.', descAr: 'تدرّب في مطعمين شاميين مشهورين في الخليج، مُعمّقاً معرفته بالمطبخ الإقليمي.', icon: Globe },
      { year: '2017', titleEn: 'Joined Reem Al Bawadi', titleAr: 'انضمام لريم البوادي', descEn: 'Appointed Executive Chef at Reem Al Bawadi, revamping the menu with heritage-focused dishes.', descAr: 'تعيينه شيفاً تنفيذياً في ريم البوادي، مُجدّداً القائمة بأطباق تراثية.', icon: ChefHat },
    ],
    signatureDishes: [
      { nameEn: 'Madfoon Lamb Platter', nameAr: 'طبق لحم المدفون', descEn: 'Whole lamb slow-cooked underground for 8 hours with Hejazi spices and basmati, served on a communal platter.', descAr: 'خروف كامل مطبوخ تحت الأرض لـ8 ساعات بتوابل حجازية وأرز بسمتي، يُقدَّم على طبق مشترك.', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop', price: 'SAR 280', restaurantId: 2 },
      { nameEn: 'Heritage Mezze — 12 Dishes', nameAr: 'مزة تراثية — 12 طبق', descEn: '12 handmade mezze dishes spanning Saudi, Levantine, and Gulf traditions — from mutabbaq to kibbeh nayyeh.', descAr: '12 طبق مزة مصنوعة يدوياً من التراثين السعودي والشامي والخليجي — من المطبق إلى الكبة النيئة.', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=400&fit=crop', price: 'SAR 165', restaurantId: 2 },
    ],
    upcomingEvents: [
      { dateEn: 'Apr 25, 2026', dateAr: '25 أبريل 2026', titleEn: 'Traditional Madfoon Night', titleAr: 'ليلة المدفون التقليدية', venueEn: 'Reem Al Bawadi Garden', venueAr: 'حديقة ريم البوادي', type: 'dinner' },
    ],
    recommendedRestaurantsEn: ['Najd Village', 'Spice Route', 'Lusin'],
    recommendedRestaurantsAr: ['قرية نجد', 'طريق التوابل', 'لوسين'],
    recommendedRestaurantIds: [1, 5, 4],
  },
  {
    id: 5,
    nameEn: 'Priya Anand',
    nameAr: 'بريا أناند',
    titleEn: 'Executive Chef & Spice Specialist',
    titleAr: 'الشيف التنفيذية ومتخصصة التوابل',
    nationalityEn: 'Indian-British',
    nationalityAr: 'هندية-بريطانية',
    restaurantEn: 'Spice Route',
    restaurantAr: 'طريق التوابل',
    restaurantId: 5,
    cityEn: 'Jeddah',
    cityAr: 'جدة',
    cuisineEn: 'Fusion',
    cuisineAr: 'دمج',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
    coverPhoto: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=600&fit=crop',
    michelinStars: 0,
    awards: ['Tabaq Rising Chef Award 2024', 'Best Fusion Restaurant Arabia 2023'],
    awardsAr: ['جائزة طبق للشيف الصاعد 2024', 'أفضل مطعم دمج في الجزيرة العربية 2023'],
    bioShortEn: 'Priya Anand traces the ancient spice trade routes from Kerala to Jeddah, creating dishes that sit at the crossroads of the Indian Ocean\'s oldest culinary conversations.',
    bioShortAr: 'تتتبع بريا أناند طرق التوابل التجارية القديمة من كيرلا إلى جدة، مُبتكرةً أطباقاً تقف على مفترق أقدم محادثات المطبخ في المحيط الهندي.',
    bioEn: 'Born in Kerala to a family of spice merchants, Priya Anand\'s relationship with food began in the spice gardens of Wayanad. She trained at the Culinary Institute of America in New York and worked in Michelin-starred restaurants in London and Singapore before a sabbatical along the ancient Arabian Sea spice trade routes brought her to Jeddah — and she never left.\n\nAt Spice Route, Priya bridges the culinary gap between the Indian subcontinent, the Gulf, and East Africa — three civilizations that traded, cooked, and ate together for centuries before borders divided them.',
    bioAr: 'وُلدت بريا أناند في كيرلا لعائلة من تجار التوابل، وبدأت علاقتها بالطعام في حدائق توابل وايناد. تدرّبت في معهد الطهي الأمريكي بنيويورك وعملت في مطاعم حائزة نجوم ميشلان في لندن وسنغافورة.',
    philosophyEn: 'A spice without context is just heat. Understanding history is the first step to cooking.',
    philosophyAr: 'التابل بدون سياق مجرد حرارة. فهم التاريخ هو الخطوة الأولى للطهي.',
    quoteEn: 'The best recipes don\'t have measurements. They have memories.',
    quoteAr: 'أفضل الوصفات ليست لها قياسات. لها ذكريات.',
    specialtyEn: 'Malabar biryani, Omani shuwa fusion, Arabian Sea seafood curry',
    specialtyAr: 'برياني مالابار، شوّاء عُماني دمج، كاري مأكولات بحرية من بحر العرب',
    yearsExp: 14,
    featured: false,
    tabaqStars: 1,
    instagram: '@chef.priya.spiceroute',
    timeline: [
      { year: '2010', titleEn: 'CIA New York', titleAr: 'معهد الطهي الأمريكي، نيويورك', descEn: 'Graduated from the Culinary Institute of America with a degree in Culinary Arts.', descAr: 'تخرّجت من معهد الطهي الأمريكي بدرجة في الفنون الطهوية.', icon: BookOpen },
      { year: '2014', titleEn: 'London & Singapore', titleAr: 'لندن وسنغافورة', descEn: 'Staged at Michelin-starred restaurants across London and Singapore, mastering Asian fusion.', descAr: 'تدرّبت في مطاعم نجوم ميشلان في لندن وسنغافورة، أتقنت الدمج الآسيوي.', icon: Award },
      { year: '2020', titleEn: 'Opened Spice Route, Jeddah', titleAr: 'افتتاح طريق التوابل، جدة', descEn: 'Launched Spice Route to celebrate the historic culinary connections between Arabia and the Indian Ocean world.', descAr: 'أطلقت طريق التوابل للاحتفاء بالروابط الطهوية التاريخية بين الجزيرة العربية وعالم المحيط الهندي.', icon: ChefHat },
    ],
    signatureDishes: [
      { nameEn: 'Malabar Biryani with Gulf Spices', nameAr: 'برياني مالابار بتوابل خليجية', descEn: 'Slow-cooked dum biryani with Malabar spices, saffron and rosewater, topped with fried pearl onions and Gulf-style raita.', descAr: 'برياني دم مطبوخ ببطء بتوابل مالابار والزعفران وماء الورد، مُزيَّن بالبصل اللؤلؤي المقلي والريتا الخليجية.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop', price: 'SAR 95', restaurantId: 5 },
      { nameEn: 'Arabian Sea Seafood Curry', nameAr: 'كاري مأكولات بحر العرب', descEn: 'Fresh Red Sea catch in a coconut-tamarind curry base with turmeric, fenugreek and toasted cumin.', descAr: 'صيد طازج من البحر الأحمر في قاعدة كاري بجوز الهند والتمر الهندي مع الكركم والحلبة والكمون المحمّص.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop', price: 'SAR 110', restaurantId: 5 },
    ],
    upcomingEvents: [
      { dateEn: 'May 8, 2026', dateAr: '8 مايو 2026', titleEn: 'Indian Ocean Flavours — Tasting Menu', titleAr: 'نكهات المحيط الهندي — قائمة تذوق', venueEn: 'Spice Route Terrace', venueAr: 'تراس طريق التوابل', type: 'tasting' },
    ],
    recommendedRestaurantsEn: ['Lusin', 'Najd Village', 'Reem Al Bawadi'],
    recommendedRestaurantsAr: ['لوسين', 'قرية نجد', 'ريم البوادي'],
    recommendedRestaurantIds: [4, 1, 2],
  },
];

export const CHEF_DETAILS: Record<number, ChefData> = Object.fromEntries(
  CHEFS.map(c => [c.id, c])
);
