import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

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
