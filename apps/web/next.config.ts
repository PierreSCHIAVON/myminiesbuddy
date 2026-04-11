import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  typescript: {
    // next-auth v5 beta expose des types internes non publics qui bloquent le build
    // À retirer quand next-auth v5 stable sera sorti
    ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig)
