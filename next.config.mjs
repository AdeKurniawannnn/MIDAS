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
      
      // Enhanced chunk splitting for animation libraries
      if (!isServer) {
        config.optimization.splitChunks = {
          chunks: 'all',
          minSize: 20000,
          maxSize: 200000, // Reduced from 244000 for better caching
          cacheGroups: {
            default: false,
            vendors: false,
            
            // Framer Motion optimization - separate chunk for better caching
            framerMotion: {
              test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
              name: 'framer-motion',
              priority: 35,
              chunks: 'all',
              enforce: true,
              reuseExistingChunk: true,
            },
            
            // React core libraries
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react-vendor',
              priority: 30,
              chunks: 'all',
              enforce: true,
              reuseExistingChunk: true,
            },
            
            // UI libraries - split by size for better caching
            radixUI: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              priority: 25,
              chunks: 'all',
              reuseExistingChunk: true,
            },
            
            // Other UI utilities
            uiUtils: {
              test: /[\\/]node_modules[\\/](@floating-ui|cmdk|class-variance-authority|clsx|tailwind-merge)[\\/]/,
              name: 'ui-utils',
              priority: 20,
              chunks: 'all',
              reuseExistingChunk: true,
            },
            
            // Shared components chunk for common UI elements
            common: {
              minChunks: 2,
              name: 'common',
              priority: 15,
              chunks: 'all',
              enforce: false,
              reuseExistingChunk: true,
            },
            
            // Large third-party libraries (>100KB)
            largeVendor: {
              test: /[\\/]node_modules[\\/](date-fns|recharts|leaflet|react-leaflet)[\\/]/,
              name: 'large-vendor',
              priority: 18,
              chunks: 'all',
              reuseExistingChunk: true,
            },
            
            // Default vendor chunk for remaining packages
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
        
        // Performance budgets
        config.performance = {
          maxAssetSize: 250000, // 250kb
          maxEntrypointSize: 250000, // 250kb
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