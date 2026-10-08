import type { Metadata, Viewport } from "next";
import { InitScript } from "@/components/shell/init-script";
import { themeColors } from "@/config/theme-colors";
import { reduceMotionInitScript } from "@/utils/reduce-motion";
import { themeInitScript } from "@/utils/theme";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ludwig.",
  description:
    "A fan-made puzzle site in the style of the BBC One drama Ludwig: reverse chess, gear puzzles, ciphers, crosswords and more.",
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
