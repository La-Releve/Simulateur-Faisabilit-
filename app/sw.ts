/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Le shell de l'app (HTML, JS, CSS, polices, icônes, animation) est précaché :
// le calcul étant 100 % client, le simulateur fonctionne hors ligne une fois installé.
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: { cleanupOutdatedCaches: true, ignoreURLParametersMatching: [/.*/] },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [{ url: "/", matcher: ({ request }) => request.destination === "document" }],
  },
});

serwist.addEventListeners();
