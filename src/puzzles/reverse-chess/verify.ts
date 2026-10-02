import { toFen } from "./derive";
import {
  applyRetro,
  enumerateRetro,
  retroKey,
  toRetro,
  type Retro,
} from "./engine";
import type { Content } from "./schema";

function mismatch(label: string, authored: Retro, survivor: Retro) {
  return new Error(
    `${label}authored ply does not match unique survivor (authored ${retroKey(authored)}, survivor ${retroKey(survivor)})`,
  );
}

/** True when every ply of `chain` applies in order, starting from `position`. */
function chainApplies(position: string, chain: Retro[]) {
  let current = position;
  for (const retro of chain) {
    const result = applyRetro(current, retro);
    if (!result.ok) return false;
    current = result.prior;
  }
  return true;
}

function verifyLastMove(fen: string, authored: Retro) {
  const survivors = enumerateRetro(fen);
  if (survivors.length !== 1) {
    throw new Error(
      `expected exactly 1 surviving retro move, found ${survivors.length}`,
    );
  }
  if (retroKey(survivors[0]) !== retroKey(authored)) {
    throw mismatch("", authored, survivors[0]);
  }
}

/**
 * Step N passes when the authored ply is the only enumerated retro move after which the
 * remaining authored plies still apply in order. The free-text goal is not machine-checkable.
 */
function verifyUnwind(fen: string, chain: Retro[]) {
  let position = fen;
  chain.forEach((authored, index) => {
    const step = index + 1;
    const rest = chain.slice(index + 1);
    const consistent = enumerateRetro(position).filter((retro) => {
      const result = applyRetro(position, retro);
      return result.ok && chainApplies(result.prior, rest);
    });
    if (consistent.length !== 1) {
      throw new Error(
        `step ${step} has ${consistent.length} consistent retro moves, expected exactly 1`,
      );
    }
    if (retroKey(consistent[0]) !== retroKey(authored)) {
      throw mismatch(`step ${step} `, authored, consistent[0]);
    }
    const result = applyRetro(position, authored);
    if (!result.ok) {
      throw new Error(`step ${step} authored ply is invalid (${result.reason})`);
    }
    position = result.prior;
  });
}

/** Throws unless the puzzle's authored retro moves are its unique solution. */
export function verifyReverseChess(content: Content) {
  const fen = toFen({
    ...content,
    enPassantFile: content.enPassantFile ?? null,
  });
  const chain = content.solutionPlies.map(toRetro);
  if (content.mode === "unwind") return verifyUnwind(fen, chain);
  if (chain.length !== 1) {
    throw new Error("last_move puzzles need exactly 1 solution ply");
  }
  return verifyLastMove(fen, chain[0]);
}
