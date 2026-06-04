import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  // Reduce memory pressure in dev by disabling source maps
  productionBrowserSourceMaps: false,
};

export default nextConfig;
