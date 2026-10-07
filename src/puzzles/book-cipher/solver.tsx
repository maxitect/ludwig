"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { wordsOfLine } from "./derive";
import type * as schema from "./schema";
import type { SolverProps } from "../solver-types";

const EMPTY = "_";

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

  const pages = useMemo(() => {
    const byPage = new Map<number, typeof lines>();
    for (const line of lines) {
      byPage.set(line.page, [...(byPage.get(line.page) ?? []), line]);
    }
    return byPage;
  }, [lines]);
  const pageCount = Math.max(...pages.keys());
  const current = refs[selected];

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
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section
          aria-label={`${title}, page ${page} of ${pageCount}`}
          tabIndex={0}
          onKeyDown={onReaderKeyDown}
          className="flex flex-col gap-4 border-2 border-ink bg-paper p-4 text-ink shadow-[3px_3px_0_var(--color-shadow)] focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-6"
        >
          <header className="flex flex-col gap-1">
            <h2 className="font-display text-xl">{title}</h2>
            <p className="font-mono text-sm text-ink-soft">{author}</p>
          </header>
          <ol className="flex flex-col gap-1 text-base sm:text-lg">
            {(pages.get(page) ?? []).map(({ line, content }) => (
              <li key={line} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="w-6 shrink-0 text-right font-mono text-xs leading-7 text-ink-soft"
                >
                  {line}
                </span>
                <span>
                  {wordsOfLine(content).map((word, index) => {
                    const here =
                      current?.page === page &&
                      current.line === line &&
                      current.wordIndex === index + 1;
                    return (
                      <span key={index}>
                        {index > 0 ? " " : null}
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
                    );
                  })}
                </span>
              </li>
            ))}
          </ol>
          <nav aria-label="Pages" className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => turnTo(page - 1)}
            >
              Previous page
            </Button>
            <span className="font-mono text-sm whitespace-nowrap">{`Page ${page} of ${pageCount}`}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => turnTo(page + 1)}
            >
              Next page
            </Button>
          </nav>
          <p className="sr-only" aria-live="polite">
            {announcement}
          </p>
        </section>
        <section
          aria-label="References"
          className="flex flex-col gap-3 border-2 border-ink bg-paper p-4 text-ink shadow-[3px_3px_0_var(--color-shadow)] sm:p-6"
        >
          <h2 className="font-display text-xl">References</h2>
          <ol className="flex flex-col gap-3">
            {refs.map((ref, index) => (
              <li key={ref.position} className="flex items-center gap-3">
                <button
                  type="button"
                  aria-pressed={index === selected}
                  onClick={() => {
                    select(index);
                    inputs.current[index]?.focus();
                  }}
                  className={cn(
                    "border-2 border-ink px-2 py-1 font-mono text-sm focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring",
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
                  className="min-w-0 flex-1 border-b-2 border-ink bg-paper px-1 font-hand text-2xl text-crayon focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
                />
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
