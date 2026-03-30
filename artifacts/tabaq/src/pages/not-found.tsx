import React from "react";
import { Link } from "wouter";
import { Home, Search, Utensils } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function NotFound() {
  const { t, lang } = useLanguage();

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Utensils className="w-10 h-10 text-primary" />
        </div>

        <p className="text-8xl font-black text-primary/20 tracking-tight mb-2">
          404
        </p>

        <h1 className="text-2xl font-bold text-foreground mb-3">
          {t("Page Not Found", "الصفحة غير موجودة")}
        </h1>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          {t(
            "The page you're looking for doesn't exist or has been moved. Let's get you back on track.",
            "الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها. دعنا نعيدك إلى المسار الصحيح."
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            {t("Back to Home", "العودة للرئيسية")}
          </Link>
          <Link
            href="/restaurants"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-2xl font-semibold text-sm hover:bg-secondary/80 transition-colors"
          >
            <Search className="w-4 h-4" />
            {t("Explore Restaurants", "استكشف المطاعم")}
          </Link>
        </div>
      </div>
    </div>
  );
}
