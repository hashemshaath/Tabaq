import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import {
  ChefHat, Award, Star, MapPin, Utensils, Filter, Search,
  ChevronRight, Globe, Flame, Sparkles, BadgeCheck, Clock, ArrowRight,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Chef {
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
  michelinStars: number;
  awards: string[];
  awardsAr: string[];
  bioShortEn: string;
  bioShortAr: string;
  specialtyEn: string;
  specialtyAr: string;
  yearsExp: number;
  featured?: boolean;
  tabaqStars?: number;
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

const CHEFS: Chef[] = [
  {
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
    photo: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=500&fit=crop&crop=face',
    coverPhoto: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=600&fit=crop',
    michelinStars: 2,
    awards: ['Michelin ✦✦', 'MENA Best Chef 2024', 'Tabaq Gold Award'],
    awardsAr: ['ميشلان ✦✦', 'أفضل شيف في الشرق الأوسط 2024', 'جائزة طبق الذهبية'],
    bioShortEn: 'A pioneer of modern Saudi cuisine, Chef Mahmoud trained at Le Cordon Bleu Paris before returning to elevate the flavours of his homeland. His restaurant Atma has held two Michelin stars since 2023, pioneering heritage grain fermentations and slow-cooked desert lamb.',
    bioShortAr: 'رائد المطبخ السعودي الحديث، تدرّب الشيف محمود في لو كوردون بلو باريس قبل أن يعود لترقية نكهات وطنه. يحتل مطعمه "أتما" نجمتين ميشلان منذ 2023، رائداً في تخمير الحبوب الموروثة وطهي لحم الضأن الصحراوي ببطء.',
    specialtyEn: 'Heritage grain fermentation & desert lamb',
    specialtyAr: 'تخمير الحبوب الموروثة ولحم الضأن الصحراوي',
    yearsExp: 18,
    featured: true,
    tabaqStars: 5,
  },
  {
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
    photo: 'https://images.unsplash.com/photo-1583394293214-bf9b5e68d6c1?w=400&h=500&fit=crop&crop=face',
    coverPhoto: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=600&fit=crop',
    michelinStars: 0,
    awards: ['Michelin Bib Gourmand', 'Forbes 30 Under 30 MENA', 'Saudi Vision 2030 Culinary Ambassador'],
    awardsAr: ['بيب جورمان ميشلان', 'فوربس 30 تحت 30 في منطقة الشرق الأوسط', 'سفيرة الطهي لرؤية السعودية 2030'],
    bioShortEn: 'The first Saudi woman to receive a Michelin recognition, Chef Sara\'s Bint Al-Jazira is a love letter to the flavours she grew up with in Jeddah\'s old city. Her kitchen is a classroom and a temple — where traditional Ma\'asub, Saleeg, and Kabsa are reimagined without compromise.',
    bioShortAr: 'أول امرأة سعودية تنال اعترافاً من ميشلان، مطعم "بنت الجزيرة" للشيف سارة هو رسالة حب لنكهات طفولتها في جدة القديمة. مطبخها فصل دراسي ومعبد — حيث يُعاد تصور المعصوب والسليق والكبسة التقليدية دون تنازلات.',
    specialtyEn: 'Hejazi cuisine & ancient bread traditions',
    specialtyAr: 'المطبخ الحجازي وتقاليد الخبز القديمة',
    yearsExp: 12,
    tabaqStars: 5,
  },
  {
    id: 3,
    nameEn: 'Yuki Tanaka',
    nameAr: 'يوكي تاناكا',
    titleEn: 'Head Sushi Chef',
    titleAr: 'رئيس شيف السوشي',
    nationalityEn: 'Japanese',
    nationalityAr: 'ياباني',
    restaurantEn: 'Sushi Sama',
    restaurantAr: 'سوشي ساما',
    restaurantId: 3,
    cityEn: 'Riyadh',
    cityAr: 'الرياض',
    cuisineEn: 'Edomae & Omakase',
    cuisineAr: 'إدوماي وأوماكاسي',
    photo: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf6?w=400&h=500&fit=crop&crop=face',
    coverPhoto: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&h=600&fit=crop',
    michelinStars: 1,
    awards: ['Michelin ✦', 'Best Asian Chef Saudi Arabia 2024', 'Tokyo Sushi Masters Finalist'],
    awardsAr: ['ميشلان ✦', 'أفضل شيف آسيوي في المملكة 2024', 'متأهل لمسابقة أساتذة السوشي طوكيو'],
    bioShortEn: 'Chef Yuki spent 12 years perfecting Edomae technique in Tokyo\'s most revered sushi-ya before bringing his mastery to Riyadh. Every grain of his shari rice is seasoned individually, and his fish is sourced twice weekly directly from Toyosu Market.',
    bioShortAr: 'قضى الشيف يوكي 12 عاماً في إتقان تقنية إدوماي في أرقى مطاعم السوشي بطوكيو قبل أن يجلب إتقانه إلى الرياض. كل حبة في أرز الشاري يُتبَّل بشكل فردي، وسمكه يُجلب مرتين أسبوعياً مباشرة من سوق تويوسو.',
    specialtyEn: 'Edomae sushi & seasonal omakase',
    specialtyAr: 'سوشي إدوماي وأوماكاسي موسمي',
    yearsExp: 20,
    tabaqStars: 5,
  },
  {
    id: 4,
    nameEn: 'Luca Ferrari',
    nameAr: 'لوكا فيراري',
    titleEn: 'Executive Chef',
    titleAr: 'الشيف التنفيذي',
    nationalityEn: 'Italian',
    nationalityAr: 'إيطالي',
    restaurantEn: 'La Perla Riyadh',
    restaurantAr: 'لا بيرلا الرياض',
    restaurantId: 1,
    cityEn: 'Riyadh',
    cityAr: 'الرياض',
    cuisineEn: 'Modern Italian Fine Dining',
    cuisineAr: 'الطهي الإيطالي الفاخر الحديث',
    photo: 'https://images.unsplash.com/photo-1595475038665-c3eb23dc517e?w=400&h=500&fit=crop&crop=face',
    coverPhoto: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=600&fit=crop',
    michelinStars: 1,
    awards: ['Michelin ✦', 'World\'s 50 Best Alumni', 'Italian Culinary Excellence Award'],
    awardsAr: ['ميشلان ✦', 'خريج أفضل 50 مطعماً في العالم', 'جائزة التميز في فن الطهي الإيطالي'],
    bioShortEn: 'Born in Modena, Chef Luca trained under Massimo Bottura before charting his own path across Dubai and now Riyadh. His tasting menu is a journey through the regions of Italy, reinterpreted through the lens of Saudi seasonal produce.',
    bioShortAr: 'وُلد في مودينا، وتدرّب الشيف لوكا على يد ماسيمو بوتورا قبل أن يشق طريقه الخاص عبر دبي ثم الرياض. قائمة التذوق لديه رحلة عبر مناطق إيطاليا، معاد تفسيرها من خلال منتجات المملكة الموسمية.',
    specialtyEn: 'Fresh pasta & truffle gastronomy',
    specialtyAr: 'المعكرونة الطازجة والكمأة الفاخرة',
    yearsExp: 22,
  },
  {
    id: 5,
    nameEn: 'Tariq Al-Ghamdi',
    nameAr: 'طارق الغامدي',
    titleEn: 'Chef & Co-Founder',
    titleAr: 'شيف ومؤسس مشارك',
    nationalityEn: 'Saudi Arabian',
    nationalityAr: 'سعودي',
    restaurantEn: 'Qasr Al-Tabikh',
    restaurantAr: 'قصر الطبيخ',
    restaurantId: 4,
    cityEn: 'Riyadh',
    cityAr: 'الرياض',
    cuisineEn: 'Molecular Arabic Gastronomy',
    cuisineAr: 'الطهي الجزيئي العربي',
    photo: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=400&h=500&fit=crop&crop=face',
    coverPhoto: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&h=600&fit=crop',
    michelinStars: 1,
    awards: ['Michelin ✦', 'Best Innovative Chef Arab World 2023', 'Tabaq Chef of the Year 2024'],
    awardsAr: ['ميشلان ✦', 'أكثر الشيفات ابتكاراً في العالم العربي 2023', 'شيف طبق للعام 2024'],
    bioShortEn: 'Chef Tariq graduated top of his class at The Culinary Institute of America before immersing himself in the molecular kitchens of elBulli alumni. He then brought this radical technique home — applying spherification, liquid nitrogen, and edible aerosols to Saudi grandmothers\' recipes.',
    bioShortAr: 'تخرّج الشيف طارق في مقدمة فصله من معهد أمريكا للطهي قبل أن يغمر نفسه في مطابخ خريجي إيل بولي الجزيئية. ثم جلب هذه التقنية الجذرية إلى الوطن — مطبقاً التكويرة والنيتروجين السائل والهباء الجوي الصالح للأكل على وصفات الجدات السعوديات.',
    specialtyEn: 'Spherification of Arabic spices & liquid nitrogen desserts',
    specialtyAr: 'تكويرة التوابل العربية وحلويات النيتروجين السائل',
    yearsExp: 14,
  },
  {
    id: 6,
    nameEn: 'Ahmed Farouk',
    nameAr: 'أحمد فاروق',
    titleEn: 'Executive Chef',
    titleAr: 'الشيف التنفيذي',
    nationalityEn: 'Egyptian-Saudi',
    nationalityAr: 'مصري-سعودي',
    restaurantEn: 'Bab Al-Sharq',
    restaurantAr: 'باب الشرق',
    restaurantId: 2,
    cityEn: 'Riyadh',
    cityAr: 'الرياض',
    cuisineEn: 'Elevated Levantine & Gulf',
    cuisineAr: 'المطبخ الشامي والخليجي الراقي',
    photo: 'https://images.unsplash.com/photo-1622021142947-da7dedc7c39a?w=400&h=500&fit=crop&crop=face',
    coverPhoto: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=600&fit=crop',
    michelinStars: 0,
    awards: ['Michelin Bib Gourmand', 'Time Out Best MENA Restaurant 2023', 'Top 100 Chefs Arab World'],
    awardsAr: ['بيب جورمان ميشلان', 'أفضل مطعم في الشرق الأوسط - تايم آوت 2023', 'أفضل 100 شيف في العالم العربي'],
    bioShortEn: 'Born in Cairo to a family of hospitality professionals, Chef Ahmed has spent 20 years traversing the MENA region to document, archive, and then reinvent its most beloved dishes. His mezze spreads have been described as "edible archaeology".',
    bioShortAr: 'وُلد في القاهرة لعائلة من المهنيين في قطاع الضيافة، قضى الشيف أحمد 20 عاماً في جولات منطقة الشرق الأوسط لتوثيق وأرشفة ثم إعادة ابتكار أكثر أطباقها شعبية. وصفت مائدة مزته بأنها "علم الآثار الصالح للأكل".',
    specialtyEn: 'Levantine mezze revival & ancient spice blends',
    specialtyAr: 'إحياء المزة الشامية ومزيج التوابل القديمة',
    yearsExp: 20,
  },
  {
    id: 7,
    nameEn: 'James Whitfield',
    nameAr: 'جيمس ويتفيلد',
    titleEn: 'Head Chef',
    titleAr: 'رئيس الطهاة',
    nationalityEn: 'British',
    nationalityAr: 'بريطاني',
    restaurantEn: 'Nobu Riyadh',
    restaurantAr: 'نوبو الرياض',
    restaurantId: 7,
    cityEn: 'Riyadh',
    cityAr: 'الرياض',
    cuisineEn: 'Japanese-Peruvian Fusion',
    cuisineAr: 'المطبخ الياباني-البيروفي المدموج',
    photo: 'https://images.unsplash.com/photo-1512485694743-9c9538b4e6e0?w=400&h=500&fit=crop&crop=face',
    coverPhoto: 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=1200&h=600&fit=crop',
    michelinStars: 0,
    awards: ['Nobu Global Excellence Award', 'Great British Menu Finalist', 'Harden\'s Top 100 Chef'],
    awardsAr: ['جائزة التميز العالمية نوبو', 'متأهل لـ Great British Menu', 'أفضل 100 شيف بريطاني'],
    bioShortEn: 'Trained at The Fat Duck and then mentored by Nobu Matsuhisa himself for five years, Chef James brings an obsessive attention to temperature and texture. His version of Black Cod Miso has been called the definitive interpretation outside Japan.',
    bioShortAr: 'تدرّب في The Fat Duck ثم أُتيحت له الإرشاد من نوبو ماتسوهيسا نفسه لمدة خمس سنوات، يُعبّر الشيف جيمس عن اهتمام وسواسي بالحرارة والملمس. وُصف إصداره من القد الأسود بالميسو بأنه التفسير النهائي خارج اليابان.',
    specialtyEn: 'Black Cod Miso & Nikkei cuisine',
    specialtyAr: 'القد الأسود بالميسو ومطبخ نيكي',
    yearsExp: 16,
  },
  {
    id: 8,
    nameEn: 'Maria Santos',
    nameAr: 'ماريا سانتوس',
    titleEn: 'Chef-Owner',
    titleAr: 'شيف ومالكة',
    nationalityEn: 'Brazilian-Lebanese',
    nationalityAr: 'برازيلية-لبنانية',
    restaurantEn: 'Sao & Beirut — Fusion Kitchen',
    restaurantAr: 'ساو وبيروت — مطبخ الدمج',
    restaurantId: 1,
    cityEn: 'Jeddah',
    cityAr: 'جدة',
    cuisineEn: 'Brazilian-Arabic Fusion',
    cuisineAr: 'مطبخ دمج برازيلي-عربي',
    photo: 'https://images.unsplash.com/photo-1618000851718-75f59e8264e1?w=400&h=500&fit=crop&crop=face',
    coverPhoto: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=600&fit=crop',
    michelinStars: 0,
    awards: ['Best Female Chef Jeddah 2024', 'Gault&Millau Rising Star', 'Tabaq Community Award 2024'],
    awardsAr: ['أفضل شيف نسائية في جدة 2024', 'نجم صاعد - غو وميو', 'جائزة مجتمع طبق 2024'],
    bioShortEn: 'Chef Maria\'s story is one of two worlds colliding beautifully. Raised between São Paulo and Beirut, she arrived in Jeddah seven years ago and found a city ready for her vision — a kitchen where açaí meets pomegranate molasses, and ceviche meets tabbouleh.',
    bioShortAr: 'قصة الشيف ماريا هي تصادم جميل بين عالمين. نشأت بين ساو باولو وبيروت، وصلت جدة منذ سبع سنوات ووجدت مدينة جاهزة لرؤيتها — مطبخ يلتقي فيه الأساي مع دبس الرمان، ويلتقي السيفيتشي مع التبولة.',
    specialtyEn: 'Afro-Arab spice crossover & Amazonian ingredients',
    specialtyAr: 'تقاطع التوابل الأفريقية العربية ومكونات الأمازون',
    yearsExp: 15,
  },
];

const CUISINE_FILTERS = [
  { en: 'All Cuisines', ar: 'كل المطابخ', value: '' },
  { en: 'Modern Saudi', ar: 'سعودي حديث', value: 'saudi' },
  { en: 'Japanese', ar: 'ياباني', value: 'japanese' },
  { en: 'Italian', ar: 'إيطالي', value: 'italian' },
  { en: 'Levantine', ar: 'شامي', value: 'levantine' },
  { en: 'Fusion', ar: 'دمج', value: 'fusion' },
];

const AWARD_FILTERS = [
  { en: 'All Awards', ar: 'كل الجوائز', value: '' },
  { en: 'Michelin Starred', ar: 'نجمة ميشلان', value: 'star' },
  { en: 'Bib Gourmand', ar: 'بيب جورمان', value: 'bib' },
  { en: 'Tabaq Award', ar: 'جائزة طبق', value: 'tabaq' },
];

function MichelinStars({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-amber-400 text-sm">✦</span>
      ))}
    </div>
  );
}

