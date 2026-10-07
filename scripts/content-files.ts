import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { z } from "zod";
import { contentMetaSchema } from "../src/lib/data/puzzle-upsert";
import { type Provenance, generatedSchema } from "../src/puzzles/generators";
import type { PuzzleRegistry } from "../src/puzzles/registry";

export type ContentMeta = z.infer<typeof contentMetaSchema>;

export type ContentFile = {
  typeKey: string;
  slug: string;
  file: string;
  meta: ContentMeta;
  content: unknown;
  generated?: Provenance;
};

export type ContentFailure = {
  typeKey: string;
  slug: string;
  file: string;
  error: string;
};

function formatIssues(error: z.ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}

/**
 * Loads every `<contentDir>/<type>/<slug>.ts` for the registered types and validates it
 * with that type's `contentSchema`. Invalid files are returned as failures, never thrown.
 */
export async function loadContentFiles(
  registry: PuzzleRegistry,
  contentDir: string,
) {
  const files: ContentFile[] = [];
  const failures: ContentFailure[] = [];

  for (const [typeKey, module] of Object.entries(registry)) {
    const typeDir = path.join(contentDir, typeKey);
    if (!existsSync(typeDir)) continue;
    const fileSchema = z.object({
      meta: contentMetaSchema,
      content: module.schema.contentSchema,
      generated: generatedSchema.optional(),
    });

    const names = readdirSync(typeDir)
      .filter((name) => name.endsWith(".ts"))
      .sort();
    for (const name of names) {
      const file = path.join(typeDir, name);
      const slug = name.slice(0, -".ts".length);
      try {
        const parsed = fileSchema.safeParse(
          await import(pathToFileURL(file).href),
        );
        if (!parsed.success) {
          failures.push({
            typeKey,
            slug,
            file,
            error: formatIssues(parsed.error),
          });
        } else if (parsed.data.meta.slug !== slug) {
          failures.push({
            typeKey,
            slug,
            file,
            error: `meta.slug: must equal the file name "${slug}"`,
          });
        } else {
          files.push({ typeKey, slug, file, ...parsed.data });
        }
      } catch (error) {
        failures.push({
          typeKey,
          slug,
          file,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return { files, failures };
}

/** Reads `--registry <module>` and `--content-dir <dir>`, defaulting to the production registry and `content/`. */
export async function resolveCliOptions(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      registry: { type: "string", default: "src/puzzles/registry.ts" },
      "content-dir": { type: "string", default: "content" },
    },
  });
  const loaded: { registry: PuzzleRegistry } = await import(
    pathToFileURL(path.resolve(values.registry)).href
  );
  return {
    registry: loaded.registry,
    contentDir: path.resolve(values["content-dir"]),
  };
}
