import type {
  EarthVisibilityResult, MissionScore, ResultMeta, Site, SolarResult,
} from '@lunasite/shared-types';
import { flatHorizon, type HorizonMask } from '../../engine/geometry';
import {
  buildGrid, DEFAULT_PANEL, earthSeries, energyPotential, hoursUntilSet, longestGapHours, METHOD_VERSION,
  round, sunSeries, visibleHours, windowsFrom, type Grid, type PanelParams, type SiteInput,
} from '../../engine/series';
import { ensureBudget, LIMITS } from '../../common/http';
import { maskFor, TERRAIN_META, terrainInfo } from '../../data/terrain';

export interface Period { start: Date; end: Date; stepMinutes: number }

export function makePeriod(start: Date, days: number, stepMinutes?: number): Period {
  return { start, end: new Date(start.getTime() + days * 86_400_000), stepMinutes: stepMinutes ?? LIMITS.defaultStepMinutes };
}

/** Horizon : plat tant qu'aucun masque LOLA n'est branché (Site.terrain.horizonMask === false). */
function siteInput(site: Site, mask?: HorizonMask): SiteInput {
  const m = mask ?? (site.terrain.horizonMask ? maskFor(site.id) : undefined);
  return { latitude: site.latitude, longitude: site.longitude, elevationM: site.elevationM, horizon: m ?? flatHorizon };
}

export function gridFor(p: Period, siteCount = 1): Grid {
  const samples = Math.ceil((p.end.getTime() - p.start.getTime()) / (p.stepMinutes * 60_000));
  ensureBudget(siteCount, samples);
  return buildGrid(p.start, p.end, p.stepMinutes);
}

function meta(site: Site, p: Period, units: Record<string, string>, extra: string[] = []): ResultMeta {
  const terrainAware = site.terrain.horizonMask;
  return {
    calculationLevel: terrainAware ? 'terrain-aware' : 'simplified',
    isMock: false,
    period: { start: p.start.toISOString(), end: p.end.toISOString() },
    stepMinutes: p.stepMinutes,
    units,
    sources: [
      'astronomy-engine (éphémérides analytiques Soleil/Lune, géométrie, sans SPICE/Horizons)',
      'Modèle de rotation lunaire IAU (Archinal et al.), repère Mean Earth / polar axis',
      'Constante solaire 1360,8 W/m² (Kopp & Lean 2011), corrigée de la distance Soleil-Lune',
      ...(terrainAware && TERRAIN_META ? [`${TERRAIN_META.dataset} — ${TERRAIN_META.product} (sha256 ${TERRAIN_META.sha256.slice(0, 12)}…)`] : []),
    ],
    methodVersion: METHOD_VERSION,
    assumptions: [
      terrainAware
        ? `Horizon issu du relief LOLA (${TERRAIN_META?.resolutionM ?? '?'} m/pixel) jusqu'à ${TERRAIN_META?.maxRangeKm ?? '?'} km, courbure lunaire incluse. Portée réduite à ${terrainInfo(site.id)?.minRangeKm ?? '?'} km dans la direction du bord du DEM (80°S) : l'horizon peut y être sous-estimé. Les obstacles de moins de ~200 m ne sont pas représentés.`
        : "Horizon géométrique plat (0°) : le relief local n'est PAS pris en compte. Près du pôle Sud, où Soleil et Terre restent très bas, ce calcul peut surestimer l'ensoleillement et les fenêtres de communication.",
      "Centre du disque du Soleil / de la Terre au-dessus de l'horizon (pas de demi-diamètre apparent) ; pas d'atmosphère, donc pas de réfraction.",
      "Les bords des fenêtres sont précis au pas de temps près (stepMinutes).",
      "Visibilité de la Terre = condition géométrique, pas une garantie de liaison radio (antennes, stations et budget de liaison non modélisés).",
      ...extra,
    ],
  };
}

const SOLAR_UNITS = {
  elevationDeg: 'degrés au-dessus de l\'horizon local', azimuthDeg: 'degrés depuis le Nord, sens horaire',
  sunlitHours: 'heures', darknessHours: 'heures', indicativeEnergyWh: 'Wh', peakPowerW: 'W', meanPowerW: 'W',
  sunlitFraction: 'fraction 0–1',
};

