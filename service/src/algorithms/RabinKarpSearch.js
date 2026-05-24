import { SearchStrategy } from "./SearchStrategy.js";

export class RabinKarpSearch extends SearchStrategy {
  constructor() {
    super("Rabin-Karp", "rabin-karp", "O(n + m) medio; O(n * m) pior caso");
    this.d = 256;
    this.q = 1000003;
  }

  search(text, pattern) {
    const matches = [];
    const n = text.length;
    const m = pattern.length;
    const { d, q } = this;

    if (m === 0 || m > n) return matches;

    let h = 1;
    for (let i = 0; i < m - 1; i++) h = (h * d) % q;

    let patHash = 0;
    let winHash = 0;
    for (let i = 0; i < m; i++) {
      patHash = (d * patHash + pattern.charCodeAt(i)) % q;
      winHash = (d * winHash + text.charCodeAt(i)) % q;
    }

    for (let s = 0; s <= n - m; s++) {
      if (patHash === winHash) {
        let j = 0;
        while (j < m) {
          this.comparisons++;
          if (text[s + j] !== pattern[j]) break;
          j++;
        }
        if (j === m) matches.push(s);
      }

      if (s < n - m) {
        winHash = (d * (winHash - text.charCodeAt(s) * h) + text.charCodeAt(s + m)) % q;
        if (winHash < 0) winHash += q;
      }
    }

    return matches;
  }
}
