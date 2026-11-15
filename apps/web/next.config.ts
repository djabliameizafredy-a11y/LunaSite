import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Les types partagés sont du TypeScript source (non compilé) : Next doit les transpiler.
  transpilePackages: ['@lunasite/shared-types'],
  // Masque le badge « N » du mode dev (il recouvre le pied du menu).
  devIndicators: false,
};

export default nextConfig;
