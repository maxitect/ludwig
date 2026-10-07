import { describe, expect, it } from "vitest";
import { gearCap } from "./limits";
import { presets } from "./presets";

describe("gear cap", () => {
  it.each(Object.entries(presets))(
    "%s preset stays within the measured diagram size",
    (_name, preset) => {
      expect(preset.gears.max).toBeLessThanOrEqual(gearCap.maxGears);
      for (const teeth of preset.teeth) {
        expect(gearCap.teeth).toContain(teeth);
      }
    },
  );
});
