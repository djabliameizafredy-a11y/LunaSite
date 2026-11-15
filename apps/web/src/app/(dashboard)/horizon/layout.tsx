import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Horizon 3D",
  description: "Le ciel du site en 3D : le Soleil et la Terre au-dessus de la vraie ligne de crête mesurée par LOLA.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
