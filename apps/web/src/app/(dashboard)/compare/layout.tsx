import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comparer',
  description: 'Comparer 2 à 4 sites lunaires sur la même période, ou un site à plusieurs dates : Soleil, Terre, énergie et score.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
