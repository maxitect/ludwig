"use client";

import { FILES } from "@/puzzles/_shared/chess-board/squares";
import type { Placement } from "./engine";
import { type StackStep, zoneName } from "./stack";

type Token = { id: string; name: string; label: string };

const fileIndex = (file: string) =>
  FILES.indexOf(file as (typeof FILES)[number]);
const centre = ({ file, rank }: { file: string; rank: number }) => ({
  x: fileIndex(file) + 0.5,
  y: 8 - rank + 0.5,
});

function PencilLine({ step, from, to }: StackStep) {
  const a = centre(from);
  const b = centre(to);
  const bend = ((step % 3) - 1) * 0.12;
  const mx = (a.x + b.x) / 2 + (a.y - b.y) * bend;
  const my = (a.y + b.y) / 2 + (b.x - a.x) * bend;
  return (
    <g>
      <path
        d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
        fill="none"
        stroke="var(--color-paper)"
        strokeWidth={0.2}
        strokeLinecap="round"
        opacity={0.7}
      />
      <path
        d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
        fill="none"
        stroke="var(--color-ludwig-red)"
        strokeWidth={0.1}
        strokeLinecap="round"
      />
      <circle cx={mx} cy={my} r={0.15} fill="var(--color-ludwig-red)" />
      <text
        x={mx}
        y={my}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={0.2}
        fontWeight={700}
        fill="var(--color-paper)"
      >
        {step}
      </text>
    </g>
  );
}

/** The work-zone board: a chessboard of zones A-H and 1-8 with a name token on each occupied zone. */
export function RotaBoard({
  tokens,
  placement,
  steps,
  selectedId,
  disabled,
  onPick,
  onDropOn,
}: {
  tokens: readonly Token[];
  placement: Placement;
  steps: readonly StackStep[];
  selectedId: string | null;
  disabled: boolean;
  onPick(workerId: string): void;
  onDropOn(fromId: string, toId: string): void;
}) {
  const at = new Map(
    tokens.map((token) => [zoneName(placement[token.id]), token]),
  );
  return (
    <div className="grid w-full max-w-lg grid-cols-[1.25rem_1fr] gap-x-1">
      <div
        aria-hidden="true"
        className="flex flex-col justify-around py-0.5 text-sm font-bold"
      >
        {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => (
          <span key={rank} className="text-center">
            {rank}
          </span>
        ))}
      </div>
      <div
        role="group"
        aria-label="Work zones"
        data-testid="rota-board"
        className="relative grid aspect-square grid-cols-8 border-2 border-border"
      >
        {[8, 7, 6, 5, 4, 3, 2, 1].flatMap((rank) =>
          FILES.map((file, column) => {
            const zone = `${file.toUpperCase()}${rank}`;
            const token = at.get(zone);
            const dark = (column + rank) % 2 === 0;
            return (
              <div
                key={zone}
                data-zone={zone}
                onDragOver={
                  token && !disabled ? (e) => e.preventDefault() : undefined
                }
                onDrop={
                  token && !disabled
                    ? (event) => {
                        event.preventDefault();
                        const from = event.dataTransfer.getData("text/plain");
                        if (from) onDropOn(from, token.id);
                      }
                    : undefined
                }
                className={`flex aspect-square items-center justify-center ${dark ? "bg-ink" : "bg-paper"}`}
              >
                {token && (
                  <button
                    type="button"
                    draggable={!disabled}
                    disabled={disabled}
                    aria-pressed={selectedId === token.id}
                    aria-label={`${token.name}, zone ${zone}`}
                    data-testid={`token-${token.name}`}
                    onClick={() => onPick(token.id)}
                    onDragStart={(event) =>
                      event.dataTransfer.setData("text/plain", token.id)
                    }
                    className={`relative z-10 flex size-[76%] cursor-grab items-center justify-center border-2 border-ink font-display text-[0.7rem] font-bold tracking-wide focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default sm:text-sm ${
                      selectedId === token.id
                        ? "bg-ludwig-red text-paper"
                        : "bg-paper text-ink"
                    }`}
                  >
                    {token.label}
                  </button>
                )}
              </div>
            );
          }),
        )}
        <svg
          viewBox="0 0 8 8"
          aria-hidden="true"
          data-testid="pencil-lines"
          className="pointer-events-none absolute inset-0 z-20 size-full"
        >
          {steps.map((step) => (
            <PencilLine key={step.step} {...step} />
          ))}
        </svg>
      </div>
      <span aria-hidden="true" />
      <div aria-hidden="true" className="flex px-0.5 pt-1 text-sm font-bold">
        {FILES.map((file) => (
          <span key={file} className="flex-1 text-center">
            {file.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
