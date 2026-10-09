import {
  MiniChessBoard,
  squareCentre,
} from "../_shared/preview/mini-chess-board";
import type { Payload } from "./schema";

export function Preview({ payload: { workers } }: { payload: Payload }) {
  return (
    <MiniChessBoard>
      {workers.flatMap(({ id, name, squares }) =>
        squares.map((square) => {
          const { x, y } = squareCentre(square);
          return square.phase === "final" ? (
            <g key={`${id}-final`}>
              <circle cx={x} cy={y} r={4} className="fill-ink" />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={5}
                className="fill-paper font-display font-bold uppercase"
              >
                {name.slice(0, 1)}
              </text>
            </g>
          ) : (
            <circle
              key={`${id}-intended`}
              cx={x}
              cy={y}
              r={4}
              strokeWidth={1}
              strokeDasharray="2 1.5"
              className="fill-none stroke-ludwig-red"
            />
          );
        }),
      )}
    </MiniChessBoard>
  );
}
