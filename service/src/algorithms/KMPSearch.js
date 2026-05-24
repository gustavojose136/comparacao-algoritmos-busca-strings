import { SearchStrategy } from "./SearchStrategy.js";

export class KMPSearch extends SearchStrategy {
  constructor() {
    super("Knuth-Morris-Pratt", "kmp", "O(n + m)");
  }

  buildLPS(pattern) {
    const lps = new Array(pattern.length).fill(0);
    let len = 0;
    let i = 1;

    while (i < pattern.length) {
      if (pattern[i] === pattern[len]) {
        len++;
        lps[i] = len;
        i++;
      } else if (len !== 0) {
        len = lps[len - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }

    return lps;
  }

  search(text, pattern) {
    const matches = [];
    const n = text.length;
    const m = pattern.length;

    if (m === 0 || m > n) return matches;

    const lps = this.buildLPS(pattern);
    let i = 0;
    let j = 0;

    while (i < n) {
      this.comparisons++;
      if (text[i] === pattern[j]) {
        i++;
        j++;
        if (j === m) {
          matches.push(i - j);
          j = lps[j - 1];
        }
      } else if (j !== 0) {
        j = lps[j - 1];
      } else {
        i++;
      }
    }

    return matches;
  }
}
