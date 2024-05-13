/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: "",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cde3730f1ad5bc94a1919815a445754e.ipfscdn.io",
        port: "",
        pathname: "/ipfs/**",
      },
    ],
  },
};

module.exports = nextConfig;
