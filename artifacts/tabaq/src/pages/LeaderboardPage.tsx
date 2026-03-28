import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useGetLeaderboard } from '@workspace/api-client-react';
import { Trophy, Medal, Star, Crown, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';

const RANK_COLORS = [
  'from-yellow-400 to-amber-500',
  'from-slate-300 to-slate-400',
  'from-amber-600 to-amber-700',
];

const RANK_ICON_COLORS = [
  'text-yellow-500',
  'text-slate-400',
  'text-amber-700',
];

const RANK_BG = [
  'bg-yellow-50 border-yellow-200 shadow-yellow-100',
  'bg-slate-50 border-slate-200 shadow-slate-100',
  'bg-amber-50 border-amber-200 shadow-amber-100',
];

export function LeaderboardPage() {
  const { t, lang } = useLanguage();
  const { data, isLoading } = useGetLeaderboard({ limit: 20 });

  const top3 = data?.slice(0, 3) ?? [];
  const rest = data?.slice(3) ?? [];

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 end-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 start-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center text-primary-foreground">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-9 h-9" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
            {t('Food Explorers Leaderboard', 'قائمة كبار المستكشفين')}
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-lg mx-auto">
            {t('The most trusted food critics and top contributors in the region.', 'أكثر نقاد الطعام موثوقية وأبرز المساهمين في المنطقة.')}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {top3.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[top3[1], top3[0], top3[2]].map((entry, podiumIdx) => {
                  if (!entry) return null;
                  const rank = podiumIdx === 1 ? 0 : podiumIdx === 0 ? 1 : 2;
                  const user = entry.user;
                  const name = lang === 'ar' ? user.nameAr : user.nameEn;
                  const heights = ['h-32', 'h-40', 'h-28'];
                  return (
                    <div key={user.id} className="flex flex-col items-center gap-2">
                      <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-4 ${rank === 0 ? 'border-yellow-400' : rank === 1 ? 'border-slate-400' : 'border-amber-600'} shadow-lg`}>
                        <img
                          src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                        {rank === 0 && (
                          <div className="absolute -top-1 -end-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                            <Crown className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className={`w-full ${heights[podiumIdx]} rounded-t-2xl bg-gradient-to-b ${RANK_COLORS[rank]} flex flex-col items-center justify-end pb-3 shadow-lg`}>
                        <span className="text-white font-black text-2xl">{rank + 1}</span>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-foreground text-sm line-clamp-1">{name}</p>
                        <p className="text-xs text-primary font-bold">{entry.points} {t('pts', 'نقطة')}</p>
                        <p className="text-xs text-muted-foreground">{entry.reviewCount} {t('reviews', 'تقييم')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Top 3 cards */}
            <div className="space-y-3 mb-8">
              {top3.map((entry, index) => {
                const user = entry.user;
                const name = lang === 'ar' ? user.nameAr : user.nameEn;
                return (
                  <div
                    key={user.id}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 shadow-md transition-all duration-300 hover:shadow-lg ${RANK_BG[index]}`}
                  >
                    <div className={`w-12 text-center shrink-0 ${RANK_ICON_COLORS[index]}`}>
                      <Medal className="w-9 h-9 mx-auto" />
                    </div>
                    <div className="w-14 h-14 rounded-full bg-white shrink-0 overflow-hidden border-2 border-white shadow">
                      <img src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-extrabold text-lg text-foreground">{name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-md">{user.levelTitle}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Star className="w-3 h-3" /> {entry.reviewCount} {t('reviews', 'تقييم')}
                        </span>
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <div className="text-2xl font-black text-primary">{entry.points}</div>
                      <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t('Points', 'نقطة')}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Remaining ranks */}
            {rest.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('Rising Explorers', 'المستكشفون الصاعدون')}</p>
                </div>
                <div className="space-y-2">
                  {rest.map((entry, idx) => {
                    const user = entry.user;
                    const name = lang === 'ar' ? user.nameAr : user.nameEn;
                    const rank = idx + 4;
                    return (
                      <div
                        key={user.id}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:bg-accent/30 hover:border-primary/20 transition-all duration-200"
                      >
                        <div className="w-10 text-center shrink-0">
                          <span className="text-lg font-black text-muted-foreground/60">#{rank}</span>
                        </div>
                        <div className="w-11 h-11 rounded-full bg-muted shrink-0 overflow-hidden border border-border">
                          <img src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow">
                          <p className="font-semibold text-foreground">{name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{user.levelTitle}</span>
                            <span className="text-xs text-muted-foreground">· {entry.reviewCount} {t('reviews', 'تقييم')}</span>
                          </div>
                        </div>
                        <div className="text-end shrink-0">
                          <div className="text-lg font-bold text-foreground">{entry.points}</div>
                          <div className="text-xs text-muted-foreground">{t('pts', 'نقطة')}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* CTA */}
            <div className="mt-10 bg-primary/5 border border-primary/20 rounded-3xl p-8 text-center">
              <Trophy className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-bold text-foreground mb-2">{t('Want to climb the ranks?', 'تريد تصعيد المراتب؟')}</h3>
              <p className="text-muted-foreground mb-5">{t('Write reviews and book tables to earn points and rise in the leaderboard.', 'اكتب تقييمات واحجز طاولات لكسب النقاط والتصعيد في القائمة.')}</p>
              <div className="flex gap-3 justify-center">
                <Link href="/restaurants">
                  <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors">
                    {t('Explore Restaurants', 'استكشف المطاعم')}
                  </button>
                </Link>
                <Link href="/signin">
                  <button className="px-5 py-2.5 border border-primary text-primary rounded-xl font-semibold text-sm hover:bg-primary/5 transition-colors">
                    {t('Sign In', 'تسجيل الدخول')}
                  </button>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
