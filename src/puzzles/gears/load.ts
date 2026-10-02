import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.gearPuzzles.findFirst({
    where: { puzzleId },
    columns: {
      slotCount: true,
      mIn: true,
      mOut: true,
      maxAdjustments: true,
      occlusion: true,
    },
    with: {
      gears: {
        columns: {
          id: true,
          label: true,
          teeth: true,
          startSlot: true,
          initialOffset: true,
          halfWidthDeg: true,
          isDriver: true,
        },
        orderBy: { label: "asc" },
      },
      meshes: {
        columns: { gearAId: true, gearBId: true },
        orderBy: { gearAId: "asc", gearBId: "asc" },
      },
    },
  });
  if (!puzzle) throw new Error(`Gear puzzle not found: ${puzzleId}`);
  return payloadSchema.parse(puzzle);
}
