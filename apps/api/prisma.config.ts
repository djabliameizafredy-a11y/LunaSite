import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// URL utilisée par la CLI Prisma (migrate, db seed, studio).
// Supabase : DIRECT_URL = pooler en mode session (port 5432) ; le mode transaction (6543) casse `migrate`.
// En local (Docker), DIRECT_URL peut être omise : on retombe sur DATABASE_URL.
// L'API, elle, se connecte avec DATABASE_URL (voir src/db/client.ts).
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  datasource: { url: url ?? '' },
});
