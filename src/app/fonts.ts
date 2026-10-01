import {
  Barlow_Semi_Condensed,
  Caveat_Brush,
  Jost,
  JetBrains_Mono,
  Josefin_Sans,
  Yesteryear,
} from "next/font/google";

const signature = Yesteryear({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-yesteryear",
});

const display = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "600", "700"],
  variable: "--font-josefin",
});

const sans = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
});

const band = Barlow_Semi_Condensed({
  subsets: ["latin"],
  weight: "600",
  variable: "--font-barlow",
});

const hand = Caveat_Brush({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-caveat",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
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
