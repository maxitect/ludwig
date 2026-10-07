import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registry } from "@/puzzles/registry";
import { regenerate } from "@/puzzles/generators";
import { formatContentFile } from "./dev/format-content";
import { verifyPuzzles } from "./verify-puzzles";

let dir: string;
const generated = { generator: "sudoku", version: 1, seed: "regen" };

function write(slug: string, content: object, seed = generated.seed) {
  writeFileSync(
    path.join(dir, "sudoku", `${slug}.ts`),
    formatContentFile({
      typeKey: "sudoku",
      slug,
      title: slug,
      difficulty: 2,
      publishedAt: "2026-10-07",
      content,
      generated: { ...generated, seed },
    }),
  );
}

beforeAll(() => {
  dir = mkdtempSync(path.join(tmpdir(), "regen-"));
  mkdirSync(path.join(dir, "sudoku"));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("verifyPuzzles regeneration", () => {
  it("passes a file that equals its regenerated puzzle", async () => {
    write("fresh", regenerate(generated, 2).content);
    const { failures } = await verifyPuzzles(registry, dir);
    expect(failures).toEqual([]);
  });

  it("fails a file whose content, seed or generator version no longer regenerates", async () => {
    const { content } = regenerate(generated, 2);
    write("edited", { givens: content.givens.slice(1) });
    write("reseeded", content, "another");
    const { failures } = await verifyPuzzles(registry, dir);
    const bySlug = Object.fromEntries(failures.map((f) => [f.slug, f.error]));
    expect(bySlug.edited).toMatch(/regeneration mismatch/);
    expect(bySlug.reseeded).toMatch(/regeneration mismatch/);
    expect(failures.find((f) => f.slug === "edited")?.file).toContain(
      "edited.ts",
    );
  });
});
