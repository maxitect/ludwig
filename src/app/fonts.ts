import {
  Barlow_Semi_Condensed,
  Dancing_Script,
  Jost,
  Josefin_Sans,
} from "next/font/google";
import localFont from "next/font/local";

const signature = Dancing_Script({
  subsets: ["latin"],
  weight: "700",
  preload: false,
  variable: "--font-dancing-script",
});

const display = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "600", "700"],
  display: "optional",
  variable: "--font-josefin",
});

const sans = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
});

const band = Barlow_Semi_Condensed({
  subsets: ["latin"],
  weight: "600",
  preload: false,
  variable: "--font-barlow",
});

const hand = localFont({
  src: "./fonts/caveat-brush-subset.woff2",
  weight: "400",
  preload: false,
  display: "block",
  variable: "--font-caveat",
});

const mono = localFont({
  src: "./fonts/jetbrains-mono-subset.woff2",
  weight: "100 800",
  preload: false,
  variable: "--font-jetbrains",
});

export const fontVariables = [
  signature,
  display,
  sans,
  band,
  hand,
  mono,
]
  .map((font) => font.variable)
  .join(" ");
