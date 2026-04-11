import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Mode standalone : bundle tout en un seul dossier pour Docker
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
};

export default nextConfig;
