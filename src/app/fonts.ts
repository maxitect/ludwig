import {
  Barlow_Semi_Condensed,
  Caveat_Brush,
  Dancing_Script,
  Jost,
  JetBrains_Mono,
  Josefin_Sans,
} from "next/font/google";

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

const hand = Caveat_Brush({
  subsets: ["latin"],
  weight: "400",
  preload: false,
  variable: "--font-caveat",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
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
