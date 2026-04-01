import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { API_BASE, getAuthHeaders } from '@/lib/api';
const CACHE_KEY = 'tabaq_demo_mode';

interface DemoModeContextValue {
  isDemoMode: boolean;
  isLoading: boolean;
  toggleDemoMode: (enabled: boolean) => Promise<void>;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    try { return localStorage.getItem(CACHE_KEY) === 'true'; } catch { return false; }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/platform-settings/public`);
        if (res.ok) {
          const data = await res.json();
          const value = data.settings?.['demo_mode'] === 'true';
          setIsDemoMode(value);
          try { localStorage.setItem(CACHE_KEY, String(value)); } catch {}
        }
      } catch {
        // keep cached value
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const toggleDemoMode = useCallback(async (enabled: boolean) => {
    setIsDemoMode(enabled);
    try { localStorage.setItem(CACHE_KEY, String(enabled)); } catch {}

    try {
      await fetch(`${API_BASE}/api/admin/platform-settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ settings: { demo_mode: String(enabled) } }),
      });
    } catch {
      // non-critical, local state already updated
    }
  }, []);

  return (
    <DemoModeContext.Provider value={{ isDemoMode, isLoading, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode(): DemoModeContextValue {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error('useDemoMode must be used within DemoModeProvider');
  return ctx;
}
