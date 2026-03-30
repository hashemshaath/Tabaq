import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Utensils } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export function JoinPage() {
  const [, setLocation] = useLocation();
  const { t, lang } = useLanguage();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("tabaq_referral_code", ref);
    }
    setLocation("/signin?mode=register");
  }, [setLocation]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-background gap-4"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
        <Utensils className="w-7 h-7 text-primary" />
      </div>
      <p className="text-muted-foreground text-sm">
        {t("Just a moment…", "لحظة من فضلك…")}
      </p>
    </div>
  );
}
