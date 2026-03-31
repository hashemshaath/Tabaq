import React, { useState } from 'react';
import { Link, useParams } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import {
  ChefHat, Award, Star, MapPin, Utensils, Globe, Clock, ArrowLeft,
  Quote, ExternalLink, Heart, Share2, ChevronRight, Sparkles,
  BookOpen, CalendarDays, Users, Flame, BadgeCheck, Trophy,
  Play, Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Types ──────────────────────────────────────────────────────────────────────

interface TimelineEntry {
  year: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  icon: React.ElementType;
}

interface SignatureDish {
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  image: string;
  price: string;
  restaurantId: number;
}

interface ChefEvent {
  dateEn: string;
  dateAr: string;
  titleEn: string;
  titleAr: string;
  venueEn: string;
  venueAr: string;
  type: 'class' | 'dinner' | 'tasting' | 'masterclass';
}

interface ChefDetail {
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
  bioEn: string;
  bioAr: string;
  philosophyEn: string;
  philosophyAr: string;
  quoteEn: string;
  quoteAr: string;
  specialtyEn: string;
  specialtyAr: string;
  yearsExp: number;
  tabaqStars?: number;
  instagram?: string;
  timeline: TimelineEntry[];
  signatureDishes: SignatureDish[];
  upcomingEvents: ChefEvent[];
  recommendedRestaurantsEn: string[];
  recommendedRestaurantsAr: string[];
  recommendedRestaurantIds: number[];
}

// ── Full Chef Data ─────────────────────────────────────────────────────────────

const CHEF_DETAILS: Record<number, ChefDetail> = {
  1: {
    id: 1,
    nameEn: 'Mahmoud Al-Rashidi',
    nameAr: 'محمود الراشدي',
    titleEn: 'Executive Chef & Culinary Director',
    titleAr: 'الشيف التنفيذي ومدير الطهي',
    nationalityEn: 'Saudi Arabian',
    nationalityAr: 'سعودي',
    restaurantEn: 'Atma — Saudi Fine Dining',
    restaurantAr: 'أتما — طعام سعودي فاخر',
    restaurantId: 7,
    cityEn: 'Riyadh',
    cityAr: 'الرياض',
    cuisineEn: 'Modern Saudi',
    cuisineAr: 'مطبخ سعودي حديث',
    photo: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&h=800&fit=crop&crop=face',
    coverPhoto: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&h=700&fit=crop',
    michelinStars: 2,
    awards: ['Michelin ✦✦ (2023–2024)', 'MENA Best Chef 2024', 'Tabaq Gold Award 2023', 'Saudi Culinary Heritage Ambassador'],
    awardsAr: ['ميشلان ✦✦ (2023–2024)', 'أفضل شيف في الشرق الأوسط 2024', 'جائزة طبق الذهبية 2023', 'سفير التراث الطهوي السعودي'],
    bioEn: "Chef Mahmoud Al-Rashidi grew up in Al-Ahsa, where his grandmother's kitchen was his first school. The rhythm of pounding coffee cardamom, slow-rendering lamb fat, and stone-grinding wheat shaped his palate long before any culinary school could.\n\nAfter graduating from King Saud University's hospitality programme, he secured a coveted scholarship to Le Cordon Bleu in Paris, graduating with distinction. He staged at Alain Ducasse's Plaza Athénée and returned to the Kingdom with a singular mission: to place Saudi cuisine on the world's finest-dining stage.\n\nHis restaurant Atma — meaning 'soul' in ancient Arabic — opened in 2021 and earned its first Michelin star within eighteen months, its second in 2023. The tasting menu changes every twelve weeks, tracking Saudi seasons and the ancient agricultural calendar of the Najd plateau.",
    bioAr: 'نشأ الشيف محمود الراشدي في الأحساء، حيث كانت مطبخ جدته مدرسته الأولى. أشكّل إيقاع طحن هيل القهوة وإذابة شحم الخروف ببطء وطحن القمح بالحجر حنكته قبل أي مدرسة طهي.\n\nبعد تخرّجه من برنامج الضيافة في جامعة الملك سعود، حصل على منحة دراسية في لو كوردون بلو باريس، وتخرج بامتياز. عمل متدرباً في Plaza Athénée لألان دوكاس وعاد إلى المملكة بمهمة واحدة: وضع المطبخ السعودي على منصة الطعام الراقي عالمياً.\n\nمطعمه "أتما" — بمعنى "روح" بالعربية القديمة — فتح أبوابه عام 2021 ونال نجمته الميشلانية الأولى خلال ثمانية عشر شهراً، والثانية عام 2023. تتغير قائمة التذوق كل اثني عشر أسبوعاً تتبعاً لمواسم المملكة والتقويم الزراعي القديم لهضبة نجد.',
    philosophyEn: "Saudi cuisine has 5,000 years of sophisticated food culture behind it. It deserves to be told with the same rigour, the same plating precision, and the same obsessive sourcing that defines the world's best restaurants. My job is to be the translator.",
    philosophyAr: 'المطبخ السعودي وراءه 5000 عام من ثقافة الطعام الراقية. يستحق أن يُروى بنفس الدقة، ونفس إتقان التقديم، ونفس الهوس بمصادر المكونات الذي يُعرّف أفضل مطاعم العالم. مهمتي أن أكون المترجم.',
    quoteEn: "\"The desert is not empty. It is full of flavour — you just need to know how to listen.\"",
    quoteAr: '"الصحراء ليست فارغة. إنها مليئة بالنكهة — تحتاج فقط أن تعرف كيف تنصت."',
    specialtyEn: 'Heritage grain fermentation & desert lamb',
    specialtyAr: 'تخمير الحبوب الموروثة ولحم الضأن الصحراوي',
    yearsExp: 18,
    tabaqStars: 5,
    instagram: '@mahmoud.alrashidi.chef',
    timeline: [
      { year: '2006', titleEn: 'First Kitchen Step', titleAr: 'أول خطوة في المطبخ', descEn: 'Begins dishwashing at a Riyadh hotel at age 19, absorbing everything possible.', descAr: 'يبدأ بغسل الأطباق في فندق رياضي وهو في التاسعة عشرة، يستوعب كل شيء ممكن.', icon: ChefHat },
      { year: '2009', titleEn: 'King Saud University', titleAr: 'جامعة الملك سعود', descEn: 'Graduates with honours from the Hotel and Tourism programme.', descAr: 'يتخرج بمرتبة الشرف من برنامج الفنادق والسياحة.', icon: BookOpen },
      { year: '2011', titleEn: 'Le Cordon Bleu Paris', titleAr: 'لو كوردون بلو باريس', descEn: 'Full scholarship. Graduates top of his class in Grande Diplôme Cuisine.', descAr: 'منحة كاملة. يتخرج في المرتبة الأولى في الدبلوم الكبير للطهي.', icon: Award },
      { year: '2013', titleEn: 'Alain Ducasse Plaza Athénée', titleAr: 'ألان دوكاس بلازا أتيني', descEn: 'Two years as chef de partie under Romain Meder, Paris.', descAr: 'سنتان كشيف دو باتي تحت إشراف رومان ميدر في باريس.', icon: Star },
      { year: '2017', titleEn: 'Returns to Saudi Arabia', titleAr: 'العودة إلى المملكة', descEn: 'Takes over Al-Najdiyya restaurant in Riyadh; revamps traditional menu completely.', descAr: 'يتولى قيادة مطعم النجدية في الرياض؛ يُجدّد القائمة التقليدية كلياً.', icon: MapPin },
      { year: '2021', titleEn: 'Atma Opens', titleAr: 'افتتاح أتما', descEn: 'His flagship opens to instant critical acclaim. Fully booked 4 months ahead within a week.', descAr: 'يفتتح مطعمه الرئيسي وسط إشادة نقدية فورية. محجوز بالكامل 4 أشهر مقدماً في غضون أسبوع.', icon: Sparkles },
      { year: '2022', titleEn: 'First Michelin Star', titleAr: 'النجمة الميشلانية الأولى', descEn: 'Atma receives one Michelin star — the first ever awarded to a modern Saudi cuisine restaurant.', descAr: 'يحصل أتما على نجمة ميشلان — الأولى من نوعها تُمنح لمطعم مطبخ سعودي حديث.', icon: Trophy },
      { year: '2023', titleEn: 'Second Michelin Star', titleAr: 'النجمة الميشلانية الثانية', descEn: 'Atma is awarded a second star, cementing Chef Mahmoud as the country\'s most decorated chef.', descAr: 'يُمنح أتما نجمة ثانية، مما يُرسّخ الشيف محمود كأكثر الطهاة تكريماً في البلاد.', icon: Trophy },
    ],
    signatureDishes: [
      {
        nameEn: 'Desert Lamb — 72-Hour Slow',
        nameAr: 'خروف الصحراء — 72 ساعة بطيئة',
        descEn: 'Najdi lamb slow-rendered in its own fat for 72 hours, served atop fermented sorghum cream and wild desert thyme oil.',
        descAr: 'خروف نجدي مطهو ببطء في شحمه الخاص لمدة 72 ساعة، يُقدَّم على كريمة الذرة الرفيعة المخمّرة وزيت الزعتر البري الصحراوي.',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
        price: '480 SAR',
        restaurantId: 7,
      },
      {
        nameEn: 'Heritage Wheat Tart — Dates & Saffron',
        nameAr: 'تارت قمح الأجداد — تمر وزعفران',
        descEn: 'Stone-milled Hejazi wheat tart shell, filled with Medjool date toffee, infused with Unaizah saffron and topped with camel milk ice cream.',
        descAr: 'قشرة تارت من قمح حجازي مطحون بالحجر، محشوة بتوفي تمر المجهول المنقوع بزعفران عنيزة ومغطاة بآيس كريم حليب الجمل.',
        image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=400&fit=crop',
        price: '95 SAR',
        restaurantId: 7,
      },
      {
        nameEn: 'Fermented Camel Cheese — Al-Ahsa Honey',
        nameAr: 'جبن الجمل المخمّر — عسل الأحساء',
        descEn: 'House-fermented camel milk cheese aged 45 days, paired with raw Al-Ahsa sidr honey and toasted black seeds.',
        descAr: 'جبن حليب جمل مخمّر محلياً لمدة 45 يوماً، مقترن بعسل سدر الأحساء الخام وحبة السوداء المحمّصة.',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
        price: '140 SAR',
        restaurantId: 7,
      },
    ],
    upcomingEvents: [
      {
        dateEn: 'April 12, 2026',
        dateAr: '12 أبريل 2026',
        titleEn: 'Chef\'s Table Dinner — Desert Journey',
        titleAr: 'عشاء طاولة الشيف — رحلة الصحراء',
        venueEn: 'Atma Restaurant, Riyadh',
        venueAr: 'مطعم أتما، الرياض',
        type: 'dinner',
      },
      {
        dateEn: 'April 22, 2026',
        dateAr: '22 أبريل 2026',
        titleEn: 'Masterclass: Heritage Grain Fermentation',
        titleAr: 'ماسترکلاس: تخمير الحبوب الموروثة',
        venueEn: 'Tabaq Culinary Studio, Riyadh',
        venueAr: 'استوديو الطهي طبق، الرياض',
        type: 'masterclass',
      },
      {
        dateEn: 'May 3, 2026',
        dateAr: '3 مايو 2026',
        titleEn: 'MENA Food Forum — Keynote Speaker',
        titleAr: 'منتدى الغذاء في الشرق الأوسط — متحدث رئيسي',
        venueEn: 'Riyadh Convention Centre',
        venueAr: 'مركز الرياض للمؤتمرات',
        type: 'tasting',
      },
    ],
    recommendedRestaurantsEn: ['Bab Al-Sharq', 'Sushi Sama', 'Reem Al-Bawadi'],
    recommendedRestaurantsAr: ['باب الشرق', 'سوشي ساما', 'ريم البوادي'],
    recommendedRestaurantIds: [2, 3, 2],
  },
  2: {
    id: 2,
    nameEn: 'Sara Al-Otaibi',
    nameAr: 'سارة العتيبي',
    titleEn: 'Chef-Owner',
    titleAr: 'شيف ومالكة',
    nationalityEn: 'Saudi Arabian',
    nationalityAr: 'سعودية',
    restaurantEn: 'Bint Al-Jazira',
    restaurantAr: 'بنت الجزيرة',
    restaurantId: 2,
    cityEn: 'Jeddah',
    cityAr: 'جدة',
    cuisineEn: 'Elevated Traditional Saudi',
    cuisineAr: 'مطبخ سعودي تقليدي راقٍ',
    photo: 'https://images.unsplash.com/photo-1583394293214-bf9b5e68d6c1?w=600&h=800&fit=crop&crop=face',
    coverPhoto: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&h=700&fit=crop',
    michelinStars: 0,
    awards: ['Michelin Bib Gourmand 2024', 'Forbes 30 Under 30 MENA 2023', 'Saudi Vision 2030 Culinary Ambassador', 'Best Female Chef Jeddah 2022'],
    awardsAr: ['بيب جورمان ميشلان 2024', 'فوربس 30 تحت 30 في منطقة الشرق الأوسط 2023', 'سفيرة الطهي لرؤية السعودية 2030', 'أفضل شيف نسائية في جدة 2022'],
    bioEn: "Chef Sara Al-Otaibi was raised between the old Al-Balad district of Jeddah and her family's farm in Taif, where she learned the difference between a hurried meal and a meal made with intention. Her cooking education came first from the women around her — grandmothers, aunts, and neighbours who treated food as both sustenance and storytelling.\n\nAfter a degree in nutrition science at King Abdulaziz University, she opened Bint Al-Jazira in 2019 in a renovated 1920s Hejazi townhouse in Al-Balad. The restaurant seats just 28 and operates on a single evening sitting. Sara runs the kitchen entirely herself, changing the menu monthly to reflect seasonal ingredients sourced exclusively from Saudi farms.\n\nIn 2024 she received the Michelin Bib Gourmand — the first Saudi woman ever to receive a Michelin recognition — and was named one of Forbes MENA's 30 Under 30.",
    bioAr: 'نشأت الشيف سارة العتيبي بين حي البلد القديم في جدة ومزرعة عائلتها في الطائف، حيث تعلّمت الفرق بين وجبة عجلى ووجبة مصنوعة بنية. جاء تعليمها الطهوي أولاً من النساء من حولها — الجدات والعمات والجيران اللواتي عاملن الطعام باعتباره غذاءً وقصصاً معاً.\n\nبعد حصولها على درجة في علوم التغذية من جامعة الملك عبدالعزيز، افتتحت "بنت الجزيرة" عام 2019 في منزل حجازي مُجدَّد يعود إلى عشرينيات القرن الماضي في البلد. يتسع المطعم لـ 28 شخصاً فقط ويعمل بجلسة مسائية واحدة. تُدير سارة المطبخ بالكامل بنفسها، وتغيّر القائمة شهرياً لتعكس المكونات الموسمية المجلوبة حصرياً من مزارع سعودية.\n\nفي عام 2024 نالت بيب جورمان ميشلان — أول امرأة سعودية تنال اعترافاً من ميشلان — وأُدرجت ضمن قائمة فوربس 30 تحت 30 في منطقة الشرق الأوسط.',
    philosophyEn: "I am not trying to modernise Saudi food. I am trying to honour it exactly as it was — with the patience it deserves. When you eat at Bint Al-Jazira, you are eating a Saudi woman's memory, not a restaurant's ambition.",
    philosophyAr: 'لا أحاول تحديث الطعام السعودي. أحاول تكريمه تماماً كما كان — بالصبر الذي يستحقه. حين تأكل في بنت الجزيرة، تأكل ذاكرة امرأة سعودية، لا طموح مطعم.',
    quoteEn: "\"My grandmother never had a recipe card. But she fed a village. That is the kitchen I am trying to preserve.\"",
    quoteAr: '"جدتي لم تمتلك بطاقة وصفات قط. لكنها أطعمت قرية. هذا هو المطبخ الذي أحاول الحفاظ عليه."',
    specialtyEn: 'Hejazi cuisine & ancient bread traditions',
    specialtyAr: 'المطبخ الحجازي وتقاليد الخبز القديمة',
    yearsExp: 12,
    tabaqStars: 5,
    instagram: '@sara.alaotaibi.chef',
    timeline: [
      { year: '2014', titleEn: 'Nutrition Science Degree', titleAr: 'درجة علوم التغذية', descEn: 'Graduates from King Abdulaziz University, Jeddah.', descAr: 'تتخرج من جامعة الملك عبدالعزيز في جدة.', icon: BookOpen },
      { year: '2015', titleEn: 'Home Kitchen Stage', titleAr: 'تدريب في المطبخ المنزلي', descEn: 'Documents 200+ traditional Hejazi recipes from grandmothers across Jeddah.', descAr: 'توثّق أكثر من 200 وصفة حجازية تقليدية من جدات في أرجاء جدة.', icon: ChefHat },
      { year: '2017', titleEn: 'Culinary Travels', titleAr: 'السفر الطهوي', descEn: 'Studies traditional bread-making in Morocco, Lebanon, and Egypt.', descAr: 'تدرس تقاليد صناعة الخبز في المغرب ولبنان ومصر.', icon: Globe },
      { year: '2019', titleEn: 'Bint Al-Jazira Opens', titleAr: 'افتتاح بنت الجزيرة', descEn: 'Opens in a restored 1920s Hejazi townhouse in Al-Balad. 28 seats only.', descAr: 'تفتتح في منزل حجازي مُجدَّد من عشرينيات القرن الماضي في البلد. 28 مقعداً فقط.', icon: Sparkles },
      { year: '2023', titleEn: 'Forbes 30 Under 30 MENA', titleAr: 'فوربس 30 تحت 30', descEn: 'Named among Forbes MENA\'s most influential young food entrepreneurs.', descAr: 'تُصنَّف ضمن أكثر رواد الأعمال الشباب تأثيراً في مجال الطعام بمنطقة الشرق الأوسط.', icon: Trophy },
      { year: '2024', titleEn: 'First Michelin Recognition', titleAr: 'أول اعتراف من ميشلان', descEn: 'Receives Bib Gourmand — the first Saudi woman ever honoured by Michelin.', descAr: 'تحصل على بيب جورمان — أول امرأة سعودية تكرّمها ميشلان.', icon: Award },
    ],
    signatureDishes: [
      {
        nameEn: 'Ma\'asub — Banana Bread Pudding',
        nameAr: 'المعصوب — بودينغ خبز الموز',
        descEn: 'Traditional Hejazi thin flatbread layered with caramelised banana, warm butter, and wild thyme honey — exactly as Sara\'s grandmother made it.',
        descAr: 'خبز رقيق حجازي تقليدي مرتّب بالموز المكرمل والزبدة الدافئة وعسل الزعتر البري — تماماً كما صنعته جدة سارة.',
        image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=400&fit=crop',
        price: '55 SAR',
        restaurantId: 2,
      },
      {
        nameEn: 'Saleeg — White Rice in Bone Broth',
        nameAr: 'السليق — أرز أبيض في مرق العظام',
        descEn: 'Slow-simmered camel bone broth, arborio rice cooked in rendered chicken fat, finished with smoked paprika and charred lemon.',
        descAr: 'مرق عظام جمل مُطهى ببطء، أرز أربوريو مطهو في دهن الدجاج، منتهياً بالفلفل الحلو المدخن والليمون المحروق.',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
        price: '95 SAR',
        restaurantId: 2,
      },
    ],
    upcomingEvents: [
      {
        dateEn: 'April 18, 2026',
        dateAr: '18 أبريل 2026',
        titleEn: 'Al-Balad Culinary Walk — with Chef Sara',
        titleAr: 'مشوار طهوي في البلد — مع الشيف سارة',
        venueEn: 'Al-Balad Historic District, Jeddah',
        venueAr: 'حي البلد التاريخي، جدة',
        type: 'class',
      },
      {
        dateEn: 'May 10, 2026',
        dateAr: '10 مايو 2026',
        titleEn: 'Hejazi Bread Masterclass',
        titleAr: 'ماسترکلاس الخبز الحجازي',
        venueEn: 'Bint Al-Jazira Kitchen, Jeddah',
        venueAr: 'مطبخ بنت الجزيرة، جدة',
        type: 'masterclass',
      },
    ],
    recommendedRestaurantsEn: ['Atma', 'Reem Al-Bawadi', 'Bab Al-Sharq'],
    recommendedRestaurantsAr: ['أتما', 'ريم البوادي', 'باب الشرق'],
    recommendedRestaurantIds: [7, 2, 2],
  },
};

// Fallback for chefs without full detail
function buildFallbackDetail(id: number): ChefDetail | null {
  const fallbacks: Record<number, Partial<ChefDetail>> = {
    3: { nameEn: 'Yuki Tanaka', nameAr: 'يوكي تاناكا', cuisineEn: 'Edomae & Omakase', cuisineAr: 'إدوماي وأوماكاسي', michelinStars: 1, restaurantEn: 'Sushi Sama', restaurantAr: 'سوشي ساما', restaurantId: 3, cityEn: 'Riyadh', cityAr: 'الرياض', nationalityEn: 'Japanese', nationalityAr: 'ياباني', photo: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf6?w=600&h=800&fit=crop&crop=face', coverPhoto: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1400&h=700&fit=crop', titleEn: 'Head Sushi Chef', titleAr: 'رئيس شيف السوشي', yearsExp: 20 },
    4: { nameEn: 'Luca Ferrari', nameAr: 'لوكا فيراري', cuisineEn: 'Modern Italian Fine Dining', cuisineAr: 'الطهي الإيطالي الفاخر الحديث', michelinStars: 1, restaurantEn: 'La Perla Riyadh', restaurantAr: 'لا بيرلا الرياض', restaurantId: 1, cityEn: 'Riyadh', cityAr: 'الرياض', nationalityEn: 'Italian', nationalityAr: 'إيطالي', photo: 'https://images.unsplash.com/photo-1595475038665-c3eb23dc517e?w=600&h=800&fit=crop&crop=face', coverPhoto: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&h=700&fit=crop', titleEn: 'Executive Chef', titleAr: 'الشيف التنفيذي', yearsExp: 22 },
    5: { nameEn: 'Tariq Al-Ghamdi', nameAr: 'طارق الغامدي', cuisineEn: 'Molecular Arabic Gastronomy', cuisineAr: 'الطهي الجزيئي العربي', michelinStars: 1, restaurantEn: 'Qasr Al-Tabikh', restaurantAr: 'قصر الطبيخ', restaurantId: 4, cityEn: 'Riyadh', cityAr: 'الرياض', nationalityEn: 'Saudi Arabian', nationalityAr: 'سعودي', photo: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=600&h=800&fit=crop&crop=face', coverPhoto: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1400&h=700&fit=crop', titleEn: 'Chef & Co-Founder', titleAr: 'شيف ومؤسس مشارك', yearsExp: 14 },
    6: { nameEn: 'Ahmed Farouk', nameAr: 'أحمد فاروق', cuisineEn: 'Elevated Levantine & Gulf', cuisineAr: 'المطبخ الشامي والخليجي الراقي', michelinStars: 0, restaurantEn: 'Bab Al-Sharq', restaurantAr: 'باب الشرق', restaurantId: 2, cityEn: 'Riyadh', cityAr: 'الرياض', nationalityEn: 'Egyptian-Saudi', nationalityAr: 'مصري-سعودي', photo: 'https://images.unsplash.com/photo-1622021142947-da7dedc7c39a?w=600&h=800&fit=crop&crop=face', coverPhoto: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&h=700&fit=crop', titleEn: 'Executive Chef', titleAr: 'الشيف التنفيذي', yearsExp: 20 },
    7: { nameEn: 'James Whitfield', nameAr: 'جيمس ويتفيلد', cuisineEn: 'Japanese-Peruvian Fusion', cuisineAr: 'المطبخ الياباني-البيروفي المدموج', michelinStars: 0, restaurantEn: 'Nobu Riyadh', restaurantAr: 'نوبو الرياض', restaurantId: 7, cityEn: 'Riyadh', cityAr: 'الرياض', nationalityEn: 'British', nationalityAr: 'بريطاني', photo: 'https://images.unsplash.com/photo-1512485694743-9c9538b4e6e0?w=600&h=800&fit=crop&crop=face', coverPhoto: 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=1400&h=700&fit=crop', titleEn: 'Head Chef', titleAr: 'رئيس الطهاة', yearsExp: 16 },
    8: { nameEn: 'Maria Santos', nameAr: 'ماريا سانتوس', cuisineEn: 'Brazilian-Arabic Fusion', cuisineAr: 'مطبخ دمج برازيلي-عربي', michelinStars: 0, restaurantEn: 'Sao & Beirut', restaurantAr: 'ساو وبيروت', restaurantId: 1, cityEn: 'Jeddah', cityAr: 'جدة', nationalityEn: 'Brazilian-Lebanese', nationalityAr: 'برازيلية-لبنانية', photo: 'https://images.unsplash.com/photo-1618000851718-75f59e8264e1?w=600&h=800&fit=crop&crop=face', coverPhoto: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&h=700&fit=crop', titleEn: 'Chef-Owner', titleAr: 'شيف ومالكة', yearsExp: 15 },
  };
  const fb = fallbacks[id];
  if (!fb) return null;
  return {
    id,
    awards: ['Regional Award'],
    awardsAr: ['جائزة إقليمية'],
    bioEn: `${fb.nameEn} is an acclaimed chef working at the intersection of tradition and innovation, based in Saudi Arabia.`,
    bioAr: `${fb.nameAr} شيف حائز على جوائز يعمل في تقاطع التقليد والابتكار، مقيم في المملكة العربية السعودية.`,
    philosophyEn: 'Great food is honest food — it tells you exactly who made it and where they come from.',
    philosophyAr: 'الطعام الرائع هو طعام صادق — يخبرك بالضبط من صنعه ومن أين جاء.',
    quoteEn: '"Every dish is a letter home."',
    quoteAr: '"كل طبق رسالة إلى الوطن."',
    specialtyEn: 'Signature regional cuisine',
    specialtyAr: 'مطبخ إقليمي مميز',
    tabaqStars: 4,
    timeline: [],
    signatureDishes: [],
    upcomingEvents: [],
    recommendedRestaurantsEn: [],
    recommendedRestaurantsAr: [],
    recommendedRestaurantIds: [],
    ...fb,
  } as ChefDetail;
}

// ── Event type config ──────────────────────────────────────────────────────────
const EVENT_CONFIG = {
  dinner: { labelEn: 'Chef\'s Table', labelAr: 'طاولة الشيف', color: 'bg-primary/10 text-primary border-primary/20' },
  masterclass: { labelEn: 'Masterclass', labelAr: 'ماسترکلاس', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  tasting: { labelEn: 'Tasting', labelAr: 'تذوق', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  class: { labelEn: 'Class', labelAr: 'دورة', color: 'bg-green-50 text-green-700 border-green-200' },
};

// ── Page ───────────────────────────────────────────────────────────────────────

export function ChefDetailPage() {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? '1');

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'story' | 'dishes' | 'timeline' | 'events'>('story');

  const chef = CHEF_DETAILS[id] ?? buildFallbackDetail(id);

  if (!chef) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">{t('Chef not found', 'الشيف غير موجود')}</h2>
          <Link href="/chefs"><Button variant="outline" className="rounded-2xl mt-2">{t('Back to Chefs', 'العودة للطهاة')}</Button></Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'story' as const, labelEn: 'Story', labelAr: 'القصة' },
    { id: 'dishes' as const, labelEn: 'Signature Dishes', labelAr: 'الأطباق المميزة' },
    { id: 'timeline' as const, labelEn: 'Career', labelAr: 'المسيرة' },
    { id: 'events' as const, labelEn: 'Events', labelAr: 'الأحداث' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <div className="relative h-[420px] sm:h-[500px] overflow-hidden bg-[#0d0d0f]">
        <img
          src={chef.coverPhoto}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

        {/* Back button */}
        <div className="absolute top-6 start-6">
          <Link href="/chefs">
            <button className="flex items-center gap-2 text-white/80 hover:text-white bg-black/30 backdrop-blur border border-white/20 px-4 py-2 rounded-2xl text-sm font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : undefined }} />
              {t('All Chefs', 'جميع الطهاة')}
            </button>
          </Link>
        </div>

        {/* Action buttons */}
        <div className="absolute top-6 end-6 flex gap-2">
          <button
            onClick={() => setSaved(s => !s)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center border backdrop-blur transition-all ${
              saved ? 'bg-red-500/20 border-red-400/40 text-red-400' : 'bg-black/30 border-white/20 text-white/80 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
          <button className="w-10 h-10 rounded-2xl flex items-center justify-center border bg-black/30 border-white/20 text-white/80 hover:text-white backdrop-blur transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Chef info overlay */}
        <div className="absolute bottom-0 start-0 end-0 p-6 sm:p-10 flex flex-col sm:flex-row items-end sm:items-end gap-6">
          {/* Chef photo */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-muted">
              <img src={chef.photo} alt={chef.nameEn} className="w-full h-full object-cover object-top" />
            </div>
            {chef.michelinStars > 0 && (
              <div className="absolute -top-2 -end-2 bg-amber-400 text-black text-xs font-black rounded-full w-7 h-7 flex items-center justify-center border-2 border-background shadow">
                {chef.michelinStars === 1 ? '✦' : '✦✦'}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Awards badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {chef.michelinStars > 0 && (
                <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/40">
                  {Array.from({ length: chef.michelinStars }).map(() => '✦').join('')} Michelin
                </span>
              )}
              {chef.awards.some(a => a.includes('Bib')) && chef.michelinStars === 0 && (
                <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-300 text-xs font-bold px-3 py-1 rounded-full border border-red-400/40">
                  🍽️ Bib Gourmand
                </span>
              )}
              {chef.tabaqStars && (
                <span className="inline-flex items-center gap-1 bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/30">
                  {Array.from({ length: chef.tabaqStars }).map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-current" />)}
                  Tabaq
                </span>
              )}
            </div>

            <h1 className="text-white font-extrabold text-3xl sm:text-4xl leading-tight mb-1">
              {lang === 'ar' ? chef.nameAr : chef.nameEn}
            </h1>
            <p className="text-white/70 text-sm sm:text-base mb-2">
              {lang === 'ar' ? chef.titleAr : chef.titleEn}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-white/60 text-sm">
              <span className="flex items-center gap-1">
                <Utensils className="w-3.5 h-3.5" />
                <Link href={`/restaurants/${chef.restaurantId}`} className="hover:text-white transition-colors">
                  {lang === 'ar' ? chef.restaurantAr : chef.restaurantEn}
                </Link>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {lang === 'ar' ? chef.cityAr : chef.cityEn}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                {lang === 'ar' ? chef.nationalityAr : chef.nationalityEn}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {chef.yearsExp} {t('years', 'سنة')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-3">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {lang === 'ar' ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">

            {/* ── Story Tab ── */}
            {activeTab === 'story' && (
              <>
                {/* Quote */}
                <div className="bg-gradient-to-br from-primary/5 to-violet-500/5 border border-primary/15 rounded-3xl p-6">
                  <Quote className="w-8 h-8 text-primary/30 mb-3" />
                  <blockquote className="text-lg sm:text-xl font-semibold text-foreground leading-relaxed italic">
                    {lang === 'ar' ? chef.quoteAr : chef.quoteEn}
                  </blockquote>
                </div>

                {/* Biography */}
                <div>
                  <h2 className="text-xl font-extrabold text-foreground mb-4">{t('Biography', 'السيرة الذاتية')}</h2>
                  <div className="space-y-4">
                    {(lang === 'ar' ? chef.bioAr : chef.bioEn).split('\n\n').map((para, i) => (
                      <p key={i} className="text-muted-foreground leading-relaxed text-[15px]">{para}</p>
                    ))}
                  </div>
                </div>

                {/* Philosophy */}
                <div className="bg-secondary/60 rounded-3xl p-6 border border-border/60">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-foreground">{t('Culinary Philosophy', 'الفلسفة الطهوية')}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {lang === 'ar' ? chef.philosophyAr : chef.philosophyEn}
                  </p>
                </div>

                {/* Specialty */}
                <div className="flex items-start gap-4 bg-card border border-border/60 rounded-3xl p-5">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Flame className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground mb-1">{t('Specialty', 'التخصص')}</p>
                    <p className="text-muted-foreground text-sm">
                      {lang === 'ar' ? chef.specialtyAr : chef.specialtyEn}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* ── Dishes Tab ── */}
            {activeTab === 'dishes' && (
              <div className="space-y-5">
                <h2 className="text-xl font-extrabold text-foreground">{t('Signature Dishes', 'الأطباق المميزة')}</h2>
                {chef.signatureDishes.length === 0 ? (
                  <div className="text-center py-16 bg-card border border-border/60 rounded-3xl">
                    <Utensils className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('Dishes coming soon.', 'الأطباق قادمة قريباً.')}</p>
                  </div>
                ) : (
                  chef.signatureDishes.map((dish, i) => (
                    <Link key={i} href={`/restaurants/${dish.restaurantId}`}>
                      <article className="group bg-card border border-border/60 rounded-3xl overflow-hidden hover:shadow-md transition-all flex flex-col sm:flex-row">
                        <div className="sm:w-52 h-44 sm:h-auto overflow-hidden shrink-0 bg-muted">
                          <img
                            src={dish.image}
                            alt={dish.nameEn}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-5 flex flex-col justify-between flex-1">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-extrabold text-foreground text-lg leading-snug">
                                {lang === 'ar' ? dish.nameAr : dish.nameEn}
                              </h3>
                              <span className="shrink-0 bg-primary/10 text-primary font-bold text-sm px-3 py-1 rounded-xl">
                                {dish.price}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                              {lang === 'ar' ? dish.descAr : dish.descEn}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-4 text-xs text-primary font-semibold">
                            <ExternalLink className="w-3.5 h-3.5" />
                            {t('View at restaurant', 'عرض في المطعم')}
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* ── Timeline Tab ── */}
            {activeTab === 'timeline' && (
              <div>
                <h2 className="text-xl font-extrabold text-foreground mb-6">{t('Career Timeline', 'المسيرة المهنية')}</h2>
                {chef.timeline.length === 0 ? (
                  <div className="text-center py-16 bg-card border border-border/60 rounded-3xl">
                    <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('Timeline coming soon.', 'المسيرة قادمة قريباً.')}</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute start-[22px] top-0 bottom-0 w-px bg-border" />
                    <div className="space-y-8">
                      {chef.timeline.map((entry, i) => {
                        const Icon = entry.icon;
                        return (
                          <div key={i} className="flex gap-5 relative">
                            <div className="relative z-10 w-11 h-11 bg-card border-2 border-primary/30 rounded-2xl flex items-center justify-center shrink-0 shadow">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 bg-card border border-border/60 rounded-3xl p-4 hover:shadow-sm transition-shadow">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="bg-primary text-white text-xs font-black px-2.5 py-0.5 rounded-full">{entry.year}</span>
                                <h3 className="font-bold text-foreground text-sm">
                                  {lang === 'ar' ? entry.titleAr : entry.titleEn}
                                </h3>
                              </div>
                              <p className="text-muted-foreground text-sm leading-relaxed">
                                {lang === 'ar' ? entry.descAr : entry.descEn}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Events Tab ── */}
            {activeTab === 'events' && (
              <div>
                <h2 className="text-xl font-extrabold text-foreground mb-6">{t('Upcoming Events', 'الأحداث القادمة')}</h2>
                {chef.upcomingEvents.length === 0 ? (
                  <div className="text-center py-16 bg-card border border-border/60 rounded-3xl">
                    <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('No upcoming events.', 'لا توجد أحداث قادمة.')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chef.upcomingEvents.map((event, i) => {
                      const cfg = EVENT_CONFIG[event.type];
                      return (
                        <div key={i} className="bg-card border border-border/60 rounded-3xl p-5 hover:shadow-sm transition-shadow">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                              <CalendarDays className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>
                                  {lang === 'ar' ? cfg.labelAr : cfg.labelEn}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {lang === 'ar' ? event.dateAr : event.dateEn}
                                </span>
                              </div>
                              <h3 className="font-bold text-foreground mb-1">
                                {lang === 'ar' ? event.titleAr : event.titleEn}
                              </h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                {lang === 'ar' ? event.venueAr : event.venueEn}
                              </p>
                            </div>
                            <Link href="/bookings">
                              <Button size="sm" className="rounded-xl shrink-0">
                                {t('Book', 'احجز')}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Restaurant card */}
            <Link href={`/restaurants/${chef.restaurantId}`}>
              <div className="bg-card border border-border/60 rounded-3xl overflow-hidden hover:shadow-md transition-all group">
                <div className="h-32 bg-muted overflow-hidden">
                  <img
                    src={chef.coverPhoto}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{t('Current Restaurant', 'المطعم الحالي')}</p>
                  <p className="font-extrabold text-foreground mb-0.5">
                    {lang === 'ar' ? chef.restaurantAr : chef.restaurantEn}
                  </p>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <MapPin className="w-3 h-3" />
                    {lang === 'ar' ? chef.cityAr : chef.cityEn}
                  </div>
                  <button className="w-full mt-3 bg-primary text-white font-bold py-2.5 rounded-2xl text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    {t('View Restaurant', 'عرض المطعم')} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Link>

            {/* Awards */}
            <div className="bg-card border border-border/60 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-foreground text-sm">{t('Awards & Recognition', 'الجوائز والتكريم')}</h3>
              </div>
              <div className="space-y-2.5">
                {chef.awards.map((award, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center shrink-0">
                      <Award className="w-3 h-3 text-amber-500" />
                    </div>
                    <p className="text-sm text-foreground">
                      {lang === 'ar' ? (chef.awardsAr[i] ?? award) : award}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-card border border-border/60 rounded-3xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-4">{t('Quick Facts', 'حقائق سريعة')}</h3>
              <div className="space-y-3">
                {[
                  { icon: Globe, labelEn: 'Nationality', labelAr: 'الجنسية', valueEn: chef.nationalityEn, valueAr: chef.nationalityAr },
                  { icon: Utensils, labelEn: 'Cuisine', labelAr: 'المطبخ', valueEn: chef.cuisineEn, valueAr: chef.cuisineAr },
                  { icon: Clock, labelEn: 'Experience', labelAr: 'الخبرة', valueEn: `${chef.yearsExp} years`, valueAr: `${chef.yearsExp} سنة` },
                  { icon: MapPin, labelEn: 'Based in', labelAr: 'مقيم في', valueEn: chef.cityEn, valueAr: chef.cityAr },
                ].map((fact, i) => {
                  const Icon = fact.icon;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground w-20 shrink-0">{lang === 'ar' ? fact.labelAr : fact.labelEn}</span>
                      <span className="text-xs font-semibold text-foreground">{lang === 'ar' ? fact.valueAr : fact.valueEn}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chef's recommendations */}
            {chef.recommendedRestaurantsEn.length > 0 && (
              <div className="bg-card border border-border/60 rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BadgeCheck className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-foreground text-sm">{t("Chef's Picks", 'اختيارات الشيف')}</h3>
                </div>
                <div className="space-y-2.5">
                  {chef.recommendedRestaurantsEn.map((name, i) => (
                    <Link key={i} href={`/restaurants/${chef.recommendedRestaurantIds[i]}`}>
                      <div className="flex items-center gap-3 hover:bg-secondary/40 rounded-xl p-2 transition-colors">
                        <div className="w-7 h-7 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 text-xs font-black text-primary">
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {lang === 'ar' ? chef.recommendedRestaurantsAr[i] : name}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground ms-auto" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Back to chefs */}
            <Link href="/chefs">
              <button className="w-full border border-border text-muted-foreground font-semibold py-2.5 rounded-2xl text-sm hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-2">
                <ChefHat className="w-4 h-4" />
                {t('All Chefs', 'جميع الطهاة')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChefDetailPage;
