import type { Site } from '@lunasite/shared-types';
import { maskFromUniform, type HorizonMask } from '../engine/geometry';
import horizons from './horizons.json';

export interface TerrainMeta {
  dataset: string; product: string; url: string; resolutionM: number; sha256: string;
  maxRangeKm: number; generatedAt: string; notes: string[];
}
export interface TerrainRecord {
  elevationM: number; slopeDeg: number | null; maxSlopeDeg: number | null; localReliefM: number | null;
  horizonElevationDeg: number[]; minRangeKm: number; maxHorizonDeg: number;
}
export interface HorizonFile { meta: TerrainMeta | null; sites: Record<string, TerrainRecord> }

/** Données embarquées (repli sans base) : produites par scripts/import-lola.ts. */
export const EMBEDDED_TERRAIN = horizons as unknown as HorizonFile;

export let TERRAIN_META: TerrainMeta | null = EMBEDDED_TERRAIN.meta;
let records: Record<string, TerrainRecord> = EMBEDDED_TERRAIN.sites;
const masks = new Map<string, HorizonMask>();

function rebuildMasks(): void {
  masks.clear();
  for (const [id, t] of Object.entries(records)) masks.set(id, maskFromUniform(t.horizonElevationDeg));
}
rebuildMasks();

/** Remplace le relief en mémoire (utilisé par le chargement depuis PostgreSQL). */
export function setTerrain(file: HorizonFile): void {
  TERRAIN_META = file.meta;
  records = file.sites;
  rebuildMasks();
}

export const maskFor = (siteId: string): HorizonMask | undefined => masks.get(siteId);
export const terrainInfo = (siteId: string) => records[siteId];

/** Complète le catalogue avec les valeurs LOLA (hauteur, pente, relief local, présence d'un masque d'horizon). */
export function applyTerrain(sites: Site[]): void {
  for (const s of sites) {
    const t = records[s.id];
    if (!t) continue;
    s.elevationM = t.elevationM;
    s.terrain = { slopeDeg: t.slopeDeg, localReliefM: t.localReliefM, shadowRisk: s.terrain.shadowRisk, horizonMask: true };
  }
}
