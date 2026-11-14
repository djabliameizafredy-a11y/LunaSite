import type { Site, TerrainScoreDetail } from '@lunasite/shared-types';

/**
 * Score terrain (version `terrain-v0.1`, PROPOSITION de l'équipe à valider — décision 5 du document d'architecture).
 *
 * Il mesure le danger de la SURFACE d'atterrissage, sur un disque de 250 m de rayon (LOLA 80 m/pixel) :
 *   facteurPente  = 1 − clamp(penteMoyenne / SLOPE_ZERO_DEG)     (0° → 1 ; ≥ SLOPE_ZERO_DEG → 0)
 *   facteurRelief = 1 − clamp(relief / RELIEF_ZERO_M)            (0 m → 1 ; ≥ RELIEF_ZERO_M → 0)
 *   score = 100 × (W_SLOPE × facteurPente + W_RELIEF × facteurRelief)
 *
 * Choix de conception :
 * - L'éclairement et la visibilité de la Terre n'y figurent PAS : ils sont déjà dans les scores solaire et
 *   communication (sinon l'ombre serait comptée deux fois, et le relief d'horizon aussi).
 * - Les seuils (15°, 150 m) et les poids (0,7/0,3) sont des valeurs ILLUSTRATIVES d'équipe, pas des exigences
 *   NASA ni d'un fournisseur d'atterrisseur. Ils sont renvoyés dans chaque réponse pour pouvoir être discutés.
 * - Limite : un DEM de 80 m (~90 % de pixels interpolés) ne voit ni cailloux ni petits cratères ; un bon score
 *   n'est pas une garantie de sûreté d'atterrissage.
 */
export const TERRAIN_SCORE_VERSION = 'terrain-v0.1';
export const TERRAIN_SCORE_PARAMS = { slopeZeroDeg: 15, reliefZeroM: 150, weightSlope: 0.7, weightRelief: 0.3 } as const;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const round1 = (x: number) => Math.round(x * 10) / 10;

/** null si la pente ou le relief local sont inconnus : le score n'est jamais estimé ni remplacé par 0. */
export function terrainScore(site: Site): TerrainScoreDetail | null {
  const { slopeDeg, localReliefM } = site.terrain;
  if (slopeDeg == null || localReliefM == null) return null;
  const P = TERRAIN_SCORE_PARAMS;
  const slopeFactor = 1 - clamp01(slopeDeg / P.slopeZeroDeg);
  const reliefFactor = 1 - clamp01(localReliefM / P.reliefZeroM);
  return {
    version: TERRAIN_SCORE_VERSION,
    score: round1(100 * (P.weightSlope * slopeFactor + P.weightRelief * reliefFactor)),
    meanSlopeDeg: slopeDeg,
    localReliefM,
    slopeFactor: Math.round(slopeFactor * 1000) / 1000,
    reliefFactor: Math.round(reliefFactor * 1000) / 1000,
    params: { ...P },
    note: "Danger de la surface d'atterrissage uniquement (disque de 250 m, DEM LOLA 80 m). L'éclairement et la visibilité de la Terre sont comptés ailleurs ; cailloux et petits cratères ne sont pas vus.",
  };
}
