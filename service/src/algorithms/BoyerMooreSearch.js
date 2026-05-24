import { SearchStrategy } from "./SearchStrategy.js";

export class BoyerMooreSearch extends SearchStrategy {
  constructor() {
    super("Boyer-Moore", "boyer-moore", "O(n / m) melhor caso; O(n * m) pior caso");
  }

  buildBadCharTable(pattern) {
    const table = new Map();
    for (let i = 0; i < pattern.length; i++) {
      table.set(pattern[i], i);
    }
    return table;
  }

  search(text, pattern) {
    const matches = [];
    const n = text.length;
    const m = pattern.length;

    if (m === 0 || m > n) return matches;

    const badChar = this.buildBadCharTable(pattern);
    let s = 0;

    while (s <= n - m) {
      let j = m - 1;
      while (j >= 0) {
        this.comparisons++;
        if (text[s + j] !== pattern[j]) break;
        j--;
      }

      if (j < 0) {
        matches.push(s);
        s += 1;
      } else {
        const lastIdx = badChar.has(text[s + j]) ? badChar.get(text[s + j]) : -1;
        s += Math.max(1, j - lastIdx);
      }
    }

    return matches;
  }
}
