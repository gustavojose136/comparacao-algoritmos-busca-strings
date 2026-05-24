/* ================================================================
   metrics.js — utilidades para medição de tempo e formatação
   ================================================================ */

const Metrics = {

  /**
   * Cronometra a execução síncrona de uma função.
   * Retorna { result, timeMs } onde timeMs tem precisão sub-milissegundo
   * (depende do navegador, geralmente ~5µs no Chrome moderno).
   */
  measure(fn) {
    const t0 = performance.now();
    const result = fn();
    const t1 = performance.now();
    return { result, timeMs: t1 - t0 };
  },

  /**
   * Formata um valor de tempo em ms para exibição.
   * Usa unidades adequadas: µs para valores < 1ms, ms caso contrário.
   */
  formatTime(timeMs) {
    if (timeMs === null || timeMs === undefined || Number.isNaN(timeMs)) return "—";
    if (timeMs < 0.001) return "< 1 µs";
    if (timeMs < 1) return (timeMs * 1000).toFixed(1) + " µs";
    if (timeMs < 100) return timeMs.toFixed(3) + " ms";
    return timeMs.toFixed(1) + " ms";
  },

  /**
   * Formata um número grande com separador de milhares (pt-BR).
   */
  formatNumber(n) {
    if (n === null || n === undefined) return "—";
    return n.toLocaleString("pt-BR");
  },

  /**
   * Formata o tamanho de um arquivo em bytes para uma string legível.
   */
  formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

};
