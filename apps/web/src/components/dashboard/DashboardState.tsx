'use client';
import { createContext, useContext, useMemo, useState } from 'react';
import type { Site } from '@lunasite/shared-types';
import { api } from '@/lib/api';
import { todayUTC } from '@/lib/format';
import { useAsync, type AsyncState } from '@/lib/useAsync';

interface DashboardState {
  sites: AsyncState<Site[]>;
  siteId: string;
  setSiteId: (id: string) => void;
  /** Jour de début, YYYY-MM-DD (UTC). */
  date: string;
  setDate: (d: string) => void;
  days: number;
  setDays: (n: number) => void;
  selectedSite: Site | null;
}

const Ctx = createContext<DashboardState | null>(null);

export function DashboardStateProvider({ children }: { children: React.ReactNode }) {
  const sites = useAsync(() => api.sites(), []);
  const [siteId, setSiteId] = useState('malapert');
  const [date, setDate] = useState(todayUTC());
  const [days, setDays] = useState(14);

  const value = useMemo<DashboardState>(() => ({
    sites, siteId, setSiteId, date, setDate, days, setDays,
    selectedSite: sites.data?.find((s) => s.id === siteId) ?? null,
  }), [sites, siteId, date, days]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDashboard hors de DashboardStateProvider');
  return v;
}
