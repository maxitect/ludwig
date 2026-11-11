import { Color } from "three";

const TOKENS = {
  mat: "--muted",
  edge: "--border",
  sheet: "--color-paper",
  sheetShade: "--color-paper-shade",
  line: "--color-ink",
  red: "--color-ludwig-red",
  book: "--color-book-blue",
  cast: "--cast",
} as const;

export type Palette = Record<keyof typeof TOKENS, Color> & {
  castOpacity: number;
};

/**
 * Resolves the brand tokens to three.js colours at call time, so Paper and Ink both work.
 * A 2D canvas turns any computed CSS colour (including `color-mix`) into plain RGBA.
 */
export function readPalette(): Palette {
  const probe = document.createElement("span");
  document.body.append(probe);
  const context = document.createElement("canvas").getContext("2d", {
    willReadFrequently: true,
  });
  const resolve = (token: string) => {
    probe.style.color = `var(${token})`;
    if (!context) return [0, 0, 0, 255] as const;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = getComputedStyle(probe).color;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a] as const;
  };
  const colours = Object.fromEntries(
    Object.entries(TOKENS).map(([name, token]) => {
      const [r, g, b, a] = resolve(token);
      return [name, { colour: new Color().setRGB(r / 255, g / 255, b / 255, "srgb"), a }];
    }),
  );
  probe.remove();

  const pick = (name: keyof typeof TOKENS) => colours[name].colour;
  return {
    mat: pick("mat"),
    edge: pick("edge"),
    sheet: pick("sheet"),
    sheetShade: pick("sheetShade"),
    line: pick("line"),
    red: pick("red"),
    book: pick("book"),
    cast: pick("cast"),
    castOpacity: colours.cast.a / 255,
  };
}
