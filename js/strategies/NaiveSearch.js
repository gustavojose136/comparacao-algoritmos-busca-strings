/* ================================================================
   NaiveSearch.js — Busca por força bruta
   ================================================================
   Para cada deslocamento s = 0 .. n-m, compara pattern[0..m-1]
   com text[s..s+m-1] caractere a caractere. Reinicia totalmente
   quando há mismatch.
   Complexidade: O(n · m) no pior caso, O(n) no melhor caso.
   ================================================================ */

class NaiveSearch extends SearchStrategy {
  constructor() {
    super("Naive", "O(n · m)");
  }

  *steps(text, pattern) {
    this.reset();
    const n = text.length;
    const m = pattern.length;
    const matches = [];

    // estado inicial
    yield this._state({
      type: "shift",
      shift: 0,
      matches,
      message: `Início da busca Naive. Texto: ${n} chars · Padrão: "${pattern}" (${m} chars).`
    });

    if (m === 0 || m > n) {
      yield this._state({
        type: "done", matches, done: true,
        message: m === 0 ? "Padrão vazio." : "Padrão maior que o texto — nenhuma ocorrência possível."
      });
      return;
    }

    for (let s = 0; s <= n - m; s++) {
      // anuncia novo alinhamento
      yield this._state({
        type: "shift",
        shift: s,
        matches: [...matches],
        message: `Tentativa em deslocamento s = ${s}.`
      });

      let j = 0;
      while (j < m) {
        this.comparisons++;
        const match = text[s + j] === pattern[j];

        yield this._state({
          type: "compare",
          i: s + j,
          j: j,
          shift: s,
          matchType: match ? "match" : "mismatch",
          matches: [...matches],
          message: `text[${s + j}] = '${text[s + j]}' ${match ? "=" : "≠"} pattern[${j}] = '${pattern[j]}'`
        });

        if (!match) break;
        j++;
      }

      if (j === m) {
        matches.push(s);
        yield this._state({
          type: "match-found",
          shift: s,
          matches: [...matches],
          message: `★ Ocorrência completa encontrada em ${s}.`
        });
      }
    }

    yield this._state({
      type: "done",
      matches,
      done: true,
      message: `Busca concluída. ${matches.length} ocorrência(s) · ${this.comparisons} comparação(ões).`
    });
  }

  /** Versão otimizada sem o overhead de gerar estados intermediários. */
  search(text, pattern) {
    this.reset();
    const t0 = performance.now();
    const matches = [];
    const n = text.length;
    const m = pattern.length;

    if (m > 0 && m <= n) {
      for (let s = 0; s <= n - m; s++) {
        let j = 0;
        while (j < m) {
          this.comparisons++;
          if (text[s + j] !== pattern[j]) break;
          j++;
        }
        if (j === m) matches.push(s);
      }
    }

    const t1 = performance.now();
    return { matches, comparisons: this.comparisons, timeMs: t1 - t0 };
  }
}
