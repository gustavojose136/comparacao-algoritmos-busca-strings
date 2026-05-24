export class SearchResult {
  constructor({
    algorithm,
    textLength,
    patternLength,
    pattern,
    matches,
    comparisons,
    durationMs,
    complexity,
    traceId = null
  }) {
    this.algorithm = algorithm;
    this.textLength = textLength;
    this.patternLength = patternLength;
    this.pattern = pattern;
    this.matches = matches;
    this.matchCount = matches.length;
    this.comparisons = comparisons;
    this.durationMs = durationMs;
    this.complexity = complexity;
    this.traceId = traceId;
  }
}
