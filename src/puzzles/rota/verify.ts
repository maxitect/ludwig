import {
  applySwaps,
  instigatorCandidates,
  openingGambit,
  placementFor,
  samePlacement,
  solve,
  type Swap,
} from "./engine";
import type { ClueParams, Content, Payload } from "./schema";

const zoneKey = ({ file, rank }: { file: string; rank: number }) =>
  `${file}${rank}`;

const pairKey = ({ workerAId, workerBId }: Swap) =>
  [workerAId, workerBId].sort().join("|");

const mentions = (text: string, word: string) =>
  new RegExp(`(?<![\\w])${word}(?![\\w])`, "i").test(text);

/** Throws unless the content has exactly one shortest valid swap sequence, it is the authored one, and the instigator is decidable. */
export function verifyRota({
  brief,
  victimName,
  workers,
  clues,
  solution,
}: Content) {
  const names = new Set(workers.map(({ name }) => name));
  if (names.size !== workers.length) throw new Error("duplicate worker name");
  const known = (name: string) => {
    if (!names.has(name)) throw new Error(`unknown worker: ${name}`);
    return name;
  };

  known(victimName);
  for (const { speakerName } of clues) if (speakerName) known(speakerName);

  const payloadWorkers: Payload["workers"] = workers.map(
    ({ name, intended, final }) => ({
      id: name,
      name,
      squares: [
        { phase: "intended", ...intended },
        { phase: "final", ...final },
      ],
    }),
  );
  const intended = placementFor(payloadWorkers, "intended");
  const final = placementFor(payloadWorkers, "final");
  for (const [phase, placement] of [
    ["intended", intended],
    ["final", final],
  ] as const) {
    const zones = Object.values(placement).map(zoneKey);
    if (new Set(zones).size !== zones.length) {
      throw new Error(`two workers share a zone in the ${phase} rota`);
    }
  }
  const intendedZones = Object.values(intended).map(zoneKey).sort();
  const finalZones = Object.values(final).map(zoneKey).sort();
  if (intendedZones.join() !== finalZones.join()) {
    throw new Error("the intended and final rotas use different zones");
  }

  const victim = workers.find(({ name }) => name === victimName);
  if (victim) {
    for (const [role, square] of [
      ["hazard zone", victim.final],
      ["pinned zone", victim.intended],
    ] as const) {
      if (!mentions(brief.replaceAll("**", ""), zoneKey(square))) {
        throw new Error(`the brief does not name the ${role} ${zoneKey(square)}`);
      }
      if (!brief.includes(`**${zoneKey(square).toUpperCase()}**`)) {
        throw new Error(`the brief does not bold the ${role} ${zoneKey(square)}`);
      }
    }
  }

  for (const clue of clues) {
    if (
      clue.kind === "never_in_rank" &&
      !mentions(clue.displayText, String(clue.rank))
    ) {
      throw new Error(`a never_in_rank clue does not name row ${clue.rank}`);
    }
    if (
      clue.kind === "unpowered_square" &&
      !mentions(clue.displayText, zoneKey(clue))
    ) {
      throw new Error(
        `an unpowered_square clue does not name ${zoneKey(clue)}`,
      );
    }
  }
  if (!clues.some(({ speakerName }) => speakerName)) {
    throw new Error("no clue is spoken by a worker");
  }
  if (clues.every(({ speakerName }) => speakerName)) {
    throw new Error("every clue is spoken: add a site log or site rule");
  }

  const swaps: Swap[] = solution.swaps.map(({ a, b }) => ({
    workerAId: known(a),
    workerBId: known(b),
  }));
  if (!samePlacement(applySwaps(intended, swaps), final)) {
    throw new Error(
      "the authored swaps do not turn the intended rota into the final one",
    );
  }
  if (
    !openingGambit({
      swaps,
      instigatorWorkerId: known(solution.instigatorName),
    })
  ) {
    throw new Error("the instigator is not in the first swap");
  }

  const cap = Math.min(
    ...clues.map((clue) =>
      clue.kind === "max_swaps" ? clue.maxSwaps : Infinity,
    ),
  );
  if (cap >= swaps.length + 2) {
    throw new Error(
      `a max_swaps clue must cap the sequence below ${swaps.length + 2} swaps, so no longer sequence satisfies every clue`,
    );
  }

  const params = clues.map(
    ({ displayText, speakerName, ...clue }): ClueParams => {
      void displayText;
      void speakerName;
      if (clue.kind !== "never_in_rank" && clue.kind !== "not_instigator") {
        return clue;
      }
      const { workerName, ...rest } = clue;
      return { ...rest, workerId: known(workerName) };
    },
  );
  const candidates = instigatorCandidates(swaps, params);
  if (candidates.length !== 1) {
    throw new Error(
      `the not_instigator clues must clear exactly one of the first swap's workers, found ${candidates.length} candidates`,
    );
  }
  if (candidates[0] !== solution.instigatorName) {
    throw new Error("a not_instigator clue clears the stored instigator");
  }
  const found = solve(intended, final, params);
  if (found.length !== 1) {
    throw new Error(
      `expected exactly 1 shortest sequence, found ${found.length}`,
    );
  }
  const [only] = found;
  if (
    only.length !== swaps.length ||
    only.some((swap, index) => pairKey(swap) !== pairKey(swaps[index]))
  ) {
    throw new Error(
      "the authored sequence is not the unique shortest sequence",
    );
  }
}
