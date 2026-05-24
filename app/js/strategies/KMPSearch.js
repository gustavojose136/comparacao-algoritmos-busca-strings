/* ================================================================
   KMPSearch.js — Knuth-Morris-Pratt
   ================================================================
   Pré-processa o padrão para construir a tabela LPS (Longest
   Proper Prefix which is also Suffix). LPS[i] indica, para o
   prefixo pattern[0..i], qual o maior prefixo próprio que também
   é sufixo. Isso permite que, em caso de mismatch, o padrão seja
   deslocado sem reexaminar caracteres já confirmados.

   Complexidade: O(n + m), garantido (pior e médio).
   ================================================================ */

class KMPSearch extends SearchStrategy {
  constructor() {
    super("Knuth-Morris-Pratt", "O(n + m)");
  }

  /**
   * Constrói a tabela LPS para o padrão.
   * Não conta comparações desta fase no contador principal — a
   * tabela é parte do pré-processamento. Tempo: O(m).
   */
  _buildLPS(pattern) {
    const m = pattern.length;
    const lps = new Array(m).fill(0);
    let len = 0;
    let i = 1;
    while (i < m) {
      if (pattern[i] === pattern[len]) {
        len++;
        lps[i] = len;
        i++;
      } else {
        if (len !== 0) {
          len = lps[len - 1];
        } else {
          lps[i] = 0;
          i++;
        }
      }
    }
    return lps;
  }

  *steps(text, pattern) {
    this.reset();
    const n = text.length;
    const m = pattern.length;
    const matches = [];

    if (m === 0 || m > n) {
      yield this._state({
        type: "done", matches, done: true,
        message: m === 0 ? "Padrão vazio." : "Padrão maior que o texto."
      });
      return;
    }

    const lps = this._buildLPS(pattern);

    yield this._state({
      type: "aux-update",
      shift: 0, matches,
      aux: { lps, pattern, currentIdx: -1 },
      message: `Tabela LPS construída: [${lps.join(", ")}].`
    });

    let i = 0; // ponteiro no texto
    let j = 0; // ponteiro no padrão

    while (i < n) {
      this.comparisons++;
      const match = text[i] === pattern[j];

      yield this._state({
        type: "compare",
        i, j, shift: i - j,
        matchType: match ? "match" : "mismatch",
        matches: [...matches],
        aux: { lps, pattern, currentIdx: j },
        message: `text[${i}]='${text[i]}' ${match ? "=" : "≠"} pattern[${j}]='${pattern[j]}'`
      });

      if (match) {
        i++;
        j++;
        if (j === m) {
          matches.push(i - j);
          yield this._state({
            type: "match-found",
            shift: i - j, matches: [...matches],
            aux: { lps, pattern, currentIdx: j - 1 },
            message: `★ Ocorrência completa em ${i - j}. Aplicando lps[${j - 1}]=${lps[j - 1]} para próxima busca.`
          });
          j = lps[j - 1];
        }
      } else {
        if (j !== 0) {
          const prev = j;
          j = lps[j - 1];
          yield this._state({
            type: "shift",
            shift: i - j, matches: [...matches],
            aux: { lps, pattern, currentIdx: j },
            message: `Mismatch com j=${prev}. lps[${prev - 1}]=${lps[prev - 1]} → j salta para ${j}.`
          });
        } else {
          i++;
          yield this._state({
            type: "shift",
            shift: i, matches: [...matches],
            aux: { lps, pattern, currentIdx: 0 },
            message: `Mismatch com j=0 → avança i para ${i}.`
          });
        }
      }
    }

    yield this._state({
      type: "done", matches, done: true,
      aux: { lps, pattern, currentIdx: -1 },
      message: `Busca concluída. ${matches.length} ocorrência(s) · ${this.comparisons} comparação(ões).`
    });
  }

  search(text, pattern) {
    this.reset();
    const t0 = performance.now();
    const matches = [];
    const n = text.length;
    const m = pattern.length;

    if (m === 0 || m > n) {
      return { matches, comparisons: 0, timeMs: performance.now() - t0 };
    }

    const lps = this._buildLPS(pattern);
    let i = 0, j = 0;
    while (i < n) {
      this.comparisons++;
      if (text[i] === pattern[j]) {
        i++; j++;
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

    return { matches, comparisons: this.comparisons, timeMs: performance.now() - t0 };
  }
}
