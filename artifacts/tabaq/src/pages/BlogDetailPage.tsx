import React from 'react';
import { Link, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Clock, User, Tag, ArrowLeft, ArrowRight, ChevronRight, Share2, Bookmark, ThumbsUp, MessageCircle, Facebook, Twitter, Link2 } from 'lucide-react';

const SAMPLE_POSTS: Record<string, {
  id: number; slug: string; titleEn: string; titleAr: string;
  excerptEn: string; excerptAr: string; coverImage: string;
  authorName: string; authorAr: string; authorAvatar: string; authorBioEn: string; authorBioAr: string;
  categoryEn: string; categoryAr: string; categorySlug: string;
  readTimeEn: string; readTimeAr: string; publishedAt: string;
  tags: string[];
  contentEn: string; contentAr: string;
}> = {
  'best-restaurants-riyadh-2025': {
    id: 1, slug: 'best-restaurants-riyadh-2025',
    titleEn: 'The Best Restaurants in Riyadh for 2025',
    titleAr: 'أفضل مطاعم الرياض لعام ٢٠٢٥',
    excerptEn: 'From traditional Saudi cuisine to international fine dining, our editors handpick the definitive list of must-visit restaurants in the Saudi capital this year.',
    excerptAr: 'من المأكولات السعودية التقليدية إلى المطابخ العالمية الراقية، يختار محررونا القائمة النهائية للمطاعم التي يجب زيارتها في العاصمة السعودية هذا العام.',
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=600&fit=crop',
    authorName: 'Layla Al-Rasheed', authorAr: 'ليلى الرشيد',
    authorAvatar: 'https://i.pravatar.cc/80?u=layla',
    authorBioEn: 'Senior Food Editor at Tabaq with 10+ years covering the Saudi dining scene.',
    authorBioAr: 'محررة طعام أولى في طبق مع أكثر من ١٠ سنوات في تغطية مشهد الطعام السعودي.',
    categoryEn: 'Restaurant Guides', categoryAr: 'أدلة المطاعم', categorySlug: 'restaurant-guides',
    readTimeEn: '8 min read', readTimeAr: '٨ دقائق قراءة',
    publishedAt: '2025-03-15',
    tags: ['Riyadh', 'Fine Dining', 'Saudi Cuisine'],
    contentEn: `<h2>Introduction</h2>
<p>Riyadh's restaurant scene has undergone a remarkable transformation over the past few years. The city that was once known primarily for traditional Saudi hospitality now boasts a dynamic, cosmopolitan dining landscape that rivals any global capital.</p>
<p>Whether you're in search of authentic Saudi flavors passed down through generations, Japanese omakase experiences, or molecular gastronomy that pushes culinary boundaries, Riyadh delivers on all fronts.</p>
<h2>1. Najd Village — The Gold Standard for Saudi Cuisine</h2>
<p>If there's one restaurant every visitor to Riyadh must experience, it's Najd Village. Nestled in a beautifully restored traditional Saudi home in Malaz, this legendary establishment has been serving authentic Najdi cuisine since 1991. Think slow-cooked Jareesh, perfectly seasoned Kabsa, and Margoog that warms the soul.</p>
<p>The experience is as much cultural as it is culinary — diners sit cross-legged on floor cushions surrounding a communal platter, echoing the timeless Bedouin tradition of shared meals.</p>
<h2>2. Nozomi — Riyadh's Premier Japanese Experience</h2>
<p>For a different kind of excellence, Nozomi at the Four Seasons Hotel Riyadh has consistently set the benchmark for Japanese cuisine in the Kingdom. The omakase counter experience, helmed by visiting Japanese master chefs, is particularly extraordinary. Reserve well in advance.</p>
<h2>3. Maestro — The Italian Icon</h2>
<p>Tucked inside the Intercontinental Hotel, Maestro has earned its legendary status through decades of consistency. The house-made pasta, aged imported cheeses, and the finest Wagyu preparations make this a reliable destination for celebrations and power dinners alike.</p>
<h2>4. Myazu — New-Wave Asian</h2>
<p>This sleek, contemporary restaurant delivers bold Pan-Asian flavors in a stunning setting. The black cod with miso has become something of a cult dish in Riyadh's dining circles, and for very good reason.</p>
<h2>5. The Globe — Spectacular Views, Exceptional Food</h2>
<p>Perched atop Faisaliyah Tower, The Globe remains an architectural marvel and a dining destination. The 360-degree views of Riyadh's glittering skyline paired with a thoughtfully curated international menu make for an unforgettable evening.</p>
<h2>What to Expect in 2025</h2>
<p>This year, watch out for a wave of homegrown Saudi concepts championing regional flavors with modern plating, celebrity chef pop-ups, and experiential dining formats that blur the lines between restaurant and theater.</p>`,
    contentAr: `<h2>مقدمة</h2>
<p>شهدت الرياض تحولاً استثنائياً في مشهد مطاعمها خلال السنوات الأخيرة. المدينة التي كانت تُعرف في المقام الأول بضيافتها السعودية الأصيلة باتت تمتلك مشهداً طهوياً ديناميكياً وعالمياً يضاهي أي عاصمة كبرى في العالم.</p>
<p>سواء كنت تبحث عن نكهات سعودية أصيلة متوارثة عبر الأجيال، أو تجارب أوماكاسي يابانية، أو مطبخاً جزيئياً يتجاوز الحدود الطهوية، فإن الرياض توفر كل ذلك وأكثر.</p>
<h2>١. قرية نجد — المعيار الذهبي للمطبخ السعودي</h2>
<p>إن كان ثمة مطعم واحد يجب على كل زائر للرياض تجربته، فهو قرية نجد. يقع هذا المطعم الأسطوري في منزل سعودي تقليدي مُرمَّم بجمال في حي الملاز، ويقدم المطبخ النجدي الأصيل منذ عام ١٩٩١. تخيل الجريش المطهو ببطء، والكبسة المتبلة بإتقان، والمرقوق الذي يدفئ الروح.</p>
<h2>٢. نوزومي — التجربة اليابانية الأولى في الرياض</h2>
<p>لنوع مختلف من التميز، يضع نوزومي في فندق فور سيزونز الرياض معايير المطبخ الياباني في المملكة باستمرار. تجربة كاونتر أوماكاسي التي يترأسها طهاة يابانيون زائرون استثنائية بكل المقاييس. احجز مبكراً جداً.</p>
<h2>٣. مايسترو — الأيقونة الإيطالية</h2>
<p>يقع داخل فندق إنتركونتيننتال، وقد اكتسب مكانته الأسطورية عبر عقود من الاتساق. المعكرونة المصنوعة يدوياً، والجبن المستورد المعتق، وأرقى قطع واغو تجعله وجهة موثوقة للاحتفالات والعشاء الرسمي على حد سواء.</p>
<h2>٤. مياتسو — آسيا بأسلوب عصري</h2>
<p>يقدم هذا المطعم الأنيق المعاصر نكهات آسيوية جريئة في محيط مبهر. أصبح سمك القد الأسود بالميسو ما يشبه الطبق الأيقوني في أوساط الطعام الراقي بالرياض، وهذا مفهوم تماماً.</p>
<h2>ما تتوقعه في ٢٠٢٥</h2>
<p>هذا العام، ترقّب موجة من المفاهيم السعودية المحلية التي تُبرز النكهات الإقليمية بتقديم عصري، وأماكن طعام يحييها شيفات مشهورون، وتجارب طهوية تمزج بين المطعم والمسرح.</p>`,
  },
};

