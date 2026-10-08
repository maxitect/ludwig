import type { MetadataRoute } from "next";
import { themeColors } from "@/config/theme-colors";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ludwig.",
    short_name: "Ludwig",
    description:
      "A fan-made puzzle site in the style of the BBC One drama Ludwig.",
    display: "standalone",
    start_url: "/",
    scope: "/",
    background_color: themeColors.paper,
    theme_color: themeColors.paper,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
