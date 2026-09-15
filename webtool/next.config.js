const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    config.resolve.alias['@peculiar/webcrypto'] = path.resolve(__dirname, 'lib/webcrypto.js');
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
  images: {
    loader: 'custom',
  },
  exportPathMap: function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      '/': { page: '/' },
    }
  },
}

module.exports = nextConfig
