import { SearchStrategy } from "./SearchStrategy.js";

export class NaiveSearch extends SearchStrategy {
  constructor() {
    super("Naive", "naive", "O(n * m)");
  }

  search(text, pattern) {
    const matches = [];
    const n = text.length;
    const m = pattern.length;

    if (m === 0 || m > n) return matches;

    for (let s = 0; s <= n - m; s++) {
      let j = 0;
      while (j < m) {
        this.comparisons++;
        if (text[s + j] !== pattern[j]) break;
        j++;
      }
      if (j === m) matches.push(s);
    }

    return matches;
  }
}
