import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Catalogue des sites",
  description: "Les 13 sites candidats du pôle Sud lunaire et sites historiques : coordonnées, pente, relief local.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
