'use client';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import type {} from '@mui/x-charts/themeAugmentation';
import type {} from '@mui/x-data-grid/themeAugmentation';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/fr';
import 'dayjs/locale/en';
import { Fragment } from 'react';
import { DocumentTitle, I18nProvider } from '@/i18n';
import AppTheme from '@/shared-theme/AppTheme';
import { chartsCustomizations, dataGridCustomizations, datePickersCustomizations } from '@/theme/customizations';
import { DashboardStateProvider } from '@/components/dashboard/DashboardState';

// Comme Dashboard.tsx du template : thème partagé + personnalisations MUI X (arbre retiré : non utilisé).
const xThemeComponents = { ...chartsCustomizations, ...dataGridCustomizations, ...datePickersCustomizations };

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppTheme themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <I18nProvider>
        {(locale) => (
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>
            <DashboardStateProvider>
              {/* Clé de langue : remonte les pages pour que formats et graphiques suivent ; le site choisi est conservé. */}
              <DocumentTitle />
              <Fragment key={locale}>{children}</Fragment>
            </DashboardStateProvider>
          </LocalizationProvider>
        )}
      </I18nProvider>
    </AppTheme>
  );
}
