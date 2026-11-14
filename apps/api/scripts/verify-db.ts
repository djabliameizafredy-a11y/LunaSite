/**
 * Vérifie la conformité de la base après `db:deploy` + `db:seed`.
 * Usage : npx tsx scripts/verify-db.ts   (utilise DIRECT_URL, sinon DATABASE_URL)
 * Les insertions invalides sont faites dans une transaction annulée (ROLLBACK) : rien n'est écrit.
 */
import 'dotenv/config';
import pg from 'pg';

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error('DIRECT_URL / DATABASE_URL non définie');

const TABLES = ['nasa_datasets', 'landing_sites', 'terrain_data', 'mission_windows', 'earth_visibility', 'mission_scores',
  '_MissionWindowToNasaDataset', '_EarthVisibilityToNasaDataset', '_MissionScoreToNasaDataset', '_prisma_migrations'];

let failed = 0;
const check = (ok: boolean, label: string) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) failed++; };

const c = new pg.Client({ connectionString: url });
await c.connect();
try {
  // 1. Migrations
  const mig = await c.query(`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`);
  const names = mig.rows.map((r) => r.migration_name);
  check(names.some((n) => n.endsWith('_init')) && names.some((n) => n.endsWith('_hardening')), `migrations appliquées : ${names.join(', ')}`);

  // 2. RLS
  const rls = await c.query(`SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relname = ANY($1)`, [TABLES]);
  const noRls = rls.rows.filter((r) => !r.relrowsecurity).map((r) => r.relname);
  check(rls.rowCount === TABLES.length && noRls.length === 0, `RLS active sur ${TABLES.length} tables${noRls.length ? ' — manquante : ' + noRls.join(', ') : ''}`);

  // 3. timestamptz
  const ts = await c.query(`SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type = 'timestamp without time zone' AND table_name <> '_prisma_migrations'`);
  check(ts.rowCount === 0, `toutes les dates en timestamptz${ts.rowCount ? ' — restantes : ' + ts.rows.map((r) => r.table_name + '.' + r.column_name).join(', ') : ''}`);

  // 4. Contraintes CHECK présentes
  const chk = await c.query(`SELECT count(*)::int AS n FROM pg_constraint WHERE contype = 'c' AND conname LIKE 'chk_%' AND connamespace = 'public'::regnamespace`);
  check(chk.rows[0].n >= 20, `${chk.rows[0].n} contraintes CHECK chk_* (attendu ≥ 20)`);

  // 5. Données du seed
  const counts = await c.query(`SELECT (SELECT count(*) FROM landing_sites)::int AS sites, (SELECT count(*) FROM terrain_data)::int AS terrain,
    (SELECT count(*) FROM nasa_datasets)::int AS datasets, (SELECT count(*) FROM landing_sites WHERE is_mock)::int AS mock_sites,
    (SELECT count(*) FROM terrain_data WHERE shadow_risk IS NOT NULL)::int AS shadow, (SELECT count(*) FROM landing_sites WHERE elevation = 0)::int AS zero_elev`);
  const k = counts.rows[0];
  check(k.sites === 13 && k.terrain === 9 && k.datasets === 2, `seed : ${k.sites} sites (13), ${k.terrain} terrains (9), ${k.datasets} jeux de données (2)`);
  check(k.shadow === 0 && k.zero_elev === 0, 'inconnu = NULL : aucun shadow_risk inventé, aucune altitude à 0');
  check(k.mock_sites === 0, 'aucun site de démo mélangé au catalogue scientifique');

  // 6. Insertions invalides refusées (code 23514 = violation de CHECK)
  const site = `INSERT INTO landing_sites (id,name,region,latitude,longitude,description,origin,coordinates_status,coordinates_source)`;
  const win = `INSERT INTO mission_windows (id,site_id,start_date,end_date,step_minutes,sun_exposure_hours,calculation_level,method_version,is_mock)`;
  const score = `INSERT INTO mission_scores (id,site_id,date,end_date,step_minutes,solar_score,communication_score,terrain_score,global_score,partial_score,weights,calculation_level,method_version)`;
  const bad: [string, string][] = [
    ['latitude 95', `${site} VALUES ('t-lat','x','r',95,0,'d','reference','published','src')`],
    ['site sans source', `${site} VALUES ('t-src','x','r',-85,0,'d','reference','published','  ')`],
    ['identifiant avec majuscules', `${site} VALUES ('Bad_ID','x','r',-85,0,'d','reference','published','src')`],
    ['période inversée', `${win} VALUES ('t1','malapert','2030-01-02Z','2030-01-01Z',15,1,'simplified','v-test',false)`],
    ['30 h de Soleil sur 24 h', `${win} VALUES ('t2','malapert','2030-01-01Z','2030-01-02Z',15,30,'simplified','v-test',false)`],
    ['mock étiqueté simplified', `${win} VALUES ('t3','malapert','2030-01-01Z','2030-01-02Z',15,1,'simplified','v-test',true)`],
    ['score 150', `${score} VALUES ('t4','malapert','2030-01-01Z','2030-01-02Z',15,150,50,50,50,50,'{}','simplified','v-test')`],
    ['score global sans score terrain', `${score} VALUES ('t5','malapert','2030-01-01Z','2030-01-02Z',15,50,50,NULL,50,50,'{}','simplified','v-test')`],
    ['horizon à 359 valeurs', `INSERT INTO terrain_data (id,site_id,source_dataset_id,horizon_elevation_deg) SELECT 't6','apollo11',id,(SELECT jsonb_agg(0) FROM generate_series(1,359)) FROM nasa_datasets LIMIT 1`],
  ];
  await c.query('BEGIN');
  for (const [label, sql] of bad) {
    await c.query('SAVEPOINT s');
    try { await c.query(sql); check(false, `refus : ${label} (ACCEPTÉ à tort)`); }
    catch (e) { check((e as { code?: string }).code === '23514', `refus : ${label} (${(e as { code?: string }).code})`); }
    await c.query('ROLLBACK TO SAVEPOINT s');
  }
  // Une insertion valide passe
  await c.query('SAVEPOINT s');
  try { await c.query(`${win} VALUES ('t7','malapert','2030-01-01Z','2030-01-02Z',15,12,'simplified','v-test',false)`); check(true, 'insertion valide acceptée'); }
  catch (e) { check(false, `insertion valide refusée : ${(e as Error).message}`); }
  await c.query('ROLLBACK');
} finally {
  await c.end();
}
console.log(failed ? `\n${failed} vérification(s) en échec` : '\nToutes les vérifications passent');
process.exitCode = failed ? 1 : 0;
