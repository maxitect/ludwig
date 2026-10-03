import { mulberry32 } from "../_shared/prng";
import type { Region, SceneNode } from "./schema";

export const SCENE_WIDTH = 400;
export const SCENE_HEIGHT = 300;

const REGION_PADDING = 3;
const MAX_LAYOUT_ATTEMPTS = 50;

/** Token names, lightest to darkest, so a swap can demand a visible step. */
const PALETTE = [
  "paper",
  "paper-shade",
  "shadow-soft",
  "ink-soft",
  "shadow",
] as const;
type Colour = (typeof PALETTE)[number];
type Token = Colour | "paper-deep";

type Kind =
  | "window"
  | "chimney"
  | "tree"
  | "lamp"
  | "flag"
  | "cloud"
  | "figure"
  | "hat"
  | "tie";

/** Kinds whose drawing differs from its mirror image. */
const ASYMMETRIC = new Set<Kind>([
  "window",
  "tree",
  "lamp",
  "flag",
  "cloud",
  "figure",
  "hat",
]);

type SceneObject = {
  kind: Kind;
  box: Region;
  colour: Colour;
  side: 1 | -1;
  parent?: number;
};

type Change =
  | { type: "remove" }
  | { type: "colour"; colour: Colour }
  | { type: "move"; dx: number; dy: number }
  | { type: "mirror" }
  | { type: "scale"; factor: number };

const round = (value: number) => Math.round(value * 100) / 100;

const INK = "var(--color-ink)";
const fill = (colour: Token) => `var(--color-${colour})`;

const node = (
  tag: SceneNode["tag"],
  attrs: SceneNode["attrs"],
  children?: SceneNode[],
): SceneNode => (children ? { tag, attrs, children } : { tag, attrs });

const outlined = (
  tag: SceneNode["tag"],
  attrs: SceneNode["attrs"],
  colour: Token,
) =>
  node(tag, {
    ...attrs,
    fill: fill(colour),
    stroke: INK,
    "stroke-width": 1.5,
    "stroke-linejoin": "round",
  });

const stroke = (x1: number, y1: number, x2: number, y2: number) =>
  node("line", {
    x1: round(x1),
    y1: round(y1),
    x2: round(x2),
    y2: round(y2),
    stroke: INK,
    "stroke-width": 1.5,
    "stroke-linecap": "round",
  });

const polygon = (points: [number, number][], colour: Token) =>
  outlined(
    "polygon",
    { points: points.map(([x, y]) => `${round(x)},${round(y)}`).join(" ") },
    colour,
  );

type Drawing = (box: Region, colour: Colour, side: 1 | -1) => SceneNode[];

