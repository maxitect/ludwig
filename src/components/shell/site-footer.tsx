export function SiteFooter() {
  return (
    <footer className="group-has-[[data-solve-mode]]/body:touch:hidden mt-auto flex flex-col gap-2 border-t-2 border-border px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-sm">
      <p>Unofficial fan site, not affiliated with the BBC.</p>
      <p>
        Chess pieces by Colin M.L. Burnett (cburnett), licensed{" "}
        <a
          href="https://creativecommons.org/licenses/by-sa/3.0/"
          className="underline underline-offset-4"
        >
          CC BY-SA 3.0
        </a>
        , via{" "}
        <a
          href="https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces"
          className="underline underline-offset-4"
        >
          Wikimedia Commons
        </a>
        .
      </p>
      <p>
        <a
          href="https://fonts.google.com/?query=Josefin+Sans+Jost+Dancing+Script+Barlow+Caveat+JetBrains+Mono"
          className="underline underline-offset-4"
        >
          Font credits
        </a>
        : Josefin Sans, Jost, Dancing Script, Barlow Semi Condensed, Caveat
        Brush and JetBrains Mono, under the SIL Open Font License.
      </p>
    </footer>
  );
}
