import { inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { rolledBack } from "@/db/integrity/harness";
import { words } from "@/db/schema";
import { readDictionaryFile } from "@/puzzles/word-ladder/dictionary";
import { seedWords } from "./seed-words";

describe("content/words.txt", () => {
  const lines = readDictionaryFile();

  it("holds only 3 to 6 letter lowercase words, each once", () => {
    expect(lines.every((line) => /^[a-z]{3,6}$/.test(line))).toBe(true);
    expect(new Set(lines).size).toBe(lines.length);
    expect(lines.length).toBeGreaterThan(5000);
  });
});

describe("seedWords", () => {
  it("inserts only the missing words and is idempotent", async () => {
    const fresh = ["qzqzq", "qzqzr", "qzqzs"];
    const result = await rolledBack(async (tx) => {
      const first = await seedWords(tx, [...fresh, "qzqzq"]);
      const second = await seedWords(tx, fresh);
      const stored = await tx
        .select({ word: words.word })
        .from(words)
        .where(inArray(words.word, fresh));
      return { first, second, stored: stored.length };
    });
    expect(result.first).toMatchObject({ inserted: 3, total: 3, failures: [] });
    expect(result.second.inserted).toBe(0);
    expect(result.stored).toBe(3);
  });

  it("reports invalid lines and inserts nothing", async () => {
    const result = await rolledBack((tx) => seedWords(tx, ["fine", "Not Fine"]));
    expect(result.inserted).toBe(0);
    expect(result.failures[0]).toMatch(/1 invalid lines, first "Not Fine"/);
  });

  it("batches a large list", async () => {
    const many = Array.from({ length: 12000 }, (_, i) =>
      `${String.fromCharCode(97 + (i % 26))}${String.fromCharCode(97 + (Math.floor(i / 26) % 26))}${String.fromCharCode(97 + (Math.floor(i / 676) % 26))}zq`,
    );
    const result = await rolledBack((tx) => seedWords(tx, many));
    expect(result.total).toBe(new Set(many).size);
    expect(result.inserted).toBe(result.total);
  });
});
