import 'dotenv/config';
import { createApp } from './app';
import { hydrateCatalogueFromDb } from './data/catalogue-db';
import { dbEnabled } from './db/client';
import { catalogueState } from './data/catalogue-state';
import { hydrateReferenceFromDb } from './data/reference-db';

const port = Number(process.env.PORT ?? 3001);

async function main() {
  if (dbEnabled()) {
    try {
      const r = await hydrateCatalogueFromDb();
      catalogueState.source = 'database';
      console.log(`Catalogue chargé depuis PostgreSQL : ${r.sites} sites, ${r.terrain} relevés de terrain.`);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      // Détail complet dans les logs serveur uniquement ; /api/health n'expose qu'une raison courte (pas de chemins internes).
      catalogueState.error = /vide/.test(detail) ? 'base vide (seed non exécuté)' : 'base indisponible';
      console.error(`ATTENTION : PostgreSQL indisponible ou vide. Repli sur le catalogue embarqué.\n${detail}`);
    }
    try {
      const n = await hydrateReferenceFromDb();
      console.log(n ? `Références JPL Horizons chargées depuis PostgreSQL : ${n} points.` : 'Aucune référence JPL Horizons en base : fichier embarqué utilisé.');
    } catch (e) {
      console.error(`ATTENTION : références JPL Horizons non lues en base, fichier embarqué utilisé.\n${e instanceof Error ? e.message : e}`);
    }
  } else {
    console.log('DATABASE_URL non définie : catalogue embarqué (aucune base requise).');
  }
  createApp().listen(port, () => console.log(`LunaSite API sur http://localhost:${port}/api`));
}
main();
