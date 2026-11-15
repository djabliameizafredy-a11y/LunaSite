import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import '@fontsource-variable/inter';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'LunaSite',
  description: "Comparer les sites d'atterrissage du pôle Sud lunaire : Soleil, Terre, énergie, communication.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
