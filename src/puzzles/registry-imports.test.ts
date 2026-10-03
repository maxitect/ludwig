import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const importUnderReactServer = (specifier: string) =>
  spawnSync(
    "pnpm",
    [
      "exec",
      "tsx",
      "--conditions",
      "react-server",
      "--env-file-if-exists=.env.local",
      "-e",
      `import(${JSON.stringify(specifier)}).then(() => process.exit(0), (error) => { console.error(error.message); process.exit(1); })`,
    ],
    { encoding: "utf8", timeout: 60_000 },
  );

describe("registry import graph", () => {
  it("fails for a client-only dependency, so the guard below is not vacuous", () => {
    const result = importUnderReactServer("./src/puzzles/_shared/chess-board");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("createContext");
  });

  it("loads the registry under react-server without reaching any solver", () => {
    const result = importUnderReactServer("./src/puzzles/registry");
    expect(result.status, result.stderr).toBe(0);
  });

  it("cannot load the solver map under react-server, which only the solve page may import", () => {
    const result = importUnderReactServer("./src/puzzles/solvers");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("createContext");
  });
});
