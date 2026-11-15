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

**PostgreSQL est optionnel.** Sans `DATABASE_URL`, l'API utilise le catalogue embarqué (`apps/api/src/data/sites.ts`) : le frontend
n'est jamais bloqué par la base. Les calculs sont faits à la volée (cache mémoire des éphémérides).

### Base de données (PostgreSQL + Prisma 7)

```bash
cd apps/api
cp .env.example .env          # DATABASE_URL (port 5433 par défaut pour éviter un conflit avec une base locale)
npm run db:up                 # PostgreSQL 16 de dev via Docker (docker-compose.db.yml)
npm run db:migrate            # applique prisma/migrations
npm run db:seed               # copie le catalogue + le relief LOLA dans la base (idempotent)
npm run dev                   # « Catalogue chargé depuis PostgreSQL : 13 sites, 9 relevés de terrain »
```
Schéma : `apps/api/prisma/schema.prisma`, **proposition alignée sur le §6** (tables `landing_sites`, `terrain_data`, `mission_windows`,
`earth_visibility`, `mission_scores`, `nasa_datasets`) avec les ajouts « à valider » : `calculation_level`, `method_version`, `is_mock`,
lien résultat ↔ jeu de données, inconnu = `NULL`. Les séries Soleil/Terre ne sont pas stockées (calculées à la demande).
Au démarrage l'API charge le catalogue depuis la base en mémoire (le moteur reste synchrone). Si la base est injoignable ou vide, repli
**explicite** sur le catalogue embarqué (log serveur + `/api/health` → `catalogueSource`). Résultat vérifié identique dans les deux modes.
Les tests d'intégration (`test/db.test.ts`) sont ignorés sans `DATABASE_URL`.
**Base hébergée (Supabase, projet LunaSpace)** : dans `apps/api/.env`, mettre `DATABASE_URL` = pooler mode transaction
(port **6543**, `?pgbouncer=true`) pour l'API, et `DIRECT_URL` = pooler mode session (port **5432**) pour `prisma migrate` / `db seed`
(Supabase > Connect > ORMs > Prisma). Puis `npm run db:deploy && npm run db:seed` (jamais `migrate dev` sur la base partagée).
La migration `20261114150000_hardening` passe les dates en `timestamptz`, ajoute les contraintes CHECK (coordonnées, durées,
scores 0–100, cohérence mock/niveau de calcul) et active la RLS sur toutes les tables (API REST Supabase fermée aux clés anon).
**Non encore branché :** l'écriture des résumés de résultats (`mission_*`, `earth_visibility`) comme cache — tables et clés d'unicité prêtes.
**À coordonner avec la personne qui travaille sur la BD** : comparer ce schéma au sien avant de fusionner.

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
- Score global = `null` pour les sites sans relief LOLA (jamais 0) ; `partialScore` (solaire + communication) est fourni et étiqueté. Les recommandations utilisent une base de classement commune (`rankingBasis`) ; `?region=south-pole` classe sur le score global.

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

## Score terrain (`terrain-v0.1`, proposition à valider)

`score = 100 × (0,7 × facteurPente + 0,3 × facteurRelief)`, avec `facteurPente = 1 − clamp(pente moyenne / 15°)` et
`facteurRelief = 1 − clamp(relief local / 150 m)`, mesurés sur un disque de 250 m de rayon (LOLA 80 m). Code : `src/modules/mission-score/terrain-score.ts`.
- Il mesure le danger de la **surface** seulement : l'éclairement et la visibilité de la Terre sont déjà dans les scores solaire et communication (pas de double comptage).
- Les seuils (15°, 150 m) et poids (0,7/0,3) sont **illustratifs, choisis par nous** — ni exigences NASA ni d'un fournisseur d'atterrisseur. Ils sont renvoyés dans `terrainScoreDetail.params` à chaque réponse.
- Un DEM de 80 m ne voit ni cailloux ni petits cratères : un bon score n'est pas une garantie de sûreté. Pente ou relief inconnus → `null`.

## Points candidats de crête

Les points des cratères/massifs polaires ne sont plus des coordonnées de mémoire : `scripts/select-sites.ts` cherche dans le DEM,
autour d'un centre approximatif (anneau ≈ rayon du cratère), le point qui maximise `0,533 × éclairement + 0,467 × visibilité Terre` sur 2027
sous la contrainte pente moyenne ≤ 10°. Résultat reproductible dans `data/lola/selection.json` (top 5 par zone). Statut `derived_from_dem`.
**Ce ne sont pas les régions Artemis officielles** (centres de recherche approximatifs, certains optimums proches du bord de la zone, ex. Nobile) :
à confronter aux régions NASA avant toute présentation comme telles. Pour IM-2, Chandrayaan-3 et Apollo : coordonnées publiées inchangées.

