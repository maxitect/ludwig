import {
  isStartingPlacement,
  reproducesFromStart,
  satisfiesGoal,
  toFen,
} from "./derive";
import {
  enumerateRetro,
  enumerateRetroSteps,
  retroKey,
  toRetro,
  unwindChain,
  type Retro,
} from "./engine";
import { minRetroMoves } from "./goal-bound";
import { proofGames } from "./proof-search";
import type { Content, PositionGoal } from "./schema";

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

const positionKey = (fen: string) => fen.split(" ").slice(0, 4).join(" ");

/**
 * Every chain of `length` retro moves from `fen` whose last prior position meets `goal`, stopping after `limit`.
 * Exact: a branch is dropped only when `minRetroMoves` proves the goal out of reach in the moves left,
 * or when the same position was already searched to the same depth and held no chain.
 */
export function goalChains(
  fen: string,
  length: number,
  goal: PositionGoal,
  limit: number,
) {
  const found: Retro[][] = [];
  const barren = new Set<string>();

  const viable = (prior: string, left: number) =>
    left === 0
      ? satisfiesGoal(prior, goal)
      : !barren.has(`${positionKey(prior)}|${left}`) &&
        minRetroMoves(prior, goal) <= left;

  const walk = (position: string, chain: Retro[], left: number) => {
    let reached = false;
    for (const step of enumerateRetroSteps(position, (prior) =>
      viable(prior, left - 1),
    )) {
      if (found.length >= limit) return true;
      const next = [...chain, step.retro];
      if (left === 1) {
        found.push(next);
        reached = true;
      } else if (walk(step.prior, next, left - 1)) {
        reached = true;
      }
    }
    if (!reached) barren.add(`${positionKey(position)}|${left}`);
    return reached;
  };

  if (minRetroMoves(fen, goal) <= length) walk(fen, [], length);
  return found;
}

/** Exactly one chain of the authored length may reach the goal, and it must be the authored one. */
function verifyUnwind(fen: string, chain: Retro[], goal: PositionGoal) {
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

/** Plies from the starting position to a position, which is all that its move number and side to move say. */
const plyCountOf = ({ fullmove, sideToMove }: Content) =>
  2 * (fullmove - 1) + (sideToMove === "black" ? 1 : 0);

const gameKey = (game: { from: string; to: string; promotion?: string }[]) =>
  game
    .map(({ from, to, promotion }) => `${from}${to}${promotion ?? ""}`)
    .join(" ");

/**
 * Exactly one game from the standard start may reach the position in the authored number of plies, and it must be the authored one.
 * Searching forward from the start finds it where a backward search from a middle game would not finish.
 */
function verifyProofGame(content: Content, fen: string, chain: Retro[]) {
  const plies = plyCountOf(content);
  if (chain.length !== plies) {
    throw new Error(
      `a proof game needs ${plies} plies (2 * (fullmove - 1), plus 1 when Black is to move), found ${chain.length}`,
    );
  }
  const unwound = unwindChain(fen, chain);
  if (!unwound.ok) {
    throw new Error(
      `authored ply ${unwound.index + 1} cannot be taken back (${unwound.reason})`,
    );
  }
  if (
    !isStartingPlacement(unwound.last) ||
    !reproducesFromStart(unwound.forward, fen)
  ) {
    throw new Error(
      "authored chain, read forward from the starting position, does not reproduce the position",
    );
  }
  const games = proofGames(fen, plies, MAX_REPORTED_CHAINS);
  if (games.length !== 1) {
    const count = games.length ? `at least ${games.length}` : "0";
    throw new Error(
      `expected exactly 1 game of ${plies} plies from the starting position, found ${count}`,
    );
  }
  if (gameKey(games[0]) !== gameKey(unwound.forward)) {
    throw new Error(
      `authored chain does not match the unique game (authored ${gameKey(unwound.forward)}, found ${gameKey(games[0])})`,
    );
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
    return content.goal.kind === "initial_position"
      ? verifyProofGame(content, fen, chain)
      : verifyUnwind(fen, chain, content.goal);
  }
  if (chain.length !== 1) {
    throw new Error("last_move puzzles need exactly 1 solution ply");
  }
  return verifyLastMove(fen, chain[0]);
}
