import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Link } from 'wouter';
import {
  Instagram, Twitter, Facebook, Youtube,
  Mail, Phone, MapPin
} from 'lucide-react';

const SOCIAL_LINKS = [
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'Twitter/X' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Youtube, href: '#', label: 'YouTube' },
];

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#1a1a2e] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main footer grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 py-12 border-b border-white/10">

          {/* Brand column */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group w-fit">
              <img
                src={`${import.meta.env.BASE_URL}images/tabaq-logo.png`}
                alt="Tabaq"
                className="w-8 h-8 object-contain brightness-0 invert"
              />
              <span className="text-xl font-bold">{t('Tabaq', 'طبق')}</span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              {t(
                'The premium dining discovery and booking platform for Saudi Arabia and the Middle East.',
                'منصة الاستكشاف والحجوزات الفاخرة للمطاعم في المملكة العربية السعودية والشرق الأوسط.'
              )}
            </p>

            {/* Contact info */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Mail className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span>hello@tabaq.sa</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Phone className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span>+966 11 000 0000</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span>{t('Riyadh, Saudi Arabia', 'الرياض، المملكة العربية السعودية')}</span>
              </div>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3 mt-5">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center text-white/60 hover:text-white transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Discover */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">{t('Discover', 'استكشف')}</h4>
            <ul className="space-y-2.5 text-sm text-white/55">
              {[
                { href: '/restaurants', en: 'Restaurants', ar: 'المطاعم' },
                { href: '/dishes', en: 'Trending Dishes', ar: 'الأطباق الشائعة' },
                { href: '/offers', en: 'Deals & Offers', ar: 'عروض وخصومات' },
                { href: '/experiences', en: 'Food Experiences', ar: 'التجارب الغذائية' },
                { href: '/collections', en: 'Curated Lists', ar: 'قوائم منتقاة' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary transition-colors">
                    {t(link.en, link.ar)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">{t('Community', 'المجتمع')}</h4>
            <ul className="space-y-2.5 text-sm text-white/55">
              {[
                { href: '/leaderboard', en: 'Top Reviewers', ar: 'أفضل المراجعين' },
                { href: '/feed', en: 'Food Feed', ar: 'تغذية الطعام' },
                { href: '/dashboard', en: 'My Dashboard', ar: 'لوحتي' },
                { href: '/referral', en: 'Refer a Friend', ar: 'دعوة صديق' },
                { href: '/bookings', en: 'My Bookings', ar: 'حجوزاتي' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary transition-colors">
                    {t(link.en, link.ar)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">{t('Company', 'الشركة')}</h4>
            <ul className="space-y-2.5 text-sm text-white/55">
              {[
                { href: '/about', en: 'About Tabaq', ar: 'عن طبق' },
                { href: '/contact', en: 'Contact Us', ar: 'تواصل معنا' },
                { href: '/faq', en: 'FAQ', ar: 'الأسئلة الشائعة' },
                { href: '/partners', en: 'List Your Restaurant', ar: 'أضف مطعمك' },
                { href: '/gold', en: 'Tabaq Gold', ar: 'طبق جولد' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary transition-colors">
                    {t(link.en, link.ar)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* App store badges */}
        <div className="py-6 border-b border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-sm text-white/50">{t('Download the App:', 'حمّل التطبيق:')}</span>
            <div className="flex gap-3">
              {['App Store', 'Google Play'].map(store => (
                <a
                  key={store}
                  href="#"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg text-xs font-medium text-white/80 transition-colors"
                >
                  <span>{store === 'App Store' ? '🍎' : '▶'}</span>
                  {store}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-5 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Tabaq. {t('All rights reserved.', 'جميع الحقوق محفوظة.')}
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <Link href="/privacy" className="hover:text-white/70 transition-colors">{t('Privacy Policy', 'سياسة الخصوصية')}</Link>
            <span className="text-white/20">·</span>
            <Link href="/terms" className="hover:text-white/70 transition-colors">{t('Terms of Service', 'شروط الخدمة')}</Link>
            <span className="text-white/20">·</span>
            <Link href="/settings" className="hover:text-white/70 transition-colors">{t('Settings', 'الإعدادات')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
