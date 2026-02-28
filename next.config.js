/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'standalone',
    env: {
        // Use relative path - works with both Caddy and dev server rewrites
        NEXT_PUBLIC_API_URL: '/api',
    },
    // Dev server proxies /api to backend - Caddy does this in production
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:3001/api/:path*',
            },
        ]
    },
}

module.exports = nextConfig
