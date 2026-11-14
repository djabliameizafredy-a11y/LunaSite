# LunaSite — Backend (NASA Space Apps 2026, défi CLPS « Lunar Landing Site Navigator »)

API REST (Node.js + Express + TypeScript) qui calcule, pour un site lunaire et une période :
position du Soleil, position de la Terre, potentiel d'énergie indicatif, fenêtres de
communication directe, score de faisabilité, comparaison et recommandations.

## Démarrer

```bash
npm install            # à la racine (workspaces)
npm run api:dev        # http://localhost:3001/api  (PORT=… pour changer)
npm run api:test       # 24 tests (repère lunaire, physique, API)
```

Aucune base de données ni clé API n'est requise pour l'instant : le catalogue de sites est
dans `apps/api/src/data/sites.ts`, les calculs sont faits à la volée (cache mémoire des éphémérides).

## Endpoints (voir « Architecture (version corrigée) » §7)

| Méthode | Route | Notes |
|---|---|---|
| GET | `/api/health` | |
| GET | `/api/sites?region=&terrain=&origin=` | catalogue filtrable |
| GET | `/api/sites/:id` | `:id` = id du catalogue, ou `custom` avec `?lat=&lon=` |
| GET | `/api/sites/:id/solar?date=YYYY-MM-DD` | `sunPosition`, durées, `energyPotential` |
| GET | `/api/sites/:id/earth-visibility?date=` | `earthPosition`, `windows` |
| GET | `/api/sites/:id/mission-score?date=` | score global (ou `null` expliqué) + score partiel |
| POST | `/api/compare` | `{siteIds, startDate, endDate}` **ou** `{siteIds, dates:[…]}` |
| GET | `/api/recommendations?date=` | classement des sites |

Paramètres communs : `days` (1–31, défaut 1), `stepMinutes` (défaut 15).
Énergie : `panelAreaM2`, `efficiency`, `panelTiltDeg`, `panelAzimuthDeg`.
`date` seule = intervalle `[00:00 UTC, 00:00 UTC du lendemain)`. Fin de période toujours exclusive.
Budget : 4 sites × 31 jours, max 20 000 échantillons-site ; au-delà → `422 BUDGET_EXCEEDED`
(la résolution n'est jamais réduite silencieusement).
Erreurs : `400` (champ fautif dans `error.field`), `404` site inconnu, `422` budget, `500`.
Chaque réponse de résultat porte `meta` (`ResultMeta`, voir `packages/shared-types`).

## Méthode de calcul (niveau `simplified`)

1. Positions Soleil/Lune : `astronomy-engine` (géocentrique, EQJ).
2. Passage au repère lunaire fixe (Mean Earth / polar axis) par le modèle de rotation IAU
   (α0, δ0, W + arguments E1–E13). **Validé** contre la libration d'`astronomy-engine` (< 0,1°, voir `test/frame.test.ts`).
3. Élévation/azimut depuis le site (parallaxe incluse : ~0,26° pour la Terre), azimut depuis le Nord, sens horaire.
4. Visible = centre du disque au-dessus du masque d'horizon (0° tant qu'aucun masque LOLA n'est fourni).
5. Énergie : `P = G · max(0, cos i) · surface · rendement`, G = 1360,8 W/m² (Kopp & Lean 2011) / d².
   Valeurs par défaut (1 m², 30 %, horizontal) = **hypothèses illustratives**.

## Limites à connaître (à dire au jury)

- **Relief LOLA limité aux sites ≥ 80,5°S** (9 sites, niveau `terrain-aware`). Les autres sites et les points
  personnalisés restent `simplified` (horizon plat) : au pôle Sud cela *surestimerait* l'ensoleillement et les fenêtres de communication.
- Relief : DEM 80 m/pixel (~90 % de pixels interpolés entre traces laser), portée 200 km, réduite près du bord du DEM (80°S) ;
  les obstacles de moins de ~200 m ne sont pas représentés. Hauteur d'observateur = 0 m.
- Terre visible = condition géométrique, pas une liaison radio. Pas de lumière-temps ni d'aberration.
- **Coordonnées du catalogue** : seules celles marquées `published` ont une source citée ; les autres sont
  `approximate_to_verify` et doivent être revérifiées (gazetteer IAU / NASA SVS 5013) avant la démo.
- Score global = `null` tant qu'il n'y a pas de score terrain (jamais 0) ; `partialScore` (solaire + communication) est fourni et étiqueté.

## Import LOLA (relief → masques d'horizon)

Source : `LDEM_80S_80M.IMG` (PDS Geosciences, LRO-L-LOLA-4-GDR-V1.0, 115 Mo, **non versionné**, empreinte sha256 dans `horizons.json`).
```bash
# télécharger dans data/lola/raw/ (URL dans apps/api/src/data/horizons.json > meta.url), puis :
cd apps/api
npx tsx scripts/probe-orientation.ts ../../data/lola/raw/ldem_80s_80m.complete.img   # détecte l'orientation des axes
npx tsx scripts/import-lola.ts ../../data/lola/raw/ldem_80s_80m.complete.img --orient swap,1,-1
```
Le résultat (`src/data/horizons.json`, 19 Ko) est versionné : l'API n'a pas besoin du DEM pour tourner.
L'orientation des axes n'est pas dans le label PDS : elle a été déterminée à partir des données (cratères connus) et recoupée
avec le point le plus bas près du pôle (fond de Shackleton). Effet mesuré sur 30 jours (14/11/2026) : Shackleton 100 % → 0 % de Soleil,
Haworth 70 % → 0 %, plateau IM-2 59 % → 51 %, Malapert (sommet) Terre visible 69 % → 100 %.

## Décisions prises par défaut (à valider par Fayose, §14 du document)

1. Express (pas NestJS) ; 2. calculs en JS/TS dans l'API (une seule stack) ; 4. paramètres d'énergie ci-dessus ;
6. comparaison de plusieurs dates pour un même site : **implémentée** (`dates:[…]`).
Restent ouverts : définition du score terrain, projection cartographique.

## Prochaines étapes

PostgreSQL + Prisma (sites, runs, traçabilité), import LOLA → masques d'horizon, déploiement (Railway/Render), OpenAPI.
