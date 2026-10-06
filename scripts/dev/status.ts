import { readFileSync } from "node:fs";
import path from "node:path";
import {
  mainCheckout,
  prsForTicket,
  readIfExists,
  reportPath,
  text,
  worktrees,
} from "./lib";

type Row = {
  id: string;
  title: string;
  deps: string[];
  mig: boolean;
  human: boolean;
  status: string;
};

const root = mainCheckout();
const readme = readFileSync(path.join(root, "docs", "tickets", "README.md"), "utf8");

const rows: Row[] = readme
  .split("\n")
  .map((line) => line.split("|").map((cell) => cell.trim()))
  .filter((cells) => /^\[T\d{3}\]/.test(cells[1] ?? ""))
  .map(([, idCell, title, deps, mig, human, status]) => ({
    id: /T\d{3}/.exec(idCell)![0],
    title,
    deps: deps.match(/T\d{3}/g) ?? [],
    mig: mig !== "",
    human: human !== "",
    status,
  }));

const done = new Set(rows.filter((r) => r.status === "done").map((r) => r.id));
const flags = (r: Row) => [r.mig && "MIG", r.human && "HUMAN"].filter(Boolean).join(" ");

const trees = worktrees(root);

function inFlightLine(row: Row): string {
  const pr = prsForTicket(row.id, root).find((p) => p.state === "OPEN");
  const wt = trees.find((w) => w.branch.startsWith(`ticket/${row.id}-`));
  const report = readIfExists(reportPath(row.id, wt?.path ?? root));
  const verdict = /^Verdict:\s*(.+)$/m.exec(report ?? "")?.[1] ?? "no review";
  const status = /^Status:\s*(.+)$/m.exec(report ?? "")?.[1] ?? "no report";
  const commits = wt ? text(`git rev-list --count origin/main..HEAD`, wt.path) : "0";
  return [
    `${row.id} [${row.status}]`,
    pr ? `PR #${pr.number}` : "no PR",
    `report ${status}`,
    verdict,
    wt ? `worktree ${path.relative(root, wt.path)} (${commits} commits)` : "no worktree",
  ].join(" · ");
}

const inFlight = rows.filter((r) => ["in-progress", "review", "blocked"].includes(r.status));
const ready = rows.filter((r) => r.status === "todo" && r.deps.every((d) => done.has(d)));
const known = new Set(inFlight.map((r) => r.id));
const strays = trees
  .filter((w) => w.branch.startsWith("ticket/"))
  .filter((w) => !known.has(/T\d{3}/.exec(w.branch)?.[0] ?? ""));

console.log(`IN FLIGHT (${inFlight.length})`);
for (const row of inFlight) console.log(`  ${inFlightLine(row)}`);
for (const w of strays) console.log(`  stray worktree ${w.branch} at ${path.relative(root, w.path)}`);
console.log(`READY (${ready.length})`);
for (const row of ready) console.log(`  ${row.id} ${flags(row)}${flags(row) ? " " : ""}${row.title}`);
console.log(`DONE ${done.size}/${rows.length}`);
