import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Données et limites",
  description: "Sources NASA (LOLA, JPL Horizons, LROC), validation des calculs et limites de l'outil.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
