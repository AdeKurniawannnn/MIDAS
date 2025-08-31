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
      
      // Enhanced chunk splitting for animation libraries
      if (!isServer) {
        config.optimization.splitChunks = {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            
            // Framer Motion optimization
            framerMotion: {
              test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
              name: 'framer-motion',
              priority: 30,
              chunks: 'all',
              enforce: true,
            },
            
            // React core libraries
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              priority: 25,
              chunks: 'all',
              enforce: true,
            },
            
            // UI libraries (shadcn, radix)
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|@floating-ui|cmdk)[\\/]/,
              name: 'ui-libs',
              priority: 20,
              chunks: 'all',
            },
            
            // Other vendor packages
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: 10,
              chunks: 'all',
              minChunks: 2,
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