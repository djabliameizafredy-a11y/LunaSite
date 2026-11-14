/** Origine du catalogue en mémoire, exposée par /api/health (jamais silencieuse sur un repli). */
export const catalogueState: { source: 'embedded' | 'database'; error: string | null } = { source: 'embedded', error: null };
