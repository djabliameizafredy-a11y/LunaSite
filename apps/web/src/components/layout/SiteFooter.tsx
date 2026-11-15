'use client';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import GitHubIcon from '@mui/icons-material/GitHub';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { CustomIcon } from '@/components/dashboard/AppNavbar';

type FooterLink = { label: string; href: string; external?: boolean };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Explorer',
    links: [
      { label: "Vue d'ensemble", href: '/dashboard' },
      { label: 'Catalogue des sites', href: '/sites' },
      { label: 'Données et limites', href: '/limits' },
      { label: 'À propos', href: '/about' },
    ],
  },
  {
    title: 'Sources NASA',
    links: [
      { label: 'LOLA (relief, PDS)', href: 'https://pds-geosciences.wustl.edu/missions/lro/lola.htm', external: true },
      { label: 'JPL Horizons', href: 'https://ssd.jpl.nasa.gov/horizons/', external: true },
      { label: 'LROC QuickMap', href: 'https://quickmap.lroc.im-ldi.com/', external: true },
      { label: 'Moon Trek', href: 'https://trek.nasa.gov/moon/', external: true },
    ],
  },
  {
    title: 'Projet',
    links: [
      { label: 'NASA Space Apps 2026', href: 'https://www.spaceappschallenge.org/', external: true },
      { label: 'Code source (GitHub)', href: 'https://github.com/djabliameizafredy-a11y/LunaSite', external: true },
    ],
  },
];

function FooterAnchor({ link }: { link: FooterLink }) {
  const common = { variant: 'body2' as const, underline: 'hover' as const, color: 'text.secondary', sx: { display: 'inline-flex', alignItems: 'center', gap: 0.5, '&:hover': { color: 'text.primary' } } };
  if (link.external) {
    return (
      <Link href={link.href} target="_blank" rel="noopener noreferrer" {...common}>
        {link.label}
        <OpenInNewRoundedIcon sx={{ fontSize: '0.85em', opacity: 0.6 }} aria-hidden="true" />
        <Box component="span" sx={visuallyHidden}>(nouvel onglet)</Box>
      </Link>
    );
  }
  return <Link component={NextLink} href={link.href} {...common}>{link.label}</Link>;
}

const visuallyHidden = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' } as const;

/** Pied de page commun (accueil + dashboard) : identité, navigation, sources, mention pédagogique. */
export function SiteFooter() {
  return (
    <Box component="footer" sx={{ width: '100%', mt: 6 }}>
      <Divider />
      <Grid container spacing={{ xs: 4, md: 3 }} sx={{ py: { xs: 4, md: 5 } }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1.5 }}>
            <CustomIcon />
            <Typography component="p" variant="subtitle1" sx={{ fontWeight: 700 }}>LunaSite</Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: '42ch' }}>
            Comparer les sites d'atterrissage du pôle Sud lunaire : Soleil, Terre, énergie et fenêtres de
            communication, calculés à partir du relief mesuré par la NASA.
          </Typography>
        </Grid>
        {COLUMNS.map((col) => (
          <Grid key={col.title} size={{ xs: 6, sm: 4, md: 3 }}>
            <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>{col.title}</Typography>
            <Stack component="ul" sx={{ listStyle: 'none', m: 0, p: 0, gap: 1 }}>
              {col.links.map((l) => <li key={l.href}><FooterAnchor link={l} /></li>)}
            </Stack>
          </Grid>
        ))}
      </Grid>
      <Divider />
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ py: 2.5, gap: 1.5, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          © 2026 Équipe LunaSite · Projet étudiant NASA Space Apps, non officiel (ni NASA, ni ASC) · Outil pédagogique, pas une recommandation opérationnelle d'atterrissage · Sans compte ni cookie, aucune donnée personnelle collectée.
        </Typography>
        <Link href="https://github.com/djabliameizafredy-a11y/LunaSite" target="_blank" rel="noopener noreferrer"
          aria-label="Code source sur GitHub (nouvel onglet)" color="text.secondary" sx={{ display: 'inline-flex', '&:hover': { color: 'text.primary' } }}>
          <GitHubIcon fontSize="small" />
        </Link>
      </Stack>
    </Box>
  );
}
