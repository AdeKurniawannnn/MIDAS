/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  experimental: {
    scrollRestoration: true,
  },
  // Enhanced webpack optimization for animation libraries
  webpack: (config, { dev, isServer, webpack }) => {
    // Development optimizations
    if (dev && !isServer) {
      config.devtool = 'eval-source-map'; // Faster than source-map in dev
    }
    
    // Production optimizations
    if (!dev) {
      // Exclude test files from production build
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /\.(test|spec)\.(ts|tsx)$|[\\/]__tests__[\\/]|[\\/]test-utils[\\/]/
        })
      );
      
      // Enhanced tree shaking for animation libraries
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Exclude React Spring from bundle since we removed it
      if (!isServer) {
        config.resolve.alias = {
          ...config.resolve.alias,
          '@react-spring/web': false,
          '@react-spring/core': false,
          'react-spring': false,
        };
      }
      
      // Optimized chunk splitting to reduce fragmentation
      if (!isServer) {
        config.optimization.splitChunks = {
          chunks: 'all',
          minSize: 50000,  // Increased to reduce fragmentation
          maxSize: 500000, // Increased for better caching
          automaticNameDelimiter: '~',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },

            // React ecosystem - bundled together for optimal caching
            reactCore: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-is|scheduler)[\\/]/,
              name: 'react-core',
              priority: 40,
              chunks: 'all',
              enforce: true,
              reuseExistingChunk: true,
            },

            // Animation and interaction libraries - loaded on demand
            animation: {
              test: /[\\/]node_modules[\\/](framer-motion|@dnd-kit)[\\/]/,
              name: 'animation',
              priority: 35,
              chunks: 'async',
              reuseExistingChunk: true,
            },

            // UI component libraries
            uiLibs: {
              test: /[\\/]node_modules[\\/](@radix-ui|@floating-ui|cmdk|vaul)[\\/]/,
              name: 'ui-libs',
              priority: 30,
              chunks: 'all',
              reuseExistingChunk: true,
            },

            // Utility libraries
            utils: {
              test: /[\\/]node_modules[\\/](class-variance-authority|clsx|tailwind-merge|date-fns|zod)[\\/]/,
              name: 'utils',
              priority: 25,
              chunks: 'all',
              reuseExistingChunk: true,
            },

            // Chart libraries - separate for lazy loading
            charts: {
              test: /[\\/]node_modules[\\/](recharts)[\\/]/,
              name: 'charts',
              priority: 22,
              chunks: 'async',
              reuseExistingChunk: true,
            },

            // Map libraries - separate for lazy loading
            maps: {
              test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
              name: 'maps',
              priority: 22,
              chunks: 'async',
              reuseExistingChunk: true,
            },

            // Particle and animation effects
            particles: {
              test: /[\\/]node_modules[\\/](@tsparticles|tsparticles|react-particles)[\\/]/,
              name: 'particles',
              priority: 20,
              chunks: 'async',
              reuseExistingChunk: true,
            },

            // Icon libraries - separate for better tree shaking
            icons: {
              test: /[\\/]node_modules[\\/](lucide-react)[\\/]/,
              name: 'icons',
              priority: 20,
              chunks: 'all',
              reuseExistingChunk: true,
            },

            // Remaining vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: 10,
              chunks: 'all',
              minChunks: 1,
              reuseExistingChunk: true,
            },
          },
        };

        // Increased performance budgets for realistic targets
        config.performance = {
          maxAssetSize: 500000, // 500kb - more realistic
          maxEntrypointSize: 600000, // 600kb - allows for main bundle
          hints: 'warning',
        };
      }
    }
    
    // Webpack plugins for animation optimization
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      })
    );
    
    // Module resolution optimizations
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    
    return config;
  },
}

export default nextConfig 