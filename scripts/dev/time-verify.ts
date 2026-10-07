import { loadContentFiles, resolveCliOptions } from "../content-files";

const RUNS = 5;

/** Times each content file's `verify` hook (the type's uniqueness proof) and prints the median per file and per type. */
async function main() {
  const { registry, contentDir } = await resolveCliOptions(process.argv.slice(2));
  const { files } = await loadContentFiles(registry, contentDir);
  const byType = new Map<string, number[]>();
  for (const { typeKey, slug, content } of files) {
    const verify = registry[typeKey].verify;
    if (!verify) continue;
    const samples: number[] = [];
    for (let i = 0; i < RUNS; i++) {
      const started = performance.now();
      verify(content);
      samples.push(performance.now() - started);
    }
    samples.sort((a, b) => a - b);
    const median = samples[Math.floor(RUNS / 2)];
    byType.set(typeKey, [...(byType.get(typeKey) ?? []), median]);
    console.log(`${typeKey}/${slug}\t${median.toFixed(2)} ms`);
  }
  console.log("\ntype\tfiles\tmedian ms\tmax ms");
  for (const [typeKey, times] of byType) {
    const sorted = [...times].sort((a, b) => a - b);
    console.log(
      `${typeKey}\t${sorted.length}\t${sorted[Math.floor(sorted.length / 2)].toFixed(2)}\t${sorted[sorted.length - 1].toFixed(2)}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
