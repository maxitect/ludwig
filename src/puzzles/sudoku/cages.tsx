import { cn } from "@/utils/cn";
import type { Cage } from "./schema";

const SIZE = 9;
const INSET = 4;

/** Which sides of a cell lie on the outline of its cage. */
export type CageSides = {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
};

export type CageLookup = {
  /** The cage holding the cell, if any. */
  cageAt(row: number, col: number): number | undefined;
  /** The cage whose first cell in reading order is this one, if any. */
  anchoredAt(row: number, col: number): Cage | undefined;
  sidesOf(row: number, col: number): CageSides | undefined;
};

export function lookupCages(cages: ReadonlyArray<Cage> = []): CageLookup {
  const owner = new Map<number, number>();
  const anchors = new Map<number, Cage>();
  cages.forEach((cage, id) => {
    const cells = cage.cells
      .map(({ row, col }) => row * SIZE + col)
      .sort((a, b) => a - b);
    for (const index of cells) owner.set(index, id);
    anchors.set(cells[0], cage);
  });
  const cageAt = (row: number, col: number) =>
    row < 0 || col < 0 || row >= SIZE || col >= SIZE
      ? undefined
      : owner.get(row * SIZE + col);
  return {
    cageAt,
    anchoredAt: (row, col) => anchors.get(row * SIZE + col),
    sidesOf(row, col) {
      const here = cageAt(row, col);
      if (here === undefined) return undefined;
      return {
        top: cageAt(row - 1, col) !== here,
        right: cageAt(row, col + 1) !== here,
        bottom: cageAt(row + 1, col) !== here,
        left: cageAt(row, col - 1) !== here,
      };
    },
  };
}

/** The dashed outline of a cage, drawn a little inside the sides of the cell that lie on its edge. */
export function CageOutline({ sides }: { sides: CageSides }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute border-dashed border-ink",
        sides.top && "border-t-2",
        sides.right && "border-r-2",
        sides.bottom && "border-b-2",
        sides.left && "border-l-2",
      )}
      style={{
        top: sides.top ? INSET : 0,
        right: sides.right ? INSET : 0,
        bottom: sides.bottom ? INSET : 0,
        left: sides.left ? INSET : 0,
      }}
    />
  );
}
