import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useGetLeaderboard } from '@workspace/api-client-react';
import { Trophy, Medal, Star } from 'lucide-react';

export function LeaderboardPage() {
  const { t, lang } = useLanguage();
  const { data, isLoading } = useGetLeaderboard({ limit: 10 });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-secondary py-16 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold text-foreground mb-4">{t('Food Explorers Leaderboard', 'قائمة كبار المستكشفين')}</h1>
          <p className="text-lg text-muted-foreground">
            {t('The top contributors and critics in your city.', 'أبرز المساهمين والنقاد في مدينتك.')}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {data?.map((entry, index) => {
              const user = entry.user;
              const name = lang === 'ar' ? user.nameAr : user.nameEn;
              const isTop3 = index < 3;
              
              return (
                <div 
                  key={user.id} 
                  className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                    isTop3 
                      ? 'bg-card shadow-lg border-primary/20 hover:border-primary/50 hover:shadow-xl scale-[1.02] z-10 relative' 
                      : 'bg-card border-border/50 hover:bg-accent/50'
                  }`}
                >
                  <div className="w-12 text-center shrink-0">
                    {index === 0 ? <Medal className="w-10 h-10 mx-auto text-yellow-500" /> :
                     index === 1 ? <Medal className="w-8 h-8 mx-auto text-slate-400" /> :
                     index === 2 ? <Medal className="w-8 h-8 mx-auto text-amber-700" /> :
                     <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>}
                  </div>
                  
                  <div className="w-14 h-14 rounded-full bg-muted shrink-0 overflow-hidden border-2 border-background">
                    <img src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-grow">
                    <h3 className="font-bold text-lg text-foreground">{name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                        {user.levelTitle}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" /> {entry.reviewCount} {t('Reviews', 'تقييم')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-end shrink-0">
                    <div className="text-xl font-black text-primary">{entry.points}</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('Points', 'نقطة')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