export function solarAnalysis(site: Site, p: Period, panel: Partial<PanelParams> = {}, grid?: Grid): SolarResult {
  const g = grid ?? gridFor(p);
  const si = siteInput(site);
  const sun = sunSeries(g, si);
  const sunlit = visibleHours(g, sun);
  const total = round(g.times.length * (g.stepMinutes / 60), 3);
  const params: PanelParams = { ...DEFAULT_PANEL, ...panel };
  return {
    siteId: site.id,
    sunPosition: sun.points,
    sunlitHours: sunlit,
    darknessHours: round(total - sunlit, 3),
    sunlitFraction: round(total ? sunlit / total : 0, 4),
    maxSunElevationDeg: Math.max(...sun.points.map((x) => x.elevationDeg)),
    longestDarknessHours: longestGapHours(g, sun),
    sunWindows: windowsFrom(g, sun),
    hoursUntilSunset: hoursUntilSet(g, sun),
    energyPotential: energyPotential(g, si, sun, params),
    meta: meta(site, p, SOLAR_UNITS, [
      "Énergie indicative = G · max(0, cos(incidence)) · surface · rendement ; valeurs par défaut (1 m², 30 %, panneau horizontal) = hypothèses ILLUSTRATIVES, pas une production réelle (pertes, stockage, thermique non modélisés).",
    ]),
  };
}

export function earthAnalysis(site: Site, p: Period, grid?: Grid): EarthVisibilityResult {
  const g = grid ?? gridFor(p);
  const earth = earthSeries(g, siteInput(site));
  const vis = visibleHours(g, earth);
  const total = round(g.times.length * (g.stepMinutes / 60), 3);
  return {
    siteId: site.id,
    earthPosition: earth.points,
    visibleHours: vis,
    visibleFraction: round(total ? vis / total : 0, 4),
    maxEarthElevationDeg: Math.max(...earth.points.map((x) => x.elevationDeg)),
    longestVisibilityGapHours: longestGapHours(g, earth),
    windows: windowsFrom(g, earth),
    hoursUntilEarthset: hoursUntilSet(g, earth),
    meta: meta(site, p, { elevationDeg: 'degrés', azimuthDeg: 'degrés depuis le Nord', visibleHours: 'heures', visibleFraction: 'fraction 0–1' }),
  };
}

export const WEIGHTS = { solar: 0.4, communication: 0.35, terrain: 0.25 } as const;

/** Score terrain provisoire (décision 5 non tranchée) : uniquement si pente ET risque d'ombre sont connus. */
function terrainScore(site: Site): number | null {
  const { slopeDeg, shadowRisk } = site.terrain;
  if (slopeDeg == null || shadowRisk == null) return null;
  return round(100 * (1 - Math.min(1, shadowRisk)) * (1 - Math.min(slopeDeg, 20) / 20), 1);
}

export function missionScore(site: Site, p: Period, grid?: Grid): MissionScore {
  const g = grid ?? gridFor(p);
  const solar = solarAnalysis(site, p, {}, g);
  const earth = earthAnalysis(site, p, g);
  const solarScore = round(solar.sunlitFraction * 100, 1);
  const communicationScore = round(earth.visibleFraction * 100, 1);
  const terrain = terrainScore(site);
  const global =
    terrain == null ? null
      : round(WEIGHTS.solar * solarScore + WEIGHTS.communication * communicationScore + WEIGHTS.terrain * terrain, 1);
  const wSum = WEIGHTS.solar + WEIGHTS.communication;
  return {
    siteId: site.id,
    solarScore,
    communicationScore,
    terrainScore: terrain,
    globalScore: global,
    globalScoreUnavailableReason:
      terrain == null ? "Score terrain indisponible : aucune donnée de pente / risque d'ombre (LOLA) importée pour ce site. Il n'est pas remplacé par 0." : null,
    partialScore: round((WEIGHTS.solar * solarScore + WEIGHTS.communication * communicationScore) / wSum, 1),
    partialScoreCriteria: ['solar', 'communication'],
    weights: { ...WEIGHTS },
    meta: meta(site, p, { solarScore: '0–100', communicationScore: '0–100', terrainScore: '0–100', globalScore: '0–100' }, [
      'Score solaire = part de la période avec le Soleil au-dessus de l\'horizon ; score communication = part avec la Terre visible. Pondération 0,40/0,35/0,25 = choix de l\'équipe, pas un standard NASA.',
      'partialScore : moyenne pondérée renormalisée sur les seuls critères disponibles ; à ne pas confondre avec le score global.',
    ]),
  };
}
