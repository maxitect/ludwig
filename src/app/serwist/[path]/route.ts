import { randomUUID } from "node:crypto";
import { createSerwistRoute } from "@serwist/turbopack";
import { withoutThreeChunks } from "@/utils/precache";

const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/offline", revision }],
    swSrc: "src/app/sw.ts",
    globPatterns: [
      ".next/static/**/*.{js,css,woff2,json}",
      "public/{glyphs,icons,textures}/**/*.{png,svg,webp,jpg,ico}",
    ],
    manifestTransforms: [(entries) => withoutThreeChunks(entries)],
    useNativeEsbuild: true,
  });
