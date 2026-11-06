/// <reference lib="esnext" />
/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  NetworkFirst,
  NetworkOnly,
  type RuntimeCaching,
  Serwist,
  type SerwistPlugin,
  StaleWhileRevalidate,
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

const pageCaches = ["pages", "pages-rsc", "pages-rsc-prefetch"];

const requireGuestBody: SerwistPlugin = {
  cacheWillUpdate: async ({ response }) => {
    if (response.status !== 200 || response.type !== "basic") return null;
    const body = await response.clone().text();
    return isGuestResponseBody(body) ? response : null;
  },
};

/** A prefetch returns only the static shell, which cannot contain session data. */
const staticShellOnly: SerwistPlugin = {
  cacheWillUpdate: async ({ response }) =>
    response.status === 200 && response.type === "basic" ? response : null,
};

const publicPage = (request: Request, url: URL, sameOrigin: boolean) =>
  sameOrigin && request.method === "GET" && isCacheablePublicPath(url.pathname);

const matchOptions = { ignoreVary: true };

/** Network first, so a signed-in visitor is never handed the cached signed-out copy while online. */
const live = (cacheName: string, plugin: SerwistPlugin) =>
  new NetworkFirst({
    cacheName,
    networkTimeoutSeconds: 8,
    plugins: [plugin],
    matchOptions,
  });

const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ request, url, sameOrigin }) =>
      publicPage(request, url, sameOrigin) &&
      request.headers.get("RSC") === "1" &&
      request.headers.has("Next-Router-Prefetch"),
    handler: new StaleWhileRevalidate({
      cacheName: "pages-rsc-prefetch",
      plugins: [staticShellOnly],
      matchOptions,
    }),
  },
  {
    matcher: ({ request, url, sameOrigin }) =>
      publicPage(request, url, sameOrigin) &&
      request.headers.get("RSC") === "1",
    handler: live("pages-rsc", requireGuestBody),
  },
  {
    matcher: ({ request, url, sameOrigin }) =>
      publicPage(request, url, sameOrigin) && request.mode === "navigate",
    handler: live("pages", requireGuestBody),
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
  event.waitUntil(Promise.all(pageCaches.map((name) => caches.delete(name))));
});

serwist.addEventListeners();
