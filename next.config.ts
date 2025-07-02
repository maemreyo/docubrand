/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better PDF processing
  experimental: {
    // Optimize package imports
    optimizePackageImports: ["pdf-lib", "react-colorful"],
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

    return config;
  },

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
