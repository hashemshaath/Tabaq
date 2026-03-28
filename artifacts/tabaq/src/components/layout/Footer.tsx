import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Link } from 'wouter';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Tabaq" className="w-8 h-8 opacity-80 grayscale" />
              <span className="text-xl font-bold text-foreground">
                {t('Tabaq', 'طبق')}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('The premium dining discovery and booking platform for the Middle East. Experience culinary excellence.', 'منصة الاستكشاف والحجوزات الفاخرة للمطاعم في الشرق الأوسط. اكتشف التميز في الطهي.')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('Discover', 'استكشف')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/restaurants" className="hover:text-primary transition-colors">{t('Restaurants', 'المطاعم')}</Link></li>
              <li><Link href="/search?type=dishes" className="hover:text-primary transition-colors">{t('Trending Dishes', 'الأطباق الشائعة')}</Link></li>
              <li><Link href="/offers" className="hover:text-primary transition-colors">{t('Special Offers', 'عروض خاصة')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('Community', 'المجتمع')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/leaderboard" className="hover:text-primary transition-colors">{t('Top Reviewers', 'أفضل المراجعين')}</Link></li>
              <li><Link href="/profile" className="hover:text-primary transition-colors">{t('My Profile', 'ملفي الشخصي')}</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">{t('Refer a Friend', 'دعوة صديق')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('Business', 'للأعمال')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors">{t('Add Restaurant', 'أضف مطعمك')}</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">{t('Partner Console', 'لوحة الشركاء')}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Tabaq. {t('All rights reserved.', 'جميع الحقوق محفوظة.')}
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary">{t('Privacy', 'الخصوصية')}</Link>
            <Link href="#" className="hover:text-primary">{t('Terms', 'الشروط')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
