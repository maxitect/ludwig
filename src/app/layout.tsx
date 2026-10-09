import type { Metadata, Viewport } from "next";
import { InitScript } from "@/components/shell/init-script";
import { themeColors } from "@/config/theme-colors";
import { reduceMotionInitScript } from "@/utils/reduce-motion";
import { themeInitScript } from "@/utils/theme";
import { fontVariables } from "./fonts";
import "./globals.css";

const splashImages = [
  [440, 956, 3],
  [402, 874, 3],
  [430, 932, 3],
  [393, 852, 3],
  [428, 926, 3],
  [390, 844, 3],
  [375, 812, 3],
  [414, 896, 3],
  [414, 896, 2],
  [414, 736, 3],
  [375, 667, 2],
].flatMap(([width, height, ratio]) =>
  (["paper", "ink"] as const).map((scheme) => ({
    url: `/splash/${scheme}-${width}x${height}@${ratio}.jpg`,
    media: `(prefers-color-scheme: ${scheme === "ink" ? "dark" : "light"}) and (device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`,
  })),
);

export const metadata: Metadata = {
  title: "Ludwig.",
  description:
    "A fan-made puzzle site in the style of the BBC One drama Ludwig: reverse chess, gear puzzles, ciphers, crosswords and more.",
  appleWebApp: { capable: true, title: "Ludwig.", startupImage: splashImages },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: themeColors.paper },
    { media: "(prefers-color-scheme: dark)", color: themeColors.ink },
  ],
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={fontVariables} suppressHydrationWarning>
      <head>
        <InitScript html={themeInitScript} />
        <InitScript html={reduceMotionInitScript} />
      </head>
      <body className="group/body flex min-h-dvh flex-col">
        {children}
      </body>
    </html>
  );
}
