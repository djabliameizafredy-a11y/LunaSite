import type { Site } from '@lunasite/shared-types';
import { applyTerrain } from './terrain';

/**
 * Catalogue de sites.
 * - `published` : coordonnées issues d'une source citée.
 * - `derived_from_dem` : point candidat sélectionné par scripts/select-sites.ts dans le DEM LOLA (reproductible, NON officiel).
 * - `approximate_to_verify` : ordre de grandeur correct, À VALIDER avant toute
 *   présentation comme donnée scientifique (aucune liste officielle inventée).
 * Les champs terrain restent null tant qu'aucune donnée LOLA n'est importée :
 * une valeur inconnue n'est jamais remplacée par 0.
 */
const NO_TERRAIN = { slopeDeg: null, localReliefM: null, shadowRisk: null, horizonMask: false } as const;

export const SITES: Site[] = [
  // --- Pôle Sud et régions polaires (cibles CLPS / Artemis / commerciales) ---
  {
    id: 'south-pole', name: 'Pôle Sud géographique (90°S)', region: 'south-pole',
    latitude: -90, longitude: 0, elevationM: null, terrainType: null, origin: 'reference',
    description: "Point de référence : l'axe de rotation lunaire. Cas limite pour comparer l'éclairage rasant.",
    coordinatesStatus: 'published', coordinatesSource: 'Définition (axe de rotation)', terrain: NO_TERRAIN,
  },
  {
    id: 'im2-mons-mouton', name: 'IM-2 Athena — Mons Mouton', region: 'south-pole',
    latitude: -84.7906, longitude: 29.1957, elevationM: null, terrainType: 'plateau', origin: 'clps',
    description: "Site d'atterrissage d'IM-2 (CLPS, 6 mars 2025), sur un plateau près du pôle Sud.",
    coordinatesStatus: 'published', coordinatesSource: 'Wikipédia / IM-2 infobox (84°47′26″S 29°11′45″E) ; atterrissage hors de l\'ellipse visée', terrain: NO_TERRAIN,
  },
  {
    id: 'shackleton', name: 'Shackleton — crête vers de Gerlache (point candidat)', region: 'south-pole',
    latitude: -89.8316, longitude: -151.8857, elevationM: null, terrainType: 'crater-rim', origin: 'feature',
    description: "Crête éclairée entre Shackleton et de Gerlache, au plus près du pôle ; le fond du cratère, lui, est en ombre permanente.",
    coordinatesStatus: 'derived_from_dem',
    coordinatesSource: "Point candidat sélectionné dans le DEM LOLA 80 m par scripts/select-sites.ts (pente moyenne ≤ 10°, max de 0,533·éclairement + 0,467·visibilité Terre sur 2027). Centre de recherche APPROXIMATIF (-89.9°, 129.78°), zone 0–14 km. Non officiel.",
    terrain: NO_TERRAIN,
  },
  {
    id: 'haworth', name: 'Haworth — bord (point candidat)', region: 'south-pole',
    latitude: -86.9192, longitude: -23.0928, elevationM: null, terrainType: 'crater', origin: 'feature',
    description: "Point candidat sur le bord du grand cratère Haworth (fond en ombre permanente).",
    coordinatesStatus: 'derived_from_dem',
    coordinatesSource: "Point candidat sélectionné dans le DEM LOLA 80 m par scripts/select-sites.ts (pente moyenne ≤ 10°, max de 0,533·éclairement + 0,467·visibilité Terre sur 2027). Centre de recherche APPROXIMATIF (-87.5°, -5.0°), zone 17–35 km. Non officiel.",
    terrain: NO_TERRAIN,
  },
  {
    id: 'malapert', name: 'Massif Malapert — sommet (point candidat)', region: 'south-pole',
    latitude: -85.9222, longitude: -4.0774, elevationM: null, terrainType: 'massif', origin: 'feature',
    description: "Sommet du massif, en vue de la Terre en continu ; région candidate Artemis III.",
    coordinatesStatus: 'derived_from_dem',
    coordinatesSource: "Point candidat sélectionné dans le DEM LOLA 80 m par scripts/select-sites.ts (pente moyenne ≤ 10°, max de 0,533·éclairement + 0,467·visibilité Terre sur 2027). Centre de recherche APPROXIMATIF (-85.9°, 0.1°), zone 0–12 km. Non officiel.",
    terrain: NO_TERRAIN,
  },
  {
    id: 'cabeus', name: 'Cabeus — bord (point candidat)', region: 'south-pole',
    latitude: -85.3866, longitude: -19.7227, elevationM: null, terrainType: 'crater', origin: 'feature',
    description: "Point candidat sur les hauteurs autour de Cabeus (cible de LCROSS, fond en ombre permanente).",
    coordinatesStatus: 'derived_from_dem',
    coordinatesSource: "Point candidat sélectionné dans le DEM LOLA 80 m par scripts/select-sites.ts (pente moyenne ≤ 10°, max de 0,533·éclairement + 0,467·visibilité Terre sur 2027). Centre de recherche APPROXIMATIF (-84.9°, -35.5°), zone 35–70 km. Non officiel.",
    terrain: NO_TERRAIN,
  },
  {
    id: 'de-gerlache', name: 'de Gerlache — bord (point candidat)', region: 'south-pole',
    latitude: -88.4216, longitude: -62.3977, elevationM: null, terrainType: 'crater-rim', origin: 'feature',
    description: "Point candidat sur le bord du cratère de Gerlache, région candidate Artemis III.",
    coordinatesStatus: 'derived_from_dem',
    coordinatesSource: "Point candidat sélectionné dans le DEM LOLA 80 m par scripts/select-sites.ts (pente moyenne ≤ 10°, max de 0,533·éclairement + 0,467·visibilité Terre sur 2027). Centre de recherche APPROXIMATIF (-88.5°, -87.1°), zone 11–22 km. Non officiel.",
    terrain: NO_TERRAIN,
  },
  {
    id: 'nobile', name: 'Nobile — hauteurs (point candidat)', region: 'south-pole',
    latitude: -84.0619, longitude: 43.693, elevationM: null, terrainType: 'crater-rim', origin: 'feature',
    description: "Point candidat sur les hauteurs près de Nobile ; optimum proche du bord de la zone de recherche.",
    coordinatesStatus: 'derived_from_dem',
    coordinatesSource: "Point candidat sélectionné dans le DEM LOLA 80 m par scripts/select-sites.ts (pente moyenne ≤ 10°, max de 0,533·éclairement + 0,467·visibilité Terre sur 2027). Centre de recherche APPROXIMATIF (-85.2°, 53.3°), zone 25–46 km. Non officiel.",
    terrain: NO_TERRAIN,
  },
  {
    id: 'faustini', name: 'Faustini — bord (point candidat)', region: 'south-pole',
    latitude: -87.8828, longitude: 88.6847, elevationM: null, terrainType: 'crater-rim', origin: 'feature',
    description: "Point candidat sur le bord du cratère Faustini, région candidate Artemis III.",
    coordinatesStatus: 'derived_from_dem',
    coordinatesSource: "Point candidat sélectionné dans le DEM LOLA 80 m par scripts/select-sites.ts (pente moyenne ≤ 10°, max de 0,533·éclairement + 0,467·visibilité Terre sur 2027). Centre de recherche APPROXIMATIF (-87.3°, 77.0°), zone 14–27 km. Non officiel.",
    terrain: NO_TERRAIN,
  },
  {
    id: 'chandrayaan3', name: 'Chandrayaan-3 — Shiv Shakti', region: 'south-highlands',
    latitude: -69.3733, longitude: 32.3191, elevationM: null, terrainType: 'highlands', origin: 'international',
    description: "Atterrissage de l'Inde (août 2023), le plus proche du pôle Sud jamais atteint à l'époque.",
    coordinatesStatus: 'approximate_to_verify', coordinatesSource: 'ISRO / LRO, ~69.37°S 32.32°E, à vérifier', terrain: NO_TERRAIN,
  },
  // --- Apollo (référence de validation et de pédagogie) ---
  {
    id: 'apollo11', name: 'Apollo 11 — Mer de la Tranquillité', region: 'equatorial',
    latitude: 0.67408, longitude: 23.47297, elevationM: null, terrainType: 'mare', origin: 'apollo',
    description: "Premier atterrissage habité (20 juillet 1969).",
    coordinatesStatus: 'approximate_to_verify', coordinatesSource: 'NASA/LROC ~0.674°N 23.473°E, à vérifier', terrain: NO_TERRAIN,
  },
  {
    id: 'apollo15', name: 'Apollo 15 — Hadley–Apennin', region: 'near-side',
    latitude: 26.1322, longitude: 3.6339, elevationM: null, terrainType: 'mountain-rille', origin: 'apollo',
    description: "Site de montagne près de la rille Hadley.",
    coordinatesStatus: 'approximate_to_verify', coordinatesSource: 'NASA/LROC ~26.13°N 3.63°E, à vérifier', terrain: NO_TERRAIN,
  },
  {
    id: 'blue-ghost', name: 'Blue Ghost — Mare Crisium', region: 'near-side',
    latitude: 18.56, longitude: 61.807, elevationM: null, terrainType: 'mare', origin: 'clps',
    description: "Cible de Firefly Blue Ghost 1 (CLPS, mars 2025).",
    coordinatesStatus: 'approximate_to_verify', coordinatesSource: 'Jatan.space (source secondaire) ; cible, non position finale', terrain: NO_TERRAIN,
  },
];

applyTerrain(SITES);

export const SITES_BY_ID = new Map(SITES.map((s) => [s.id, s]));

/** Remplace le contenu du catalogue en place (les modules qui importent SITES / SITES_BY_ID voient la mise à jour). */
export function replaceCatalogue(sites: Site[]): void {
  SITES.splice(0, SITES.length, ...sites);
  SITES_BY_ID.clear();
  for (const s of sites) SITES_BY_ID.set(s.id, s);
}
