"use client";

import { useState } from "react";
import { fromFen } from "@/puzzles/reverse-chess/derive";
import {
  ChessBoard,
  UncaptureTray,
  type RetroDrop,
  type UncaptureChoice,
} from "@/puzzles/_shared/chess-board";

const { pieces: POSITION } = fromFen("4k3/5N2/8/8/8/8/8/4K3 w - - 0 1");

const ARROW = { from: "g5", to: "f7" } as const;

function previousPosition(drop: RetroDrop, uncapture?: UncaptureChoice) {
  const mover = POSITION.find((p) => `${p.file}${p.rank}` === drop.to);
  if (!mover) return POSITION;
  const rest = POSITION.filter((p) => p !== mover);
  const restored = uncapture && uncapture !== "none" && {
    file: drop.to[0] as typeof mover.file,
    rank: Number(drop.to[1]),
    colour: mover.colour === "white" ? ("black" as const) : ("white" as const),
    piece: uncapture,
  };
  return [
    ...rest,
    {
      ...mover,
      file: drop.from[0] as typeof mover.file,
      rank: Number(drop.from[1]),
    },
    ...(restored ? [restored] : []),
  ];
}

export function ChessBoardDemo() {
  const [drop, setDrop] = useState<RetroDrop | null>(null);
  const [uncapture, setUncapture] = useState<UncaptureChoice>();

  const mover = drop && POSITION.find((p) => `${p.file}${p.rank}` === drop.to);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <ChessBoard
            position={POSITION}
            onRetroDrop={(next) => {
              setDrop(next);
              setUncapture(undefined);
            }}
            highlights={drop ? [drop.to] : []}
            arrows={drop ? [drop] : []}
          />
          <p>
            Retro drop:{" "}
            <output data-testid="retro-output" className="font-mono">
              {drop ? `{from:'${drop.from}',to:'${drop.to}'}` : "none yet"}
            </output>
          </p>
          {mover && (
            <div className="flex flex-col gap-2">
              <UncaptureTray
                colour={mover.colour === "white" ? "black" : "white"}
                value={uncapture}
                onChange={setUncapture}
              />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          {drop && (
            <>
              <p className="font-display text-sm font-bold uppercase tracking-[0.04em]">
                Preview
              </p>
              <div data-testid="preview">
                <ChessBoard
                  position={previousPosition(drop, uncapture)}
                  interactive={false}
                />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <p className="font-display text-sm font-bold uppercase tracking-[0.04em]">
          Backwards arrow
        </p>
        <div data-testid="arrow-board" className="max-w-sm">
          <ChessBoard
            position={POSITION}
            arrows={[ARROW]}
            highlights={["f7"]}
            interactive={false}
          />
        </div>
      </div>
    </div>
  );
}
