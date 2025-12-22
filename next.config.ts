import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/site",
  assetPrefix: "/site",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
