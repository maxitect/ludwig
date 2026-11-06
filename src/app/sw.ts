/// <reference lib="esnext" />
/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  type RuntimeCaching,
  Serwist,
  type SerwistPlugin,
} from "serwist";
import {
  isCacheablePublicPath,
  isGuestResponseBody,
} from "../utils/offline-cache";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const pagesCache = "pages";

const requireGuestBody: SerwistPlugin = {
  cacheWillUpdate: async ({ response }) => {
    if (response.status !== 200 || response.type !== "basic") return null;
    const body = await response.clone().text();
    return isGuestResponseBody(body) ? response : null;
  },
};

/** No network timeout: a timeout would hand a signed-in visitor on a slow link the cached signed-out copy. */
const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ request, url, sameOrigin }) =>
      sameOrigin &&
      request.mode === "navigate" &&
      isCacheablePublicPath(url.pathname),
    handler: new NetworkFirst({
      cacheName: pagesCache,
      plugins: [requireGuestBody, new ExpirationPlugin({ maxEntries: 64 })],
      matchOptions: { ignoreVary: true },
    }),
  },
  {
    matcher: ({ request }) => request.mode === "navigate",
    handler: new NetworkOnly(),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.delete(pagesCache));
});

serwist.addEventListeners();
