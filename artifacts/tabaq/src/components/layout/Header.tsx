import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Search, MapPin, Globe, User, LogOut, ChevronDown, Tag,
  CalendarDays, LayoutDashboard, Trophy, Star, Shield, Utensils, ArrowRight
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function Header() {
  const { lang, toggleLanguage, t } = useLanguage();
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", en: "Home", ar: "الرئيسية" },
    { href: "/restaurants", en: "Discovery", ar: "استكشف" },
    { href: "/collections", en: "Collections", ar: "المجموعات" },
    { href: "/offers", en: "Offers", ar: "العروض" },
    { href: "/leaderboard", en: "Leaderboard", ar: "المتصدرين" },
  ];

  const displayName = user
    ? lang === "ar"
      ? user.nameAr || user.nameEn
      : user.nameEn || user.nameAr
    : null;

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shrink-0">
          <img
            src={`${import.meta.env.BASE_URL}images/tabaq-logo.png`}
            alt="Tabaq"
            className="h-9 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-semibold transition-colors hover:text-primary relative py-2",
                isActive(link.href) ? "text-primary" : "text-muted-foreground"
              )}
            >
              {t(link.en, link.ar)}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
          {/* For Partners link */}
          <Link
            href="/partners"
            className={cn(
              "text-sm font-semibold transition-colors hover:text-primary relative py-2 flex items-center gap-1",
              isActive("/partners") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Utensils className="w-3.5 h-3.5" />
            {t("For Partners", "للشركاء")}
            {isActive("/partners") && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-accent">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{t("Riyadh", "الرياض")}</span>
          </button>

          <Link href="/search" className="p-2.5 rounded-full hover:bg-accent text-foreground transition-colors">
            <Search className="w-5 h-5" />
          </Link>

          <button
            onClick={toggleLanguage}
            className="p-2.5 rounded-full hover:bg-accent text-foreground transition-colors flex items-center justify-center font-bold text-xs relative"
            title={t("Switch to Arabic", "التبديل للإنجليزية")}
          >
            <Globe className="w-5 h-5 absolute opacity-20" />
            <span className="z-10">{lang === "en" ? "ع" : "EN"}</span>
          </button>

          {/* Auth area */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border hover:border-primary transition-colors px-2 py-1 bg-secondary"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName || ""} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium text-foreground max-w-24 truncate">
                  {displayName}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute end-0 top-12 z-50 bg-popover border border-border rounded-2xl shadow-xl py-2 w-56 animate-in fade-in zoom-in-95 duration-150">

                    {/* User section header */}
                    <div className="px-4 py-2 border-b border-border mb-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("My Account", "حسابي")}</p>
                    </div>

                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground leading-none">{t("My Dashboard", "لوحتي")}</p>
                        <p className="text-xs text-muted-foreground">{t("Profile, points & history", "الملف والنقاط والتاريخ")}</p>
                      </div>
                    </Link>

                    <Link
                      href="/bookings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                        <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground leading-none">{t("My Bookings", "حجوزاتي")}</p>
                        <p className="text-xs text-muted-foreground">{t("Upcoming & past", "القادمة والسابقة")}</p>
                      </div>
                    </Link>

                    <Link
                      href="/vouchers"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                        <Tag className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground leading-none">{t("My Vouchers", "قسائمي")}</p>
                        <p className="text-xs text-muted-foreground">{t("Offers & promotions", "العروض والترقيات")}</p>
                      </div>
                    </Link>

                    <Link
                      href="/leaderboard"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                        <Trophy className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground leading-none">{t("Leaderboard", "المتصدرون")}</p>
                        <p className="text-xs text-muted-foreground">{t("Rank & rewards", "الترتيب والمكافآت")}</p>
                      </div>
                    </Link>

                    {/* Business section */}
                    <div className="px-4 py-2 border-t border-b border-border mt-1 mb-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("Business", "الأعمال")}</p>
                    </div>

                    <Link
                      href="/console"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                        <LayoutDashboard className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground leading-none">{t("Business Console", "لوحة الأعمال")}</p>
                        <p className="text-xs text-muted-foreground">{t("Manage your restaurant", "إدارة مطعمك")}</p>
                      </div>
                    </Link>

                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
                        <Shield className="w-3.5 h-3.5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground leading-none">{t("Admin Panel", "لوحة الإدارة")}</p>
                        <p className="text-xs text-muted-foreground">{t("Platform management", "إدارة المنصة")}</p>
                      </div>
                    </Link>

                    <hr className="border-border my-1" />
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("Sign Out", "تسجيل الخروج")}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/partners"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
              >
                <Utensils className="w-3.5 h-3.5" />
                {t("For Restaurants", "للمطاعم")}
              </Link>
              <Link
                href="/signin"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <User className="w-4 h-4" />
                {t("Sign In", "دخول")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
