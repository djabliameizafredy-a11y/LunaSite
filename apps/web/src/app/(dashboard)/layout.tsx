import { DashboardShell } from '@/components/dashboard/DashboardShell';

/** Toutes les pages du dashboard partagent la coquille du template (menu, barre mobile, en-tête). */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
