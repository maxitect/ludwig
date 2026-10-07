import { describe, expect, it } from "vitest";
import { content as buildingSite } from "../../../content/rota/the-building-site";
import { content as canteenQueue } from "../../../content/rota/canteen-queue";
import { content as nightShift } from "../../../content/rota/night-shift";
import { content as scaffoldRow } from "../../../content/rota/scaffold-row";
import { content as longShift } from "../../../content/rota/the-long-shift";
import type { Content } from "./schema";
import { verifyRota } from "./verify";

const puzzles = {
  "the-building-site": buildingSite,
  "canteen-queue": canteenQueue,
  "night-shift": nightShift,
  "scaffold-row": scaffoldRow,
  "the-long-shift": longShift,
} satisfies Record<string, Content>;

describe("verifyRota", () => {
  it.each(Object.entries(puzzles))("accepts %s", (_slug, content) => {
    expect(() => verifyRota(content)).not.toThrow();
  });

  it.each(Object.entries(puzzles))(
    "rejects %s with a clue removed that it needs",
    (_slug, content) => {
      const failing = content.clues.filter((clue, index) => {
        if (clue.kind === "max_swaps") return false;
        const clues = content.clues.filter((_, other) => other !== index);
        try {
          verifyRota({ ...content, clues });
          return false;
        } catch (error) {
          return /shortest sequence/.test(String(error));
        }
      });
      expect(failing.length).toBeGreaterThan(0);
    },
  );

  it("rejects an authored sequence that is not the solution", () => {
    const swaps = [...buildingSite.solution.swaps].reverse();
    expect(() =>
      verifyRota({
        ...buildingSite,
        solution: { ...buildingSite.solution, swaps },
      }),
    ).toThrow();
  });

  it("rejects an instigator outside the first swap", () => {
    expect(() =>
      verifyRota({
        ...buildingSite,
        solution: { ...buildingSite.solution, instigatorName: "Bridget" },
      }),
    ).toThrow(/instigator/);
  });

  it("rejects a cap that would let a longer sequence satisfy every clue", () => {
    const loosen = (maxSwaps?: number): Content => ({
      ...buildingSite,
      clues: buildingSite.clues.flatMap((clue): Content["clues"] =>
        clue.kind !== "max_swaps"
          ? [clue]
          : maxSwaps === undefined
            ? []
            : [{ ...clue, maxSwaps }],
      ),
    });
    const length = buildingSite.solution.swaps.length;
    expect(() => verifyRota(loosen(length + 1))).not.toThrow();
    expect(() => verifyRota(loosen(length + 2))).toThrow(
      /max_swaps/,
    );
    expect(() => verifyRota(loosen())).toThrow(/max_swaps/);
  });

  it("rejects a final rota on different zones", () => {
    const [first, ...rest] = buildingSite.workers;
    expect(() =>
      verifyRota({
        ...buildingSite,
        workers: [{ ...first, final: { file: "h", rank: 8 } }, ...rest],
      }),
    ).toThrow(/different zones/);
  });
});
