/** The one-line case brief above a grid, on a paper sheet. */
export function BriefSheet({ brief }: { brief: string }) {
  return (
    <p data-testid="puzzle-brief" className="paper-sheet p-3">
      {brief}
    </p>
  );
}
