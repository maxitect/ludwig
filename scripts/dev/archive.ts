import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { die, sh, text, ticketDirs, topLevel } from "./lib";

/**
 * Moves every ticket whose README status is `done` into docs/tickets/done/ (git mv, history kept)
 * and rewrites every reference to a ticket file so it points at the file's current location.
 * Idempotent.
 */

const root = topLevel();
const [openDir, doneDir] = ticketDirs(root);
const readme = readFileSync(path.join(openDir, "README.md"), "utf8");

const doneIds = readme
  .split("\n")
  .map((line) => line.split("|").map((cell) => cell.trim()))
  .filter((cells) => /^\[T\d{3}\]/.test(cells[1] ?? "") && cells[6] === "done")
  .map((cells) => /T\d{3}/.exec(cells[1])![0]);

const ticketName = /^T\d{3}-[a-z0-9-]+\.md$/;
const names = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => ticketName.test(f)) : []);
const nameOf = (id: string, dir: string) => names(dir).find((f) => f.startsWith(`${id}-`));

const moved: string[] = [];
const origin = new Map<string, string>();
mkdirSync(doneDir, { recursive: true });
for (const id of doneIds) {
  if (nameOf(id, doneDir)) continue;
  const name = nameOf(id, openDir);
  if (!name) die("ARCHIVE", `${id} is done in the README but its file is in neither docs/tickets nor docs/tickets/done`);
  const res = sh(`git mv "${path.join(openDir, name)}" "${path.join(doneDir, name)}"`, root);
  if (!res.ok) die("ARCHIVE", res.out);
  origin.set(path.join(doneDir, name), path.join(openDir, name));
  moved.push(name);
}

const location = new Map<string, string>();
for (const dir of [openDir, doneDir]) for (const name of names(dir)) location.set(name, path.join(dir, name));

const files = text("git ls-files -z -co --exclude-standard -- '*.md' '.claude'", root)
  .split("\0")
  .filter((f) => f.endsWith(".md"));

const ref = /((?:[\w.-]+\/)*)(T\d{3}-[a-z0-9-]+\.md)/g;
const outgoing = /\]\((\.{0,2}\/?[\w.-][^)\s#:]*)/g;
let rewritten = 0;
for (const rel of files) {
  const file = path.join(root, rel);
  if (!existsSync(file)) continue;
  const beforeDir = path.dirname(origin.get(file) ?? file);
  const afterDir = path.dirname(file);
  const source = readFileSync(file, "utf8");
  const next = source
    .replace(outgoing, (match, target: string) => {
      if (beforeDir === afterDir || ticketName.test(path.basename(target))) return match;
      const resolved = path.resolve(beforeDir, target);
      return existsSync(resolved) ? `](${path.relative(afterDir, resolved)}` : match;
    })
    .replace(ref, (match, prefix: string, name: string) => {
      const target = location.get(name);
      if (!target) return match;
      const rooted = prefix.startsWith("docs/");
      const resolved = path.resolve(rooted ? root : beforeDir, prefix || ".");
      if (resolved !== openDir && resolved !== doneDir) return match;
      if (rooted) return `docs/tickets/${path.relative(openDir, target)}`;
      const relative = path.relative(afterDir, target);
      return relative.startsWith(".") ? relative : `./${relative}`;
    });
  if (next !== source) {
    writeFileSync(file, next);
    rewritten++;
  }
}

console.log(`ARCHIVE PASS: moved ${moved.length}, rewrote links in ${rewritten} file(s)`);
