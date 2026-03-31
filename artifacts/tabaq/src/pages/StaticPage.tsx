import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Mail, Phone, MapPin, Clock, ChevronDown, ChevronUp,
  Instagram, Twitter, Linkedin, Star, Users, Globe, Award, ShieldCheck,
  Utensils, MessageCircle, CheckCircle2, Send,
} from 'lucide-react';

function StaticLayout({ title, titleAr, children }: { title: string; titleAr: string; children: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-8 -ms-2 text-muted-foreground">
            <ArrowRight className="w-4 h-4 me-1 rotate-180" />
            {t('Back to Home', 'العودة للرئيسية')}
          </Button>
        </Link>
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-8">{t(title, titleAr)}</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground space-y-6 text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

export function TermsPage() {
  const { t } = useLanguage();
  return (
    <StaticLayout title="Terms of Service" titleAr="شروط الخدمة">
      <p>{t('Last updated: March 2026', 'آخر تحديث: مارس 2026')}</p>

      <h2 className="text-foreground font-semibold text-base mt-8">{t('1. Acceptance of Terms', '١. قبول الشروط')}</h2>
      <p>{t('By accessing or using Tabaq ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please discontinue use immediately.', 'باستخدامك لمنصة طبق ("المنصة")، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا لم توافق، يرجى التوقف عن الاستخدام فوراً.')}</p>

      <h2 className="text-foreground font-semibold text-base mt-6">{t('2. Use of the Platform', '٢. استخدام المنصة')}</h2>
      <p>{t('You must be at least 18 years old to use Tabaq. You agree not to misuse the Platform, submit false reviews, or attempt to manipulate ratings. Tabaq reserves the right to suspend accounts that violate these terms.', 'يجب أن يكون عمرك 18 عامًا على الأقل لاستخدام طبق. توافق على عدم إساءة استخدام المنصة أو تقديم تقييمات كاذبة أو محاولة التلاعب بالتقييمات. تحتفظ طبق بحق تعليق الحسابات التي تنتهك هذه الشروط.')}</p>

      <h2 className="text-foreground font-semibold text-base mt-6">{t('3. Bookings and Vouchers', '٣. الحجوزات والقسائم')}</h2>
      <p>{t('Reservations made through Tabaq are subject to restaurant availability and policies. Vouchers are non-refundable unless stated otherwise. Tabaq acts as a marketplace and is not responsible for the quality of dining experiences.', 'تخضع الحجوزات المُجراة عبر طبق لتوافر المطعم وسياساته. لا يمكن استرداد القسائم إلا إذا نُص على ذلك. تعمل طبق كسوق إلكتروني ولا تتحمل المسؤولية عن جودة تجارب تناول الطعام.')}</p>

      <h2 className="text-foreground font-semibold text-base mt-6">{t('4. User Content', '٤. محتوى المستخدم')}</h2>
      <p>{t('By submitting reviews, photos, or other content, you grant Tabaq a non-exclusive, royalty-free license to use, display, and distribute your content. You are responsible for ensuring your content does not infringe on third-party rights.', 'بتقديم تقييمات أو صور أو محتوى آخر، فإنك تمنح طبق ترخيصًا غير حصري وخاليًا من حقوق الملكية لاستخدام محتواك وعرضه وتوزيعه. أنت مسؤول عن التأكد من أن محتواك لا ينتهك حقوق أطراف ثالثة.')}</p>

      <h2 className="text-foreground font-semibold text-base mt-6">{t('5. Limitation of Liability', '٥. تحديد المسؤولية')}</h2>
      <p>{t('Tabaq is provided "as is" without warranties of any kind. We shall not be liable for indirect, incidental, or consequential damages arising from your use of the Platform.', 'تُقدَّم طبق "كما هي" دون أي ضمانات. لن نكون مسؤولين عن الأضرار غير المباشرة أو العرضية أو التبعية الناجمة عن استخدامك للمنصة.')}</p>

      <h2 className="text-foreground font-semibold text-base mt-6">{t('6. Governing Law', '٦. القانون الحاكم')}</h2>
      <p>{t('These Terms are governed by the laws of the Kingdom of Saudi Arabia.', 'تخضع هذه الشروط لقوانين المملكة العربية السعودية.')}</p>

      <h2 className="text-foreground font-semibold text-base mt-6">{t('7. Contact Us', '٧. تواصل معنا')}</h2>
      <p>{t('For any questions regarding these Terms, please contact us at legal@tabaq.sa', 'لأي استفسارات بشأن هذه الشروط، يرجى التواصل معنا على legal@tabaq.sa')}</p>
    </StaticLayout>
  );
}

export function PrivacyPage() {
  const { t } = useLanguage();
  return (
    <StaticLayout title="Privacy Policy" titleAr="سياسة الخصوصية">
      <p>{t('Last updated: March 2026', 'آخر تحديث: مارس 2026')}</p>

      <h2 className="text-foreground font-semibold text-base mt-8">{t('1. Information We Collect', '١. المعلومات التي نجمعها')}</h2>
      <p>{t('We collect information you provide when registering (name, phone number, email), booking tables, writing reviews, and browsing restaurants. We also collect usage data such as page views and search queries to improve the Platform.', 'نجمع المعلومات التي تقدمها عند التسجيل (الاسم ورقم الهاتف والبريد الإلكتروني) وحجز الطاولات وكتابة التقييمات وتصفح المطاعم. كما نجمع بيانات الاستخدام مثل مشاهدات الصفحة واستعلامات البحث لتحسين المنصة.')}</p>

      <h2 className="text-foreground font-semibold text-base mt-6">{t('2. How We Use Your Information', '٢. كيف نستخدم معلوماتك')}</h2>
      <p>{t('We use your data to: provide and improve our services, process bookings and vouchers, send relevant notifications, personalise your experience, and comply with legal obligations.', 'نستخدم بياناتك لـ: تقديم خدماتنا وتحسينها ومعالجة الحجوزات والقسائم وإرسال إشعارات ذات صلة وتخصيص تجربتك والامتثال للالتزامات القانونية.')}</p>

      <h2 className="text-foreground font-semibold text-base mt-6">{t('3. Sharing of Information', '٣. مشاركة المعلومات')}</h2>
      <p>{t('We do not sell your personal data. We may share data with restaurant partners (for bookings), payment processors, and analytics providers under strict confidentiality agreements.', 'نحن لا نبيع بياناتك الشخصية. قد نشارك البيانات مع شركاء المطاعم (للحجوزات) ومعالجي المدفوعات ومزودي التحليلات بموجب اتفاقيات سرية صارمة.')}</p>

      <h2 className="text-foreground font-semibold text-base mt-6">{t('4. Data Retention', '٤. الاحتفاظ بالبيانات')}</h2>
      <p>{t('We retain your personal data for as long as your account is active or as required by law. You may request deletion of your account and associated data at any time.', 'نحتفظ ببياناتك الشخصية طالما كان حسابك نشطًا أو كما يقتضيه القانون. يمكنك طلب حذف حسابك والبيانات المرتبطة به في أي وقت.')}</p>

      <h2 className="text-foreground font-semibold text-base mt-6">{t('5. Cookies', '٥. ملفات تعريف الارتباط')}</h2>
      <p>{t('We use cookies and similar technologies to maintain your session, remember preferences, and analyse usage. You can control cookie settings through your browser.', 'نستخدم ملفات تعريف الارتباط وتقنيات مماثلة للحفاظ على جلستك وتذكر تفضيلاتك وتحليل الاستخدام. يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال متصفحك.')}</p>

      <h2 className="text-foreground font-semibold text-base mt-6">{t('6. Your Rights', '٦. حقوقك')}</h2>
      <p>{t('You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at privacy@tabaq.sa', 'يحق لك الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها. لممارسة هذه الحقوق، تواصل معنا على privacy@tabaq.sa')}</p>

      <h2 className="text-foreground font-semibold text-base mt-6">{t('7. Contact Us', '٧. تواصل معنا')}</h2>
      <p>{t('For any privacy-related questions, please contact our Data Protection Officer at privacy@tabaq.sa', 'لأي أسئلة تتعلق بالخصوصية، يرجى التواصل مع مسؤول حماية البيانات على privacy@tabaq.sa')}</p>
    </StaticLayout>
  );
}

const TEAM = [
  { nameEn: 'Faisal Al-Turki', nameAr: 'فيصل التركي', roleEn: 'CEO & Co-Founder', roleAr: 'الرئيس التنفيذي والمؤسس المشارك', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
  { nameEn: 'Nora Al-Rashid', nameAr: 'نورة الراشد', roleEn: 'Chief Product Officer', roleAr: 'رئيسة قسم المنتج', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' },
  { nameEn: 'Ahmad Khalil', nameAr: 'أحمد خليل', roleEn: 'Head of Partnerships', roleAr: 'رئيس الشراكات', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' },
  { nameEn: 'Layla Bin Saeed', nameAr: 'ليلى بن سعيد', roleEn: 'Head of Culinary Curation', roleAr: 'رئيسة الاختيار الطهوي', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face' },
];

const STATS = [
  { valueEn: '2,400+', valueAr: '+٢٤٠٠', labelEn: 'Partner Restaurants', labelAr: 'مطعم شريك', icon: Utensils },
  { valueEn: '18 Cities', valueAr: '١٨ مدينة', labelEn: 'Across Saudi Arabia', labelAr: 'في أنحاء المملكة', icon: Globe },
  { valueEn: '1.2M+', valueAr: '+١.٢ مليون', labelEn: 'Registered Foodies', labelAr: 'مسجل في المنصة', icon: Users },
  { valueEn: '4.8★', valueAr: '★٤.٨', labelEn: 'Average App Rating', labelAr: 'متوسط تقييم التطبيق', icon: Star },
];

export function AboutPage() {
  const { t, lang } = useLanguage();
  return (
    <div className="min-h-screen bg-background">
      <Link href="/">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Button variant="ghost" size="sm" className="-ms-2 text-muted-foreground">
            <ArrowRight className="w-4 h-4 me-1 rotate-180" />
            {t('Back to Home', 'العودة للرئيسية')}
          </Button>
        </div>
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-background" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-bold tracking-widest uppercase text-primary bg-primary/10 px-3 py-1.5 rounded-full mb-6">
              {t('Our Story', 'قصتنا')}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
              {t('Saudi Arabia\'s', 'منصة استكشاف')}
              <br />
              <span className="text-primary">{t('Premier Dining', 'المطاعم الأولى')}</span>
              <br />
              {t('Platform', 'في المملكة العربية السعودية')}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {t(
                'Tabaq was born from a simple belief: every great meal deserves to be discovered. We are building Saudi Arabia\'s most trusted restaurant guide — combining the discovery of Zomato with the curatorial excellence of the Michelin Guide.',
                'وُلدت طبق من إيمان بسيط: كل وجبة رائعة تستحق أن تُكتشف. نبني دليل المطاعم الأكثر موثوقية في المملكة العربية السعودية — تجمع بين اكتشافية زوماتو وتميّز دليل ميشلان.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Cover image */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-16">
        <div className="rounded-2xl overflow-hidden h-64 md:h-96">
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&h=600&fit=crop"
            alt="Tabaq dining experience"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Stats */}
      <section className="bg-primary py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.labelEn} className="text-center">
                  <Icon className="w-6 h-6 text-white/70 mx-auto mb-2" />
                  <p className="text-3xl md:text-4xl font-black text-white mb-1">
                    {lang === 'ar' ? stat.valueAr : stat.valueEn}
                  </p>
                  <p className="text-sm text-white/70">
                    {t(stat.labelEn, stat.labelAr)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-foreground mb-5">{t('Our Mission', 'مهمتنا')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t(
                'We connect food lovers with exceptional restaurants across the Kingdom of Saudi Arabia. Whether you\'re searching for a hidden gem in Al-Ula, a Michelin-worthy experience in Riyadh, or a casual family dinner in Jeddah — Tabaq is your guide.',
                'نربط عشاق الطعام بالمطاعم الاستثنائية في أنحاء المملكة العربية السعودية. سواء كنت تبحث عن جوهرة خفية في العُلا، أو تجربة تستحق ميشلان في الرياض، أو عشاء عائلي مريح في جدة — طبق دليلك.'
              )}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {t(
                'We believe food is culture. Every review, every recommendation, and every booking on Tabaq helps preserve and celebrate the rich culinary heritage of the Arab world while championing innovative chefs shaping the future of Saudi cuisine.',
                'نؤمن بأن الطعام ثقافة. كل تقييم وكل توصية وكل حجز على طبق يساعد في حفظ التراث الطهوي الغني للعالم العربي والاحتفاء به، مع دعم الطهاة المبدعين الذين يشكلون مستقبل المطبخ السعودي.'
              )}
            </p>
            <div className="space-y-3">
              {[
                { en: 'Verified restaurant data and real reviews', ar: 'بيانات موثّقة وتقييمات حقيقية' },
                { en: 'Transparent, ethical rating system', ar: 'نظام تقييم شفاف وأخلاقي' },
                { en: 'Committed to supporting Saudi restaurants', ar: 'ملتزمون بدعم المطاعم السعودية' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  {t(item.en, item.ar)}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden h-80 md:h-96">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop"
              alt="Restaurant interior"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-secondary/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-foreground mb-2 text-center">{t('What We Stand For', 'ما نؤمن به')}</h2>
          <p className="text-muted-foreground text-center mb-12">{t('The values guiding every decision we make', 'القيم التي توجه كل قرار نتخذه')}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Star, en: 'Culinary Excellence', ar: 'التميز الطهوي', descEn: 'We celebrate the highest standards in cooking, service, and ambiance — from street food to fine dining.', descAr: 'نحتفل بأعلى المعايير في الطبخ والخدمة والأجواء — من طعام الشارع إلى المطاعم الفاخرة.' },
              { icon: ShieldCheck, en: 'Trusted Reviews', ar: 'تقييمات موثوقة', descEn: 'Every review on Tabaq is from a verified diner. No fake ratings, no pay-to-win scores.', descAr: 'كل تقييم على طبق من زائر موثّق. لا تقييمات مزيفة، لا درجات مدفوعة.' },
              { icon: Users, en: 'Community First', ar: 'المجتمع أولاً', descEn: 'Our leaderboard, points, and social features are built to celebrate the foodies who make Tabaq great.', descAr: 'لوحة الصدارة والنقاط والميزات الاجتماعية لدينا مبنية للاحتفاء بعشاق الطعام الذين يجعلون طبق رائعاً.' },
              { icon: Globe, en: 'Saudi at Heart', ar: 'سعودي في الجوهر', descEn: 'Built in Riyadh, for the Kingdom. We are proud to champion local chefs and authentic Saudi flavours.', descAr: 'مبني في الرياض، للمملكة. نفخر بدعم الطهاة المحليين والنكهات السعودية الأصيلة.' },
              { icon: Award, en: 'Michelin-Level Curation', ar: 'اختيار على مستوى ميشلان', descEn: 'Our editorial team personally visits and evaluates every restaurant featured in our Michelin Guide.', descAr: 'يزور فريقنا التحريري ويقيّم شخصياً كل مطعم يُعرض في دليل ميشلان لدينا.' },
              { icon: MessageCircle, en: 'Open Dialogue', ar: 'حوار مفتوح', descEn: 'Restaurants can respond to reviews. We believe transparency builds better dining culture for everyone.', descAr: 'يمكن للمطاعم الرد على التقييمات. نؤمن بأن الشفافية تبني ثقافة طعام أفضل للجميع.' },
            ].map(v => {
              const Icon = v.icon;
              return (
                <div key={v.en} className="bg-card rounded-2xl p-6 border border-border/50">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{t(v.en, v.ar)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(v.descEn, v.descAr)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-extrabold text-foreground mb-2">{t('The Team', 'الفريق')}</h2>
        <p className="text-muted-foreground mb-12">{t('Food lovers, technologists, and storytellers.', 'عشاق طعام وتقنيون وحكّاؤون.')}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM.map(member => (
            <div key={member.nameEn} className="text-center">
              <img
                src={member.img}
                alt={lang === 'ar' ? member.nameAr : member.nameEn}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-4 ring-4 ring-border"
              />
              <p className="font-bold text-foreground">{lang === 'ar' ? member.nameAr : member.nameEn}</p>
              <p className="text-sm text-muted-foreground mt-1">{t(member.roleEn, member.roleAr)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-background mb-4">{t('Join the Tabaq Community', 'انضم لمجتمع طبق')}</h2>
          <p className="text-background/70 mb-8 max-w-xl mx-auto">{t('Discover your next great meal. Write reviews. Earn points. Be part of Saudi Arabia\'s finest dining community.', 'اكتشف وجبتك الرائعة القادمة. اكتب تقييمات. اربح نقاطاً. كن جزءاً من أفضل مجتمع طعام في المملكة.')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/restaurants">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8">
                {t('Explore Restaurants', 'استكشف المطاعم')}
              </Button>
            </Link>
            <Link href="/partners">
              <Button size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10 px-8">
                {t('List Your Restaurant', 'أضف مطعمك')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    qEn: 'Is Tabaq free to use?',
    qAr: 'هل استخدام طبق مجاني؟',
    aEn: 'Yes! Tabaq is completely free for food lovers. You can browse restaurants, read reviews, and make reservations at no cost. We offer an optional premium membership called Tabaq Gold with exclusive perks.',
    aAr: 'نعم! طبق مجاني تمامًا لعشاق الطعام. يمكنك تصفح المطاعم وقراءة التقييمات وإجراء الحجوزات دون أي تكلفة. نقدم عضوية مميزة اختيارية تسمى طبق جولد مع مزايا حصرية.',
  },
  {
    qEn: 'How do I book a table?',
    qAr: 'كيف أحجز طاولة؟',
    aEn: 'Navigate to any restaurant page and click "Book a Table". Select your preferred date, time, and party size. You\'ll receive a confirmation code instantly. For some restaurants, a deposit may be required.',
    aAr: 'انتقل إلى صفحة أي مطعم وانقر على "احجز طاولة". اختر التاريخ والوقت وعدد الأشخاص المفضل. ستتلقى رمز تأكيد فوراً. قد يُطلب إيداع مسبق لبعض المطاعم.',
  },
  {
    qEn: 'How are restaurant ratings calculated?',
    qAr: 'كيف تُحسب تقييمات المطاعم؟',
    aEn: 'Ratings are based on verified diner reviews only — no restaurant can pay to improve their score. We evaluate food quality, service, ambiance, and value. Our credibility system detects and removes fake reviews.',
    aAr: 'تستند التقييمات إلى مراجعات الزوار المُتحقق منهم فقط — لا يمكن لأي مطعم الدفع لتحسين درجته. نُقيّم جودة الطعام والخدمة والأجواء والقيمة. يكتشف نظام الموثوقية لدينا التقييمات المزيفة ويزيلها.',
  },
  {
    qEn: 'What is Tabaq Gold?',
    qAr: 'ما هو طبق جولد؟',
    aEn: 'Tabaq Gold is our premium membership offering priority bookings, exclusive restaurant discounts (up to 20% off), early access to new restaurant launches, and a dedicated concierge line. Visit /gold for more details.',
    aAr: 'طبق جولد هو عضويتنا المميزة التي تتيح الحجوزات ذات الأولوية وخصومات حصرية على المطاعم (حتى 20%)، والوصول المبكر لافتتاحات المطاعم الجديدة، وخط خدمة كونسيرج مخصص.',
  },
  {
    qEn: 'How can I earn points on Tabaq?',
    qAr: 'كيف أكسب نقاطاً على طبق؟',
    aEn: 'You earn points for writing reviews (50 pts), completing bookings (25 pts), uploading food photos (15 pts), referring friends (100 pts each), and other platform activities. Points unlock higher levels and exclusive perks.',
    aAr: 'تكسب نقاطاً مقابل كتابة التقييمات (٥٠ نقطة)، وإتمام الحجوزات (٢٥ نقطة)، ورفع صور الطعام (١٥ نقطة)، وإحالة الأصدقاء (١٠٠ نقطة لكل صديق)، وأنشطة أخرى على المنصة.',
  },
  {
    qEn: 'Can I cancel or modify a booking?',
    qAr: 'هل يمكنني إلغاء حجزي أو تعديله؟',
    aEn: 'Yes. You can cancel or modify most bookings up to 2 hours before the reservation time through the Bookings page. Some restaurants have stricter cancellation policies — these are shown before you confirm.',
    aAr: 'نعم. يمكنك إلغاء معظم الحجوزات أو تعديلها قبل ساعتين من موعد الحجز عبر صفحة الحجوزات. بعض المطاعم لها سياسات إلغاء أكثر صرامة — تُعرض هذه قبل التأكيد.',
  },
  {
    qEn: 'How do I add my restaurant to Tabaq?',
    qAr: 'كيف أضيف مطعمي إلى طبق؟',
    aEn: 'Visit the Partners page and complete the registration form. Our team will review your application within 3 business days. Once approved, you\'ll get access to the Business Console to manage your profile, menu, and bookings.',
    aAr: 'تفضل بزيارة صفحة الشركاء وأكمل نموذج التسجيل. سيراجع فريقنا طلبك خلال ٣ أيام عمل. بعد الموافقة، ستحصل على إمكانية الوصول إلى لوحة الأعمال لإدارة ملفك التعريفي والقائمة والحجوزات.',
  },
  {
    qEn: 'Is Tabaq available outside Riyadh?',
    qAr: 'هل طبق متاح خارج الرياض؟',
    aEn: 'Tabaq currently covers 18 cities across Saudi Arabia including Riyadh, Jeddah, Dammam, Al-Khobar, Madinah, Makkah, Abha, Taif, Tabuk, and Al-Ula. We are expanding continuously.',
    aAr: 'تغطي طبق حاليًا ١٨ مدينة في المملكة العربية السعودية بما فيها الرياض وجدة والدمام والخبر والمدينة المنورة ومكة المكرمة وأبها والطائف وتبوك والعُلا. نتوسع باستمرار.',
  },
];

export function FAQPage() {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-8 -ms-2 text-muted-foreground">
            <ArrowRight className="w-4 h-4 me-1 rotate-180" />
            {t('Back to Home', 'العودة للرئيسية')}
          </Button>
        </Link>

        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">{t('Frequently Asked Questions', 'الأسئلة الشائعة')}</h1>
          <p className="text-muted-foreground">{t('Everything you need to know about Tabaq.', 'كل ما تحتاج معرفته عن طبق.')}</p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border border-border rounded-xl overflow-hidden bg-card">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-start hover:bg-secondary/30 transition-colors"
              >
                <span className="font-semibold text-foreground text-sm leading-snug">
                  {lang === 'ar' ? item.qAr : item.qEn}
                </span>
                {open === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                  {lang === 'ar' ? item.aAr : item.aEn}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <p className="text-foreground font-semibold mb-2">{t('Still have questions?', 'لا تزال لديك أسئلة؟')}</p>
          <p className="text-muted-foreground text-sm mb-4">{t('Our support team is available 7 days a week.', 'فريق الدعم لدينا متاح ٧ أيام في الأسبوع.')}</p>
          <Link href="/contact">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
              {t('Contact Support', 'تواصل مع الدعم')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { t, lang } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-8 -ms-2 text-muted-foreground">
            <ArrowRight className="w-4 h-4 me-1 rotate-180" />
            {t('Back to Home', 'العودة للرئيسية')}
          </Button>
        </Link>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">{t('Get in Touch', 'تواصل معنا')}</h1>
            <p className="text-muted-foreground mb-10 leading-relaxed">
              {t(
                'Whether you have a question about your booking, want to list your restaurant, or just want to say hello — we\'d love to hear from you.',
                'سواء كان لديك سؤال حول حجزك، أو تريد إضافة مطعمك، أو تريد فقط إلقاء التحية — نرحب بأن نسمع منك.'
              )}
            </p>

            <div className="space-y-5 mb-10">
              {[
                { icon: Mail, titleEn: 'Email Us', titleAr: 'راسلنا', valueEn: 'hello@tabaq.sa', valueAr: 'hello@tabaq.sa', descEn: 'We reply within 24 hours', descAr: 'نرد خلال ٢٤ ساعة' },
                { icon: Phone, titleEn: 'Call Us', titleAr: 'اتصل بنا', valueEn: '+966 11 000 0000', valueAr: '٠٠٠ ٠٠٠ ١١ ٩٦٦+', descEn: 'Sun–Thu, 9am–6pm AST', descAr: 'الأحد–الخميس، ٩ص–٦م' },
                { icon: MapPin, titleEn: 'Visit Us', titleAr: 'زرنا', valueEn: 'King Fahd Rd, Olaya, Riyadh', valueAr: 'طريق الملك فهد، العليا، الرياض', descEn: 'By appointment only', descAr: 'بموعد مسبق فقط' },
                { icon: Clock, titleEn: 'Working Hours', titleAr: 'ساعات العمل', valueEn: 'Sunday to Thursday', valueAr: 'الأحد إلى الخميس', descEn: '9:00 AM – 6:00 PM', descAr: '٩:٠٠ ص – ٦:٠٠ م' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.titleEn} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{t(item.titleEn, item.titleAr)}</p>
                      <p className="text-foreground text-sm">{lang === 'ar' ? item.valueAr : item.valueEn}</p>
                      <p className="text-xs text-muted-foreground">{t(item.descEn, item.descAr)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border border-border rounded-xl p-5 bg-card">
              <p className="text-sm font-semibold text-foreground mb-3">{t('Quick Links', 'روابط سريعة')}</p>
              <div className="space-y-2 text-sm">
                {[
                  { href: '/faq', en: 'Frequently Asked Questions', ar: 'الأسئلة الشائعة' },
                  { href: '/partners', en: 'List Your Restaurant', ar: 'أضف مطعمك' },
                  { href: '/gold', en: 'Tabaq Gold Membership', ar: 'عضوية طبق جولد' },
                  { href: '/privacy', en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
                ].map(link => (
                  <Link key={link.href} href={link.href} className="block text-primary hover:underline">
                    {t(link.en, link.ar)}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-card border border-border rounded-2xl p-8">
            {submitted ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{t('Message Sent!', 'تم إرسال رسالتك!')}</h3>
                <p className="text-muted-foreground text-sm">
                  {t('Thanks for reaching out. We\'ll get back to you within 24 hours.', 'شكراً للتواصل. سنرد عليك خلال ٢٤ ساعة.')}
                </p>
                <Button className="mt-6" onClick={() => setSubmitted(false)}>
                  {t('Send Another', 'إرسال رسالة أخرى')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-xl font-bold text-foreground mb-6">{t('Send a Message', 'أرسل رسالة')}</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('Your Name', 'اسمك')}</label>
                    <input
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder={t('e.g. Ahmed Al-Turki', 'مثال: أحمد التركي')}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('Email Address', 'البريد الإلكتروني')}</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('Subject', 'الموضوع')}</label>
                  <select
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">{t('Select a topic…', 'اختر موضوعاً…')}</option>
                    <option value="booking">{t('Booking Issue', 'مشكلة حجز')}</option>
                    <option value="restaurant">{t('List My Restaurant', 'إضافة مطعمي')}</option>
                    <option value="review">{t('Review / Rating', 'تقييم / مراجعة')}</option>
                    <option value="gold">{t('Tabaq Gold', 'طبق جولد')}</option>
                    <option value="press">{t('Press & Media', 'الصحافة والإعلام')}</option>
                    <option value="other">{t('Other', 'أخرى')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('Message', 'رسالتك')}</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder={t('Describe your question or feedback…', 'صف سؤالك أو ملاحظتك…')}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground resize-none"
                  />
                </div>

                <Button type="submit" className="w-full font-bold gap-2">
                  <Send className="w-4 h-4" />
                  {t('Send Message', 'إرسال الرسالة')}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t('By submitting this form, you agree to our Privacy Policy.', 'بإرسال هذا النموذج، توافق على سياسة الخصوصية.')}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
