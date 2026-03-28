import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useGetUser } from '@workspace/api-client-react';
import { User, Settings, ShieldCheck, MapPin, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProfilePage() {
  const { t, lang } = useLanguage();
  // Using user ID 1 as stub since auth isn't fully wired with session hook yet
  const { data, isLoading } = useGetUser(1);

  if (isLoading) return <div className="min-h-screen p-20 flex justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!data?.user) return null;

  const { user, reviewCount, bookingCount, followerCount, followingCount } = data;
  const name = lang === 'ar' ? user.nameAr : user.nameEn;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Cover */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-primary/80 to-primary w-full"></div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-3xl p-6 md:p-8 shadow-xl border border-border -mt-24 relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-start">
          
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-muted border-4 border-card shadow-lg shrink-0 overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-full h-full p-6 text-muted-foreground" />
            )}
          </div>

          <div className="flex-grow">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center justify-center md:justify-start gap-2">
                  {name}
                  {user.isVerified && <ShieldCheck className="w-6 h-6 text-primary" />}
                </h1>
                <p className="text-muted-foreground mt-2 max-w-lg">{user.bio || t('No bio provided.', 'لم يتم كتابة نبذة.')}</p>
                
                <div className="flex items-center justify-center md:justify-start gap-4 mt-4 text-sm font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {t('Riyadh', 'الرياض')}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {t('Joined 2024', 'انضم ٢٠٢٤')}</span>
                </div>
              </div>
              
              <Button variant="outline" className="shrink-0 gap-2 rounded-xl">
                <Settings className="w-4 h-4" /> {t('Edit Profile', 'تعديل الملف')}
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-8 pt-6 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{reviewCount}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{t('Reviews', 'تقييمات')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{bookingCount}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{t('Bookings', 'حجوزات')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{followerCount}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{t('Followers', 'متابعون')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{followingCount}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{t('Following', 'يتابع')}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Level Banner */}
        <div className="mt-8 bg-gradient-to-r from-accent to-background p-6 rounded-3xl border border-accent flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Star className="w-7 h-7 fill-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{t('Level', 'المستوى')} {user.level}: {user.levelTitle}</h3>
              <p className="text-sm text-muted-foreground">{user.points} {t('Points', 'نقطة')}</p>
            </div>
          </div>
          <div className="w-full sm:w-1/2">
            <div className="flex justify-between text-xs font-medium mb-2 text-muted-foreground">
              <span>{user.points} XP</span>
              <span>{t('Next level at 500 XP', 'المستوى القادم عند ٥٠٠ نقطة')}</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${(user.points / 500) * 100}%` }}></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
