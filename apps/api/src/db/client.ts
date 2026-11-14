import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

let client: PrismaClient | undefined;

export const dbEnabled = () => Boolean(process.env.DATABASE_URL);

/** Client Prisma 7 (adaptateur pg). Créé à la demande ; ne doit être appelé que si DATABASE_URL est définie. */
export function getPrisma(): PrismaClient {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL non définie');
  client ??= new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  return client;
}

export async function closePrisma(): Promise<void> {
  await client?.$disconnect();
  client = undefined;
}