const DRAWINGS: Record<Kind, Drawing> = {
  window: ({ x, y, width, height }, colour) => [
    outlined("rect", { x, y, width, height }, colour),
    stroke(x + width / 2, y, x + width / 2, y + height),
    stroke(x, y + height / 2, x + width, y + height / 2),
    polygon(
      [
        [x, y],
        [x + 9, y],
        [x, y + height * 0.65],
      ],
      "ink-soft",
    ),
  ],
  chimney: ({ x, y, width, height }, colour) => [
    outlined("rect", { x, y, width, height }, colour),
    stroke(x, y + 6, x + width, y + 6),
    stroke(x, y + 12, x + width, y + 12),
  ],
  tree: ({ x, y, width, height }, colour) => {
    const cx = x + width / 2;
    return [
      outlined(
        "rect",
        { x: cx - 4, y: y + height - 60, width: 8, height: 60 },
        "paper-deep",
      ),
      stroke(cx, y + height - 30, x + width - 1, y + height - 50),
      outlined("circle", { cx, cy: y + 26, r: 22 }, colour),
      outlined("circle", { cx: cx - 9, cy: y + 52, r: 13 }, colour),
      outlined("circle", { cx: cx + 9, cy: y + 54, r: 12 }, colour),
    ];
  },
  lamp: ({ x, y, width, height }, colour) => [
    stroke(x + 4, y + 8, x + 4, y + height),
    outlined("rect", { x, y: y + height - 6, width: 9, height: 6 }, "ink-soft"),
    stroke(x + 4, y + 8, x + width - 4, y + 4),
    polygon(
      [
        [x + width - 7, y + 3],
        [x + width, y + 3],
        [x + width - 1, y + 14],
        [x + width - 6, y + 14],
      ],
      colour,
    ),
  ],
  flag: ({ x, y, width, height }, colour) => [
    stroke(x + 1, y, x + 1, y + height),
    polygon(
      [
        [x + 1, y + 1],
        [x + width, y + 8],
        [x + 1, y + 15],
      ],
      colour,
    ),
  ],
  cloud: ({ x, y, width, height }, colour) => [
    outlined("circle", { cx: x + 12, cy: y + height - 8, r: 8 }, colour),
    outlined("circle", { cx: x + 26, cy: y + 11, r: 11 }, colour),
    outlined("circle", { cx: x + width - 11, cy: y + height - 7, r: 7 }, colour),
  ],
  figure: ({ x, y, width, height }, colour, side) => {
    const cx = x + width / 2;
    const waist = y + height * 0.62;
    return [
      stroke(cx - 4, waist, cx - 4, y + height),
      stroke(cx + 4, waist, cx + 4, y + height),
      outlined(
        "rect",
        { x: side > 0 ? cx + 9 : cx - 17, y: waist - 8, width: 8, height: 9 },
        "paper-shade",
      ),
      polygon(
        [
          [cx - 9, y + 26],
          [cx + 9, y + 26],
          [cx + 11, waist],
          [cx - 11, waist],
        ],
        colour,
      ),
      stroke(cx - side * 9, y + 28, cx - side * 11, waist - 6),
      stroke(cx + side * 9, y + 28, cx + side * 13, waist - 4),
      outlined("circle", { cx, cy: y + 17, r: 7 }, "paper"),
    ];
  },
  hat: ({ x, y, width, height }, colour) => [
    polygon(
      [
        [x + 4, y + height],
        [x + 5, y + 3],
        [x + width - 5, y + 3],
        [x + width - 4, y + height],
      ],
      colour,
    ),
    stroke(x, y + height, x + width, y + height),
    stroke(x + width - 5, y + height - 2, x + width, y + 1),
  ],
  tie: ({ x, y, width, height }, colour) => [
    polygon(
      [
        [x + width * 0.2, y],
        [x + width * 0.8, y],
        [x + width, y + height * 0.75],
        [x + width / 2, y + height],
        [x, y + height * 0.75],
      ],
      colour,
    ),
  ],
};

const frameOf = ({ x, y, width, height }: Region) => ({
  cx: x + width / 2,
  bottom: y + height,
});

function transformOf(change: Change, box: Region) {
  const { cx, bottom } = frameOf(box);
  switch (change.type) {
    case "move":
      return `translate(${round(change.dx)} ${round(change.dy)})`;
    case "mirror":
      return `translate(${round(2 * cx)} 0) scale(-1 1)`;
    case "scale":
      return `translate(${round(cx)} ${round(bottom)}) scale(${change.factor}) translate(${round(-cx)} ${round(-bottom)})`;
    default:
      return null;
  }
}

function changedBox(change: Change, box: Region): Region {
  const { cx, bottom } = frameOf(box);
  switch (change.type) {
    case "move":
      return { ...box, x: box.x + change.dx, y: box.y + change.dy };
    case "scale":
      return {
        x: cx + (box.x - cx) * change.factor,
        y: bottom + (box.y - bottom) * change.factor,
        width: box.width * change.factor,
        height: box.height * change.factor,
      };
    default:
      return box;
  }
}

export const inCanvas = ({ x, y, width, height }: Region) =>
  x >= 0 && y >= 0 && x + width <= SCENE_WIDTH && y + height <= SCENE_HEIGHT;

export const overlaps = (a: Region, b: Region) =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

