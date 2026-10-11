import type { Metadata } from "next";
import Link from "next/link";
import { Credit, GridPaper } from "@/components/brand";
import {
  BLOG_URL,
  CONTACT_EMAIL,
  GITHUB_URL,
  LINKEDIN_URL,
  TANDEM_URL,
} from "@/config/about";

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
          <h2 className="font-display font-bold uppercase">Who I am</h2>
          <p>
            I&apos;m Max (Maxime Downe, maxitect online). I trained as an
            architect and a computational designer, then moved into software,
            and I now work as a full-stack developer and AI engineer. I founded{" "}
            <a href={TANDEM_URL} className={link}>
              Tandem Creative Dev
            </a>
            , where I build for charities, government, founders and learning
            institutions, and I am currently on an AI and machine learning
            course with Founders and Coders.
          </p>
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="font-display font-bold uppercase">Why this site</h2>
          <p>
            I watched <em>Ludwig</em> and two of its puzzles stuck with me:
            Reverse Chess (series one, episode four) and the Gear Puzzle (series
            two, episode two). I wanted to sit down and solve them myself, so I
            built somewhere to do it.
          </p>
          <p>
            I like puzzles, and I like staying with a hard problem until it
            gives. That is most of the job, and most of the fun.
          </p>
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="font-display font-bold uppercase">What&apos;s here</h2>
          <ul className="flex flex-col gap-2">
            <li>
              <Link href="/reverse-chess" className={link}>
                Reverse Chess
              </Link>
              : start from the position on the board and work out the moves
              that produced it.
            </li>
            <li>
              <Link href="/gears" className={link}>
                The Gear Puzzle
              </Link>
              : turn the first gear and find which way the last one goes.
            </li>
            <li>
              <Link href="/puzzles" className={link}>
                The library
              </Link>
              : word, logic, spatial and cipher puzzles to keep you going
              between the two.
            </li>
          </ul>
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="font-display font-bold uppercase">Get in touch</h2>
          <p>
            Email me at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className={link}>
              {CONTACT_EMAIL}
            </a>
            . I write about what I learn when things break on{" "}
            <a href={BLOG_URL} className={link}>
              my blog
            </a>
            , and I am on{" "}
            <a href={GITHUB_URL} className={link}>
              GitHub
            </a>{" "}
            and{" "}
            <a href={LINKEDIN_URL} className={link}>
              LinkedIn
            </a>
            .
          </p>
        </section>
        <section className="flex flex-col gap-3 text-sm">
          <h2 className="font-display font-bold uppercase">Credits</h2>
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
