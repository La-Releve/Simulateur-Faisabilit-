import type { NextConfig } from "next";

// STATIC_EXPORT=1 → export statique dans out/ (hébergement de fichiers pur, sans serveur Node).
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export" as const, images: { unoptimized: true } } : {}),
  poweredByHeader: false,
};

export default nextConfig;
