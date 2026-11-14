import type { Site } from '@lunasite/shared-types';
import { maskFromUniform, type HorizonMask } from '../engine/geometry';
import horizons from './horizons.json';

interface HorizonFile {
  meta: null | {
    dataset: string; product: string; url: string; resolutionM: number; sha256: string;
    maxRangeKm: number; generatedAt: string; notes: string[];
  };
  sites: Record<string, {
    elevationM: number; slopeDeg: number | null; horizonElevationDeg: number[]; minRangeKm: number; maxHorizonDeg: number;
  }>;
}
const file = horizons as unknown as HorizonFile;

export const TERRAIN_META = file.meta;
const masks = new Map<string, HorizonMask>();
for (const [id, t] of Object.entries(file.sites)) masks.set(id, maskFromUniform(t.horizonElevationDeg));

export const maskFor = (siteId: string): HorizonMask | undefined => masks.get(siteId);
export const terrainInfo = (siteId: string) => file.sites[siteId];

/** Complète le catalogue avec les valeurs LOLA importées (hauteur, pente, présence d'un masque d'horizon). */
export function applyTerrain(sites: Site[]): void {
  for (const s of sites) {
    const t = file.sites[s.id];
    if (!t) continue;
    s.elevationM = t.elevationM;
    s.terrain = { slopeDeg: t.slopeDeg, shadowRisk: s.terrain.shadowRisk, horizonMask: true };
  }
}
