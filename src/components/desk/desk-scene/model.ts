import type { DeskCharts } from "@/lib/data/desk-charts";

export const MAX_SHEETS = 14;
export const SHEET = { width: 1.5, depth: 1.1, thickness: 0.07 } as const;
export const MAT = { width: 8.6, depth: 5.2, thickness: 0.12 } as const;

const MARKERS = {
  flagship: "toppled pawns",
  cipher: "a closed notebook",
  logic: "a die",
  numbers: "a red pencil",
  spatial: "a wedge block",
  word: "two letter tiles",
} as const;

export type MarkerKey = keyof typeof MARKERS;
const isMarker = (key: string): key is MarkerKey => key in MARKERS;

const COLUMNS = [-2.5, 0, 2.5];
const ROWS = [-1.3, 1.3];

export type Stack = {
  key: string;
  name: string;
  solved: number;
  sheets: number;
  marker: MarkerKey | null;
  x: number;
  z: number;
};

type CategoryCount = Pick<
  DeskCharts["categories"][number],
  "key" | "name" | "solved"
>;

/** One stack per category, a sheet per solve (at least one, so an empty desk still has a desk). */
export function deskStacks(categories: CategoryCount[]): Stack[] {
  return categories.map(({ key, name, solved }, index) => ({
    key,
    name,
    solved,
    sheets: Math.min(Math.max(solved, 1), MAX_SHEETS),
    marker: isMarker(key) ? key : null,
    x: COLUMNS[index % COLUMNS.length],
    z: ROWS[Math.floor(index / COLUMNS.length) % ROWS.length],
  }));
}

/** A small deterministic wobble per sheet, so the SVG and the scene agree and server output is stable. */
export function sheetJitter(stackIndex: number, sheetIndex: number) {
  const seed =
    Math.sin((stackIndex + 1) * 12.9898 + (sheetIndex + 1) * 78.233) *
    43758.5453;
  const unit = seed - Math.floor(seed);
  return {
    yaw: (unit - 0.5) * 0.22,
    dx: ((unit * 7) % 1) * 0.12 - 0.06,
    dz: ((unit * 13) % 1) * 0.12 - 0.06,
  };
}

export const stackTop = (stack: Stack) => stack.sheets * SHEET.thickness;

export function describeDesk(stacks: Stack[]) {
  return stacks.map(({ name, solved, sheets, marker }) => {
    const marked = marker ? `, topped with ${MARKERS[marker]}` : "";
    return `${name}: ${solved} solved, a stack of ${sheets} ${sheets === 1 ? "sheet" : "sheets"}${marked}.`;
  });
}

/** The empty composition, for the no-JavaScript fallback while the signed-in Desk is still streaming. */
export const emptyDeskStacks = () =>
  deskStacks(Object.keys(MARKERS).map((key) => ({ key, name: key, solved: 0 })));

export const HERO_HEIGHT = "h-[clamp(14rem,32vw,21rem)]";
