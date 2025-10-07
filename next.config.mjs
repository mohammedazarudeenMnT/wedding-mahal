/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value:
              process.env.NODE_ENV === "production"
                ? "https://www.jrvmahal.com"
                : "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      // {
      //   protocol: "https",
      //   hostname: `${process.env.DO_SPACE_BUCKET}.${process.env.DO_SPACE_REGION}.digitaloceanspaces.com`,
      // },
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
