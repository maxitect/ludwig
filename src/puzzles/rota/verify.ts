import {
  applySwaps,
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

/** Throws unless the content has exactly one shortest valid swap sequence and it is the authored one. */
export function verifyRota({ workers, clues, solution }: Content) {
  const names = new Set(workers.map(({ name }) => name));
  if (names.size !== workers.length) throw new Error("duplicate worker name");
  const known = (name: string) => {
    if (!names.has(name)) throw new Error(`unknown worker: ${name}`);
    return name;
  };

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

  const params = clues.map(({ displayText, ...clue }): ClueParams => {
    void displayText;
    if (clue.kind !== "never_in_rank") return clue;
    const { workerName, ...rest } = clue;
    return { ...rest, workerId: known(workerName) };
  });
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
