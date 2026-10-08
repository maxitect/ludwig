"use client";

import { useId } from "react";
import { cn } from "@/utils/cn";

type Option<V extends string> = { value: V; label: string };

type Entry = { id: number; name: string; statements: readonly string[] };

type Props<V extends string> = {
  entries: readonly Entry[];
  /** The choices offered for every entry, in display order. */
  options: readonly [Option<V>, ...Option<V>[]];
  /** The choice made for each entry id, absent while undecided. */
  value: ReadonlyMap<number, V>;
  onChange(id: number, value: V): void;
  /** Names the choice for the screen reader, such as "Is this speaker a knight or a knave". */
  question: string;
  disabled?: boolean;
};

/**
 * Speakers with what they said and one choice each. Each speaker is a native radio group, so Tab
 * moves between speakers, the arrow keys move between choices and the screen reader announces the state.
 * A chosen option is marked with a tick as well as a fill, never colour alone.
 */
export function StatementList<V extends string>({
  entries,
  options,
  value,
  onChange,
  question,
  disabled = false,
}: Props<V>) {
  const groupId = useId();
  return (
    <ol className="flex flex-col gap-6">
      {entries.map(({ id, name, statements }) => {
        const chosen = value.get(id);
        const radioName = `${groupId}-${id}`;
        return (
          <li key={id}>
            <div className="border-2 border-ink bg-paper p-4 text-ink shadow-[3px_3px_0_var(--color-shadow)] sm:p-6">
              <fieldset
                disabled={disabled}
                className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0"
              >
                <legend className="sr-only">
                  {name}. {question}
                </legend>
                <h3
                  aria-hidden="true"
                  className="font-display text-xl uppercase"
                >
                  {name}
                </h3>
                <ul className="flex flex-col gap-1">
                  {statements.map((statement, position) => (
                    <li
                      key={position}
                      className="-indent-3 pl-3 font-hand text-xl text-crayon sm:text-2xl"
                    >
                      <span className="sr-only">{name} says: </span>“{statement}”
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  {options.map((option) => {
                    const selected = chosen === option.value;
                    return (
                      <label
                        key={option.value}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-2 border-2 border-ink px-4 font-display uppercase has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-solid has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-paper-shade text-ink",
                        )}
                      >
                        <input
                          type="radio"
                          name={radioName}
                          value={option.value}
                          checked={selected}
                          onChange={() => onChange(id, option.value)}
                          className="sr-only"
                        />
                        <span aria-hidden="true">{selected ? "✓" : "○"}</span>
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
