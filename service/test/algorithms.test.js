import assert from "node:assert/strict";
import { test } from "node:test";
import { algorithmKeys, createStrategy } from "../src/algorithms/index.js";

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

const cases = [
  { text: "abracadabra", pattern: "abr" },
  { text: "abracadabra", pattern: "cad" },
  { text: "abracadabra", pattern: "xyz" },
  { text: "aaaaaa", pattern: "aa" },
  { text: "ABABDABACDABABCABAB", pattern: "ABABCABAB" },
  { text: "GCATCGCAGAGAGTATACAGTACG", pattern: "GCAGAGAG" },
  { text: "x".repeat(1000) + "needle" + "y".repeat(1000) + "needle", pattern: "needle" },
  { text: "abc", pattern: "" },
  { text: "abc", pattern: "abcd" }
];

for (const key of algorithmKeys) {
  test(`${key} retorna as mesmas ocorrencias do indexOf`, () => {
    const strategy = createStrategy(key);
    for (const item of cases) {
      const result = strategy.execute(item.text, item.pattern);
      assert.deepEqual(result.matches, indexOfAll(item.text, item.pattern));
      assert.equal(result.matchCount, result.matches.length);
      assert.equal(result.algorithm, strategy.name);
    }
  });
}
