import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recommandations',
  description: "Classement des sites d'atterrissage du pôle Sud lunaire sur une période : score solaire, communication et terrain.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
