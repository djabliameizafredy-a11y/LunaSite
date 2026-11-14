import { describe, it, expect } from 'vitest';
import type { Site } from '@lunasite/shared-types';
import { SITES_BY_ID } from '../src/data/sites';
import { earthAnalysis, makePeriod, solarAnalysis } from '../src/modules/solar/analysis';

const mk = (lat: number, lon: number): Site => ({
  id: 'custom', name: 't', region: 'custom', latitude: lat, longitude: lon, elevationM: null, terrainType: null,
  description: '', origin: 'reference', coordinatesStatus: 'published', coordinatesSource: 'test',
  terrain: { slopeDeg: null, shadowRisk: null, horizonMask: false },
});
const day = (s: string) => new Date(`${s}T00:00:00Z`);
const SYNODIC = 29.53;

describe('cohérence physique du moteur', () => {
  it("équateur sur un mois synodique : ~50 % d'ensoleillement", () => {
    // 90 jours : plusieurs cycles complets (sur 30 j, une nuit est coupée par le bord de la période).
    const r = solarAnalysis(mk(0, 0), makePeriod(day('2026-11-14'), 90, 60));
    expect(r.sunlitFraction).toBeGreaterThan(0.47);
    expect(r.sunlitFraction).toBeLessThan(0.53);
    expect(r.maxSunElevationDeg).toBeGreaterThan(85);
    // jour lunaire complet ≈ demi-mois synodique (354,4 h)
    const full = r.sunWindows.filter((w) => !w.truncatedStart && !w.truncatedEnd);
    expect(full.length).toBeGreaterThanOrEqual(2);
    for (const w of full) {
      expect(w.durationHours).toBeGreaterThan(SYNODIC * 12 - 12);
      expect(w.durationHours).toBeLessThan(SYNODIC * 12 + 12);
    }
  });

  it('fenêtres coupées par la période sont marquées tronquées (jamais présentées comme complètes)', () => {
    const r = solarAnalysis(mk(0, 0), makePeriod(day('2026-11-14'), 30, 60));
    expect(r.longestDarknessHours).toBeLessThan(354); // nuit coupée par le bord
    expect(r.hoursUntilSunset).toBeNull(); // la période commence de nuit
  });

  it("face cachée (0°N, 180°E) : la Terre n'est jamais visible", () => {
    const r = earthAnalysis(mk(0, 180), makePeriod(day('2026-11-14'), 30, 60));
    expect(r.visibleHours).toBe(0);
    expect(r.windows).toEqual([]);
  });

  it('face visible au centre (0°N, 0°E) : la Terre est toujours visible, haute dans le ciel', () => {
    const r = earthAnalysis(mk(0, 0), makePeriod(day('2026-11-14'), 30, 60));
    expect(r.visibleFraction).toBe(1);
    expect(r.maxEarthElevationDeg).toBeGreaterThan(80);
    expect(r.windows[0].truncatedStart && r.windows[0].truncatedEnd).toBe(true);
  });

  it('pôle Sud : le Soleil reste rasant (|élévation| < 1,7°) et la Terre < 8°', () => {
    const p = makePeriod(day('2026-11-14'), 31, 120);
    const s = solarAnalysis(mk(-90, 0), p);
    const e = earthAnalysis(mk(-90, 0), p);
    expect(Math.max(...s.sunPosition.map((x) => Math.abs(x.elevationDeg)))).toBeLessThan(1.7);
    expect(Math.max(...e.earthPosition.map((x) => Math.abs(x.elevationDeg)))).toBeLessThan(8);
  });

  it("Apollo 11 : élévation du Soleil à l'atterrissage (20/07/1969 20:17 UTC) ≈ 10–14°", () => {
    const site = SITES_BY_ID.get('apollo11')!;
    const start = new Date('1969-07-20T20:00:00Z');
    const r = solarAnalysis(site, { start, end: new Date(start.getTime() + 3_600_000), stepMinutes: 5 });
    const at2017 = r.sunPosition.find((p) => p.t.startsWith('1969-07-20T20:15'))!;
    expect(at2017.elevationDeg).toBeGreaterThan(8);
    expect(at2017.elevationDeg).toBeLessThan(15);
  });

  it("énergie nulle quand le Soleil est sous l'horizon, jamais négative", () => {
    const p = makePeriod(day('2026-11-14'), 30, 60);
    const r = solarAnalysis(mk(0, 0), p);
    expect(r.energyPotential.indicativeEnergyWh).toBeGreaterThan(0);
    const dark = solarAnalysis(mk(0, 0), makePeriod(day('2026-11-14'), 1, 60), { panelAreaM2: 0.0001 });
    expect(dark.energyPotential.indicativeEnergyWh).toBeGreaterThanOrEqual(0);
  });
});
