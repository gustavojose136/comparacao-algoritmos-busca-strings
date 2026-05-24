/* ================================================================
   ui.js — Camada de UI
   ================================================================
   Encapsula manipulação do DOM, renderização da visualização do
   passo a passo, estruturas auxiliares, log e resultados.
   ================================================================ */

const UI = {

  // -------- Configurações --------
  WINDOW_SIZE: 80,         // largura da janela de visualização do texto (caracteres)

  // -------- Referências do DOM (preenchidas em init) --------
  el: {},

  init() {
    this.el = {
      fileInput:        document.getElementById("file-input"),
      fileInputLabel:   document.getElementById("file-input-label"),
      fileList:         document.getElementById("file-list"),
      patternInput:     document.getElementById("pattern-input"),
      algorithmSelect:  document.getElementById("algorithm-select"),
      btnRun:           document.getElementById("btn-run"),
      btnStep:          document.getElementById("btn-step"),
      btnPrev:          document.getElementById("btn-prev"),
      btnNext:          document.getElementById("btn-next"),
      btnReset:         document.getElementById("btn-reset"),
      vizText:          document.getElementById("viz-text"),
      stepCounter:      document.getElementById("step-counter"),
      stateI:           document.getElementById("state-i"),
      stateJ:           document.getElementById("state-j"),
      stateTextLen:     document.getElementById("state-textlen"),
      statePatLen:      document.getElementById("state-patlen"),
      stateComparisons: document.getElementById("state-comparisons"),
      stateShift:       document.getElementById("state-shift"),
      stateTime:        document.getElementById("state-time"),
      auxContent:       document.getElementById("aux-content"),
      log:              document.getElementById("log"),
      resultsBody:      document.getElementById("results-body"),
    };
  },

  // -------- Lista de arquivos --------

  renderFileList(files, selectedIndex) {
    const list = this.el.fileList;
    if (!files.length) {
      list.innerHTML = `<li class="file-list-empty">Nenhum arquivo carregado.</li>`;
      return;
    }
    list.innerHTML = files.map((f, idx) => `
      <li class="file-list-item ${idx === selectedIndex ? "selected" : ""}" data-idx="${idx}">
        <span class="file-marker"></span>
        <span class="file-name">${escapeHTML(f.name)}</span>
        <span class="file-size">${Metrics.formatBytes(f.size)}</span>
      </li>
    `).join("");
  },

  // -------- Visualização --------

  /**
   * Renderiza a janela do texto + linha do padrão alinhada.
   * @param {string} text       Texto completo
   * @param {string} pattern    Padrão de busca
   * @param {object} state      Estado yieldado por uma strategy
   */
  renderVisualization(text, pattern, state) {
    const n = text.length;
    const m = pattern.length;

    // pivot: prioriza o índice de comparação atual; se não há, usa o shift
    const pivot = state.i >= 0 ? state.i : (state.shift >= 0 ? state.shift : 0);

    // janela: centraliza no pivot, ajusta para não sair dos limites
    let start = Math.max(0, pivot - Math.floor(this.WINDOW_SIZE / 2));
    let end = Math.min(n, start + this.WINDOW_SIZE);
    if (end - start < this.WINDOW_SIZE) {
      start = Math.max(0, end - this.WINDOW_SIZE);
    }

    // intervalo de matches confirmados (cada match cobre m caracteres)
    const matchRanges = (state.matches || []).map(s => [s, s + m - 1]);
    const isMatchedIdx = idx => matchRanges.some(([a, b]) => idx >= a && idx <= b);

    // linha do texto
    const textChars = [];
    for (let idx = start; idx < end; idx++) {
      const ch = text[idx];
      const classes = ["char"];

      // dentro da janela ativa do padrão?
      const inActiveWindow = idx >= state.shift && idx < state.shift + m;
      if (inActiveWindow) classes.push("char-window");

      if (state.type === "compare" && idx === state.i) {
        classes.push("char-current");
        classes.push(state.matchType === "match" ? "char-match" : "char-mismatch");
      } else if (isMatchedIdx(idx)) {
        classes.push("char-match");
      }

      textChars.push(`<span class="${classes.join(" ")}">${escapeChar(ch)}</span>`);
    }

    // linha do padrão (alinhada por padding-left)
    const offset = state.shift - start;
    const patternChars = [];
    for (let pj = 0; pj < m; pj++) {
      const classes = ["char"];
      if (state.type === "compare" && pj === state.j) {
        classes.push("char-current");
        classes.push(state.matchType === "match" ? "char-match" : "char-mismatch");
      }
      patternChars.push(`<span class="${classes.join(" ")}">${escapeChar(pattern[pj])}</span>`);
    }

    // indicadores de truncamento
    const leftEllipsis = start > 0 ? `<span class="char-ellipsis">[...${start} chars]</span>` : "";
    const rightEllipsis = end < n ? `<span class="char-ellipsis">[${n - end} chars...]</span>` : "";

    this.el.vizText.innerHTML = `
      <div class="viz-text-row">${leftEllipsis}${textChars.join("")}${rightEllipsis}</div>
      <div class="viz-pattern-row" style="padding-left: calc(${offset}ch${start > 0 ? " + 13ch" : ""});">${patternChars.join("")}</div>
    `;
  },

  /** Limpa a área de visualização. */
  clearVisualization() {
    this.el.vizText.innerHTML = `<div class="viz-empty">Carregue um arquivo e defina um padrão para começar.</div>`;
  },

  // -------- Painel de estado --------

  renderState(state, timeMs) {
    this.el.stateI.textContent = state.i >= 0 ? state.i : "—";
    this.el.stateJ.textContent = state.j >= 0 ? state.j : "—";
    this.el.stateComparisons.textContent = Metrics.formatNumber(state.comparisons || 0);
    this.el.stateShift.textContent = state.shift >= 0 ? state.shift : "—";
    this.el.stateTime.textContent = timeMs !== undefined ? Metrics.formatTime(timeMs) : "—";
  },

  setSizes(textLen, patternLen) {
    this.el.stateTextLen.textContent = textLen != null ? Metrics.formatNumber(textLen) : "—";
    this.el.statePatLen.textContent  = patternLen != null ? Metrics.formatNumber(patternLen) : "—";
  },

  clearState() {
    this.el.stateI.textContent = "—";
    this.el.stateJ.textContent = "—";
    this.el.stateComparisons.textContent = "0";
    this.el.stateShift.textContent = "—";
    this.el.stateTime.textContent = "—";
    this.el.stateTextLen.textContent = "—";
    this.el.statePatLen.textContent = "—";
  },

  // -------- Estrutura auxiliar (depende do algoritmo) --------

  renderAux(state, algorithmKey) {
    const c = this.el.auxContent;
    if (!state.aux) {
      c.innerHTML = `<p class="aux-empty">A estrutura aparece quando o algoritmo é executado.</p>`;
      return;
    }
    const aux = state.aux;

    if (algorithmKey === "kmp" && aux.lps) {
      c.innerHTML = this._renderLPS(aux.lps, aux.pattern, aux.currentIdx);
    } else if (algorithmKey === "boyer-moore" && aux.badChar) {
      c.innerHTML = this._renderBadChar(aux.badChar, aux.lastAccess);
    } else if (algorithmKey === "rabin-karp" && aux.q) {
      c.innerHTML = this._renderHash(aux);
    } else if (algorithmKey === "naive") {
      c.innerHTML = `<p class="aux-empty">Naive não usa estrutura auxiliar.</p>`;
    } else {
      c.innerHTML = `<p class="aux-empty">—</p>`;
    }
  },

  clearAux() {
    this.el.auxContent.innerHTML = `<p class="aux-empty">A estrutura aparece quando o algoritmo é executado.</p>`;
  },

  _renderLPS(lps, pattern, currentIdx) {
    const cols = lps.map((v, i) => {
      const hl = i === currentIdx ? " cell-current" : "";
      return `<td class="${hl.trim()}">${v}</td>`;
    }).join("");
    const idxs = lps.map((_, i) => `<td>${i}</td>`).join("");
    const chars = pattern.split("").map((c, i) => {
      const hl = i === currentIdx ? " cell-current" : "";
      return `<td class="${hl.trim()}">${escapeChar(c)}</td>`;
    }).join("");
    return `
      <p style="margin:0 0 .5rem; color: var(--ink-muted); font-family: var(--font-body); font-size: var(--fs-small);">
        Tabela LPS (Longest Proper Prefix-Suffix)
      </p>
      <table class="aux-table">
        <tr><th>i</th>${idxs}</tr>
        <tr><th>pattern[i]</th>${chars}</tr>
        <tr><th>lps[i]</th>${cols}</tr>
      </table>
    `;
  },

  _renderBadChar(badCharObj, lastAccess) {
    const entries = Object.entries(badCharObj);
    if (!entries.length) return `<p class="aux-empty">—</p>`;
    const rows = entries.map(([ch, idx]) => {
      const hl = ch === lastAccess ? " cell-current" : "";
      return `<tr><td class="${hl.trim()}">${escapeChar(ch)}</td><td class="${hl.trim()}">${idx}</td></tr>`;
    }).join("");
    return `
      <p style="margin:0 0 .5rem; color: var(--ink-muted); font-family: var(--font-body); font-size: var(--fs-small);">
        Tabela bad-character (último índice de cada caractere no padrão)
      </p>
      <table class="aux-table">
        <tr><th>caractere</th><th>último idx</th></tr>
        ${rows}
      </table>
    `;
  },

  _renderHash(aux) {
    const same = aux.patternHash === aux.windowHash;
    return `
      <p style="margin:0 0 .5rem; color: var(--ink-muted); font-family: var(--font-body); font-size: var(--fs-small);">
        Rolling hash (mod q = ${aux.q}, base d = ${aux.d})
      </p>
      <table class="aux-table">
        <tr><th>hash(padrão)</th><td>${aux.patternHash ?? "—"}</td></tr>
        <tr><th>hash(janela)</th><td class="${same ? "cell-current" : ""}">${aux.windowHash ?? "—"}</td></tr>
        <tr><th>início da janela</th><td>${aux.windowStart ?? "—"}</td></tr>
        ${aux.spurious ? `<tr><th colspan="2" style="color: var(--mismatch);">colisão (falso positivo)</th></tr>` : ""}
      </table>
    `;
  },

  // -------- Log --------

  clearLog() {
    this.el.log.innerHTML = "";
  },

  appendLog(message) {
    if (!message) return;
    const li = document.createElement("li");
    li.textContent = message;
    this.el.log.appendChild(li);
    this.el.log.scrollTop = this.el.log.scrollHeight;
  },

  setEmptyLog() {
    this.el.log.innerHTML = `<li class="log-empty">Nenhuma execução ainda.</li>`;
  },

  // -------- Tabela de resultados --------

  renderResults(results) {
    if (!results.length) {
      this.el.resultsBody.innerHTML = `
        <tr class="results-empty"><td colspan="6">Execute para ver resultados.</td></tr>
      `;
      return;
    }
    // Encontra o vencedor (menor tempo) entre execuções comparáveis
    const minTime = Math.min(...results.map(r => r.timeMs));

    this.el.resultsBody.innerHTML = results.map(r => {
      const isWinner = r.timeMs === minTime && results.length > 1;
      return `
        <tr class="${isWinner ? "winner" : ""}">
          <td class="star-col"></td>
          <td>${escapeHTML(r.name)}</td>
          <td class="num">${Metrics.formatNumber(r.comparisons)}</td>
          <td class="num">${Metrics.formatTime(r.timeMs)}</td>
          <td class="num">${Metrics.formatNumber(r.matches.length)}</td>
          <td>${escapeHTML(r.complexity)}</td>
        </tr>
      `;
    }).join("");
  },

  clearResults() {
    this.renderResults([]);
  },

  // -------- Controles --------

  setStepCounter(current, total) {
    if (current == null || total == null) {
      this.el.stepCounter.textContent = "";
    } else {
      this.el.stepCounter.textContent = `passo ${current} de ${total}`;
    }
  },

  setButtonsState({ run, step, prev, next, reset }) {
    if (run !== undefined)   this.el.btnRun.disabled = !run;
    if (step !== undefined)  this.el.btnStep.disabled = !step;
    if (prev !== undefined)  this.el.btnPrev.disabled = !prev;
    if (next !== undefined)  this.el.btnNext.disabled = !next;
    if (reset !== undefined) this.el.btnReset.disabled = !reset;
  }
};

// -------- Helpers de escape --------

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Escape para exibir um caractere isolado dentro da visualização monospaced.
 * Converte newline, tab e outros caracteres "invisíveis" em símbolos visíveis.
 */
function escapeChar(ch) {
  if (ch === "\n") return "↵";
  if (ch === "\t") return "→";
  if (ch === "\r") return "↤";
  if (ch === " ") return "·";   // espaço fica visível com middle-dot discreto
  return escapeHTML(ch);
}
