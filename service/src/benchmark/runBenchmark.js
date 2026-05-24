import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { algorithmKeys, createStrategy } from "../algorithms/index.js";

const repoRoot = resolve(process.cwd(), "..");
const dataDir = resolve(repoRoot, "data");
const reportsDir = resolve(repoRoot, "reports");
const iterations = Number(process.env.BENCH_ITERATIONS || 5);

const patternSets = {
  text: ["the", "love", "king", "algorithm", "zzzzzz"],
  dna: ["ATG", "GATTACA", "TTTTTTTT", "ACGTACGT", "NNNN"]
};

function classifyCorpus(fileName) {
  return fileName.endsWith(".fna") || fileName.includes("dna") || fileName.includes("ecoli") ? "dna" : "text";
}

function mean(values) {
  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

async function main() {
  await mkdir(reportsDir, { recursive: true });

  const files = (await readdir(dataDir)).filter(name => /\.(txt|fna)$/i.test(name));
  if (files.length === 0) {
    throw new Error("Nenhum corpus encontrado em data/. Rode: npm run data:download");
  }

  const rows = [];

  for (const fileName of files) {
    const corpusType = classifyCorpus(fileName);
    const text = await readFile(join(dataDir, fileName), "utf8");
    const patterns = patternSets[corpusType];

    for (const pattern of patterns) {
      for (const algorithm of algorithmKeys) {
        const durations = [];
        const comparisons = [];
        let matchCount = 0;

        for (let i = 0; i < iterations; i++) {
          const strategy = createStrategy(algorithm);
          const result = strategy.execute(text, pattern);
          durations.push(result.durationMs);
          comparisons.push(result.comparisons);
          matchCount = result.matchCount;
        }

        rows.push({
          corpus: fileName,
          corpusType,
          textLength: text.length,
          pattern,
          algorithm,
          iterations,
          matchCount,
          durationMeanMs: mean(durations),
          durationMedianMs: median(durations),
          comparisonsMean: mean(comparisons),
          comparisonsMedian: median(comparisons)
        });
      }
    }
  }

  await writeFile(join(reportsDir, "benchmark-results.json"), JSON.stringify(rows, null, 2), "utf8");
  await writeFile(join(reportsDir, "benchmark-results.csv"), toCsv(rows), "utf8");
  console.table(rows.map(row => ({
    corpus: row.corpus,
    pattern: row.pattern,
    algorithm: row.algorithm,
    ms: row.durationMeanMs.toFixed(3),
    comparisons: Math.round(row.comparisonsMean),
    matches: row.matchCount
  })));
}

function toCsv(rows) {
  const headers = Object.keys(rows[0] || {});
  const body = rows.map(row => headers.map(header => JSON.stringify(row[header])).join(","));
  return [headers.join(","), ...body].join("\n");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