function regionOf(box: Region, change: Change): Region {
  const after = changedBox(change, box);
  const x1 = Math.max(0, Math.min(box.x, after.x) - REGION_PADDING);
  const y1 = Math.max(0, Math.min(box.y, after.y) - REGION_PADDING);
  const x2 = Math.min(
    SCENE_WIDTH,
    Math.max(box.x + box.width, after.x + after.width) + REGION_PADDING,
  );
  const y2 = Math.min(
    SCENE_HEIGHT,
    Math.max(box.y + box.height, after.y + after.height) + REGION_PADDING,
  );
  return {
    x: round(x1),
    y: round(y1),
    width: round(x2 - x1),
    height: round(y2 - y1),
  };
}

type Rng = () => number;

const pick = <T>(rng: Rng, items: readonly T[]) =>
  items[Math.floor(rng() * items.length)];

const int = (rng: Rng, min: number, max: number) =>
  min + Math.floor(rng() * (max - min + 1));

const shuffled = <T>(rng: Rng, items: readonly T[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/** Primitive density grows with the difference count, so harder puzzles are busier. */
function layout(rng: Rng, differenceCount: number) {
  const objects: SceneObject[] = [];
  const add = (
    kind: Kind,
    x: number,
    y: number,
    width: number,
    height: number,
    parent?: number,
  ) => {
    objects.push({
      kind,
      box: { x: round(x), y: round(y), width, height },
      colour: pick(rng, PALETTE),
      side: rng() < 0.5 ? 1 : -1,
      parent,
    });
    return objects.length - 1;
  };

  const columns = Math.min(5, 3 + Math.floor(differenceCount / 5));
  const gap = (240 - columns * 26) / (columns + 1);
  for (const y of [82, 132]) {
    for (let column = 0; column < columns; column++) {
      add("window", 80 + gap * (column + 1) + 26 * column, y, 26, 34);
    }
  }
  add("chimney", 120, 22, 14, 22);
  add("chimney", 266, 22, 14, 22);
  add("flag", 198, 6, 24, 32);
  add("cloud", 14, 8, 50, 22);
  add("cloud", 336, 14, 50, 22);
  add("tree", 6, 120, 46, 130);
  add("tree", 342, 120, 46, 130);
  add("lamp", 62, 150, 14, 100);

  const figures = 3 + Math.floor(differenceCount / 4);
  const slot = (330 - 96) / figures;
  for (let i = 0; i < figures; i++) {
    const height = int(rng, 72, 82);
    const x = 96 + slot * i + (slot - 36) * rng();
    const feet = int(rng, 262, 278);
    const figure = add("figure", x, feet - height, 36, height);
    if (i === 0 || rng() < 0.6) add("hat", x + 8, feet - height, 20, 10, figure);
    if (i === 0 || rng() < 0.7) add("tie", x + 15, feet - height + 27, 6, 16, figure);
  }
  return objects;
}

function proposeChange(rng: Rng, object: SceneObject): Change | null {
  const types = shuffled<Change["type"]>(rng, [
    "remove",
    "colour",
    "move",
    "scale",
    ...(ASYMMETRIC.has(object.kind) ? (["mirror"] as const) : []),
  ]);
  for (const type of types) {
    if (type === "remove") return { type };
    if (type === "mirror") return { type };
    if (type === "colour") {
      const index = PALETTE.indexOf(object.colour);
      const options = PALETTE.filter((_, i) => Math.abs(i - index) >= 2);
      return { type, colour: pick(rng, options) };
    }
    if (type === "scale") {
      const factor = pick(rng, [1.3, 0.7]);
      const change: Change = { type, factor };
      if (inCanvas(changedBox(change, object.box))) return change;
      return { type, factor: 0.7 };
    }
    const distance = int(rng, 10, 16);
    for (const [dx, dy] of shuffled(rng, [
      [distance, 0],
      [-distance, 0],
      [0, distance],
      [0, -distance],
    ])) {
      const change: Change = { type, dx, dy };
      if (inCanvas(changedBox(change, object.box))) return change;
    }
  }
  return null;
}

function chooseChanges(rng: Rng, objects: SceneObject[], count: number) {
  for (let attempt = 0; attempt < MAX_LAYOUT_ATTEMPTS; attempt++) {
    const chosen: { object: number; change: Change; region: Region }[] = [];
    for (const object of shuffled(rng, objects.map((_, i) => i))) {
      if (chosen.length === count) break;
      const change = proposeChange(rng, objects[object]);
      if (!change) continue;
      const region = regionOf(objects[object].box, change);
      if (chosen.some((other) => overlaps(other.region, region))) continue;
      chosen.push({ object, change, region });
    }
    if (chosen.length === count) return chosen;
  }
  throw new Error(`Could not place ${count} separate differences`);
}

function drawObject(
  object: SceneObject,
  change: Change | undefined,
  frame: Region,
): SceneNode | null {
  if (change?.type === "remove") return null;
  const colour = change?.type === "colour" ? change.colour : object.colour;
  const transform = change ? transformOf(change, frame) : null;
  return node(
    "g",
    transform ? { transform } : {},
    DRAWINGS[object.kind](object.box, colour, object.side),
  );
}

function backdrop(rng: Rng): SceneNode[] {
  const grass: SceneNode[] = [];
  for (let i = 0; i < 40; i++) {
    const x = int(rng, 4, SCENE_WIDTH - 10);
    const y = int(rng, 254, SCENE_HEIGHT - 6);
    grass.push(stroke(x, y, x + 3, y - 5));
  }
  return [
    node("rect", {
      x: 0,
      y: 0,
      width: SCENE_WIDTH,
      height: SCENE_HEIGHT,
      fill: fill("paper"),
    }),
    outlinedHouse(),
    stroke(0, 250, SCENE_WIDTH, 250),
    ...grass,
  ];
}

const outlinedHouse = () =>
  node("g", {}, [
    outlined("rect", { x: 80, y: 70, width: 240, height: 146 }, "paper-shade"),
    polygon(
      [
        [70, 70],
        [110, 38],
        [290, 38],
        [330, 70],
      ],
      "ink-soft",
    ),
  ]);

function generateV1(sceneSeed: number, differenceCount: number) {
  const rng = mulberry32(sceneSeed);
  const base = backdrop(rng);
  const objects = layout(rng, differenceCount);
  const chosen = chooseChanges(rng, objects, differenceCount);
  const changes = new Map(chosen.map(({ object, change }) => [object, change]));

  const render = (altered: boolean) =>
    objects.flatMap((object, index) => {
      const own = altered ? changes.get(index) : undefined;
      const inherited =
        object.parent === undefined
          ? undefined
          : (() => {
              const change = altered ? changes.get(object.parent) : undefined;
              return change && change.type !== "colour" ? change : undefined;
            })();
      const drawn = drawObject(
        object,
        own ?? inherited,
        own || object.parent === undefined
          ? object.box
          : objects[object.parent].box,
      );
      return drawn ? [drawn] : [];
    });

  return {
    original: node("g", {}, [...base, ...render(false)]),
    altered: node("g", {}, [...base, ...render(true)]),
    differences: chosen.map(({ change, region }, index) => ({
      index,
      type: change.type,
      region,
    })),
  };
}

/** Each version pins one derivation. Never edit an entry: add a new version instead. */
export const engines: Readonly<Record<number, typeof generateV1>> = {
  1: generateV1,
};

export function generateScene(
  sceneSeed: number,
  differenceCount: number,
  generatorVersion: number,
) {
  const engine = Object.hasOwn(engines, generatorVersion)
    ? engines[generatorVersion]
    : undefined;
  if (!engine) throw new Error(`Unknown generator version: ${generatorVersion}`);
  return engine(sceneSeed, differenceCount);
}

export const regionCentre = ({ x, y, width, height }: Region) => ({
  x: x + width / 2,
  y: y + height / 2,
});

export const regionContains = (
  { x, y, width, height }: Region,
  point: { x: number; y: number },
) =>
  point.x >= x &&
  point.x <= x + width &&
  point.y >= y &&
  point.y <= y + height;

/** The difference a tap lands in, or null. Regions never overlap, so there is at most one. */
export function findDifferenceAt(
  differences: ReturnType<typeof generateScene>["differences"],
  point: { x: number; y: number },
) {
  return differences.find(({ region }) => regionContains(region, point)) ?? null;
}
