import { readFileSync } from "node:fs";

const css = readFileSync("src/app/globals.css", "utf8");

const TEXT_MIN = 4.5;
const LARGE_TEXT_MIN = 3;

function declarations(block: string): Map<string, string> {
  return new Map(
    [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
  );
}

function blockFor(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Selector not found: ${selector}`);
  return css.slice(start, css.indexOf("}", start));
}

const tokens = declarations(blockFor("@theme static"));

function resolve(value: string, theme: Map<string, string>): string {
  const ref = value.match(/^var\((--[\w-]+)\)$/);
  if (!ref) return value;
  const next = theme.get(ref[1]) ?? tokens.get(ref[1]);
  if (!next) throw new Error(`Unresolved ${value}`);
  return resolve(next, theme);
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const themes = {
  paper: declarations(blockFor(':root,\n:root[data-theme="paper"]')),
  ink: declarations(blockFor(':root[data-theme="ink"]')),
};

const semanticPairs = [
  ["--foreground", "--background"],
  ["--card-foreground", "--card"],
  ["--popover-foreground", "--popover"],
  ["--primary-foreground", "--primary"],
  ["--secondary-foreground", "--secondary"],
  ["--muted-foreground", "--muted"],
  ["--muted-foreground", "--background"],
  ["--accent-foreground", "--accent"],
  ["--destructive-foreground", "--destructive"],
] as const;

const tokenPairs: Record<keyof typeof themes, [string, string, number][]> = {
  paper: [
    ["--color-ludwig-red", "--color-paper", TEXT_MIN],
    ["--color-ink-soft", "--color-paper", TEXT_MIN],
    ["--color-crayon", "--color-paper", LARGE_TEXT_MIN],
  ],
  ink: [["--color-paper", "--color-shadow", TEXT_MIN]],
};

let failed = false;

for (const [name, theme] of Object.entries(themes) as [keyof typeof themes, Map<string, string>][]) {
  console.log(`\n${name.toUpperCase()}`);
  const pairs: [string, string, number][] = [
    ...semanticPairs.map(([fg, bg]): [string, string, number] => [fg, bg, TEXT_MIN]),
    ...tokenPairs[name],
  ];
  for (const [fg, bg, min] of pairs) {
    const fgHex = resolve(`var(${fg})`, theme);
    const bgHex = resolve(`var(${bg})`, theme);
    const value = ratio(fgHex, bgHex);
    const ok = value >= min;
    failed ||= !ok;
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${fg} ${fgHex} on ${bg} ${bgHex}  ${value.toFixed(2)}:1 (min ${min})`,
    );
  }
}

process.exit(failed ? 1 : 0);
