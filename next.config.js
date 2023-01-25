/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api-cdn.myanimelist.net',
      },
    ],
  },
}

module.exports = nextConfig
