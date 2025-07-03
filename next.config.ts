/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack configuration
  turbopack: {
    resolveAlias: {
      // Fix for TailwindCSS v4 components path
      "tailwindcss/components": "tailwindcss",
      "tailwindcss/base": "tailwindcss",
    },
    rules: {
      // Handle PDF.js worker files
      '*.worker.mjs': {
        loaders: ['file-loader'],
        as: '*.js',
      },
    },
  },
  
  // Enable experimental features for better PDF processing
  experimental: {
    // Optimize package imports
    optimizePackageImports: ["pdf-lib", "react-colorful"],
  },

  // Webpack configuration for pdf-lib and react-pdf compatibility
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle client-side dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }

    // Essential aliases for PDF.js compatibility
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    };

    // Enhanced PDF.js worker handling for Next.js 15
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

    // Optimize PDF.js imports
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          pdf: {
            test: /[\\/]node_modules[\\/](pdfjs-dist|react-pdf)[\\/]/,
            name: 'pdf',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };

    // Handle pdfjs-dist imports properly
    config.resolve.extensions = ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'];

    return config;
  },

  // Essential settings for PDF.js compatibility
  reactStrictMode: true,

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // Environment variables
  env: {
    APP_NAME: 'DocuBrand',
    APP_VERSION: '0.1.0',
    PDF_WORKER_VERSION: '4.0.379',
  },

  // Headers for better PDF loading
  async headers() {
    return [
      {
        source: '/pdf.worker.min.mjs',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/chunks/pdf.worker.min.mjs',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for PDF worker files (fallback)
  async redirects() {
    return [
      // Redirect old worker paths to new ones if needed
      {
        source: '/pdf.worker.js',
        destination: '/pdf.worker.min.mjs',
        permanent: false,
      },
    ];
  },

  // Rewrites for better PDF worker handling
  async rewrites() {
    return [
      // Handle PDF worker requests
      {
        source: '/pdf-worker/:path*',
        destination: '/api/pdf-worker/:path*',
      },
    ];
  },

  // Configure output for better compatibility
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Compiler options
  compiler: {
    // Remove console logs in production except errors
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Performance configuration
  poweredByHeader: false,
  compress: true,

  // Development configuration
  ...(process.env.NODE_ENV === 'development' && {
    // Enhanced dev options
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),
};

module.exports = nextConfig;