## Décisions prises par défaut (à valider par Fayose, §14 du document)

1. Express (pas NestJS) ; 2. calculs en JS/TS dans l'API (une seule stack) ; 4. paramètres d'énergie ci-dessus ;
6. comparaison de plusieurs dates pour un même site : **implémentée** (`dates:[…]`).
5. score terrain : **proposé ci-dessus (v0.1)**, à valider. Reste ouvert : projection cartographique.

## Frontend (apps/web)

```bash
npm run web:dev        # http://localhost:3000 (API attendue sur http://localhost:3001, ou NEXT_PUBLIC_API_URL)
npm run web:build
```
Pages : accueil, vue d'ensemble, **Horizon 3D en direct** (ciel du site à l'instant présent, mis à jour chaque seconde,
sans lecture manuelle), catalogue + globe 3D, **Comparer** (2 à 4 sites sur une période, ou un site à 2–4 dates,
`POST /api/compare`), **Recommandations** (classement, `GET /api/recommendations`), à propos, données et limites.
Globe 3D : texture chargée comme dans le prototype de Fredy (lunascope-mui) depuis `apps/web/public/textures/moon_equirect.jpg`
(texture Solar System Scope CC BY 4.0, voir le README de ce dossier) ; si l'image manque, repli automatique sur la texture procédurale.

## Déploiement sur Render

Le fichier `render.yaml` (Blueprint) crée deux services web Node 22 depuis ce dépôt :

| Service | Build | Start | Variables |
|---|---|---|---|
| `lunasite-api` | `npm ci --include=dev` | `npm run start -w @lunasite/api` | `DATABASE_URL` (optionnelle, Supabase pooler 6543), `CORS_ORIGIN` (optionnelle) |
| `lunasite-web` | `npm ci --include=dev && npm run build -w @lunasite/web` | `npm run start -w @lunasite/web` | `NEXT_PUBLIC_API_URL` = URL publique de l'API |

1. Render > **New > Blueprint** > choisir le dépôt et la branche. Remplir `DATABASE_URL` (ou la laisser vide : catalogue embarqué).
2. Vérifier l'URL attribuée à l'API (`https://lunasite-api.onrender.com` par défaut). Si elle diffère, mettre la bonne valeur
   dans `NEXT_PUBLIC_API_URL` du service web puis **Manual Deploy** : cette variable est lue au build.
3. Contrôle : `https://<api>/api/health` → `{"status":"ok", ...}`.

`next start` écoute sur `PORT` (fourni par Render). `--include=dev` est nécessaire : `tsx` (démarrage de l'API) et la CLI
Prisma (`postinstall` → `prisma generate`, qui fonctionne sans base) sont des dépendances de développement.
Offre gratuite : l'API se met en veille après 15 min ; le premier appel peut prendre ~50 s (le client attend jusqu'à 60 s).

### Base de données en production et tâche « keep-alive »

- Brancher Supabase : sur Render, service `lunasite-api` > **Environment** > `DATABASE_URL` = pooler **mode transaction**
  (port 6543, `?pgbouncer=true`). Au redémarrage, `/api/health` doit renvoyer `"catalogueSource":"database"`.
- `GET /api/health/db` exécute une vraie requête (`count` sur `landing_sites`) : `200 {"status":"ok","sites":13,...}`,
  ou `503` si la base n'est pas configurée ou ne répond pas.
- `.github/workflows/keep-alive.yml` appelle cette route **toutes les 2 h** pour que Supabase (offre gratuite, pause après
  7 jours d'inactivité) ne se mette pas en pause. GitHub n'exécute les tâches planifiées que depuis la **branche par défaut** :
  le fichier doit être présent sur `main`. Lancement manuel : onglet **Actions** > « Keep-alive base de données » > **Run workflow**.
  Elle ne garde pas l'API Render éveillée en continu (volontaire : quota gratuit de 750 h/mois partagé entre les services).

## Prochaines étapes

PostgreSQL + Prisma (sites, runs, traçabilité), import LOLA → masques d'horizon, OpenAPI. (Déploiement Render : voir ci-dessus.)
