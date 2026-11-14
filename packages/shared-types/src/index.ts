/**
 * Contrats partagés frontend <-> backend de LunaSite.
 * Toute réponse de résultat porte un ResultMeta (honnêteté des résultats).
 */

/** Niveau de calcul (convention du projet, pas une classification NASA). */
export type CalculationLevel = 'mock' | 'simplified' | 'terrain-aware';

export interface ResultMeta {
  calculationLevel: CalculationLevel;
  isMock: boolean;
  /** Période analysée, ISO 8601 UTC, fin exclusive. */
  period: { start: string; end: string };
  stepMinutes: number;
  /** Unités de chaque champ numérique renvoyé. */
  units: Record<string, string>;
  /** Jeux de données / bibliothèques utilisés. */
  sources: string[];
  methodVersion: string;
  /** Hypothèses et limites, lisibles par un non-spécialiste. */
  assumptions: string[];
}

export interface Site {
  id: string;
  name: string;
  region: string;
  /** Latitude sélénographique, degrés, Sud négatif. */
  latitude: number;
  /** Longitude sélénographique, degrés Est positifs (-180..180). */
  longitude: number;
  /** Altitude par rapport à la sphère de référence (1737,4 km), mètres. null = inconnue. */
  elevationM: number | null;
  terrainType: string | null;
  description: string;
  origin: 'apollo' | 'clps' | 'commercial' | 'international' | 'feature' | 'reference';
  coordinatesStatus: 'published' | 'approximate_to_verify' | 'derived_from_dem';
  coordinatesSource: string;
  terrain: {
    /** Pente moyenne sur un disque de 250 m de rayon (LOLA 80 m). */
    slopeDeg: number | null;
    /** Relief local (max - min des hauteurs) sur ce disque, mètres. */
    localReliefM: number | null;
    shadowRisk: number | null;
    horizonMask: boolean;
  };
}

export interface TimeSeriesPoint {
  t: string;
  elevationDeg: number;
  azimuthDeg: number;
}

export interface Window {
  start: string;
  end: string;
  durationHours: number;
  /** La fenêtre commence avant / finit après la période demandée. */
  truncatedStart: boolean;
  truncatedEnd: boolean;
  maxElevationDeg: number;
}

export interface EnergyPotential {
  parameters: {
    panelAreaM2: number;
    efficiency: number;
    panelTiltDeg: number;
    panelAzimuthDeg: number;
    solarConstantWm2: number;
  };
  /** Énergie indicative sur la période (Wh). */
  indicativeEnergyWh: number;
  peakPowerW: number;
  meanPowerW: number;
}

export interface SolarResult {
  siteId: string;
  sunPosition: TimeSeriesPoint[];
  sunlitHours: number;
  darknessHours: number;
  sunlitFraction: number;
  maxSunElevationDeg: number;
  longestDarknessHours: number;
  sunWindows: Window[];
  /** Heures avant le prochain coucher à l'instant `start` (null si déjà couché ou inconnu). */
  hoursUntilSunset: number | null;
  energyPotential: EnergyPotential;
  meta: ResultMeta;
}

export interface EarthVisibilityResult {
  siteId: string;
  earthPosition: TimeSeriesPoint[];
  visibleHours: number;
  visibleFraction: number;
  maxEarthElevationDeg: number;
  longestVisibilityGapHours: number;
  windows: Window[];
  hoursUntilEarthset: number | null;
  meta: ResultMeta;
}

export interface TerrainScoreDetail {
  version: string;
  /** 0–100, plus haut = surface plus sûre. */
  score: number;
  meanSlopeDeg: number;
  localReliefM: number;
  slopeFactor: number;
  reliefFactor: number;
  params: { slopeZeroDeg: number; reliefZeroM: number; weightSlope: number; weightRelief: number };
  note: string;
}

export interface MissionScore {
  siteId: string;
  solarScore: number;
  communicationScore: number;
  terrainScore: number | null;
  /** Détail et paramètres du score terrain (null si pente/relief inconnus). */
  terrainScoreDetail: TerrainScoreDetail | null;
  /** null si un critère obligatoire manque (jamais remplacé par 0). */
  globalScore: number | null;
  globalScoreUnavailableReason: string | null;
  /** Score partiel, renormalisé sur les critères disponibles. Explicitement partiel. */
  partialScore: number;
  partialScoreCriteria: string[];
  weights: { solar: number; communication: number; terrain: number };
  meta: ResultMeta;
}

export interface ApiError {
  error: {
    code: 'INVALID_INPUT' | 'NOT_FOUND' | 'DATA_UNAVAILABLE' | 'BUDGET_EXCEEDED' | 'INTERNAL';
    message: string;
    field?: string;
    requestId?: string;
  };
}
