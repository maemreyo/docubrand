/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      // Fix for TailwindCSS v4 components path
      "tailwindcss/components": "tailwindcss",
      "tailwindcss/base": "tailwindcss",
    },
  },
  // Enable experimental features for better PDF processing
  experimental: {
    // Optimize package imports
    optimizePackageImports: ["pdf-lib", "react-colorful"],
    // Enable Turbopack configuration
  },

  // Webpack configuration for pdf-lib compatibility
  // @ts-ignore
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Handle pdf-lib dependencies on client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // This is needed for PDF.js to work properly
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    // Handle PDF.js worker
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?mjs$/,
      type: "asset/resource",
      generator: {
        filename: "static/chunks/[name].[hash][ext]",
      },
    });

    return config;
  },

  reactStrictMode: true,
  swcMinify: false, // Disable SWC minify to avoid issues with PDF.js

  // Optimize images and static assets
  images: {
    formats: ["image/webp", "image/avif"],
  },

  // Development configuration
  env: {
    APP_NAME: "DocuBrand",
    APP_VERSION: "0.1.0",
  },
};

module.exports = nextConfig;
