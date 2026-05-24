// Test harness — valida os 4 algoritmos contra String.prototype.indexOf
const fs = require("fs");
const path = require("path");

const files = [
  "js/metrics.js",
  "js/strategies/SearchStrategy.js",
  "js/strategies/NaiveSearch.js",
  "js/strategies/RabinKarpSearch.js",
  "js/strategies/KMPSearch.js",
  "js/strategies/BoyerMooreSearch.js",
];

const combined = files.map(f => fs.readFileSync(path.join(__dirname, f), "utf8")).join("\n");

// concat + test code together so classes are visible
const testCode = `
function indexOfAll(text, pattern) {
  if (!pattern) return [];
  const out = [];
  let i = 0;
  while (true) {
    const idx = text.indexOf(pattern, i);
    if (idx === -1) break;
    out.push(idx);
    i = idx + 1;
  }
  return out;
}

const testCases = [
  { text: "abracadabra", pattern: "abr" },
  { text: "abracadabra", pattern: "cad" },
  { text: "abracadabra", pattern: "xyz" },
  { text: "aaaaaa", pattern: "aa" },
  { text: "ababababab", pattern: "abab" },
  { text: "the quick brown fox jumps over the lazy dog", pattern: "the" },
  { text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", pattern: "dolor" },
  { text: "AABAACAADAABAABA", pattern: "AABA" },
  { text: "ABABDABACDABABCABAB", pattern: "ABABCABAB" },
  { text: "GCATCGCAGAGAGTATACAGTACG", pattern: "GCAGAGAG" },
  { text: "a", pattern: "a" },
  { text: "a", pattern: "b" },
  { text: "abc", pattern: "abcd" },
  { text: "abc", pattern: "" },
  { text: "x".repeat(1000) + "needle" + "y".repeat(1000) + "needle" + "z".repeat(500), pattern: "needle" },
  { text: "abcdefghij".repeat(100), pattern: "fghi" },
  { text: "olá, mundo! como vai?", pattern: "mundo" },
  { text: "ababababababababababab", pattern: "ababab" },
];

const algs = [
  ["Naive", new NaiveSearch()],
  ["Rabin-Karp", new RabinKarpSearch()],
  ["KMP", new KMPSearch()],
  ["Boyer-Moore", new BoyerMooreSearch()],
];

let fails = 0, passes = 0;

for (const tc of testCases) {
  const expected = indexOfAll(tc.text, tc.pattern);
  const preview = tc.text.length > 40 ? tc.text.slice(0, 37) + "..." : tc.text;
  for (const [name, alg] of algs) {
    const result = alg.search(tc.text, tc.pattern);
    const ok = JSON.stringify(result.matches) === JSON.stringify(expected);
    if (ok) passes++;
    else {
      fails++;
      console.log("FAIL search() [" + name + "] text=" + JSON.stringify(preview) + " pattern=" + JSON.stringify(tc.pattern));
      console.log("  esperado:", JSON.stringify(expected));
      console.log("  obtido:  ", JSON.stringify(result.matches));
    }
  }
}

console.log("--- Validando generator steps() vs search() ---");
for (const tc of testCases) {
  for (const [name, alg] of algs) {
    const directResult = alg.search(tc.text, tc.pattern);
    alg.reset();
    let lastState = null;
    for (const s of alg.steps(tc.text, tc.pattern)) {
      lastState = s;
      if (s.done) break;
    }
    const genMatches = lastState ? lastState.matches : [];
    const ok = JSON.stringify(genMatches) === JSON.stringify(directResult.matches);
    if (!ok) {
      fails++;
      const preview = tc.text.length > 40 ? tc.text.slice(0, 37) + "..." : tc.text;
      console.log("GENERATOR MISMATCH [" + name + "] text=" + JSON.stringify(preview) + " pattern=" + JSON.stringify(tc.pattern));
      console.log("  search():", JSON.stringify(directResult.matches));
      console.log("  *steps():", JSON.stringify(genMatches));
    } else passes++;
  }
}

console.log("=== " + passes + " passou · " + fails + " falhou ===");
if (fails > 0) process.exit(1);
`;

eval(combined + testCode);
