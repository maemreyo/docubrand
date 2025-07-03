import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable experimental features for better font handling
  experimental: {
    esmExternals: true,
  },

  // Webpack configuration for fontkit and pdf-lib
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle fontkit and binary modules
    config.module.rules.push({
      test: /\.node$/,
      use: 'raw-loader',
    });

    // Handle fontkit ESM imports
    config.externals = config.externals || [];
    
    if (!isServer) {
      // Client-side externals
      config.externals.push({
        'fontkit': 'fontkit',
      });
    }

    // Resolve fontkit properly
    config.resolve.alias = {
      ...config.resolve.alias,
      'fontkit': require.resolve('fontkit'),
    };

    // Handle PDF.js worker files
    config.module.rules.push(
      {
        test: /pdf\.worker\.(min\.)?mjs$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/chunks/[name].[hash][ext]',
        },
      },
      {
        test: /pdf\.worker\.(min\.)?js$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/chunks/[name].[hash][ext]',
        },
      }
    );

    // Handle react-pdf specific requirements
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    // Optimize fontkit bundling
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          fontkit: {
            test: /[\\/]node_modules[\\/]fontkit[\\/]/,
            name: 'fontkit',
            chunks: 'all',
            priority: 15,
          },
          pdf: {
            test: /[\\/]node_modules[\\/](pdfjs-dist|react-pdf|pdf-lib)[\\/]/,
            name: 'pdf',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };

    // Ignore node-specific modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        zlib: false,
        buffer: require.resolve('buffer'),
      };

      // Provide polyfills for browser
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }

    // Handle fontkit binary files
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name].[hash][ext]',
      },
    });

    return config;
  },

  // Headers for better font loading
  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },

  // Environment variables for font loading
  env: {
    FONTKIT_ENABLED: 'true',
    PDF_WORKER_VERSION: '4.0.379',
  },

  // Essential settings for PDF.js and fontkit compatibility
  reactStrictMode: false, // Disable for fontkit compatibility
  swcMinify: true,

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // Output configuration for better fontkit support
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Transpile fontkit for proper browser support
  transpilePackages: ['fontkit'],

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

export default nextConfig;