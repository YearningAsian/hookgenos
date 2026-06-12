/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' output is only consumed by docker/app.Dockerfile (Linux).
  // Writing it requires symlink creation, which Windows denies unless
  // Developer Mode is enabled — skip it on win32 so local builds succeed.
  output: process.platform === 'win32' ? undefined : 'standalone',
  transpilePackages: ['@hookgenos/core'],
};
module.exports = nextConfig;
