import { performance } from "node:perf_hooks";
import { SearchResult } from "./SearchResult.js";

export class SearchStrategy {
  constructor(name, key, complexity) {
    if (new.target === SearchStrategy) {
      throw new Error("SearchStrategy is abstract.");
    }
    this.name = name;
    this.key = key;
    this.complexity = complexity;
    this.comparisons = 0;
  }

  reset() {
    this.comparisons = 0;
  }

  execute(text, pattern, traceId = null) {
    this.reset();
    const t0 = performance.now();
    const matches = this.search(text, pattern);
    const durationMs = performance.now() - t0;

    return new SearchResult({
      algorithm: this.name,
      textLength: text.length,
      patternLength: pattern.length,
      pattern,
      matches,
      comparisons: this.comparisons,
      durationMs,
      complexity: this.complexity,
      traceId
    });
  }

  search() {
    throw new Error(`${this.constructor.name}.search() not implemented.`);
  }
}
