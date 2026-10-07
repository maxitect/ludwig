import {
  type Board,
  collisions,
  meshes,
  type Placement,
  pegKey,
  reachableFrom,
  trainOf,
  validate,
} from "./engine";
import type { Cog } from "./schema";

type Peg = Pick<Cog, "row" | "col">;

/** A peg as a spreadsheet cell: column letter, then the 1-based row. */
export const pegName = ({ row, col }: Peg) =>
  `${String.fromCharCode(65 + col)}${row + 1}`;

const toothName = ({ teeth }: Pick<Cog, "teeth">) => `${teeth}-tooth`;

const list = (names: string[]) =>
  names.length < 2
    ? names.join("")
    : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

/** Why `next` may not join the board (rules 1 to 3 of SPEC 5.2.5), or null when it may. */
export function refusal(
  board: Board,
  placed: Placement,
  next: Cog,
): string | null {
  const at = pegName(next);
  const occupied = [board.driver, board.target, ...placed].some(
    (cog) => pegKey(cog) === pegKey(next),
  );
  if (occupied) return `Peg ${at} already has a cog.`;
  if (board.bolts.some((bolt) => pegKey(bolt) === pegKey(next))) {
    return `Peg ${at} has a bolt.`;
  }
  const used = placed.filter(({ teeth }) => teeth === next.teeth).length;
  const stocked =
    board.inventory.find(({ teeth }) => teeth === next.teeth)?.count ?? 0;
  if (used >= stocked) {
    return `No ${toothName(next)} cogs are left in the tray.`;
  }
  const hit = collisions(board, [...placed, next]).find((collision) =>
    collision.kind === "cog"
      ? collision.a === next || collision.b === next
      : collision.cog === next,
  );
  if (!hit) return null;
  const subject = `A ${toothName(next)} cog at ${at}`;
  if (hit.kind === "board") return `${subject} would hang off the board.`;
  if (hit.kind === "bolt") {
    return `${subject} would sit on the bolt at ${pegName(hit.bolt)}.`;
  }
  const other = hit.a === next ? hit.b : hit.a;
  return `${subject} would overlap the cog at ${pegName(other)}.`;
}

/** The cogs on an odd cycle of the mesh graph: the ones that jam the train. */
export function jamCogs(board: Board, placement: Placement): Cog[] {
  const cogs = [board.driver, board.target, ...placement];
  const reached = [...reachableFrom(board.driver, cogs).values()];
  const parent = new Map<string, Cog | null>([[pegKey(board.driver), null]]);
  const depth = new Map([[pegKey(board.driver), 0]]);
  const queue = [board.driver];
  for (const current of queue) {
    for (const other of reached) {
      if (!parent.has(pegKey(other)) && meshes(current, other)) {
        parent.set(pegKey(other), current);
        depth.set(pegKey(other), depth.get(pegKey(current))! + 1);
        queue.push(other);
      }
    }
  }
  const marked = new Map<string, Cog>();
  const climb = (from: Cog, to: Cog) => {
    let a = from;
    let b = to;
    while (pegKey(a) !== pegKey(b)) {
      const deeper = depth.get(pegKey(a))! >= depth.get(pegKey(b))!;
      marked.set(pegKey(deeper ? a : b), deeper ? a : b);
      if (deeper) a = parent.get(pegKey(a))!;
      else b = parent.get(pegKey(b))!;
    }
    marked.set(pegKey(a), a);
  };
  for (const a of reached) {
    for (const b of reached) {
      const sameSide =
        depth.get(pegKey(a))! % 2 === depth.get(pegKey(b))! % 2;
      if (pegKey(a) < pegKey(b) && meshes(a, b) && sameSide) climb(a, b);
    }
  }
  return [...marked.values()];
}

/** Placed cogs whose removal leaves the target still reached: rule 7 names them. */
export function unneededCogs(board: Board, placement: Placement): Cog[] {
  const cogs = [board.driver, board.target, ...placement];
  const target = pegKey(board.target);
  if (!reachableFrom(board.driver, cogs).has(target)) return [];
  return placement.filter((removed) =>
    reachableFrom(
      board.driver,
      cogs.filter((cog) => cog !== removed),
    ).has(target),
  );
}

const turning = (clockwise: boolean) =>
  clockwise ? "clockwise" : "anticlockwise";

/** The status line under the board, built from the live train. */
export function statusLine(board: Board, placement: Placement): string {
  const train = trainOf(board, placement);
  const sign = train.signs[pegKey(board.target)];
  const need = turning(board.targetClockwise);
  const sentences: string[] = [];
  if (train.jammed) {
    sentences.push("The train is jammed, so nothing turns.");
  } else if (sign === undefined) {
    sentences.push(
      `The driver doesn't reach the target yet. The target must turn ${need}.`,
    );
  } else if ((sign === 1) === board.targetClockwise) {
    sentences.push(`The target turns ${need}.`);
  } else {
    sentences.push(
      `The target turns ${turning(sign === 1)}, but it must turn ${need}.`,
    );
  }
  const spare = train.jammed
    ? []
    : unneededCogs(board, placement).map(pegName);
  if (spare.length === 1) sentences.push(`Cog at ${spare[0]} isn't needed.`);
  if (spare.length > 1) sentences.push(`Cogs at ${list(spare)} aren't needed.`);
  if (
    !train.jammed &&
    !spare.length &&
    validate(board, placement).ok
  ) {
    sentences.push("Every cog is needed. Press Check.");
  }
  return sentences.join(" ");
}
