import type { Metadata } from "next";
import Link from "next/link";
import { Credit, GridPaper } from "@/components/brand";
import { BLOG_URL, CONTACT_EMAIL } from "@/config/about";

export const metadata: Metadata = {
  title: "About | Ludwig.",
  description:
    "Who made this fan site, why it exists, how to get in touch, and the credits.",
};

const link = "underline underline-offset-4";

export default function AboutPage() {
  return (
    <GridPaper className="flex-1">
      <main className="mx-auto flex max-w-xl flex-col gap-10 px-4 py-12 sm:px-8">
        <Credit level={1} top="The person behind it" bottom="About" />
        <section className="flex flex-col gap-3">
          <h2 className="font-bold uppercase">Who I am</h2>
          <p>I&apos;m Max, and I built this site.</p>
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="font-bold uppercase">Why this site</h2>
          <p>
            It started with watching <em>Ludwig</em>, and two puzzles from the
            show in particular: Reverse Chess (series one, episode four) and the
            Gear Puzzle (series two, episode two). I wanted to be able to solve
            them myself.
          </p>
          <p>
            I love puzzles, and I love working at a complex problem until it
            gives.
          </p>
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="font-bold uppercase">What&apos;s here</h2>
          <ul className="flex flex-col gap-2">
            <li>
              <Link href="/reverse-chess" className={link}>
                Reverse Chess
              </Link>
              : work out the moves that led to the position.
            </li>
            <li>
              <Link href="/gears" className={link}>
                The Gear Puzzle
              </Link>
              : turn the gears and find which way the last one goes.
            </li>
            <li>
              <Link href="/puzzles" className={link}>
                The library
              </Link>
              : word, logic, spatial and cipher puzzles.
            </li>
          </ul>
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="font-bold uppercase">Get in touch</h2>
          <p>
            Email me at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className={link}>
              {CONTACT_EMAIL}
            </a>
            , or read the{" "}
            <a href={BLOG_URL} className={link}>
              blog
            </a>
            .
          </p>
        </section>
        <section className="flex flex-col gap-3 text-sm">
          <h2 className="font-bold uppercase">Credits</h2>
          <p>
            Unofficial fan site, not affiliated with the BBC. <em>Ludwig</em>{" "}
            belongs to its makers.
          </p>
          <p>
            Chess pieces by Colin M.L. Burnett (cburnett), licensed{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/3.0/"
              className={link}
            >
              CC BY-SA 3.0
            </a>
            , via{" "}
            <a
              href="https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces"
              className={link}
            >
              Wikimedia Commons
            </a>
            , modified.
          </p>
          <p>
            <a
              href="https://fonts.google.com/?query=Josefin+Sans+Jost+Dancing+Script+Barlow+Caveat+JetBrains+Mono"
              className={link}
            >
              Font credits
            </a>
            : Josefin Sans, Jost, Dancing Script, Barlow Semi Condensed, Caveat
            Brush and JetBrains Mono, under the SIL Open Font License.
          </p>
        </section>
      </main>
    </GridPaper>
  );
}
