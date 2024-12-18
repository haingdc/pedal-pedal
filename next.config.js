const { withContentlayer } = require('next-contentlayer2')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
const StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default

// You might need to insert additional domains in script-src if you are using external services
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' giscus.app analytics.umami.is https://ngayhe.disqus.com;
  style-src 'self' 'unsafe-inline';
  img-src * blob: data:;
  media-src *.s3.amazonaws.com;
  connect-src *;
  font-src 'self';
  frame-src giscus.app https://disqus.com youtube.com www.youtube.com;
`

const securityHeaders = [
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ''),
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

const output = process.env.EXPORT ? 'export' : undefined
const basePath = process.env.BASE_PATH || undefined
const unoptimized = process.env.UNOPTIMIZED ? true : undefined

/**
 * @type {import('next/dist/next-server/server/config').NextConfig}
 **/
module.exports = () => {
  const plugins = [withContentlayer, withBundleAnalyzer]
  return plugins.reduce((acc, next) => next(acc), {
    output,
    basePath,
    reactStrictMode: true,
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    eslint: {
      dirs: ['app', 'components', 'layouts', 'scripts'],
    },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'picsum.photos',
        },
      ],
      unoptimized,
    },
    async headers() {
      return [
        {
          source: '/api/:path*', // Chỉ định headers cho các API routes
          headers: [
            {
              key: 'Access-Control-Allow-Origin',
              value: '*', // Thay đổi thành miền mà bạn muốn cấp phép
            },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET,POST,OPTIONS',
            },
          ],
        },
        {
          source: '/(.*)',
          headers: securityHeaders,
        },
      ]
    },
    /**
     * @param {import('webpack').Configuration} config
     * @param {import('next').NextConfig} options
     * @returns {import('webpack').Configuration}
     */
    webpack: (config, options) => {
      /*
      optimization: {
        usedExports: false,
        minimize: false,
        moduleIds: "named",
        chunkIds: "named",
        splitChunks: false,
        runtimeChunk: 'single',
      }
      // hiện tại
      {
        emitOnErrors: true,
        checkWasmTypes: false,
        nodeEnv: false,
        splitChunks: { filename: 'edge-chunks/[name].js', chunks: 'all', minChunks: 2 },
        runtimeChunk: undefined,
        minimize: true,
        minimizer: [ [Function (anonymous)], [Function (anonymous)] ]
      }
       */
      config.optimization = {
        ...config.optimization,
        minimize: true,
        moduleIds: 'named',
        chunkIds: 'named',
      }
      config.module.rules.push({
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      })
      config.plugins.push(
        new StatoscopeWebpackPlugin({
          open: false,
          compressor: 'gzip',
          saveReportTo: '.next/static/statoscope-analyze/report.html',
          saveStatsTo: '.next/static/statoscope-analyze/stats.json',
          normalizeStats: false,
          watchMode: false,
        })
      )

      return config
    },
  })
}
