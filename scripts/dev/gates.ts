import { writeFileSync } from "node:fs";
import path from "node:path";
import {
  currentBranch,
  idFromBranch,
  openLog,
  pass,
  runSteps,
  sh,
  topLevel,
  workingTree,
} from "./lib";

const root = topLevel();
const id = idFromBranch(currentBranch()) ?? "local";
const dir = path.join(root, ".verification", id);

openLog(path.join(dir, "gates.log"));

runSteps("GATES", [
  { name: "typecheck", run: () => sh("pnpm typecheck") },
  { name: "lint", run: () => sh("pnpm lint") },
  { name: "test", run: () => sh("pnpm test") },
  { name: "build", run: () => sh("pnpm build") },
  { name: "puzzles:verify", run: () => sh("pnpm puzzles:verify") },
  {
    name: "record",
    run: () => {
      writeFileSync(path.join(dir, "gates.ok"), `${workingTree()}\n`);
      return pass;
    },
  },
]);
