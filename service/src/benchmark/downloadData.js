import { createReadStream, createWriteStream, existsSync, mkdirSync } from "node:fs";
import { readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import https from "node:https";

const dataDir = resolve(process.cwd(), "..", "data");

const sources = [
  {
    id: "shakespeare",
    url: "https://www.gutenberg.org/files/100/100-0.txt",
    output: "shakespeare.txt",
    description: "The Complete Works of William Shakespeare, Project Gutenberg"
  },
  {
    id: "don-quixote",
    url: "https://www.gutenberg.org/files/996/996-0.txt",
    output: "don-quixote.txt",
    description: "Don Quixote, Project Gutenberg"
  },
  {
    id: "ecoli",
    url: "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/005/845/GCF_000005845.2_ASM584v2/GCF_000005845.2_ASM584v2_genomic.fna.gz",
    output: "ecoli.fna",
    gzip: true,
    description: "Escherichia coli str. K-12 substr. MG1655 genome, NCBI"
  }
];

function download(url, destination) {
  return new Promise((resolveDownload, rejectDownload) => {
    https.get(url, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        download(response.headers.location, destination).then(resolveDownload, rejectDownload);
        return;
      }
      if (response.statusCode !== 200) {
        rejectDownload(new Error(`HTTP ${response.statusCode} ao baixar ${url}`));
        return;
      }
      pipeline(response, createWriteStream(destination)).then(resolveDownload, rejectDownload);
    }).on("error", rejectDownload);
  });
}

async function ensureFallbackCorpus() {
  const files = await readdir(dataDir).catch(() => []);
  if (files.length > 0) return;

  const fallbackText = [
    "Corpus sintetico de contingencia para execucao offline.",
    "Use npm run data:download para substituir por dados publicos reais.",
    "algoritmo busca string padrao observabilidade telemetry traces metrics logs"
  ].join("\n");

  await writeFile(join(dataDir, "fallback-text.txt"), fallbackText.repeat(50000), "utf8");
  await writeFile(join(dataDir, "fallback-dna.fna"), `>fallback\n${"ACGTGATTACATTTACG".repeat(300000)}`, "utf8");
}

mkdirSync(dataDir, { recursive: true });

for (const source of sources) {
  const target = join(dataDir, source.output);
  if (existsSync(target)) {
    const info = await stat(target);
    console.log(`${source.output} ja existe (${info.size} bytes).`);
    continue;
  }

  const tmp = join(dataDir, `${basename(source.output)}.download`);
  console.log(`Baixando ${source.description}...`);
  await download(source.url, tmp);

  if (source.gzip) {
    const extracted = `${tmp}.extracted`;
    await pipeline(
      createReadStream(tmp),
      createGunzip(),
      createWriteStream(extracted)
    );
    await rename(extracted, target);
  } else {
    await rename(tmp, target);
  }
}

await writeFile(
  join(dataDir, "SOURCES.md"),
  sources.map(source => `- ${source.output}: ${source.description} (${source.url})`).join("\n") + "\n",
  "utf8"
);

await ensureFallbackCorpus();
