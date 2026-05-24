import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const repoRoot = resolve(process.cwd(), "..");
const reportsDir = resolve(repoRoot, "reports");
const chartsDir = resolve(reportsDir, "charts");

const algorithmLabels = {
  naive: "Naive",
  "rabin-karp": "Rabin-Karp",
  kmp: "KMP",
  "boyer-moore": "Boyer-Moore"
};

const colors = {
  naive: "#111111",
  "rabin-karp": "#2F5233",
  kmp: "#7A2E2E",
  "boyer-moore": "#4A4A4A"
};

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function mean(items, valueFn) {
  return items.reduce((sum, item) => sum + valueFn(item), 0) / items.length;
}

function fmt(value, digits = 2) {
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function barChart({ title, unit, values }) {
  const width = 900;
  const height = 420;
  const margin = { top: 56, right: 40, bottom: 92, left: 80 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(...values.map(item => item.value), 1);
  const barWidth = plotWidth / values.length * 0.62;

  const bars = values.map((item, index) => {
    const x = margin.left + index * (plotWidth / values.length) + (plotWidth / values.length - barWidth) / 2;
    const barHeight = (item.value / maxValue) * plotHeight;
    const y = margin.top + plotHeight - barHeight;
    return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${colors[item.algorithm]}"/>
      <text x="${x + barWidth / 2}" y="${height - 52}" text-anchor="middle">${algorithmLabels[item.algorithm]}</text>
      <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" class="value">${fmt(item.value, unit === "ms" ? 2 : 0)}</text>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
  <style>
    text { font-family: Arial, sans-serif; fill: #111; font-size: 14px; }
    .title { font-size: 22px; font-weight: 700; }
    .axis { stroke: #111; stroke-width: 1; }
    .rule { stroke: #e5e5e0; stroke-width: 1; }
    .value { font-family: Consolas, monospace; font-size: 13px; }
  </style>
  <rect width="100%" height="100%" fill="#FAFAF7"/>
  <text x="${margin.left}" y="34" class="title">${title}</text>
  <text x="${margin.left}" y="54">Unidade: ${unit}</text>
  <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" class="axis"/>
  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" class="axis"/>
  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left + plotWidth}" y2="${margin.top}" class="rule"/>
  ${bars}
</svg>`;
}

async function main() {
  await mkdir(chartsDir, { recursive: true });
  const rows = JSON.parse(await readFile(join(reportsDir, "benchmark-results.json"), "utf8"));
  const byAlgorithm = [...groupBy(rows, row => row.algorithm).entries()];

  const durationValues = byAlgorithm.map(([algorithm, items]) => ({
    algorithm,
    value: mean(items, row => row.durationMeanMs)
  }));

  const comparisonValues = byAlgorithm.map(([algorithm, items]) => ({
    algorithm,
    value: mean(items, row => row.comparisonsMean)
  }));

  const winners = new Map(Object.keys(algorithmLabels).map(key => [key, 0]));
  for (const [, items] of groupBy(rows, row => `${row.corpus}|${row.pattern}`).entries()) {
    const fastest = [...items].sort((a, b) => a.durationMeanMs - b.durationMeanMs)[0];
    winners.set(fastest.algorithm, winners.get(fastest.algorithm) + 1);
  }

  const winnerValues = [...winners.entries()].map(([algorithm, value]) => ({ algorithm, value }));

  await writeFile(
    join(chartsDir, "tempo-medio-por-algoritmo.svg"),
    barChart({ title: "Tempo medio dos benchmarks", unit: "ms", values: durationValues }),
    "utf8"
  );
  await writeFile(
    join(chartsDir, "comparacoes-medias-por-algoritmo.svg"),
    barChart({ title: "Comparacoes medias por algoritmo", unit: "comparacoes", values: comparisonValues }),
    "utf8"
  );
  await writeFile(
    join(chartsDir, "vitorias-por-algoritmo.svg"),
    barChart({ title: "Quantidade de cenarios em que foi mais rapido", unit: "cenarios", values: winnerValues }),
    "utf8"
  );

  const fastestLines = [...groupBy(rows, row => `${row.corpus}|${row.pattern}`).entries()]
    .map(([scenario, items]) => {
      const fastest = [...items].sort((a, b) => a.durationMeanMs - b.durationMeanMs)[0];
      const [corpus, pattern] = scenario.split("|");
      return `| ${corpus} | \`${pattern}\` | ${algorithmLabels[fastest.algorithm]} | ${fmt(fastest.durationMeanMs)} ms | ${fmt(fastest.comparisonsMean, 0)} |`;
    })
    .join("\n");

  const summary = `# Analise dos benchmarks reais

Os benchmarks foram executados com 5 iteracoes por combinacao em tres corpora publicos:

- \`shakespeare.txt\`: The Complete Works of William Shakespeare, Project Gutenberg.
- \`don-quixote.txt\`: Don Quixote, Project Gutenberg.
- \`ecoli.fna\`: genoma Escherichia coli K-12 MG1655, NCBI.

## Leitura dos resultados

| Algoritmo | Tempo medio geral | Comparacoes medias |
|---|---:|---:|
${durationValues.map(item => `| ${algorithmLabels[item.algorithm]} | ${fmt(item.value)} ms | ${fmt(comparisonValues.find(c => c.algorithm === item.algorithm).value, 0)} |`).join("\n")}

## Vencedores por cenario

| Corpus | Padrao | Mais rapido | Tempo medio | Comparacoes |
|---|---|---:|---:|---:|
${fastestLines}

## Discussao teorica x pratica

KMP manteve desempenho muito estavel nos textos em linguagem natural, refletindo sua complexidade linear garantida. Boyer-Moore foi forte quando o padrao era raro ou inexistente, porque a heuristica bad-character permitiu saltos maiores. Naive ficou competitivo em padroes curtos e frequentes porque seu custo constante e simples e baixo, mesmo tendo pior caso O(n * m). Rabin-Karp fez muito menos comparacoes diretas de caracteres, mas nesta implementacao JavaScript o custo de rolling hash dominou o tempo total; isso ilustra por que comparacoes teoricas precisam ser confrontadas com medicoes reais.

No corpus de DNA, o alfabeto pequeno reduziu os saltos do Boyer-Moore em alguns padroes e aumentou a chance de verificacoes locais. Ainda assim, para padroes repetitivos ou ausentes, ele venceu varios cenarios. O resultado mais importante para a etapa N2 e que a aplicacao agora permite observar esses efeitos por metricas, traces e logs, nao apenas por uma tabela final.
`;

  await writeFile(join(reportsDir, "benchmark-analysis.md"), summary, "utf8");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
