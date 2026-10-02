import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const pageDir = join(root, "src/app/dev/kitchen-sink");

const pageSources = readdirSync(pageDir)
  .filter((file) => file.endsWith(".tsx"))
  .map((file) => readFileSync(join(pageDir, file), "utf8"))
  .join("\n");

describe("kitchen sink coverage", () => {
  it("imports every brand component", () => {
    const index = readFileSync(
      join(root, "src/components/brand/index.ts"),
      "utf8",
    );
    const exported = [...index.matchAll(/export \{\s*(\w+)\s*\}/g)].map(
      (match) => match[1],
    );
    const brandImports = [
      ...pageSources.matchAll(/import \{([^}]*)\} from "@\/components\/brand"/g),
    ].flatMap((match) => match[1].split(",").map((name) => name.trim()));

    expect(exported.length).toBeGreaterThan(0);
    expect(exported.filter((name) => !brandImports.includes(name))).toEqual([]);
  });

  it("imports every ui component file", () => {
    const uiFiles = readdirSync(join(root, "src/components/ui"))
      .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"))
      .map((file) => file.replace(/\.tsx$/, ""));

    expect(uiFiles.length).toBeGreaterThan(0);
    expect(
      uiFiles.filter(
        (name) => !pageSources.includes(`"@/components/ui/${name}"`),
      ),
    ).toEqual([]);
  });
});
