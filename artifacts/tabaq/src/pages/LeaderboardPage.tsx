import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy, Medal, Star, Crown, TrendingUp, Zap, Award, Target,
  Flame, Heart, ChefHat, Users, CheckCircle2
} from 'lucide-react';
import { Link } from 'wouter';

type Period = 'weekly' | 'monthly' | 'alltime';

const LEVELS = [
  { level: 1, nameEn: 'Food Explorer', nameAr: 'مستكشف الطعام', icon: '🌱', color: 'from-green-400 to-emerald-500', min: 0, max: 100 },
  { level: 2, nameEn: 'Taste Enthusiast', nameAr: 'عاشق الذوق', icon: '🍽️', color: 'from-blue-400 to-cyan-500', min: 100, max: 300 },
  { level: 3, nameEn: 'Food Critic', nameAr: 'ناقد طعام', icon: '⭐', color: 'from-purple-400 to-violet-500', min: 300, max: 600 },
  { level: 4, nameEn: 'Taste Expert', nameAr: 'خبير الذوق', icon: '🏅', color: 'from-orange-400 to-amber-500', min: 600, max: 1000 },
  { level: 5, nameEn: 'Grand Gourmet', nameAr: 'جورميه كبير', icon: '👑', color: 'from-yellow-400 to-amber-400', min: 1000, max: 2000 },
  { level: 6, nameEn: 'Culinary Legend', nameAr: 'أسطورة الطهي', icon: '🌟', color: 'from-rose-400 to-pink-500', min: 2000, max: Infinity },
];

const ACHIEVEMENTS = [
  { icon: <Star className="w-5 h-5" />, nameEn: 'First Review', nameAr: 'أول تقييم', descEn: 'Write your first review', descAr: 'اكتب أول تقييم', pts: 25, bg: 'bg-amber-50', color: 'text-amber-600' },
  { icon: <Flame className="w-5 h-5" />, nameEn: 'On Fire!', nameAr: 'مشتعل!', descEn: '5 reviews in a week', descAr: '5 تقييمات في أسبوع', pts: 50, bg: 'bg-orange-50', color: 'text-orange-600' },
  { icon: <Heart className="w-5 h-5" />, nameEn: 'Community Favourite', nameAr: 'مفضل المجتمع', descEn: 'Get 100 helpful votes', descAr: 'احصل على 100 تصويت مفيد', pts: 100, bg: 'bg-rose-50', color: 'text-rose-600' },
  { icon: <ChefHat className="w-5 h-5" />, nameEn: 'Cuisine Explorer', nameAr: 'مستكشف المطابخ', descEn: 'Review 10 cuisine types', descAr: 'قيّم 10 أنواع مطابخ', pts: 75, bg: 'bg-purple-50', color: 'text-purple-600' },
  { icon: <Trophy className="w-5 h-5" />, nameEn: 'Top 10', nameAr: 'ضمن أفضل 10', descEn: 'Reach top 10 on leaderboard', descAr: 'ادخل ضمن أفضل 10 في القائمة', pts: 200, bg: 'bg-yellow-50', color: 'text-yellow-600' },
  { icon: <Users className="w-5 h-5" />, nameEn: 'Social Butterfly', nameAr: 'الفراشة الاجتماعية', descEn: 'Get 50 followers', descAr: 'احصل على 50 متابع', pts: 150, bg: 'bg-blue-50', color: 'text-blue-600' },
];

const PERIOD_TABS: { id: Period; labelEn: string; labelAr: string }[] = [
  { id: 'weekly', labelEn: 'This Week', labelAr: 'هذا الأسبوع' },
  { id: 'monthly', labelEn: 'This Month', labelAr: 'هذا الشهر' },
  { id: 'alltime', labelEn: 'All Time', labelAr: 'كل الوقت' },
];

const RANK_PODIUM_ORDER = [1, 0, 2]; // silver, gold, bronze display order

function PodiumBlock({ entry, rank, lang, t }: {
  entry: { nameEn: string; nameAr: string; avatar: string; points: number; reviewCount: number; badge: string };
  rank: number;
  lang: string;
  t: (en: string, ar: string) => string;
}) {
  const configs = [
    { height: 'h-36', gradient: 'from-yellow-400 to-amber-400', ring: 'ring-yellow-400', crown: true, label: '🥇' },
    { height: 'h-28', gradient: 'from-slate-300 to-slate-400', ring: 'ring-slate-400', crown: false, label: '🥈' },
    { height: 'h-24', gradient: 'from-amber-600 to-orange-700', ring: 'ring-amber-600', crown: false, label: '🥉' },
  ];
  const cfg = configs[rank];
  const name = lang === 'ar' ? entry.nameAr : entry.nameEn;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {cfg.crown && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">👑</div>
        )}
        <img
          src={entry.avatar}
          alt={name}
          className={`w-16 h-16 rounded-full object-cover ring-4 ${cfg.ring} shadow-xl`}
        />
        <span className="absolute -bottom-1 -end-1 text-lg">{entry.badge}</span>
      </div>
      <div className={`w-full ${cfg.height} rounded-t-2xl bg-gradient-to-b ${cfg.gradient} flex flex-col items-center justify-end pb-3 shadow-lg relative overflow-hidden`}>
        <div className="absolute inset-0 bg-white/5" />
        <span className="relative text-white font-black text-3xl">{rank + 1}</span>
      </div>
      <div className="text-center px-1">
        <p className="font-bold text-foreground text-xs sm:text-sm line-clamp-1">{name}</p>
        <p className="text-xs text-primary font-bold">{entry.points} {t('pts', 'نقطة')}</p>
        <p className="text-[10px] text-muted-foreground">{entry.reviewCount} {t('reviews', 'تقييم')}</p>
      </div>
    </div>
  );
}

