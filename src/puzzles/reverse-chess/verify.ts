import { satisfiesGoal, toFen } from "./derive";
import {
  applyRetro,
  enumerateRetro,
  retroKey,
  toRetro,
  type Retro,
} from "./engine";
import type { Content, Goal } from "./schema";

const MAX_REPORTED_CHAINS = 2;

function mismatch(
  label: "ply" | "chain",
  authored: Retro[],
  survivor: Retro[],
) {
  const keys = (chain: Retro[]) => chain.map(retroKey).join(" ");
  return new Error(
    `authored ${label} does not match unique survivor (authored ${keys(authored)}, survivor ${keys(survivor)})`,
  );
}

function verifyLastMove(fen: string, authored: Retro) {
  const survivors = enumerateRetro(fen);
  if (survivors.length !== 1) {
    throw new Error(
      `expected exactly 1 surviving retro move, found ${survivors.length}`,
    );
  }
  if (retroKey(survivors[0]) !== retroKey(authored)) {
    throw mismatch("ply", [authored], [survivors[0]]);
  }
}

/** Every chain of `length` retro moves from `fen` whose last prior position meets `goal`, stopping after `limit`. */
function goalChains(fen: string, length: number, goal: Goal, limit: number) {
  const found: Retro[][] = [];
  const walk = (position: string, chain: Retro[]) => {
    if (chain.length === length) {
      if (satisfiesGoal(position, goal)) found.push(chain);
      return;
    }
    for (const retro of enumerateRetro(position)) {
      if (found.length >= limit) return;
      const result = applyRetro(position, retro);
      if (result.ok) walk(result.prior, [...chain, retro]);
    }
  };
  walk(fen, []);
  return found;
}

/** Exactly one chain of the authored length may reach the goal, and it must be the authored one. */
function verifyUnwind(fen: string, chain: Retro[], goal: Goal) {
  const chains = goalChains(fen, chain.length, goal, MAX_REPORTED_CHAINS);
  if (chains.length !== 1) {
    const count = chains.length ? `at least ${chains.length}` : "0";
    throw new Error(
      `expected exactly 1 chain of ${chain.length} retro moves reaching the goal, found ${count}`,
    );
  }
  const survivor = chains[0];
  if (survivor.map(retroKey).join() !== chain.map(retroKey).join()) {
    throw mismatch("chain", chain, survivor);
  }
}

/** Throws unless the puzzle's authored retro moves are its unique solution. */
export function verifyReverseChess(content: Content) {
  const fen = toFen({
    ...content,
    enPassantFile: content.enPassantFile ?? null,
  });
  const chain = content.solutionPlies.map(toRetro);
  if (content.mode === "unwind") {
    if (!content.goal) throw new Error("unwind puzzles need a goal");
    return verifyUnwind(fen, chain, content.goal);
  }
  if (chain.length !== 1) {
    throw new Error("last_move puzzles need exactly 1 solution ply");
  }
  return verifyLastMove(fen, chain[0]);
}
