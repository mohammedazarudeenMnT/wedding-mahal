/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: `${process.env.DO_SPACE_BUCKET}.${process.env.DO_SPACE_REGION}.digitaloceanspaces.com`,
      },
    ],
    domains: ["jrvmahal.com", "jrv-mahal.nyc3.digitaloceanspaces.com"],
    unoptimized: true,
  },

  output: "standalone",

  // Enable static file serving through public folder
  useFileSystemPublicRoutes: true,

  webpack: (config) => {
    // Add handlebars loader
    config.module.rules.push({
      test: /\.(handlebars|hbs)$/,
      loader: "handlebars-loader",
    });

    // Ignore warnings about require.extensions
    config.ignoreWarnings = [
      { module: /node_modules\/handlebars\/lib\/index\.js/ },
    ];

    return config;
  },
};

export default nextConfig;
