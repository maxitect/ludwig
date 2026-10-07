import { difficulties } from "../../src/puzzles/_shared/generate/pipeline";
import { generators } from "../../src/puzzles/generators";

/** Median and worst generation time and the yield (accepted per candidate) per difficulty, over N seeds. */
const N = Number(process.argv[2] ?? 50);

for (const name of Object.keys(generators)) {
  const generate = generators[name][1];
  for (const difficulty of difficulties) {
    const times: number[] = [];
    let attempts = 0;
    for (let i = 0; i < N; i++) {
      const started = performance.now();
      attempts += generate(`bench-${i}`, difficulty).attempts;
      times.push(performance.now() - started);
    }
    times.sort((a, b) => a - b);
    console.log(
      `${name} d${difficulty}: median ${times[Math.floor(N / 2)].toFixed(0)} ms, worst ${times[N - 1].toFixed(0)} ms, yield ${((N / attempts) * 100).toFixed(1)}% (${N} accepted of ${attempts} candidates)`,
    );
  }
}