const LEADERBOARD_BADGES = ['👑', '🥈', '🥉', '⭐', '🍽️', '🌱', '🥢', '🍜', '🫐', '🥙'];

export function LeaderboardPage() {
  const { t, lang } = useLanguage();
  usePageMeta({
    titleEn: 'Leaderboard | Tabaq',
    titleAr: 'المتصدرون | طبق',
    descriptionEn: 'See the top food reviewers and critics on Tabaq. Earn points, climb the ranks, and win exclusive rewards.',
    descriptionAr: 'تعرّف على أفضل المراجعين في طبق. اكسب نقاطاً وتسلّق السلّم لتفوز بمكافآت حصرية.',
  }, lang);
  const [period, setPeriod] = useState<Period>('alltime');

  const { data: liveData, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?limit=20&period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 60000,
  });

  const liveEntries = (liveData ?? []).map((e: any, i: number) => ({
    rank: i + 1,
    nameEn: e.user.nameEn,
    nameAr: e.user.nameAr,
    avatar: e.user.avatarUrl || `https://i.pravatar.cc/80?u=${e.user.id}`,
    points: e.points,
    reviewCount: e.reviewCount,
    periodReviewCount: e.periodReviewCount ?? e.reviewCount,
    badge: LEADERBOARD_BADGES[i] ?? '⭐',
    levelTitle: e.user.levelTitle || 'Food Explorer',
    levelTitleAr: e.user.levelTitle || 'مستكشف الطعام',
    specialty: 'Gourmet',
    trending: i < 3,
  }));

  const allEntries = [...liveEntries];
  allEntries.sort((a, b) => b.points - a.points);
  allEntries.forEach((e, i) => { e.rank = i + 1; });

  const top3 = allEntries.slice(0, 3);
  const rest = allEntries.slice(3);

  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length >= 1 ? [top3[0]] : [];

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-violet-700 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 end-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 start-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 start-1/2 w-96 h-96 bg-white/3 rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center text-primary-foreground">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl">
            <Trophy className="w-11 h-11" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
            {t('Food Explorers Leaderboard', 'قائمة كبار المستكشفين')}
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-lg mx-auto mb-8">
            {t('The most trusted food critics and top contributors in the region.', 'أكثر نقاد الطعام موثوقية وأبرز المساهمين في المنطقة.')}
          </p>

          {/* Period tabs */}
          <div className="inline-flex bg-white/10 rounded-2xl p-1 gap-1">
            {PERIOD_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${period === tab.id ? 'bg-white text-primary shadow-md' : 'text-white/80 hover:text-white'}`}
              >
                {lang === 'ar' ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>
          <p className="text-sm text-primary-foreground/60 mt-3">
            {period === 'weekly' && t('Ranked by reviews posted in the last 7 days', 'مرتبون حسب التقييمات خلال آخر 7 أيام')}
            {period === 'monthly' && t('Ranked by reviews posted in the last 30 days', 'مرتبون حسب التقييمات خلال آخر 30 يوماً')}
            {period === 'alltime' && t('Ranked by total points earned', 'مرتبون حسب مجموع النقاط المكتسبة')}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-10">
            {/* Podium */}
            {top3.length >= 2 && (
              <div className="flex items-end justify-center gap-3 sm:gap-6 pt-6">
                {podiumOrder.map((entry, podiumIdx) => {
                  if (!entry) return null;
                  const rank = podiumIdx === 1 ? 0 : podiumIdx === 0 ? 1 : 2;
                  return (
                    <div key={entry.nameEn} className="flex-1 max-w-[140px]">
                      <PodiumBlock entry={entry} rank={rank} lang={lang} t={t} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Top 3 detailed cards */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                {t('Top Performers', 'أبرز المنافسين')}
              </p>
              {top3.map((entry, index) => {
                const rankColors = [
                  'bg-yellow-50 border-yellow-200',
                  'bg-slate-50 border-slate-200',
                  'bg-amber-50 border-amber-200',
                ];
                const medalColors = ['text-yellow-500', 'text-slate-400', 'text-amber-700'];
                return (
                  <div
                    key={entry.nameEn}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all hover:shadow-md ${rankColors[index]}`}
                  >
                    <div className={`w-10 text-center shrink-0 ${medalColors[index]}`}>
                      <Medal className="w-8 h-8 mx-auto" />
                    </div>
                    <img src={entry.avatar} alt={lang === 'ar' ? entry.nameAr : entry.nameEn} className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-white shadow" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-extrabold text-foreground truncate">{lang === 'ar' ? entry.nameAr : entry.nameEn}</p>
                        <span className="text-base shrink-0">{entry.badge}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                          {lang === 'ar' ? entry.levelTitleAr : entry.levelTitle}
                        </span>
                        <span className="text-xs text-muted-foreground">· {entry.reviewCount} {t('reviews', 'تقييم')}</span>
                        {entry.specialty && <span className="text-xs text-muted-foreground hidden sm:block">· {entry.specialty}</span>}
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      {period === 'alltime' ? (
                        <>
                          <div className="text-xl font-black text-primary">{entry.points.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t('pts', 'نقطة')}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-xl font-black text-primary">{(entry as any).periodReviewCount ?? entry.reviewCount}</div>
                          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t('reviews', 'تقييم')}</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rising explorers */}
            {rest.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Rising Explorers', 'المستكشفون الصاعدون')}</p>
                </div>
                <div className="space-y-2">
                  {rest.map((entry) => (
                    <div
                      key={entry.nameEn}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:bg-accent/30 hover:border-primary/20 transition-all"
                    >
                      <div className="w-8 text-center shrink-0">
                        <span className="text-sm font-black text-muted-foreground">#{entry.rank}</span>
                      </div>
                      <div className="relative shrink-0">
                        <img src={entry.avatar} alt={lang === 'ar' ? entry.nameAr : entry.nameEn} className="w-11 h-11 rounded-full object-cover border border-border" />
                        {entry.trending && (
                          <div className="absolute -top-1 -end-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                            <Flame className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-foreground text-sm truncate">{lang === 'ar' ? entry.nameAr : entry.nameEn}</p>
                          <span className="text-sm shrink-0">{entry.badge}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{lang === 'ar' ? entry.levelTitleAr : entry.levelTitle} · {entry.reviewCount} {t('reviews', 'تقييم')}</p>
                      </div>
                      <div className="text-end shrink-0">
                        {period === 'alltime' ? (
                          <>
                            <div className="text-base font-bold text-foreground">{entry.points.toLocaleString()}</div>
                            <div className="text-[10px] text-muted-foreground">{t('pts', 'نقطة')}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-base font-bold text-foreground">{(entry as any).periodReviewCount ?? entry.reviewCount}</div>
                            <div className="text-[10px] text-muted-foreground">{t('reviews', 'تقييم')}</div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Levels system */}
            <div className="bg-card border border-border rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-foreground">{t('Levels System', 'نظام المستويات')}</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {LEVELS.map(lev => (
                  <div key={lev.level} className="flex items-center gap-3 p-3 bg-secondary/40 rounded-2xl">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${lev.color} flex items-center justify-center text-xl shadow-sm shrink-0`}>
                      {lev.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{lang === 'ar' ? lev.nameAr : lev.nameEn}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {lev.min}–{lev.max === Infinity ? '∞' : lev.max} {t('pts', 'نقطة')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-foreground">{t('Achievements', 'الإنجازات')}</h2>
                <span className="text-xs text-muted-foreground">{t('Earn bonus points', 'اجمع نقاطاً إضافية')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ACHIEVEMENTS.map((a, i) => (
                  <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border border-border ${a.bg}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.color} bg-white shadow-sm`}>
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm">{lang === 'ar' ? a.nameAr : a.nameEn}</p>
                      <p className="text-xs text-muted-foreground">{lang === 'ar' ? a.descAr : a.descEn}</p>
                    </div>
                    <div className={`shrink-0 text-xs font-black px-2 py-1 rounded-xl ${a.color} bg-white`}>+{a.pts}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* How to earn points */}
            <div className="bg-primary/5 border border-primary/15 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-foreground">{t('How to Earn Points', 'كيف تجمع النقاط')}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { en: 'Write a review', ar: 'اكتب تقييماً', pts: 25, icon: Star },
                  { en: 'Complete a booking', ar: 'أكمل حجزاً', pts: 10, icon: CheckCircle2 },
                  { en: 'Refer a friend', ar: 'ادعُ صديقاً', pts: 50, icon: Users },
                  { en: 'Upload a photo', ar: 'ارفع صورة', pts: 5, icon: Flame },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.en} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{lang === 'ar' ? item.ar : item.en}</p>
                      </div>
                      <span className="text-sm font-black text-primary shrink-0">+{item.pts}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-6 flex-wrap">
                <Link href="/restaurants">
                  <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors">
                    {t('Explore Restaurants', 'استكشف المطاعم')}
                  </button>
                </Link>
                <Link href="/signin">
                  <button className="px-5 py-2.5 border border-primary text-primary rounded-xl font-semibold text-sm hover:bg-primary/5 transition-colors">
                    {t('Sign In to Compete', 'سجّل دخولك للمنافسة')}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
