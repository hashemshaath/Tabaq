import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useLocalization } from '@/context/LocalizationContext';

export interface Neighborhood {
  id: number;
  nameEn: string;
  nameAr: string;
}

export interface CityNeighborhoodsMap {
  [cityId: number]: Neighborhood[];
}

export const CITY_NEIGHBORHOODS: CityNeighborhoodsMap = {
  1: [
    { id: 101, nameEn: 'Al Olaya', nameAr: 'العليا' },
    { id: 102, nameEn: 'Al Malaz', nameAr: 'الملز' },
    { id: 103, nameEn: 'Al Hamra', nameAr: 'الحمراء' },
    { id: 104, nameEn: 'Al Murabba', nameAr: 'المربع' },
    { id: 105, nameEn: 'Al Woroud', nameAr: 'الورود' },
    { id: 106, nameEn: 'Al Sulaimaniyah', nameAr: 'السليمانية' },
    { id: 107, nameEn: 'Al Nakheel', nameAr: 'النخيل' },
    { id: 108, nameEn: 'Al Aqiq', nameAr: 'العقيق' },
  ],
  2: [
    { id: 201, nameEn: 'Al Balad', nameAr: 'البلد' },
    { id: 202, nameEn: 'Al Corniche', nameAr: 'الكورنيش' },
    { id: 203, nameEn: 'Al Hamra', nameAr: 'الحمراء' },
    { id: 204, nameEn: 'Al Ruwais', nameAr: 'الروابي' },
    { id: 205, nameEn: 'Al Rawdah', nameAr: 'الروضة' },
  ],
  3: [
    { id: 301, nameEn: 'Al Aziziyah', nameAr: 'العزيزية' },
    { id: 302, nameEn: 'Al Rawdah', nameAr: 'الروضة' },
    { id: 303, nameEn: 'Quba', nameAr: 'قباء' },
  ],
  4: [
    { id: 401, nameEn: 'Al Khobar Corniche', nameAr: 'كورنيش الخبر' },
    { id: 402, nameEn: 'Al Rakah', nameAr: 'الراكة' },
    { id: 403, nameEn: 'Al Thuqbah', nameAr: 'الثقبة' },
  ],
};

export interface CityState {
  selectedCityId: number | null;
  selectedCityName: string | null;
  selectedCityNameAr: string | null;
  selectedNeighborhoodId: number | null;
  selectedNeighborhoodName: string | null;
  selectedNeighborhoodNameAr: string | null;
  setCity: (id: number | null, nameEn: string | null, nameAr: string | null) => void;
  setNeighborhood: (id: number | null, nameEn: string | null, nameAr: string | null) => void;
  clearCity: () => void;
  clearNeighborhood: () => void;
  getNeighborhoods: () => Neighborhood[];
}

const CityContext = createContext<CityState | null>(null);

function safeStorage(fn: () => void) {
  try { fn(); } catch { }
}

function readStorage(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function CityProvider({ children }: { children: React.ReactNode }) {
  const { country } = useLocalization();
  const prevCountryCode = useRef(country.code);

  const [selectedCityId, setSelectedCityId] = useState<number | null>(() => {
    const stored = readStorage('tabaq_city_id');
    return stored ? Number(stored) : null;
  });
  const [selectedCityName, setSelectedCityName] = useState<string | null>(() =>
    readStorage('tabaq_city_name_en')
  );
  const [selectedCityNameAr, setSelectedCityNameAr] = useState<string | null>(() =>
    readStorage('tabaq_city_name_ar')
  );
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<number | null>(() => {
    const stored = readStorage('tabaq_neighborhood_id');
    return stored ? Number(stored) : null;
  });
  const [selectedNeighborhoodName, setSelectedNeighborhoodName] = useState<string | null>(() =>
    readStorage('tabaq_neighborhood_name_en')
  );
  const [selectedNeighborhoodNameAr, setSelectedNeighborhoodNameAr] = useState<string | null>(() =>
    readStorage('tabaq_neighborhood_name_ar')
  );

  useEffect(() => {
    if (prevCountryCode.current !== country.code) {
      prevCountryCode.current = country.code;
      setSelectedCityId(null);
      setSelectedCityName(null);
      setSelectedCityNameAr(null);
      setSelectedNeighborhoodId(null);
      setSelectedNeighborhoodName(null);
      setSelectedNeighborhoodNameAr(null);
      safeStorage(() => {
        localStorage.removeItem('tabaq_city_id');
        localStorage.removeItem('tabaq_city_name_en');
        localStorage.removeItem('tabaq_city_name_ar');
        localStorage.removeItem('tabaq_neighborhood_id');
        localStorage.removeItem('tabaq_neighborhood_name_en');
        localStorage.removeItem('tabaq_neighborhood_name_ar');
      });
    }
  }, [country.code]);

  const setCity = useCallback((id: number | null, nameEn: string | null, nameAr: string | null) => {
    setSelectedCityId(id);
    setSelectedCityName(nameEn);
    setSelectedCityNameAr(nameAr);
    setSelectedNeighborhoodId(null);
    setSelectedNeighborhoodName(null);
    setSelectedNeighborhoodNameAr(null);
    safeStorage(() => {
      if (id !== null) {
        localStorage.setItem('tabaq_city_id', String(id));
        localStorage.setItem('tabaq_city_name_en', nameEn ?? '');
        localStorage.setItem('tabaq_city_name_ar', nameAr ?? '');
      } else {
        localStorage.removeItem('tabaq_city_id');
        localStorage.removeItem('tabaq_city_name_en');
        localStorage.removeItem('tabaq_city_name_ar');
      }
      localStorage.removeItem('tabaq_neighborhood_id');
      localStorage.removeItem('tabaq_neighborhood_name_en');
      localStorage.removeItem('tabaq_neighborhood_name_ar');
    });
  }, []);

  const setNeighborhood = useCallback((id: number | null, nameEn: string | null, nameAr: string | null) => {
    setSelectedNeighborhoodId(id);
    setSelectedNeighborhoodName(nameEn);
    setSelectedNeighborhoodNameAr(nameAr);
    safeStorage(() => {
      if (id !== null) {
        localStorage.setItem('tabaq_neighborhood_id', String(id));
        localStorage.setItem('tabaq_neighborhood_name_en', nameEn ?? '');
        localStorage.setItem('tabaq_neighborhood_name_ar', nameAr ?? '');
      } else {
        localStorage.removeItem('tabaq_neighborhood_id');
        localStorage.removeItem('tabaq_neighborhood_name_en');
        localStorage.removeItem('tabaq_neighborhood_name_ar');
      }
    });
  }, []);

  const clearCity = useCallback(() => {
    setCity(null, null, null);
  }, [setCity]);

  const clearNeighborhood = useCallback(() => {
    setNeighborhood(null, null, null);
  }, [setNeighborhood]);

  const getNeighborhoods = useCallback((): Neighborhood[] => {
    if (!selectedCityId) return [];
    return CITY_NEIGHBORHOODS[selectedCityId] ?? [];
  }, [selectedCityId]);

  return (
    <CityContext.Provider value={{
      selectedCityId,
      selectedCityName,
      selectedCityNameAr,
      selectedNeighborhoodId,
      selectedNeighborhoodName,
      selectedNeighborhoodNameAr,
      setCity,
      setNeighborhood,
      clearCity,
      clearNeighborhood,
      getNeighborhoods,
    }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity(): CityState {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be used within CityProvider');
  return ctx;
}
