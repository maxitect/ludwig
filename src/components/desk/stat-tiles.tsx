import { formatDuration } from "@/utils/format-duration";
import type { DeskCharts } from "@/lib/data/desk-charts";
import { plural } from "./chart-model";

type Stats = {
  total: number;
  thisWeek: number;
  currentStreak: number;
  longestStreak: number;
};

/** The number counts up in CSS from 0; the real value is always in the text for assistive tech and reduced motion. */
function Count({ value, className }: { value: number; className: string }) {
  return (
    <dd className={className}>
      <span
        aria-hidden="true"
        className="count-up"
        style={{ "--count": value } as React.CSSProperties}
      />
      <span className="sr-only">{value}</span>
    </dd>
  );
}

function Tile({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col justify-between border-2 border-border bg-card p-4 ${className}`}>
      <dt className="font-display text-lg font-light tracking-[0.04em] uppercase">
        {label}
      </dt>
      {children}
    </div>
  );
}

export function StatTiles({
  stats,
  categories,
  fastest,
}: {
  stats: Stats;
  categories: DeskCharts["categories"];
  fastest: DeskCharts["fastest"];
}) {
  const favourite = categories.reduce<DeskCharts["categories"][number] | null>(
    (best, row) => (row.solved > (best?.solved ?? 0) ? row : best),
    null,
  );
  const small = "font-display text-4xl font-bold";

  return (
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Tile
        label="Current streak"
        className="col-span-2 border-primary bg-card shadow-[3px_3px_0_var(--cast)] lg:row-span-2"
      >
        <Count
          value={stats.currentStreak}
          className="mt-4 font-display text-7xl leading-none font-bold sm:text-8xl"
        />
        <dd className="font-display text-xl font-bold uppercase">
          {stats.currentStreak === 1 ? "day" : "days"} running
        </dd>
      </Tile>
      <Tile label="Longest streak">
        <Count value={stats.longestStreak} className={small} />
      </Tile>
      <Tile label="Solved">
        <Count value={stats.total} className={small} />
      </Tile>
      <Tile label="This week">
        <Count value={stats.thisWeek} className={small} />
      </Tile>
      <Tile label="Favourite category">
        <dd className="font-display text-2xl leading-tight font-bold uppercase">
          {favourite ? favourite.name : "None yet"}
          {favourite && (
            <span className="block text-base font-light">
              {plural(favourite.solved, "solve")}
            </span>
          )}
        </dd>
      </Tile>
      <Tile label="Fastest solve" className="col-span-2 lg:col-span-4">
        <dd className="flex flex-wrap items-baseline justify-between gap-x-4">
          <span className="font-display text-2xl font-bold uppercase">
            {fastest ? fastest.title : "No solves yet"}
            {fastest && (
              <span className="block text-base font-light">{fastest.typeName}</span>
            )}
          </span>
          <span className={small}>
            {fastest ? formatDuration(fastest.durationMs) : "–"}
          </span>
        </dd>
      </Tile>
    </dl>
  );
}
