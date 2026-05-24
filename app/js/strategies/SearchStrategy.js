/* ================================================================
   SearchStrategy.js — Classe base abstrata (padrão Strategy)
   ================================================================ */

/**
 * Classe base para todas as estratégias de busca em strings.
 *
 * Cada algoritmo concreto deve implementar:
 *
 *   - search(text, pattern)  → execução normal, retorna o resultado final
 *   - *steps(text, pattern)  → generator que produz estados intermediários
 *
 * Ambos contam comparações na propriedade this.comparisons.
 *
 * Formato do estado yielded por steps():
 * {
 *   type:        'compare' | 'match-found' | 'shift' | 'aux-update' | 'done',
 *   i:           number,         // índice atual no texto
 *   j:           number,         // índice atual no padrão
 *   shift:       number,         // deslocamento corrente do padrão
 *   comparisons: number,         // total acumulado de comparações
 *   matchType:   'match' | 'mismatch' | null,
 *   matches:     number[],       // ocorrências confirmadas até aqui (índices iniciais)
 *   aux:         object | null,  // estrutura auxiliar do algoritmo
 *   message:     string,         // descrição humana para o log
 *   done:        boolean
 * }
 */
class SearchStrategy {

  /**
   * @param {string} name        Nome legível do algoritmo
   * @param {string} complexity  Complexidade teórica em notação legível
   */
  constructor(name, complexity) {
    if (new.target === SearchStrategy) {
      throw new Error("SearchStrategy é abstrata e não pode ser instanciada diretamente.");
    }
    this.name = name;
    this.complexity = complexity;
    this.comparisons = 0;
  }

  /** Reinicia contadores antes de uma nova execução. */
  reset() {
    this.comparisons = 0;
  }

  /**
   * Execução normal. Retorna:
   * { matches: number[], comparisons: number, timeMs: number }
   *
   * Por padrão é implementada *consumindo* o generator steps(), assim
   * cada estratégia precisa implementar apenas a versão passo a passo.
   * Subclasses podem override para uma versão otimizada (sem yields).
   */
  search(text, pattern) {
    this.reset();
    const t0 = performance.now();
    let matches = [];
    for (const state of this.steps(text, pattern)) {
      if (state.done) {
        matches = state.matches;
        break;
      }
    }
    const t1 = performance.now();
    return {
      matches,
      comparisons: this.comparisons,
      timeMs: t1 - t0
    };
  }

  /**
   * Generator abstrato. Subclasses DEVEM sobrescrever.
   * Deve sempre yieldar um estado final com done:true.
   */
  *steps(text, pattern) {
    throw new Error(`${this.constructor.name}.steps() não implementado.`);
    // eslint-disable-next-line no-unreachable
    yield;
  }

  /**
   * Helper: cria um objeto de estado consistente.
   * Subclasses chamam isso para padronizar o formato.
   */
  _state({ type, i = -1, j = -1, shift = 0, matchType = null, matches = [], aux = null, message = "", done = false }) {
    return {
      type, i, j, shift,
      comparisons: this.comparisons,
      matchType, matches, aux, message, done
    };
  }
}
