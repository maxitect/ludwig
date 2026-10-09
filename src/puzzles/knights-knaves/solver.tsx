"use client";

import { useEffect, useState } from "react";
import { StatementList } from "../_shared/statement-list/statement-list";
import type { SolverProps } from "../solver-types";
import type * as schema from "./schema";

const OPTIONS = [
  { value: "knight", label: "Knight" },
  { value: "knave", label: "Knave" },
] as const;

export function Solver({
  payload: { questionText, characters },
  initialState,
  onStateChange,
  registerCheck,
  solved,
}: SolverProps<typeof schema>) {
  const [roles, setRoles] = useState<ReadonlyMap<number, schema.Role>>(
    () =>
      new Map(
        initialState?.roles
          .filter(({ position }) =>
            characters.some((character) => character.position === position),
          )
          .map(({ position, role }) => [position, role]),
      ),
  );

  useEffect(() => {
    registerCheck(() =>
      roles.size === characters.length
        ? {
            roles: characters.map(({ position }) => ({
              position,
              role: roles.get(position)!,
            })),
          }
        : null,
    );
  }, [registerCheck, characters, roles]);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-lg">{questionText}</p>
      <p className="text-muted-foreground">
        Knights always tell the truth. Knaves always lie. Everything a knave
        says is false.
      </p>
      <StatementList
        entries={characters.map(({ position, name, statements }) => ({
          id: position,
          name,
          statements,
        }))}
        options={OPTIONS}
        value={roles}
        question="Is this speaker a knight or a knave?"
        disabled={solved}
        onChange={(position, role) => {
          const next = new Map(roles).set(position, role);
          setRoles(next);
          onStateChange({
            roles: Array.from(next, ([entry, value]) => ({
              position: entry,
              role: value,
            })).sort((a, b) => a.position - b.position),
          });
        }}
      />
    </div>
  );
}
