/* ================================================================
   BoyerMooreSearch.js — Boyer-Moore (heurística bad-character)
   ================================================================
   Compara o padrão com o texto da DIREITA para a esquerda. Em caso
   de mismatch, usa a tabela bad-character para deslocar o padrão de
   forma a alinhar a última ocorrência do caractere problemático no
   padrão com a posição no texto.

   Esta implementação usa apenas a heurística bad-character (também
   conhecida como Boyer-Moore-Horspool simplificado). A versão
   completa do Boyer-Moore inclui também a heurística good-suffix,
   mas a bad-character sozinha já demonstra o princípio central do
   algoritmo e é a forma usualmente apresentada em cursos
   introdutórios.

   Complexidade: O(n/m) no melhor caso (alfabetos grandes, padrões
   distintos do texto), O(n · m) no pior caso.
   ================================================================ */

class BoyerMooreSearch extends SearchStrategy {
  constructor() {
    super("Boyer-Moore", "O(n / m) melhor caso");
  }

  /**
   * Constrói a tabela bad-character.
   * Para cada caractere do padrão, guarda o último índice em que
   * aparece. Para caracteres ausentes, retorna -1.
   * Usa Map para suportar qualquer caractere (Unicode).
   */
  _buildBadCharTable(pattern) {
    const table = new Map();
    for (let i = 0; i < pattern.length; i++) {
      table.set(pattern[i], i);
    }
    return table;
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

    const badChar = this._buildBadCharTable(pattern);
    const badCharObj = Object.fromEntries(badChar); // para o painel UI

    yield this._state({
      type: "aux-update",
      shift: 0, matches,
      aux: { badChar: badCharObj, pattern, lastAccess: null },
      message: `Tabela bad-character construída com ${badChar.size} entrada(s).`
    });

    let s = 0;
    while (s <= n - m) {
      yield this._state({
        type: "shift", shift: s, matches: [...matches],
        aux: { badChar: badCharObj, pattern, lastAccess: null },
        message: `Tentando alinhamento s = ${s}.`
      });

      let j = m - 1;

      // varredura da direita para a esquerda
      while (j >= 0) {
        this.comparisons++;
        const match = text[s + j] === pattern[j];

        yield this._state({
          type: "compare",
          i: s + j, j, shift: s,
          matchType: match ? "match" : "mismatch",
          matches: [...matches],
          aux: { badChar: badCharObj, pattern, lastAccess: null },
          message: `text[${s + j}]='${text[s + j]}' ${match ? "=" : "≠"} pattern[${j}]='${pattern[j]}' (varredura direita→esquerda)`
        });

        if (!match) break;
        j--;
      }

      if (j < 0) {
        // padrão totalmente alinhado
        matches.push(s);
        yield this._state({
          type: "match-found",
          shift: s, matches: [...matches],
          aux: { badChar: badCharObj, pattern, lastAccess: null },
          message: `★ Ocorrência completa em ${s}. Avança 1 posição.`
        });
        s += 1;
      } else {
        // calcula salto pela bad-character heuristic
        const badChrInText = text[s + j];
        const lastIdx = badChar.has(badChrInText) ? badChar.get(badChrInText) : -1;
        const shift = Math.max(1, j - lastIdx);

        yield this._state({
          type: "shift", shift: s, matches: [...matches],
          aux: { badChar: badCharObj, pattern, lastAccess: badChrInText },
          message: `Bad-char: '${badChrInText}' último idx no padrão = ${lastIdx}. Salto = max(1, ${j} - ${lastIdx}) = ${shift}.`
        });

        s += shift;
      }
    }

    yield this._state({
      type: "done", matches, done: true,
      aux: { badChar: badCharObj, pattern, lastAccess: null },
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

    const badChar = this._buildBadCharTable(pattern);

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

    return { matches, comparisons: this.comparisons, timeMs: performance.now() - t0 };
  }
}
