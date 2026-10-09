"use client";

import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { LINE_WIDTH, wordsOfLine } from "./derive";
import type * as schema from "./schema";
import type { SolverProps } from "../solver-types";

const EMPTY = "_";

/** Widest average advance of a book line in Jost, in em per character, with a margin for wide glyphs. */
export const JOST_EM_PER_CHAR = 0.52;
export const MIN_LINE_FONT_PX = 14;
export const LINE_NUMBER_COLUMN_PX = 36;
const BODY_FONT = "1.125rem";

const LINE_FONT_SIZE = `max(${MIN_LINE_FONT_PX}px, min(${BODY_FONT}, calc((100cqi - ${LINE_NUMBER_COLUMN_PX}px) / ${LINE_WIDTH * JOST_EM_PER_CHAR})))`;
const NOWRAP_FROM_PX = Math.ceil(
  MIN_LINE_FONT_PX * LINE_WIDTH * JOST_EM_PER_CHAR + LINE_NUMBER_COLUMN_PX,
);
const BOOK_PAGE_STYLES = `@container book-page (min-width: ${NOWRAP_FROM_PX}px) {
  .book-line { white-space: nowrap; background-color: transparent; }
  .book-text { padding-left: 0; text-indent: 0; }
  .book-turn { display: none; }
}`;

const panelTitle =
  "font-display text-lg font-bold tracking-[0.04em] uppercase";

