// @ts-check
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { serwist } from "@serwist/next/config";

const revision = (file) => createHash("md5").update(readFileSync(file)).digest("hex");

export default serwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Shell de l'app : JS, CSS, polices auto-hébergées, icônes et images de l'animation.
  globPatterns: [
    ".next/static/**/*.{js,css,ico,png,svg,webp,jpg,json,woff,woff2}",
    "public/**/*.{png,jpg,webp,ico,svg}",
  ],
  // L'animation HTML est précachée à son URL publique exacte (la transformation par défaut retirerait « .html »).
  additionalPrecacheEntries: [
    { url: "/pwa-install-animation.html", revision: revision("public/pwa-install-animation.html") },
  ],
});
