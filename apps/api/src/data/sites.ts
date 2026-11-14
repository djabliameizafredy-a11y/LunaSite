import type { Site } from '@lunasite/shared-types';
import { applyTerrain } from './terrain';

/**
 * Catalogue de sites.
 * - `published` : coordonnées issues d'une source citée.
 * - `approximate_to_verify` : ordre de grandeur correct, À VALIDER avant toute
 *   présentation comme donnée scientifique (aucune liste officielle inventée).
 * Les champs terrain restent null tant qu'aucune donnée LOLA n'est importée :
 * une valeur inconnue n'est jamais remplacée par 0.
 */
const NO_TERRAIN = { slopeDeg: null, shadowRisk: null, horizonMask: false } as const;

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
    id: 'shackleton', name: 'Cratère Shackleton (bord)', region: 'south-pole',
    latitude: -89.9, longitude: 129.78, elevationM: null, terrainType: 'crater-rim', origin: 'feature',
    description: "Cratère polaire emblématique, fond en ombre permanente ; les crêtes voisines sont très éclairées.",
    coordinatesStatus: 'approximate_to_verify', coordinatesSource: 'Mémoire équipe / gazetteer IAU à revérifier', terrain: NO_TERRAIN,
  },
  {
    id: 'haworth', name: 'Cratère Haworth', region: 'south-pole',
    latitude: -87.5, longitude: -5.0, elevationM: null, terrainType: 'crater', origin: 'feature',
    description: "Région candidate Artemis III citée par la NASA ; coordonnées exactes du site à choisir dans la région.",
    coordinatesStatus: 'approximate_to_verify', coordinatesSource: 'Ordre de grandeur, à vérifier (gazetteer IAU / SVS 5013)', terrain: NO_TERRAIN,
  },
  {
    id: 'malapert', name: 'Massif Malapert', region: 'south-pole',
    latitude: -85.9, longitude: 0.1, elevationM: null, terrainType: 'massif', origin: 'feature',
    description: "Massif en vue quasi permanente de la Terre ; région candidate Artemis III.",
    coordinatesStatus: 'approximate_to_verify', coordinatesSource: 'Ordre de grandeur, à vérifier', terrain: NO_TERRAIN,
  },
  {
    id: 'cabeus', name: 'Cratère Cabeus', region: 'south-pole',
    latitude: -84.9, longitude: -35.5, elevationM: null, terrainType: 'crater', origin: 'feature',
    description: "Cible de l'impact LCROSS (détection d'eau) ; fond en ombre permanente.",
    coordinatesStatus: 'approximate_to_verify', coordinatesSource: 'Ordre de grandeur, à vérifier', terrain: NO_TERRAIN,
  },
  {
    id: 'de-gerlache', name: 'Cratère de Gerlache (bord)', region: 'south-pole',
    latitude: -88.5, longitude: -87.1, elevationM: null, terrainType: 'crater-rim', origin: 'feature',
    description: "Région candidate Artemis III (bords de Gerlache), proche de Shackleton.",
    coordinatesStatus: 'approximate_to_verify', coordinatesSource: 'Ordre de grandeur, à vérifier', terrain: NO_TERRAIN,
  },
  {
    id: 'nobile', name: 'Cratère Nobile (bord)', region: 'south-pole',
    latitude: -85.2, longitude: 53.3, elevationM: null, terrainType: 'crater-rim', origin: 'feature',
    description: "Régions candidates Artemis III (Nobile Rim 1 et 2).",
    coordinatesStatus: 'approximate_to_verify', coordinatesSource: 'Ordre de grandeur, à vérifier', terrain: NO_TERRAIN,
  },
  {
    id: 'faustini', name: 'Cratère Faustini (bord)', region: 'south-pole',
    latitude: -87.3, longitude: 77.0, elevationM: null, terrainType: 'crater-rim', origin: 'feature',
    description: "Région candidate Artemis III (Faustini Rim A).",
    coordinatesStatus: 'approximate_to_verify', coordinatesSource: 'Ordre de grandeur, à vérifier', terrain: NO_TERRAIN,
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
