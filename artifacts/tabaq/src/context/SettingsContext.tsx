import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { API_BASE, getAuthHeaders } from '@/lib/api';

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

const STORAGE_KEY = 'tabaq_platform_settings_cache';

function loadFromCache(): PlatformSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveToCache(s: PlatformSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function groupedToSettings(grouped: Record<string, Record<string, string>>): PlatformSettings {
  return {
    analytics: {
      googleAnalyticsId: grouped.analytics?.googleAnalyticsId ?? DEFAULT_SETTINGS.analytics.googleAnalyticsId,
      googleTagManagerId: grouped.analytics?.googleTagManagerId ?? DEFAULT_SETTINGS.analytics.googleTagManagerId,
      metaPixelId: grouped.analytics?.metaPixelId ?? DEFAULT_SETTINGS.analytics.metaPixelId,
    },
    smtp: {
      host: grouped.smtp?.host ?? DEFAULT_SETTINGS.smtp.host,
      port: grouped.smtp?.port ?? DEFAULT_SETTINGS.smtp.port,
      email: grouped.smtp?.email ?? DEFAULT_SETTINGS.smtp.email,
      password: grouped.smtp?.password ?? DEFAULT_SETTINGS.smtp.password,
      fromName: grouped.smtp?.fromName ?? DEFAULT_SETTINGS.smtp.fromName,
    },
    sms: {
      apiKey: grouped.sms?.apiKey ?? DEFAULT_SETTINGS.sms.apiKey,
      senderId: grouped.sms?.senderId ?? DEFAULT_SETTINGS.sms.senderId,
      provider: grouped.sms?.provider ?? DEFAULT_SETTINGS.sms.provider,
    },
    firebase: {
      apiKey: grouped.firebase?.apiKey ?? DEFAULT_SETTINGS.firebase.apiKey,
      authDomain: grouped.firebase?.authDomain ?? DEFAULT_SETTINGS.firebase.authDomain,
      projectId: grouped.firebase?.projectId ?? DEFAULT_SETTINGS.firebase.projectId,
      storageBucket: grouped.firebase?.storageBucket ?? DEFAULT_SETTINGS.firebase.storageBucket,
      messagingSenderId: grouped.firebase?.messagingSenderId ?? DEFAULT_SETTINGS.firebase.messagingSenderId,
      appId: grouped.firebase?.appId ?? DEFAULT_SETTINGS.firebase.appId,
    },
    seo: {
      metaTitle: grouped.seo?.metaTitle ?? DEFAULT_SETTINGS.seo.metaTitle,
      metaDescription: grouped.seo?.metaDescription ?? DEFAULT_SETTINGS.seo.metaDescription,
      keywords: grouped.seo?.keywords ?? DEFAULT_SETTINGS.seo.keywords,
      ogImage: grouped.seo?.ogImage ?? DEFAULT_SETTINGS.seo.ogImage,
      twitterHandle: grouped.seo?.twitterHandle ?? DEFAULT_SETTINGS.seo.twitterHandle,
      canonicalDomain: grouped.seo?.canonicalDomain ?? DEFAULT_SETTINGS.seo.canonicalDomain,
    },
    maps: {
      googleMapsApiKey: grouped.maps?.googleMapsApiKey ?? DEFAULT_SETTINGS.maps.googleMapsApiKey,
    },
  };
}

function settingsToFlat(s: PlatformSettings): Record<string, string> {
  return {
    'analytics.googleAnalyticsId': s.analytics.googleAnalyticsId,
    'analytics.googleTagManagerId': s.analytics.googleTagManagerId,
    'analytics.metaPixelId': s.analytics.metaPixelId,
    'smtp.host': s.smtp.host,
    'smtp.port': s.smtp.port,
    'smtp.email': s.smtp.email,
    'smtp.password': s.smtp.password,
    'smtp.fromName': s.smtp.fromName,
    'sms.provider': s.sms.provider,
    'sms.senderId': s.sms.senderId,
    'sms.apiKey': s.sms.apiKey,
    'firebase.apiKey': s.firebase.apiKey,
    'firebase.authDomain': s.firebase.authDomain,
    'firebase.projectId': s.firebase.projectId,
    'firebase.storageBucket': s.firebase.storageBucket,
    'firebase.messagingSenderId': s.firebase.messagingSenderId,
    'firebase.appId': s.firebase.appId,
    'seo.metaTitle': s.seo.metaTitle,
    'seo.metaDescription': s.seo.metaDescription,
    'seo.keywords': s.seo.keywords,
    'seo.ogImage': s.seo.ogImage,
    'seo.twitterHandle': s.seo.twitterHandle,
    'seo.canonicalDomain': s.seo.canonicalDomain,
    'maps.googleMapsApiKey': s.maps.googleMapsApiKey,
  };
}

interface SettingsContextValue {
  settings: PlatformSettings;
  isLoading: boolean;
  updateAnalytics: (v: Partial<AnalyticsSettings>) => void;
  updateSmtp: (v: Partial<SmtpSettings>) => void;
  updateSms: (v: Partial<SmsSettings>) => void;
  updateFirebase: (v: Partial<FirebaseSettings>) => void;
  updateSeo: (v: Partial<SeoSettings>) => void;
  updateMaps: (v: Partial<MapsSettings>) => void;
  saveAll: () => Promise<void>;
  isDirty: boolean;
  saveError: string | null;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>(loadFromCache);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Fetch settings from API on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/platform-settings`, {
          headers: getAuthHeaders(),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.grouped) {
            const loaded = groupedToSettings(data.grouped);
            setSettings(loaded);
            saveToCache(loaded);
          }
        }
      } catch {
        // Fall back to cached settings — no problem
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

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

  const saveAll = useCallback(async () => {
    setSaveError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/platform-settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ settings: settingsToFlat(settings) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.error ?? 'save_failed');
        return;
      }

      saveToCache(settings);
      setIsDirty(false);
    } catch (e) {
      setSaveError('network_error');
    }
  }, [settings]);

  return (
    <SettingsContext.Provider value={{
      settings, isLoading, isDirty, saveError,
      updateAnalytics, updateSmtp, updateSms,
      updateFirebase, updateSeo, updateMaps, saveAll,
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
