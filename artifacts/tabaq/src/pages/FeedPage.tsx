import React, { useState } from 'react';
import { Users, Rss, TrendingUp, Search } from 'lucide-react';
import { useGetFeed, useListReviews } from '@workspace/api-client-react';
import { ReviewCard } from '@/components/ReviewCard';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

type FeedTab = 'following' | 'community';

export default function FeedPage() {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const { user } = useAuth();
  const [tab, setTab] = useState<FeedTab>('community');

  const { data: feedData, isLoading: feedLoading } = useGetFeed(
    { limit: 30 },
    {
      query: {
        queryKey: ['/api/feed', { limit: 30 }],
        enabled: !!user && tab === 'following',
      },
    }
  );

  const { data: communityData, isLoading: communityLoading } = useListReviews(
    { limit: 30 },
    {
      query: {
        queryKey: ['/api/reviews', { limit: 30 }],
        enabled: tab === 'community',
      },
    }
  );

  const reviews = tab === 'following' ? feedData?.reviews : communityData?.reviews;
  const isLoading = tab === 'following' ? feedLoading : communityLoading;

  return (
    <div className="min-h-screen bg-background" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Rss className="w-6 h-6 text-primary" />
            {t('Food Feed', 'تغذية الطعام')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('Discover what the food community is saying', 'اكتشف ما يقوله مجتمع الطعام')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-2xl p-1 mb-6">
          <button
            onClick={() => setTab('community')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === 'community'
                ? 'bg-card shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            {t('Community', 'المجتمع')}
          </button>
          <button
            onClick={() => setTab('following')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === 'following'
                ? 'bg-card shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            {t('Following', 'المتابَعون')}
          </button>
        </div>

        {/* Following tab — unauthenticated state */}
        {tab === 'following' && !user && (
          <div className="text-center py-20">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-semibold text-foreground text-lg mb-2">
              {t('Sign in to see your feed', 'سجّل دخولك لرؤية تغذيتك')}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {t('Follow food critics and see their latest reviews.', 'تابع نقاد الطعام وشاهد تقييماتهم الأخيرة.')}
            </p>
            <Link href="/">
              <Button>{t('Go Home', 'الرئيسية')}</Button>
            </Link>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-border/60 rounded-2xl p-5 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="flex-grow space-y-2">
                    <div className="h-4 bg-muted rounded w-32" />
                    <div className="h-3 bg-muted rounded w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No reviews in following feed */}
        {!isLoading && tab === 'following' && user && (!feedData?.reviews?.length) && (
          <div className="text-center py-20">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-semibold text-foreground text-lg mb-2">
              {t('Your feed is empty', 'تغذيتك فارغة')}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {t(
                'Follow other food explorers to see their reviews here.',
                'تابع مستكشفي الطعام الآخرين لرؤية تقييماتهم هنا.'
              )}
            </p>
            <Link href="/leaderboard">
              <Button variant="outline">
                <Search className="w-4 h-4 me-2" />
                {t('Discover Food Critics', 'اكتشف نقاد الطعام')}
              </Button>
            </Link>
          </div>
        )}

        {/* No reviews in community feed */}
        {!isLoading && tab === 'community' && (!communityData?.reviews?.length) && (
          <div className="text-center py-20">
            <Rss className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-semibold text-foreground text-lg mb-2">
              {t('No reviews yet', 'لا توجد تقييمات بعد')}
            </h3>
            <p className="text-muted-foreground text-sm">
              {t('Be the first to share your dining experience!', 'كن أول من يشارك تجربته!')}
            </p>
          </div>
        )}

        {/* Reviews list */}
        {!isLoading && reviews && reviews.length > 0 && (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showTarget={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
