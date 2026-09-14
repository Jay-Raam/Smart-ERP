import { useState, useEffect } from 'react';
import { ComboboxOption } from '../components/shared/Combobox';

export interface IndiaStateOption extends ComboboxOption {
  value: string; // e.g. "Tamil Nadu"
  label: string; // e.g. "Tamil Nadu"
  sublabel: string; // e.g. "GST Code: 33 (Home State)"
  stateCode: string; // e.g. "33"
  shortCode?: string; // e.g. "TN"
}

// Official Indian State/UT 2-digit GST Codes mapping
export const GST_STATE_CODE_MAP: Record<string, { code: string; shortCode: string; isHome?: boolean }> = {
  'Jammu and Kashmir': { code: '01', shortCode: 'JK' },
  'Himachal Pradesh': { code: '02', shortCode: 'HP' },
  'Punjab': { code: '03', shortCode: 'PB' },
  'Chandigarh': { code: '04', shortCode: 'CH' },
  'Uttarakhand': { code: '05', shortCode: 'UK' },
  'Haryana': { code: '06', shortCode: 'HR' },
  'Delhi': { code: '07', shortCode: 'DL' },
  'Rajasthan': { code: '08', shortCode: 'RJ' },
  'Uttar Pradesh': { code: '09', shortCode: 'UP' },
  'Bihar': { code: '10', shortCode: 'BR' },
  'Sikkim': { code: '11', shortCode: 'SK' },
  'Arunachal Pradesh': { code: '12', shortCode: 'AR' },
  'Nagaland': { code: '13', shortCode: 'NL' },
  'Manipur': { code: '14', shortCode: 'MN' },
  'Mizoram': { code: '15', shortCode: 'MZ' },
  'Tripura': { code: '16', shortCode: 'TR' },
  'Meghalaya': { code: '17', shortCode: 'ML' },
  'Assam': { code: '18', shortCode: 'AS' },
  'West Bengal': { code: '19', shortCode: 'WB' },
  'Jharkhand': { code: '20', shortCode: 'JH' },
  'Odisha': { code: '21', shortCode: 'OD' },
  'Chhattisgarh': { code: '22', shortCode: 'CG' },
  'Madhya Pradesh': { code: '23', shortCode: 'MP' },
  'Gujarat': { code: '24', shortCode: 'GJ' },
  'Dadra and Nagar Haveli and Daman and Diu': { code: '26', shortCode: 'DN' },
  'Maharashtra': { code: '27', shortCode: 'MH' },
  'Andhra Pradesh': { code: '37', shortCode: 'AP' },
  'Karnataka': { code: '29', shortCode: 'KA' },
  'Goa': { code: '30', shortCode: 'GA' },
  'Lakshadweep': { code: '31', shortCode: 'LD' },
  'Kerala': { code: '32', shortCode: 'KL' },
  'Tamil Nadu': { code: '33', shortCode: 'TN', isHome: true },
  'Puducherry': { code: '34', shortCode: 'PY' },
  'Andaman and Nicobar Islands': { code: '35', shortCode: 'AN' },
  'Telangana': { code: '36', shortCode: 'TS' },
  'Ladakh': { code: '38', shortCode: 'LA' },
  'Other Territory': { code: '97', shortCode: 'OT' },
};

// Comprehensive built-in fallback containing all official 36 Indian states & union territories
export const FALLBACK_INDIA_STATES: IndiaStateOption[] = Object.entries(GST_STATE_CODE_MAP).map(
  ([stateName, meta]) => ({
    value: stateName,
    label: stateName,
    sublabel: meta.isHome ? `GST Code: ${meta.code} • ${meta.shortCode} (Home HQ)` : `GST Code: ${meta.code} • ${meta.shortCode}`,
    stateCode: meta.code,
    shortCode: meta.shortCode,
  })
).sort((a, b) => {
  // Keep Tamil Nadu at the top if desired, or alphabetical with TN first
  if (a.value === 'Tamil Nadu') return -1;
  if (b.value === 'Tamil Nadu') return 1;
  return a.label.localeCompare(b.label);
});

export const INDIA_STATES_LIST = FALLBACK_INDIA_STATES;

/**
 * Resolves the state name from a GSTIN or 2-digit GST state code.
 * E.g., "33AAAAA0000A1Z5" -> "Tamil Nadu", "36AAACM1234P1Z1" -> "Telangana", etc.
 */
export function getStateFromGstin(gstin: string): string | null {
  if (!gstin) return null;
  const clean = gstin.trim().toUpperCase();
  if (clean.length < 2) return null;
  const code = clean.slice(0, 2);
  for (const [stateName, meta] of Object.entries(GST_STATE_CODE_MAP)) {
    if (meta.code === code) {
      return stateName;
    }
  }
  return null;
}

const CACHE_KEY = 'smart_erp_india_states_v1';

/**
 * Fetch Indian states from open free public API (countriesnow.space)
 * with graceful fallback to standard GST states catalog.
 */
export async function fetchIndiaStates(): Promise<IndiaStateOption[]> {
  try {
    // Check cached states first
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= 30) {
          return parsed;
        }
      } catch {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: 'India' }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: States fetch failed`);
    const json = await res.json();

    if (json.data && Array.isArray(json.data.states) && json.data.states.length > 0) {
      const apiStates: IndiaStateOption[] = json.data.states.map((s: { name: string; state_code: string }) => {
        const name = s.name.trim();
        const mapped = GST_STATE_CODE_MAP[name] || { code: s.state_code || '--', shortCode: s.state_code || '' };
        return {
          value: name,
          label: name,
          sublabel: mapped.isHome
            ? `GST Code: ${mapped.code} • ${mapped.shortCode} (Home HQ)`
            : `GST Code: ${mapped.code} • ${mapped.shortCode}`,
          stateCode: mapped.code,
          shortCode: mapped.shortCode,
        };
      });

      // Sort with Tamil Nadu first, then alphabetically
      apiStates.sort((a, b) => {
        if (a.value === 'Tamil Nadu') return -1;
        if (b.value === 'Tamil Nadu') return 1;
        return a.label.localeCompare(b.label);
      });

      localStorage.setItem(CACHE_KEY, JSON.stringify(apiStates));
      return apiStates;
    }

    return FALLBACK_INDIA_STATES;
  } catch (err) {
    console.warn('[IndiaStatesAPI] Network fetch failed, using fallback list:', err);
    return FALLBACK_INDIA_STATES;
  }
}

/**
 * React hook to fetch and provide Indian state options for Combobox
 */
export function useIndiaStates() {
  const [states, setStates] = useState<IndiaStateOption[]>(FALLBACK_INDIA_STATES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadedFromApi, setLoadedFromApi] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchIndiaStates()
      .then((data) => {
        if (isMounted && data.length > 0) {
          setStates(data);
          setLoadedFromApi(true);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { states, isLoading, loadedFromApi };
}
