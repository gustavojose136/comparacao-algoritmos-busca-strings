/* ================================================================
   RabinKarpSearch.js — Busca por hash (rolling hash)
   ================================================================
   Calcula o hash do padrão e desliza uma janela do mesmo tamanho
   pelo texto, recalculando o hash em O(1) com a técnica de rolling
   hash. Quando os hashes batem, faz verificação caractere a
   caractere para evitar falsos positivos (colisão).

   Hash: polinomial módulo q, base d.
      h(s) = (s[0]·d^(m-1) + s[1]·d^(m-2) + ... + s[m-1]) mod q
   Rolling step:
      h' = (d·(h - s[i]·d^(m-1)) + s[i+m]) mod q

   Complexidade: O(n + m) médio, O(n · m) pior caso (muitas colisões).
   ================================================================ */

class RabinKarpSearch extends SearchStrategy {
  constructor() {
    super("Rabin-Karp", "O(n + m) médio");
    this.d = 256;       // tamanho do alfabeto (ASCII estendido)
    this.q = 1000003;   // primo grande para reduzir colisões
  }

  *steps(text, pattern) {
    this.reset();
    const n = text.length;
    const m = pattern.length;
    const matches = [];
    const { d, q } = this;

    yield this._state({
      type: "shift", shift: 0, matches,
      aux: { patternHash: null, windowHash: null, q, d, m },
      message: `Início Rabin-Karp. d=${d}, q=${q}, padrão "${pattern}".`
    });

    if (m === 0 || m > n) {
      yield this._state({
        type: "done", matches, done: true,
        message: m === 0 ? "Padrão vazio." : "Padrão maior que o texto."
      });
      return;
    }

    // pré-cálculo de d^(m-1) mod q
    let h = 1;
    for (let i = 0; i < m - 1; i++) h = (h * d) % q;

    // hash do padrão e da primeira janela
    let patHash = 0;
    let winHash = 0;
    for (let i = 0; i < m; i++) {
      patHash = (d * patHash + pattern.charCodeAt(i)) % q;
      winHash = (d * winHash + text.charCodeAt(i)) % q;
    }

    yield this._state({
      type: "aux-update", shift: 0, matches: [...matches],
      aux: { patternHash: patHash, windowHash: winHash, q, d, m, windowStart: 0 },
      message: `Hash do padrão = ${patHash}. Hash da primeira janela [0..${m - 1}] = ${winHash}.`
    });

    for (let s = 0; s <= n - m; s++) {
      // hashes iguais? verifica caractere a caractere
      if (patHash === winHash) {
        yield this._state({
          type: "shift", shift: s, matches: [...matches],
          aux: { patternHash: patHash, windowHash: winHash, q, d, m, windowStart: s, hashMatch: true },
          message: `Hashes iguais em s=${s}. Verificando caracteres...`
        });

        let j = 0;
        while (j < m) {
          this.comparisons++;
          const match = text[s + j] === pattern[j];

          yield this._state({
            type: "compare",
            i: s + j, j, shift: s,
            matchType: match ? "match" : "mismatch",
            matches: [...matches],
            aux: { patternHash: patHash, windowHash: winHash, q, d, m, windowStart: s, hashMatch: true },
            message: `text[${s + j}]='${text[s + j]}' ${match ? "=" : "≠"} pattern[${j}]='${pattern[j]}'`
          });

          if (!match) break;
          j++;
        }

        if (j === m) {
          matches.push(s);
          yield this._state({
            type: "match-found", shift: s, matches: [...matches],
            aux: { patternHash: patHash, windowHash: winHash, q, d, m, windowStart: s },
            message: `★ Ocorrência confirmada em ${s}.`
          });
        } else {
          yield this._state({
            type: "shift", shift: s, matches: [...matches],
            aux: { patternHash: patHash, windowHash: winHash, q, d, m, windowStart: s, hashMatch: true, spurious: true },
            message: `Falso positivo (colisão de hash) em s=${s}.`
          });
        }
      } else {
        // mesmo sem verificar caracteres, mostramos o estado de comparação de hash
        yield this._state({
          type: "shift", shift: s, matches: [...matches],
          aux: { patternHash: patHash, windowHash: winHash, q, d, m, windowStart: s, hashMatch: false },
          message: `s=${s}: hash da janela ${winHash} ≠ hash do padrão ${patHash}.`
        });
      }

      // rolling hash: avança para a próxima janela
      if (s < n - m) {
        winHash = (d * (winHash - text.charCodeAt(s) * h) + text.charCodeAt(s + m)) % q;
        if (winHash < 0) winHash += q;
      }
    }

    yield this._state({
      type: "done", matches, done: true,
      aux: { patternHash: patHash, q, d, m },
      message: `Busca concluída. ${matches.length} ocorrência(s) · ${this.comparisons} comparação(ões) de caractere.`
    });
  }

  search(text, pattern) {
    this.reset();
    const t0 = performance.now();
    const matches = [];
    const n = text.length;
    const m = pattern.length;
    const { d, q } = this;

    if (m === 0 || m > n) {
      return { matches, comparisons: 0, timeMs: performance.now() - t0 };
    }

    let h = 1;
    for (let i = 0; i < m - 1; i++) h = (h * d) % q;

    let patHash = 0, winHash = 0;
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

    return { matches, comparisons: this.comparisons, timeMs: performance.now() - t0 };
  }
}
