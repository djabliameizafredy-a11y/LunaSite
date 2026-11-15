import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "À propos",
  description: "Ce qu'est LunaSite, à quoi il sert et comment l'utiliser.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
