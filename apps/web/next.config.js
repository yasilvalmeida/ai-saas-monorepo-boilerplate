/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ai-saas/shared-types'],
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig 