import { describe, expect, it } from "vitest";
import { contentSchema, payloadSchema } from "./schema";

describe("slotCount", () => {
  it("accepts multiples of 4 and rejects other even counts", () => {
    for (const schema of [payloadSchema, contentSchema]) {
      const { slotCount } = schema.shape;
      expect(slotCount.safeParse(8).success).toBe(true);
      expect(slotCount.safeParse(12).success).toBe(true);
      expect(slotCount.safeParse(6).success).toBe(false);
      expect(slotCount.safeParse(10).success).toBe(false);
    }
  });
});