function useRowStarts(
  list: RefObject<HTMLOListElement | null>,
  dependency: unknown,
) {
  const [starts, setStarts] = useState("");
  useLayoutEffect(() => {
    const node = list.current;
    if (!node) return;
    function measure() {
      const found: string[] = [];
      for (const item of node!.querySelectorAll("li")) {
        let top: number | null = null;
        for (const word of item.querySelectorAll<HTMLElement>("[data-word]")) {
          if (top !== null && word.offsetTop > top + 2) {
            found.push(`${item.dataset.line}-${word.dataset.word}`);
          }
          top = word.offsetTop;
        }
      }
      setStarts(found.join(","));
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    void document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [list, dependency]);
  return starts.split(",");
}

function decodeSaved(saved: string | null | undefined, count: number) {
  const words = saved?.split(" ") ?? [];
  return Array.from({ length: count }, (_, i) =>
    words.length === count && words[i] !== EMPTY ? (words[i] ?? "") : "",
  );
}

function encode(words: readonly string[]) {
  return words.some(Boolean)
    ? words.map((word) => word || EMPTY).join(" ")
    : null;
}

export function Solver({
  payload: { title, author, lines, refs },
  initialState,
  onStateChange,
  registerCheck,
}: SolverProps<typeof schema>) {
  const [words, setWords] = useState(() =>
    decodeSaved(initialState?.answer, refs.length),
  );
  const [selected, setSelected] = useState(0);
  const [page, setPage] = useState(refs[0]?.page ?? 1);
  const [announcement, setAnnouncement] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const bookLines = useRef<HTMLOListElement | null>(null);

  const pages = useMemo(() => {
    const byPage = new Map<number, typeof lines>();
    for (const line of lines) {
      byPage.set(line.page, [...(byPage.get(line.page) ?? []), line]);
    }
    return byPage;
  }, [lines]);
  const pageCount = Math.max(...pages.keys());
  const current = refs[selected];
  const rowStarts = useRowStarts(bookLines, page);

  useEffect(() => {
    registerCheck(() =>
      words.every(Boolean) ? { answer: words.join(" ") } : null,
    );
  }, [registerCheck, words]);

  function turnTo(next: number) {
    const clamped = Math.min(Math.max(next, 1), pageCount);
    setPage(clamped);
    setAnnouncement(`Page ${clamped} of ${pageCount}`);
  }

  function select(index: number) {
    const ref = refs[index];
    setSelected(index);
    setPage(ref.page);
    setAnnouncement(
      `Reference ${index + 1}: page ${ref.page}, line ${ref.line}, word ${ref.wordIndex}`,
    );
  }

  function write(index: number, value: string) {
    const next = words.map((word, i) =>
      i === index ? value.toLowerCase().replace(/[^a-z]/g, "") : word,
    );
    setWords(next);
    onStateChange({ answer: encode(next) });
  }

  function onReaderKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const step: Record<string, number | undefined> = {
      ArrowRight: page + 1,
      PageDown: page + 1,
      ArrowLeft: page - 1,
      PageUp: page - 1,
      Home: 1,
      End: pageCount,
    };
    const next = step[event.key];
    if (next === undefined) return;
    event.preventDefault();
    turnTo(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg">
        Each reference names a page, a line and a word in the book. Find the
        word, write it down, and read the message the words make together.
      </p>
      <div className="grid gap-6 lg:-mx-24 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <style>{BOOK_PAGE_STYLES}</style>
        <section
          aria-label={`${title}, page ${page} of ${pageCount}`}
          tabIndex={0}
          onKeyDown={onReaderKeyDown}
          className="paper-sheet order-2 flex flex-col gap-4 p-4 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-6 lg:order-1 lg:p-4"
        >
          <header className="flex flex-col gap-1">
            <h2 className={panelTitle}>{title}</h2>
            <p className="font-mono text-sm text-ink-soft">{author}</p>
          </header>
          <div className="@container/book-page">
            <ol
              ref={bookLines}
              style={{ fontSize: LINE_FONT_SIZE }}
              className="flex flex-col"
            >
              {(pages.get(page) ?? []).map(({ line, content }) => (
                <li
                  key={line}
                  data-line={line}
                  className="book-line flex gap-3 odd:bg-paper-deep/20"
                >
                  <span
                    aria-hidden="true"
                    className="w-6 shrink-0 text-right font-mono text-xs leading-7 text-ink-soft"
                  >
                    {line}
                  </span>
                  <span className="book-text min-w-0 flex-1 pl-[1.25em] -indent-[1.25em] leading-7">
                    {wordsOfLine(content).map((word, index) => {
                      const here =
                        current?.page === page &&
                        current.line === line &&
                        current.wordIndex === index + 1;
                      return (
                        <Fragment key={index}>
                          {index > 0 ? " " : null}
                          <span data-word={index + 1} className="relative">
                          {rowStarts.includes(`${line}-${index + 1}`) ? (
                            <span
                              aria-hidden="true"
                              className="book-turn absolute -left-[1.1em] text-ink-soft"
                            >
                              ↪
                            </span>
                          ) : null}
                          {here ? (
                            <mark
                              aria-current="location"
                              className="bg-ink px-1 text-paper"
                            >
                              <span className="sr-only">{`Page ${page}, line ${line}, word ${index + 1}: `}</span>
                              {word}
                            </mark>
                          ) : (
                            word
                          )}
                          </span>
                        </Fragment>
                      );
                    })}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <nav aria-label="Pages" className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => turnTo(page - 1)}
            >
              <span aria-hidden="true" className="sm:hidden">
                Prev
              </span>
              <span className="max-sm:hidden">Previous page</span>
            </Button>
            <span className="font-mono text-sm whitespace-nowrap">{`Page ${page} of ${pageCount}`}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-label="Next page"
              disabled={page >= pageCount}
              onClick={() => turnTo(page + 1)}
            >
              <span aria-hidden="true" className="sm:hidden">
                Next
              </span>
              <span className="max-sm:hidden">Next page</span>
            </Button>
          </nav>
          <p className="sr-only" aria-live="polite">
            {announcement}
          </p>
        </section>
        <section
          aria-label="References"
          className="paper-sheet order-1 flex flex-col gap-3 p-4 sm:p-6 lg:order-2 lg:p-4"
        >
          <h2 className={panelTitle}>References</h2>
          <ol className="grid grid-cols-1 gap-3 min-[30rem]:grid-cols-2 lg:grid-cols-1">
            {refs.map((ref, index) => (
              <li key={ref.position} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2">
                <button
                  type="button"
                  aria-pressed={index === selected}
                  onClick={() => {
                    select(index);
                    inputs.current[index]?.focus();
                  }}
                  className={cn(
                    "border-2 border-ink px-1 py-1 text-center font-mono text-sm focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring",
                    index === selected && "bg-ink text-paper",
                  )}
                >
                  {`${ref.page}:${ref.line}:${ref.wordIndex}`}
                </button>
                <input
                  ref={(node) => {
                    inputs.current[index] = node;
                  }}
                  type="text"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={words[index]}
                  aria-label={`Word ${index + 1}: page ${ref.page}, line ${ref.line}, word ${ref.wordIndex}`}
                  onFocus={() => select(index)}
                  onChange={(event) => write(index, event.currentTarget.value)}
                  className="min-w-0 flex-1 border-b-2 border-ink px-1 font-hand text-2xl text-crayon focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
                />
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
