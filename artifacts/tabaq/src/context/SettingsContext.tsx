import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface AnalyticsSettings {
  googleAnalyticsId: string;
  googleTagManagerId: string;
  metaPixelId: string;
}

export interface SmtpSettings {
  host: string;
  port: string;
  email: string;
  password: string;
  fromName: string;
}

export interface SmsSettings {
  apiKey: string;
  senderId: string;
  provider: string;
}

export interface FirebaseSettings {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage: string;
  twitterHandle: string;
  canonicalDomain: string;
}

export interface MapsSettings {
  googleMapsApiKey: string;
}

export interface PlatformSettings {
  analytics: AnalyticsSettings;
  smtp: SmtpSettings;
  sms: SmsSettings;
  firebase: FirebaseSettings;
  seo: SeoSettings;
  maps: MapsSettings;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  analytics: {
    googleAnalyticsId: '',
    googleTagManagerId: '',
    metaPixelId: '',
  },
  smtp: {
    host: '',
    port: '587',
    email: '',
    password: '',
    fromName: 'Tabaq',
  },
  sms: {
    apiKey: '',
    senderId: 'TABAQ',
    provider: 'unifonic',
  },
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  },
  seo: {
    metaTitle: 'Tabaq | طبق — Discover & Book the Best Restaurants',
    metaDescription: 'Tabaq is the premium dining discovery and booking platform for Saudi Arabia and the Middle East.',
    keywords: 'restaurants, dining, booking, food, Saudi Arabia, Middle East, طبق, مطاعم',
    ogImage: '',
    twitterHandle: '@tabaqapp',
    canonicalDomain: 'https://tabaq.sa',
  },
  maps: {
    googleMapsApiKey: '',
  },
};

const STORAGE_KEY = 'tabaq_platform_settings';

interface SettingsContextValue {
  settings: PlatformSettings;
  updateAnalytics: (v: Partial<AnalyticsSettings>) => void;
  updateSmtp: (v: Partial<SmtpSettings>) => void;
  updateSms: (v: Partial<SmsSettings>) => void;
  updateFirebase: (v: Partial<FirebaseSettings>) => void;
  updateSeo: (v: Partial<SeoSettings>) => void;
  updateMaps: (v: Partial<MapsSettings>) => void;
  saveAll: () => void;
  isDirty: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadFromStorage(): PlatformSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>(loadFromStorage);
  const [isDirty, setIsDirty] = useState(false);

  const updateAnalytics = useCallback((v: Partial<AnalyticsSettings>) => {
    setSettings(s => ({ ...s, analytics: { ...s.analytics, ...v } }));
    setIsDirty(true);
  }, []);

  const updateSmtp = useCallback((v: Partial<SmtpSettings>) => {
    setSettings(s => ({ ...s, smtp: { ...s.smtp, ...v } }));
    setIsDirty(true);
  }, []);

  const updateSms = useCallback((v: Partial<SmsSettings>) => {
    setSettings(s => ({ ...s, sms: { ...s.sms, ...v } }));
    setIsDirty(true);
  }, []);

  const updateFirebase = useCallback((v: Partial<FirebaseSettings>) => {
    setSettings(s => ({ ...s, firebase: { ...s.firebase, ...v } }));
    setIsDirty(true);
  }, []);

  const updateSeo = useCallback((v: Partial<SeoSettings>) => {
    setSettings(s => ({ ...s, seo: { ...s.seo, ...v } }));
    setIsDirty(true);
  }, []);

  const updateMaps = useCallback((v: Partial<MapsSettings>) => {
    setSettings(s => ({ ...s, maps: { ...s.maps, ...v } }));
    setIsDirty(true);
  }, []);

  const saveAll = useCallback(() => {
    setSettings(s => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
      return s;
    });
    setIsDirty(false);
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings, updateAnalytics, updateSmtp, updateSms,
      updateFirebase, updateSeo, updateMaps, saveAll, isDirty,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
