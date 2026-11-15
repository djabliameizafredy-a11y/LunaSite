'use client';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import type {} from '@mui/x-charts/themeAugmentation';
import type {} from '@mui/x-data-grid/themeAugmentation';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/fr';
import AppTheme from '@/shared-theme/AppTheme';
import { chartsCustomizations, dataGridCustomizations, datePickersCustomizations } from '@/theme/customizations';
import { DashboardStateProvider } from '@/components/dashboard/DashboardState';

// Comme Dashboard.tsx du template : thème partagé + personnalisations MUI X (arbre retiré : non utilisé).
const xThemeComponents = { ...chartsCustomizations, ...dataGridCustomizations, ...datePickersCustomizations };

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppTheme themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
        <DashboardStateProvider>{children}</DashboardStateProvider>
      </LocalizationProvider>
    </AppTheme>
  );
}