const RELATED_POSTS = [
  {
    id: 4, slug: 'jeddah-waterfront-dining',
    titleEn: "Jeddah's Best Waterfront Dining Spots", titleAr: 'أفضل مطاعم كورنيش جدة',
    coverImage: 'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=400&h=240&fit=crop',
    readTimeEn: '7 min read', readTimeAr: '٧ دقائق قراءة',
    categoryEn: 'Restaurant Guides', categoryAr: 'أدلة المطاعم',
  },
  {
    id: 2, slug: 'saudi-coffee-culture-guide',
    titleEn: 'Saudi Coffee Culture: A Deep Dive', titleAr: 'ثقافة القهوة السعودية',
    coverImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=240&fit=crop',
    readTimeEn: '6 min read', readTimeAr: '٦ دقائق قراءة',
    categoryEn: 'Food & Culture', categoryAr: 'الطعام والثقافة',
  },
  {
    id: 3, slug: 'chef-noura-interview',
    titleEn: 'Chef Noura Al-Ghamdi: Reinventing Saudi Cuisine', titleAr: 'الشيف نورة الغامدي',
    coverImage: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=240&fit=crop',
    readTimeEn: '10 min read', readTimeAr: '١٠ دقائق قراءة',
    categoryEn: 'Chef Stories', categoryAr: 'قصص الشيف',
  },
];

