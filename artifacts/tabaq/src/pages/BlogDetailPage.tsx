import React, { useMemo, useState, useCallback } from 'react';
import { Link, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta, buildArticleSchema, buildBreadcrumbSchema } from '@/hooks/use-page-meta';
import { Clock, User, Tag, ArrowLeft, ArrowRight, ChevronRight, Share2, Bookmark, ThumbsUp, MessageCircle, Facebook, Twitter, Link2, Check, Loader2 } from 'lucide-react';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

function parseHeadings(html: string): { id: string; text: string; level: number }[] {
  const results: { id: string; text: string; level: number }[] = [];
  const re = /<h([23])[^>]*>(.*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (text) results.push({ level: parseInt(m[1]), text, id: slugify(text) });
  }
  return results;
}

function injectHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (_, level, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    const id = slugify(text);
    if (!text) return `<h${level}${attrs}>${inner}</h${level}>`;
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
}


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
  const [linkCopied, setLinkCopied] = useState(false);

  const { data: rawApiPost, isLoading: postLoading } = useQuery({
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

  const post = apiPost ?? null;

  const articleJsonLd = post ? buildArticleSchema({
    slug: post.slug,
    titleEn: post.titleEn,
    titleAr: post.titleAr,
    excerpt: lang === 'ar' ? post.excerptAr : post.excerptEn,
    coverImage: post.coverImage,
    authorName: lang === 'ar' ? post.authorAr : post.authorName,
    publishedAt: post.publishedAt,
    categoryName: lang === 'ar' ? post.categoryAr : post.categoryEn,
    tags: post.tags,
  }) : undefined;

  const breadcrumbJsonLd = post ? buildBreadcrumbSchema([
    { name: 'Home', url: 'https://tabaq.sa/' },
    { name: 'Blog', url: 'https://tabaq.sa/blog' },
    { name: lang === 'ar' ? post.titleAr : post.titleEn },
  ]) : undefined;

  usePageMeta({
    titleEn: post ? `${post.titleEn} | Tabaq Blog` : 'Blog | Tabaq',
    titleAr: post ? `${post.titleAr} | مدونة طبق` : 'المدونة | طبق',
    descriptionEn: post ? (post.excerptEn ?? '') : '',
    descriptionAr: post ? (post.excerptAr ?? '') : '',
    imageUrl: post?.coverImage,
    type: 'article',
    keywords: post?.tags?.join(', '),
    structuredData: [articleJsonLd, breadcrumbJsonLd].filter(Boolean) as any,
  }, lang);

  if (postLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-lg font-medium">{t('Article not found', 'المقال غير موجود')}</p>
          <p className="text-muted-foreground text-sm mt-2 mb-6">{t('This article may have been moved or removed.', 'قد يكون هذا المقال قد نُقل أو حُذف.')}</p>
          <Link href="/blog">
            <button className="text-primary font-semibold hover:underline">{t('Back to Blog', 'العودة للمدونة')}</button>
          </Link>
        </div>
      </div>
    );
  }

  const rawContent = lang === 'ar' ? post.contentAr : post.contentEn;
  const content = rawContent ? injectHeadingIds(rawContent) : rawContent;
  const headings = useMemo(() => parseHeadings(rawContent ?? ''), [rawContent]);

  const pageUrl = typeof window !== 'undefined' ? window.location.href : `https://tabaq.sa/blog/${slug}`;
  const pageTitle = lang === 'ar' ? post.titleAr : post.titleEn;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pageUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(pageTitle)}`, '_blank', 'width=600,height=400');
  };

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
                <button onClick={handleFacebookShare} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                  <Facebook className="w-4 h-4" />
                  Facebook
                </button>
                <button onClick={handleTwitterShare} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors">
                  <Twitter className="w-4 h-4" />
                  X (Twitter)
                </button>
                <button onClick={handleCopyLink} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors">
                  {linkCopied ? <Check className="w-4 h-4 text-green-600" /> : <Link2 className="w-4 h-4" />}
                  {linkCopied ? t('Copied!', 'تم النسخ!') : t('Copy Link', 'نسخ الرابط')}
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
              <div className="space-y-1">
                {headings.length > 0 ? headings.map(h => (
                  <button
                    key={h.id}
                    onClick={() => scrollToHeading(h.id)}
                    className={`block w-full text-start text-xs text-muted-foreground hover:text-primary transition-colors py-1.5 border-s-2 border-transparent hover:border-primary ${h.level === 3 ? 'ps-5' : 'ps-3'}`}
                  >
                    {h.text}
                  </button>
                )) : (
                  <p className="text-xs text-muted-foreground ps-3">{t('No sections', 'لا توجد أقسام')}</p>
                )}
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
            : [];
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
