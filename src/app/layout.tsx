import type { Metadata } from "next";
import { themeInitScript } from "@/utils/theme";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ludwig.",
  description:
    "A fan-made puzzle site in the style of the BBC One drama Ludwig: reverse chess, gear puzzles, ciphers, crosswords and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        {children}
      </body>
    </html>
  );
}
