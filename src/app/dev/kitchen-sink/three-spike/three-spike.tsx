"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeskHero } from "@/components/desk/desk-scene/desk-hero";
import { deskStacks } from "@/components/desk/desk-scene/model";

const BoardRoom = dynamic(() => import("./board-room"), { ssr: false });
const GearDaily = dynamic(() => import("./gear-daily"), { ssr: false });

const SAMPLE = deskStacks([
  { key: "flagship", name: "Flagship", solved: 4 },
  { key: "word", name: "Word", solved: 9 },
  { key: "logic", name: "Logic", solved: 6 },
  { key: "spatial", name: "Spatial", solved: 2 },
  { key: "cipher", name: "James's Notebooks", solved: 7 },
  { key: "numbers", name: "Numbers", solved: 3 },
]);

const CANDIDATES = ["desk", "board-room", "gear-daily"] as const;

/** The three.js spike: each candidate mounts only when chosen, so the page itself stays light. */
export function ThreeSpike() {
  const [candidate, setCandidate] = useState<(typeof CANDIDATES)[number]>("desk");
  return (
    <div data-dev="three-spike" className="flex flex-col gap-4">
      <div className="flex gap-2">
        {CANDIDATES.map((key) => (
          <Button
            key={key}
            variant={candidate === key ? "default" : "secondary"}
            onClick={() => setCandidate(key)}
          >
            {key}
          </Button>
        ))}
      </div>
      {candidate === "desk" && <DeskHero stacks={SAMPLE} />}
      {candidate === "board-room" && <BoardRoom />}
      {candidate === "gear-daily" && <GearDaily />}
    </div>
  );
}
