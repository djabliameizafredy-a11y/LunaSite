import { describe, it, expect } from 'vitest';
import type { Site } from '@lunasite/shared-types';
import { terrainScore, TERRAIN_SCORE_PARAMS } from '../src/modules/mission-score/terrain-score';

const site = (slopeDeg: number | null, localReliefM: number | null): Site => ({
  id: 't', name: 't', region: 'x', latitude: -86, longitude: 0, elevationM: 0, terrainType: null, description: '',
  origin: 'feature', coordinatesStatus: 'derived_from_dem', coordinatesSource: 't',
  terrain: { slopeDeg, localReliefM, shadowRisk: null, horizonMask: true },
});

describe('score terrain terrain-v0.1', () => {
  it('terrain parfaitement plat -> 100', () => expect(terrainScore(site(0, 0))!.score).toBe(100));
  it('au-delà des seuils -> 0 (pas négatif)', () => {
    expect(terrainScore(site(TERRAIN_SCORE_PARAMS.slopeZeroDeg, TERRAIN_SCORE_PARAMS.reliefZeroM))!.score).toBe(0);
    expect(terrainScore(site(60, 5000))!.score).toBe(0);
  });
  it('valeur intermédiaire : pente 7,5° (facteur 0,5), relief 75 m (facteur 0,5) -> 50', () => {
    expect(terrainScore(site(7.5, 75))!.score).toBe(50);
  });
  it('monotone : plus de pente ou de relief = score plus bas', () => {
    expect(terrainScore(site(3, 30))!.score).toBeGreaterThan(terrainScore(site(8, 30))!.score);
    expect(terrainScore(site(3, 30))!.score).toBeGreaterThan(terrainScore(site(3, 100))!.score);
  });
  it("donnée manquante -> null, jamais 0 ni estimation", () => {
    expect(terrainScore(site(null, 40))).toBeNull();
    expect(terrainScore(site(5, null))).toBeNull();
  });
  it('les poids valent 1 et le détail expose les paramètres', () => {
    expect(TERRAIN_SCORE_PARAMS.weightSlope + TERRAIN_SCORE_PARAMS.weightRelief).toBeCloseTo(1);
    expect(terrainScore(site(5, 40))!.params).toEqual(TERRAIN_SCORE_PARAMS);
  });
});
