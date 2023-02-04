/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'api-cdn.myanimelist.net'
			}
		]
	},
	async redirects() {
    return [
      {
        source: '/',
        destination: '/completed',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
