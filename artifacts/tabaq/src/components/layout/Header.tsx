import React from 'react';
import { Link, useLocation } from 'wouter';
import { Search, MapPin, User, Globe } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/utils';

export function Header() {
  const { lang, toggleLanguage, t } = useLanguage();
  const [location] = useLocation();

  const navLinks = [
    { href: '/', en: 'Home', ar: 'الرئيسية' },
    { href: '/restaurants', en: 'Discovery', ar: 'استكشف' },
    { href: '/offers', en: 'Offers', ar: 'العروض' },
    { href: '/leaderboard', en: 'Leaderboard', ar: 'المتصدرين' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Tabaq" className="w-10 h-10 object-contain" />
          <span className="text-2xl font-bold tracking-tight text-primary">
            {t('Tabaq', 'طبق')}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={cn(
                "text-sm font-semibold transition-colors hover:text-primary relative py-2",
                location === link.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {t(link.en, link.ar)}
              {location === link.href && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-accent">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{t('Riyadh', 'الرياض')}</span>
          </button>
          
          <Link href="/search" className="p-2.5 rounded-full hover:bg-accent text-foreground transition-colors">
            <Search className="w-5 h-5" />
          </Link>

          <button 
            onClick={toggleLanguage}
            className="p-2.5 rounded-full hover:bg-accent text-foreground transition-colors flex items-center justify-center font-bold text-xs"
            title={t('Switch to Arabic', 'التبديل للإنجليزية')}
          >
            <Globe className="w-5 h-5 absolute opacity-20" />
            <span className="z-10">{lang === 'en' ? 'ع' : 'EN'}</span>
          </button>

          <Link href="/profile" className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center hover:border-primary transition-colors overflow-hidden">
            {/* User Avatar Stub */}
            <User className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </header>
  );
}
