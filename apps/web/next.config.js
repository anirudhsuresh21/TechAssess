/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@techassess/shared'],
  async rewrites() {
    // In local dev without Vercel edge router, proxy /api/v1 to Express on port 4000.
    // On Vercel, the top-level vercel.json service router directs /api/* to Express.
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      return [
        {
          source: '/api/v1/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/:path*`,
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