function ChefCard({ chef, lang, t }: { chef: Chef; lang: string; t: (en: string, ar: string) => string }) {
  return (
    <Link href={`/chefs/${chef.id}`}>
      <article className="group bg-card border border-border/60 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col">
        {/* Photo */}
        <div className="relative h-60 overflow-hidden bg-muted">
          <img
            src={chef.photo}
            alt={chef.nameEn}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Michelin / award badge */}
          <div className="absolute top-3 start-3 flex flex-col gap-1.5">
            {chef.michelinStars > 0 && (
              <span className="inline-flex items-center gap-1 bg-black/80 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-400/40 backdrop-blur">
                {Array.from({ length: chef.michelinStars }).map((_, i) => <span key={i}>✦</span>)}
                <span className="text-white ms-0.5">Michelin</span>
              </span>
            )}
            {chef.awards.some(a => a.includes('Bib')) && chef.michelinStars === 0 && (
              <span className="inline-flex items-center gap-1 bg-red-600/90 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur">
                <span>🍽️</span> Bib Gourmand
              </span>
            )}
          </div>

          {/* Tabaq stars */}
          {chef.tabaqStars && (
            <div className="absolute top-3 end-3">
              <span className="bg-primary/90 backdrop-blur text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-0.5">
                {Array.from({ length: chef.tabaqStars }).map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 fill-current" />
                ))}
              </span>
            </div>
          )}

          {/* Name overlay */}
          <div className="absolute bottom-3 start-3 end-3">
            <p className="text-white font-extrabold text-xl leading-tight">
              {lang === 'ar' ? chef.nameAr : chef.nameEn}
            </p>
            <p className="text-white/70 text-xs mt-0.5">
              {lang === 'ar' ? chef.titleAr : chef.titleEn}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Restaurant + City */}
          <div className="flex items-start gap-2 mb-3">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Utensils className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm truncate">
                {lang === 'ar' ? chef.restaurantAr : chef.restaurantEn}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">{lang === 'ar' ? chef.cityAr : chef.cityEn}</span>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">{lang === 'ar' ? chef.nationalityAr : chef.nationalityEn}</span>
              </div>
            </div>
          </div>

          {/* Cuisine tag + years exp */}
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-secondary text-foreground text-xs font-semibold px-3 py-1 rounded-full">
              {lang === 'ar' ? chef.cuisineAr : chef.cuisineEn}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {chef.yearsExp} {t('yrs', 'سنة')}
            </span>
          </div>

          {/* Short bio */}
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
            {lang === 'ar' ? chef.bioShortAr : chef.bioShortEn}
          </p>

          {/* Awards strip */}
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
            {chef.awards.slice(0, 2).map((award, i) => (
              <span key={i} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate max-w-[140px]">
                {lang === 'ar' ? (chef.awardsAr[i] ?? award) : award}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('Specialty', 'التخصص')}: <span className="text-foreground font-medium">{lang === 'ar' ? chef.specialtyAr.split(' ')[0] : chef.specialtyEn.split(' ')[0]}…</span></span>
            <ChevronRight className="w-4 h-4 text-primary" />
          </div>
        </div>
      </article>
    </Link>
  );
}

// ── Featured Chef Banner ────────────────────────────────────────────────────────

function FeaturedChef({ chef, lang, t }: { chef: Chef; lang: string; t: (en: string, ar: string) => string }) {
  const [, navigate] = useLocation();
  return (
    <div
      className="relative rounded-3xl overflow-hidden h-72 cursor-pointer group"
      onClick={() => navigate(`/chefs/${chef.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/chefs/${chef.id}`)}
    >
      <img
        src={chef.coverPhoto}
        alt=""
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Chef photo */}
      <div className="absolute bottom-0 end-0 h-full w-72 overflow-hidden opacity-60">
        <img
          src={chef.photo}
          alt={chef.nameEn}
          className="h-full w-full object-cover object-top"
          style={{ maskImage: 'linear-gradient(to left, black 40%, transparent 100%)' }}
        />
      </div>

      <div className="absolute inset-6 flex flex-col justify-end max-w-md">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
            {t('Featured Chef', 'شيف مميز')}
          </span>
          <span className="bg-amber-400/20 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-400/40">
            {Array.from({ length: chef.michelinStars }).map(() => '✦').join('')} Michelin
          </span>
        </div>

        <h2 className="text-white font-extrabold text-3xl leading-tight mb-1">
          {lang === 'ar' ? chef.nameAr : chef.nameEn}
        </h2>
        <p className="text-white/70 text-sm mb-2">
          {lang === 'ar' ? chef.titleAr : chef.titleEn} · {lang === 'ar' ? chef.restaurantAr : chef.restaurantEn}
        </p>
        <p className="text-white/80 text-sm leading-relaxed line-clamp-2">
          {lang === 'ar' ? chef.bioShortAr : chef.bioShortEn}
        </p>

        <div className="flex items-center gap-3 mt-4">
          <button className="bg-white text-black font-bold px-5 py-2.5 rounded-2xl text-sm hover:bg-white/90 transition-colors flex items-center gap-2">
            {t('View Profile', 'عرض الملف')} <ArrowRight className="w-4 h-4" />
          </button>
          <button
            className="border border-white/40 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm hover:bg-white/10 transition-colors"
            onClick={e => { e.stopPropagation(); navigate(`/restaurants/${chef.restaurantId}`); }}
          >
            {t('See Restaurant', 'المطعم')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function ChefsPage() {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const [search, setSearch] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [awardFilter, setAwardFilter] = useState('');

  const featured = CHEFS.find(c => c.featured);

  const filtered = useMemo(() => {
    return CHEFS.filter(c => {
      if (c.featured && search === '' && cuisineFilter === '' && awardFilter === '') return true;
      const nameMatch = search === '' ||
        c.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        c.nameAr.includes(search) ||
        c.restaurantEn.toLowerCase().includes(search.toLowerCase());
      const cuisineMatch = cuisineFilter === '' ||
        c.cuisineEn.toLowerCase().includes(cuisineFilter) ||
        c.cuisineAr.includes(cuisineFilter);
      const awardMatch = awardFilter === '' ||
        (awardFilter === 'star' && c.michelinStars > 0) ||
        (awardFilter === 'bib' && c.awards.some(a => a.includes('Bib'))) ||
        (awardFilter === 'tabaq' && c.awards.some(a => a.includes('Tabaq')));
      return nameMatch && cuisineMatch && awardMatch;
    });
  }, [search, cuisineFilter, awardFilter]);

  const stats = [
    { valueEn: '8', valueAr: '٨', labelEn: 'World-Class Chefs', labelAr: 'طهاة عالميون' },
    { valueEn: '5', valueAr: '٥', labelEn: 'Michelin Stars', labelAr: 'نجوم ميشلان' },
    { valueEn: '7', valueAr: '٧', labelEn: 'Nationalities', labelAr: 'جنسيات' },
    { valueEn: '145+', valueAr: '١٤٥+', labelEn: 'Collective Years Experience', labelAr: 'سنة خبرة مجتمعة' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <div className="relative bg-[#0d0d0f] overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=600&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d0d0f]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
            <ChefHat className="w-4 h-4" />
            {t('TABAQ CHEF SERIES', 'سلسلة شيف طبق')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            {t('Meet the Masters', 'تعرّف على الأساتذة')}
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto mb-10">
            {t(
              'The visionary chefs shaping Saudi Arabia\'s culinary identity — from Michelin-starred kitchens to beloved neighbourhood restaurants.',
              'الطهاة الحالمون الذين يشكّلون الهوية الطهوية للمملكة — من مطابخ النجوم ميشلان إلى المطاعم المحبوبة في كل حي.'
            )}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {stats.map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl py-4 px-3">
                <p className="text-amber-400 font-extrabold text-2xl">{lang === 'ar' ? s.valueAr : s.valueEn}</p>
                <p className="text-white/50 text-xs mt-0.5">{lang === 'ar' ? s.labelAr : s.labelEn}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Featured Chef */}
        {featured && <div className="mb-10"><FeaturedChef chef={featured} lang={lang} t={t} /></div>}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Search chefs or restaurants…', 'ابحث عن شيف أو مطعم…')}
              className="w-full ps-9 pe-4 py-2.5 bg-card border border-border rounded-2xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Cuisine filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 shrink-0">
            {CUISINE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setCuisineFilter(f.value)}
                className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                  cuisineFilter === f.value
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {lang === 'ar' ? f.ar : f.en}
              </button>
            ))}
          </div>
        </div>

        {/* Award filter strip */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {AWARD_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setAwardFilter(f.value)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                awardFilter === f.value
                  ? 'bg-amber-400 text-black'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              {lang === 'ar' ? f.ar : f.en}
            </button>
          ))}
          <span className="ms-auto shrink-0 text-xs text-muted-foreground self-center">
            {filtered.length} {t('chefs', 'طهاة')}
          </span>
        </div>

        {/* Chef grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('No chefs match your filters.', 'لا يوجد طهاة يطابقون تصفيتك.')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(chef => (
              <ChefCard key={chef.id} chef={chef} lang={lang} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChefsPage;
