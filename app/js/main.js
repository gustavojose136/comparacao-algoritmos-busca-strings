/* ================================================================
   main.js — Orquestrador da aplicação
   ================================================================ */

const App = {

  // -------- Estado --------
  files: [],            // [{ name, size, content }]
  selectedFileIdx: -1,

  // estratégias instanciadas (Strategy pattern)
  strategies: {},

  // estado do passo a passo
  stepMode: false,
  steps: [],            // todos os estados pré-coletados do generator
  stepIdx: 0,
  currentAlgorithmKey: null,

  // -------- Inicialização --------

  init() {
    // instancia as estratégias
    this.strategies = {
      "naive":       new NaiveSearch(),
      "rabin-karp":  new RabinKarpSearch(),
      "kmp":         new KMPSearch(),
      "boyer-moore": new BoyerMooreSearch(),
    };

    UI.init();
    this._wireEvents();
    this._updateButtons();
  },

  _wireEvents() {
    UI.el.fileInput.addEventListener("change", e => this._onFilesSelected(e));
    UI.el.fileList.addEventListener("click", e => this._onFileListClick(e));
    UI.el.patternInput.addEventListener("input", () => this._updateButtons());
    UI.el.algorithmSelect.addEventListener("change", () => {
      if (this.stepMode) this._exitStepMode();
    });
    UI.el.btnRun.addEventListener("click", () => this._runOnce());
    UI.el.btnStep.addEventListener("click", () => this._startStepMode());
    UI.el.btnPrev.addEventListener("click", () => this._stepPrev());
    UI.el.btnNext.addEventListener("click", () => this._stepNext());
    UI.el.btnReset.addEventListener("click", () => this._stepReset());

    // navegação por teclado no passo a passo
    document.addEventListener("keydown", e => {
      if (!this.stepMode) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") { e.preventDefault(); this._stepNext(); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); this._stepPrev(); }
    });
  },

  // -------- Arquivos --------

  async _onFilesSelected(e) {
    const newFiles = Array.from(e.target.files);
    if (!newFiles.length) return;

    for (const file of newFiles) {
      const content = await file.text();
      this.files.push({ name: file.name, size: file.size, content });
    }
    if (this.selectedFileIdx === -1 && this.files.length) {
      this.selectedFileIdx = 0;
    }
    UI.renderFileList(this.files, this.selectedFileIdx);
    UI.el.fileInput.value = "";  // permite reupload do mesmo nome
    this._updateButtons();
  },

  _onFileListClick(e) {
    const item = e.target.closest(".file-list-item");
    if (!item) return;
    this.selectedFileIdx = parseInt(item.dataset.idx, 10);
    UI.renderFileList(this.files, this.selectedFileIdx);
    if (this.stepMode) this._exitStepMode();
    this._updateButtons();
  },

  // -------- Estado dos botões --------

  _updateButtons() {
    const hasFile = this.selectedFileIdx >= 0;
    const hasPattern = UI.el.patternInput.value.length > 0;
    const ready = hasFile && hasPattern;
    const isAll = UI.el.algorithmSelect.value === "all";

    if (this.stepMode) {
      UI.setButtonsState({
        run: false, step: false,
        prev: this.stepIdx > 0,
        next: this.stepIdx < this.steps.length - 1,
        reset: true
      });
    } else {
      UI.setButtonsState({
        run: ready,
        step: ready && !isAll,   // passo a passo apenas para algoritmo único
        prev: false, next: false, reset: false
      });
    }
  },

  // -------- Execução normal --------

  async _runOnce() {
    const file = this.files[this.selectedFileIdx];
    const pattern = UI.el.patternInput.value;
    const algKey = UI.el.algorithmSelect.value;
    const mode = UI.el.executionMode.value;

    if (this.stepMode) this._exitStepMode();

    if (mode === "backend") {
      await this._runBackend(file, pattern, algKey);
      return;
    }

    UI.clearLog();
    UI.appendLog(`Execução normal · arquivo "${file.name}" (${Metrics.formatBytes(file.size)}) · padrão "${pattern}" (${pattern.length} chars).`);

    let results = [];

    if (algKey === "all") {
      for (const key of ["naive", "rabin-karp", "kmp", "boyer-moore"]) {
        const strat = this.strategies[key];
        const res = strat.search(file.content, pattern);
        results.push({
          name: strat.name,
          complexity: strat.complexity,
          comparisons: res.comparisons,
          timeMs: res.timeMs,
          matches: res.matches
        });
        UI.appendLog(`${strat.name}: ${res.matches.length} ocorrência(s) · ${Metrics.formatNumber(res.comparisons)} comparações · ${Metrics.formatTime(res.timeMs)}.`);
      }
    } else {
      const strat = this.strategies[algKey];
      const res = strat.search(file.content, pattern);
      results.push({
        name: strat.name,
        complexity: strat.complexity,
        comparisons: res.comparisons,
        timeMs: res.timeMs,
        matches: res.matches
      });
      UI.appendLog(`${strat.name}: ${res.matches.length} ocorrência(s) · ${Metrics.formatNumber(res.comparisons)} comparações · ${Metrics.formatTime(res.timeMs)}.`);
    }

    UI.renderResults(results);

    // Renderiza a visualização final mostrando todos os matches do primeiro resultado
    const first = results[0];
    const finalState = {
      type: "done",
      i: -1, j: -1, shift: 0,
      comparisons: first.comparisons,
      matches: first.matches,
      matchType: null,
      aux: null
    };
    UI.setSizes(file.content.length, pattern.length);
    UI.renderVisualization(file.content, pattern, finalState);
    UI.renderState(finalState, first.timeMs);
    UI.clearAux();
    UI.setStepCounter();
  },

  async _runBackend(file, pattern, algKey) {
    UI.clearLog();
    UI.appendLog(`Execucao instrumentada no backend · arquivo "${file.name}" (${Metrics.formatBytes(file.size)}) · padrao "${pattern}" (${pattern.length} chars).`);
    UI.renderBackendStatus("backend: executando");

    try {
      const response = await fetch("http://localhost:3000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: file.content,
          pattern,
          algorithm: algKey,
          source: "frontend"
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const results = payload.results.map(result => ({
        name: result.algorithm,
        complexity: result.complexity,
        comparisons: result.comparisons,
        timeMs: result.durationMs,
        matches: result.matches
      }));

      for (const result of payload.results) {
        UI.appendLog(`${result.algorithm}: ${result.matchCount} ocorrencia(s) · ${Metrics.formatNumber(result.comparisons)} comparacoes · ${Metrics.formatTime(result.durationMs)}.`);
      }
      UI.appendLog(`trace_id: ${payload.traceId}`);
      UI.renderBackendStatus("backend: ok", payload.traceId);
      UI.renderResults(results);

      const first = results[0];
      const finalState = {
        type: "done",
        i: -1, j: -1, shift: 0,
        comparisons: first.comparisons,
        matches: first.matches,
        matchType: null,
        aux: null
      };
      UI.setSizes(file.content.length, pattern.length);
      UI.renderVisualization(file.content, pattern, finalState);
      UI.renderState(finalState, first.timeMs);
      UI.clearAux();
      UI.setStepCounter();
    } catch (error) {
      UI.renderBackendStatus("backend: indisponivel");
      UI.appendLog(`Falha ao consultar backend: ${error.message}. Inicie a stack com docker compose up --build.`);
    }
  },

  // -------- Passo a passo --------

  _startStepMode() {
    const file = this.files[this.selectedFileIdx];
    const pattern = UI.el.patternInput.value;
    const algKey = UI.el.algorithmSelect.value;
    const strat = this.strategies[algKey];

    if (!strat) return;

    this.currentAlgorithmKey = algKey;
    this.stepMode = true;
    this.stepIdx = 0;

    // pré-coleta todos os estados (mais simples para nav prev/next)
    const t0 = performance.now();
    this.steps = [];
    for (const state of strat.steps(file.content, pattern)) {
      this.steps.push(state);
      if (this.steps.length > 50000) {
        // failsafe para casos patológicos
        UI.appendLog("⚠ Mais de 50.000 passos. Truncando para evitar travamento.");
        break;
      }
    }
    const elapsed = performance.now() - t0;

    UI.clearLog();
    UI.appendLog(`Modo passo a passo iniciado · ${strat.name} · ${this.steps.length} estados pré-computados em ${Metrics.formatTime(elapsed)}.`);
    UI.appendLog(`Use os botões Anterior/Próximo ou as setas ← →.`);

    UI.setSizes(file.content.length, pattern.length);
    this._renderStep();
    this._updateButtons();
  },

  _exitStepMode() {
    this.stepMode = false;
    this.steps = [];
    this.stepIdx = 0;
    this.currentAlgorithmKey = null;
    UI.clearAux();
    UI.setStepCounter();
    this._updateButtons();
  },

  _stepNext() {
    if (this.stepIdx >= this.steps.length - 1) return;
    this.stepIdx++;
    this._renderStep();
    this._updateButtons();
  },

  _stepPrev() {
    if (this.stepIdx <= 0) return;
    this.stepIdx--;
    this._renderStep();
    this._updateButtons();
  },

  _stepReset() {
    if (this.stepMode) {
      this.stepIdx = 0;
      // reconstrói o log até o passo atual
      UI.clearLog();
      UI.appendLog(`Passo a passo reiniciado · ${this.strategies[this.currentAlgorithmKey].name}.`);
      this._renderStep();
      this._updateButtons();
    }
  },

  _renderStep() {
    const file = this.files[this.selectedFileIdx];
    const pattern = UI.el.patternInput.value;
    const state = this.steps[this.stepIdx];
    if (!state) return;

    UI.renderVisualization(file.content, pattern, state);
    UI.renderState(state);
    UI.renderAux(state, this.currentAlgorithmKey);
    UI.setStepCounter(this.stepIdx + 1, this.steps.length);

    // adiciona a mensagem do passo atual ao log (sem duplicar)
    const lastLog = UI.el.log.lastElementChild;
    const expectedPrefix = `[${this.stepIdx + 1}]`;
    if (!lastLog || !lastLog.textContent.startsWith(expectedPrefix)) {
      UI.appendLog(`[${this.stepIdx + 1}] ${state.message}`);
    }

    // se chegou ao final, exibe a tabela de resultados deste algoritmo
    if (state.done) {
      const strat = this.strategies[this.currentAlgorithmKey];
      UI.renderResults([{
        name: strat.name,
        complexity: strat.complexity,
        comparisons: state.comparisons,
        timeMs: 0,                          // tempo no passo a passo é distorcido pelos yields
        matches: state.matches
      }]);
    }
  }
};

// -------- Boot --------
document.addEventListener("DOMContentLoaded", () => App.init());
