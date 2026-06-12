/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@hookgenos/core'],
};
module.exports = nextConfig;
