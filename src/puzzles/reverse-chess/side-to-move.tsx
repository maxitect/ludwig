import { PieceGlyph, type Colour } from "../_shared/chess-board";

export function SideToMove({ colour }: { colour: Colour }) {
  return (
    <p className="flex items-center gap-2" data-testid="side-to-move">
      <span
        aria-hidden="true"
        className={`block size-8 [&_svg]:size-full! ${colour === "white" ? "bg-paper" : "bg-ink"}`}
      >
        <PieceGlyph colour={colour} piece="king" shadow={false} />
      </span>
      <span>{colour === "white" ? "White" : "Black"} to move</span>
    </p>
  );
}
