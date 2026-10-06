"use client";

import { useId, useSyncExternalStore } from "react";
import { Toggle } from "@/components/ui/toggle";
import { type Diagram, signsOf, stateAt } from "./engine";

const STORAGE_KEY = "gears-state-table";

const listeners = new Set<() => void>();
let unsaved: boolean | null = null;

function subscribe(notify: () => void) {
  listeners.add(notify);
  window.addEventListener("storage", notify);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", notify);
  };
}

function readStored() {
  if (unsaved !== null) return unsaved;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Server and hydration render the table hidden; the stored choice applies right after. Blocked storage keeps the choice in memory. */
export function useStateTableToggle() {
  const shown = useSyncExternalStore(subscribe, readStored, () => false);
  const tableId = useId();

  function toggle(next: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      unsaved = null;
    } catch {
      unsaved = next;
    }
    listeners.forEach((notify) => notify());
  }

  return { shown, toggle, tableId };
}

type StateTableToggleProps = {
  shown: boolean;
  onToggle: (shown: boolean) => void;
  tableId: string;
};

export function StateTableToggle({
  shown,
  onToggle,
  tableId,
}: StateTableToggleProps) {
  return (
    <Toggle
      className="self-start"
      pressed={shown}
      onPressedChange={onToggle}
      aria-controls={shown ? tableId : undefined}
    >
      Show as table
    </Toggle>
  );
}

type StateTableProps = {
  id: string;
  diagram: Diagram;
  crank: number;
  convergence: number;
};

const degrees = (value: number) => `${Number(value.toFixed(1))}°`;

/** Text mirror of the board at the settled convergence, from the same engine state. */
export function StateTable({
  id,
  diagram,
  crank,
  convergence,
}: StateTableProps) {
  const signs = signsOf(diagram);
  const states = stateAt(diagram, crank, convergence);

  return (
    <div id={id} className="w-0 min-w-full overflow-x-auto bg-background">
      <table className="w-full border-2 border-border text-left">
        <caption className="p-3 text-left font-display text-sm uppercase">
          Gear state at crank {crank}, convergence {convergence}
        </caption>
        <thead className="bg-muted">
          <tr className="border-b-2 border-border">
            <th scope="col" className="p-3">
              Gear
            </th>
            <th scope="col" className="p-3">
              Teeth
            </th>
            <th scope="col" className="p-3">
              Spin
            </th>
            <th scope="col" className="p-3">
              Slot
            </th>
            <th scope="col" className="p-3">
              Facing
            </th>
            <th scope="col" className="p-3">
              Sees victim
            </th>
          </tr>
        </thead>
        <tbody>
          {diagram.gears.map((gear) => {
            const state = states[gear.id]!;
            return (
              <tr key={gear.id} className="border-b border-border">
                <th scope="row" className="p-3 font-bold">
                  {gear.label}
                </th>
                <td className="p-3">{gear.teeth}</td>
                <td className="p-3">
                  {signs[gear.id] === 1 ? "with driver" : "against driver"}
                </td>
                <td className="p-3">{state.slot}</td>
                <td className="p-3">{degrees(state.facingDeg)}</td>
                <td className="p-3">{state.sees ? "yes" : "no"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
