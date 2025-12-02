const withNextIntl = require('next-intl/plugin')('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Ensure proper output for Vercel
  output: 'standalone',
};

module.exports = withNextIntl(nextConfig);

