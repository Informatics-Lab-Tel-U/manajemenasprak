import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Disable Turbopack — OpenNext requires Webpack output (Turbopack produces
    // [root-of-the-server]__*.js chunks which OpenNext cannot trace/bundle).
    turbopack: false,
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-dialog',
      '@radix-ui/react-label',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
  },
};

export default nextConfig;
