import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Vue d'ensemble",
  description: "Soleil, Terre, énergie et fenêtres de communication du site choisi, calculés sur le relief NASA LOLA.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