function formatDate(dateStr: string, lang: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function BlogDetailPage() {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const [, params] = useRoute('/blog/:slug');
  const slug = params?.slug ?? '';

  const { data: rawApiPost } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const res = await fetch(`/api/blog/posts/${slug}`);
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    enabled: !!slug,
  });

  const rawPost = rawApiPost?.post ?? rawApiPost;
  const relatedPosts: any[] = rawApiPost?.related ?? [];

  const apiPost = rawPost ? {
    ...rawPost,
    coverImage: rawPost.coverImageUrl ?? rawPost.coverImage ?? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=600&fit=crop',
    titleEn: rawPost.titleEn ?? rawPost.title ?? '',
    titleAr: rawPost.titleAr ?? rawPost.title ?? '',
    categoryEn: rawPost.categoryNameEn ?? rawPost.categoryEn ?? '',
    categoryAr: rawPost.categoryNameAr ?? rawPost.categoryAr ?? '',
    authorName: rawPost.authorNameEn ?? rawPost.authorName ?? 'Tabaq Editorial',
    authorAr: rawPost.authorNameAr ?? rawPost.authorAr ?? 'فريق طبق التحريري',
    authorAvatar: rawPost.authorAvatarUrl ?? rawPost.authorAvatar ?? `https://i.pravatar.cc/60?u=${rawPost.authorId ?? 1}`,
    authorBioEn: rawPost.authorBioEn ?? 'Member of the Tabaq editorial team, passionate about discovering the best dining experiences across the Arab world.',
    authorBioAr: rawPost.authorBioAr ?? 'عضو في فريق طبق التحريري، شغوف باكتشاف أفضل تجارب تناول الطعام في العالم العربي.',
    readTimeEn: `${rawPost.readTimeMinutes ?? 5} min read`,
    readTimeAr: `${rawPost.readTimeMinutes ?? 5} دقائق قراءة`,
    publishedAt: rawPost.publishedAt ?? rawPost.createdAt ?? '',
    tags: Array.isArray(rawPost.tags) ? rawPost.tags : [],
    content: lang === 'ar' ? (rawPost.contentAr ?? rawPost.content ?? '') : (rawPost.contentEn ?? rawPost.content ?? ''),
  } : null;

  const post = apiPost ?? SAMPLE_POSTS[slug] ?? SAMPLE_POSTS['best-restaurants-riyadh-2025'];

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">{t('Article not found', 'المقال غير موجود')}</p>
          <Link href="/blog">
            <button className="mt-4 text-primary font-semibold hover:underline">{t('Back to Blog', 'العودة للمدونة')}</button>
          </Link>
        </div>
      </div>
    );
  }

  const content = lang === 'ar' ? post.contentAr : post.contentEn;

  return (
    <div className="min-h-screen bg-background" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">{t('Home', 'الرئيسية')}</Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <Link href="/blog" className="hover:text-foreground transition-colors">{t('Blog', 'المدونة')}</Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-foreground font-medium line-clamp-1">{lang === 'ar' ? post.titleAr : post.titleEn}</span>
        </nav>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        <div className="mb-4">
          <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
            {t(post.categoryEn, post.categoryAr)}
          </span>
        </div>
        <h1 className="text-2xl md:text-4xl font-black text-foreground leading-tight mb-4">
          {lang === 'ar' ? post.titleAr : post.titleEn}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
          {lang === 'ar' ? post.excerptAr : post.excerptEn}
        </p>

        {/* Author & Meta */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <img src={post.authorAvatar} alt={post.authorName} className="w-12 h-12 rounded-full object-cover border border-border" />
            <div>
              <p className="font-bold text-foreground text-sm">{lang === 'ar' ? post.authorAr : post.authorName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{lang === 'ar' ? post.readTimeAr : post.readTimeEn}</span>
                <span>·</span>
                <span>{formatDate(post.publishedAt, lang)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-medium text-muted-foreground hover:text-primary">
              <Bookmark className="w-4 h-4" />
              {t('Save', 'حفظ')}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-medium text-muted-foreground hover:text-primary">
              <Share2 className="w-4 h-4" />
              {t('Share', 'مشاركة')}
            </button>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div className="max-w-4xl mx-auto px-4 mb-10">
        <div className="aspect-[16/7] rounded-3xl overflow-hidden">
          <img
            src={post.coverImage}
            alt={lang === 'ar' ? post.titleAr : post.titleEn}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Content + Sidebar */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Article Content */}
          <article className="lg:col-span-2">
            {content ? (
              <div
                className="prose prose-sm md:prose-base max-w-none
                  prose-headings:font-black prose-headings:text-foreground
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
                  prose-strong:text-foreground
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted animate-pulse rounded-full" style={{ width: `${70 + Math.random() * 30}%` }} />
                ))}
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-border">
              <Tag className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              {(post.tags ?? []).map((tag: string) => (
                <span key={tag} className="text-xs bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary px-3 py-1.5 rounded-full cursor-pointer transition-colors font-medium">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Reactions */}
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground me-2">{t('Was this helpful?', 'هل كان هذا مفيداً؟')}</p>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-sm font-medium">
                <ThumbsUp className="w-4 h-4" />
                {t('Yes', 'نعم')}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-sm font-medium">
                <MessageCircle className="w-4 h-4" />
                {t('Comment', 'تعليق')}
              </button>
            </div>

            {/* Share */}
            <div className="mt-8 p-5 bg-secondary/40 rounded-3xl">
              <p className="font-bold text-foreground mb-3">{t('Share this article', 'شارك هذا المقال')}</p>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                  <Facebook className="w-4 h-4" />
                  Facebook
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors">
                  <Twitter className="w-4 h-4" />
                  X (Twitter)
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors">
                  <Link2 className="w-4 h-4" />
                  {t('Copy Link', 'نسخ الرابط')}
                </button>
              </div>
            </div>

            {/* Author Bio */}
            <div className="mt-10 p-6 bg-card border border-border rounded-3xl">
              <div className="flex items-start gap-4">
                <img src={post.authorAvatar} alt={post.authorName} className="w-14 h-14 rounded-full object-cover border border-border shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-foreground">{lang === 'ar' ? post.authorAr : post.authorName}</p>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                      {t('Author', 'كاتب')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {lang === 'ar' ? (post.authorBioAr ?? post.authorBioEn) : post.authorBioEn}
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Quick Nav */}
            <div className="bg-card border border-border rounded-3xl p-5 sticky top-24">
              <h3 className="font-bold text-foreground mb-3 text-sm">{t('In This Article', 'في هذا المقال')}</h3>
              <div className="space-y-2">
                {['Introduction', '1. Najd Village', '2. Nozomi', '3. Maestro', '4. Myazu', '5. The Globe', 'What to Expect in 2025'].map(heading => (
                  <button key={heading} className="block w-full text-start text-xs text-muted-foreground hover:text-primary transition-colors py-1 border-s-2 border-transparent hover:border-primary ps-3">
                    {heading}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Link href="/restaurants">
                  <button className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    {t('Explore Restaurants', 'استكشف المطاعم')}
                    {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* Related Posts */}
        {(() => {
          const normalizedRelated = relatedPosts.length > 0
            ? relatedPosts.map((r: any) => ({
                id: r.id,
                slug: r.slug,
                titleEn: r.titleEn ?? r.title ?? '',
                titleAr: r.titleAr ?? r.title ?? '',
                categoryEn: r.categoryNameEn ?? r.categoryEn ?? '',
                categoryAr: r.categoryNameAr ?? r.categoryAr ?? '',
                coverImage: r.coverImageUrl ?? r.coverImage ?? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
                readTimeEn: `${r.readTimeMinutes ?? 5} min read`,
                readTimeAr: `${r.readTimeMinutes ?? 5} دقائق قراءة`,
              }))
            : RELATED_POSTS.filter(p => p.slug !== slug);
          if (!normalizedRelated.length) return null;
          return (
            <div className="mt-16">
              <h2 className="text-xl font-black text-foreground mb-6">{t('Related Articles', 'مقالات ذات صلة')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {normalizedRelated.slice(0, 3).map(related => (
                  <Link key={related.id} href={`/blog/${related.slug}`}>
                    <div className="group cursor-pointer rounded-2xl overflow-hidden border border-border/60 hover:border-primary/30 hover:shadow-lg transition-all">
                      <div className="aspect-[16/9] overflow-hidden">
                        <img src={related.coverImage} alt={lang === 'ar' ? related.titleAr : related.titleEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="p-4">
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{t(related.categoryEn, related.categoryAr)}</span>
                        <h4 className="font-bold text-foreground text-sm mt-2 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                          {lang === 'ar' ? related.titleAr : related.titleEn}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lang === 'ar' ? related.readTimeAr : related.readTimeEn}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Back to Blog */}
        <div className="mt-12 text-center">
          <Link href="/blog">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all font-semibold text-foreground">
              {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {t('Back to all articles', 'العودة لجميع المقالات')}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
