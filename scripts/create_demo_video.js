import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

const repoRoot = resolve(import.meta.dirname, "..");
const outDir = resolve(repoRoot, "docs", "video");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const userDataDir = resolve(outDir, ".chrome-profile");
const port = 9223;
const width = 1440;
const height = 900;

await mkdir(outDir, { recursive: true });
await rm(userDataDir, { recursive: true, force: true });
console.log("Preparando captura em docs/video...");

const server = createServer((req, res) => {
  if (req.url === "/sample.txt") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end("the quick brown fox jumps over the lazy dog love king algorithm ".repeat(6000));
    return;
  }
  res.writeHead(404);
  res.end("not found");
});
await new Promise(resolveServer => server.listen(8099, "127.0.0.1", resolveServer));
console.log("Servidor auxiliar iniciado em http://127.0.0.1:8099");

const chrome = spawn(chromePath, [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  "--headless=new",
  "--no-first-run",
  "--no-default-browser-check",
  "--remote-allow-origins=*",
  "--disable-gpu",
  "--hide-scrollbars",
  `--window-size=${width},${height}`,
  "about:blank"
], { stdio: "ignore" });
console.log("Chrome headless iniciado.");

try {
  await connectToChrome();
  console.log("Chrome DevTools conectado.");
  const page = await newPage();
  console.log("Aba de captura criada.");

  const screenshots = [];
  await captureFrontend(page, screenshots);
  console.log("Frontend capturado.");
  await captureGrafana(page, screenshots);
  console.log("Grafana capturado.");
  await captureJaeger(page, screenshots);
  console.log("Jaeger capturado.");
  await captureLoki(page, screenshots);
  console.log("Loki capturado.");

  const videoPath = await renderVideo(page, screenshots);
  console.log("Video renderizado.");
  await writeScriptFiles();
  console.log(`VIDEO=${videoPath}`);
} finally {
  chrome.kill();
  server.close();
}

async function connectToChrome() {
  for (let i = 0; i < 50; i++) {
    try {
      const version = await fetch(`http://127.0.0.1:${port}/json/version`).then(r => r.json());
      return createCdp(version.webSocketDebuggerUrl);
    } catch {
      await sleep(200);
    }
  }
  throw new Error("Chrome DevTools nao iniciou.");
}

async function createCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolveWs, rejectWs) => {
    ws.addEventListener("open", resolveWs, { once: true });
    ws.addEventListener("error", rejectWs, { once: true });
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", event => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolveMsg, rejectMsg } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) rejectMsg(new Error(msg.error.message));
      else resolveMsg(msg.result);
    }
  });
  return {
    ws,
    send(method, params = {}) {
      const msgId = ++id;
      ws.send(JSON.stringify({ id: msgId, method, params }));
      return new Promise((resolveMsg, rejectMsg) => pending.set(msgId, { resolveMsg, rejectMsg }));
    }
  };
}

async function newPage() {
  let tab;
  try {
    tab = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" }).then(r => r.json());
  } catch {
    tab = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json()).then(list => list[0]);
  }
  const page = await createCdp(tab.webSocketDebuggerUrl);
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  await page.send("Network.enable");
  await page.send("Emulation.setDeviceMetricsOverride", {
    width, height, deviceScaleFactor: 1, mobile: false
  });
  return page;
}

async function evalPage(page, expression, awaitPromise = true) {
  const result = await page.send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true
  });
  return result?.result?.value;
}

async function navigate(page, url) {
  await page.send("Page.navigate", { url });
  await sleep(2500);
}

async function screenshot(page, name, title, narration) {
  const result = await page.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false
  });
  const path = resolve(outDir, `${name}.png`);
  await writeFile(path, Buffer.from(result.data, "base64"));
  return { path, title, narration };
}

async function captureFrontend(page, screenshots) {
  await navigate(page, "http://localhost:8080");
  await evalPage(page, `
    (async () => {
      const text = await fetch('http://127.0.0.1:8099/sample.txt').then(r => r.text());
      App.files = [{ name: 'shakespeare-demo.txt', size: text.length, content: text }];
      App.selectedFileIdx = 0;
      UI.renderFileList(App.files, 0);
      UI.el.patternInput.value = 'the';
      UI.el.algorithmSelect.value = 'all';
      UI.el.executionMode.value = 'backend';
      App._updateButtons();
      await App._runOnce();
      window.scrollTo(0, 0);
      return true;
    })()
  `);
  await sleep(2500);
  screenshots.push(await screenshot(page, "01-frontend-backend", "Teste no frontend instrumentado", "No primeiro momento mostramos o app web original evoluido. O modo escolhido e Backend instrumentado, entao a execucao chama a API Node.js e gera trace, metricas e logs."));

  await evalPage(page, "document.getElementById('results-h').scrollIntoView({block:'start'});");
  await sleep(800);
  screenshots.push(await screenshot(page, "02-frontend-results", "Resultados comparativos", "A tabela compara os quatro algoritmos com a mesma entrada. O retorno segue a estrutura SearchResult, com ocorrencias, comparacoes, tempo, complexidade e traceId."));
}

async function captureGrafana(page, screenshots) {
  await page.send("Network.setExtraHTTPHeaders", {
    headers: { Authorization: `Basic ${Buffer.from("admin:admin").toString("base64")}` }
  });
  await navigate(page, "http://localhost:3001/d/busca-strings-n2/comparacao-de-algoritmos-de-busca-em-strings?orgId=1&from=now-15m&to=now&kiosk");
  await sleep(5000);
  screenshots.push(await screenshot(page, "03-grafana-dashboard", "Dashboard Grafana", "No Grafana ficam os paineis principais da observabilidade: tempo medio, numero de execucoes, comparacoes, latencia e logs correlacionados."));
  await evalPage(page, "window.scrollTo(0, document.body.scrollHeight);");
  await sleep(1200);
  screenshots.push(await screenshot(page, "04-grafana-logs", "Logs no dashboard", "O painel inferior mostra os logs vindos do Loki. Cada log possui trace_id e span_id, permitindo correlacionar log com trace e metrica."));
}

async function captureJaeger(page, screenshots) {
  await page.send("Network.setExtraHTTPHeaders", { headers: {} });
  await navigate(page, "http://localhost:16686/search?service=busca-strings-service");
  await sleep(3500);
  screenshots.push(await screenshot(page, "05-jaeger", "Traces no Jaeger", "No Jaeger aparecem as traces do servico busca-strings-service. Cada chamada /search cria um span principal e um span por algoritmo."));
}

async function captureLoki(page, screenshots) {
  const query = encodeURIComponent('{service_name="n2-evoluir/busca-strings-service"} |= "search"');
  await navigate(page, `http://localhost:3100/loki/api/v1/query_range?query=${query}&limit=3`);
  await sleep(1000);
  screenshots.push(await screenshot(page, "06-loki-query", "Consulta direta no Loki", "Por fim, a consulta direta ao Loki confirma que os logs foram ingeridos com os campos estruturados de algoritmo, duracao, comparacoes, trace_id e span_id."));
}

async function renderVideo(page, screenshots) {
  const scenes = [];
  for (const item of screenshots) {
    const image = `data:image/png;base64,${(await readFile(item.path)).toString("base64")}`;
    scenes.push({ ...item, image });
  }
  const script = JSON.stringify(scenes);
  const result = await evalPage(page, `
    (async () => {
      const scenes = ${script};
      document.body.innerHTML = '<canvas id="c" width="1280" height="720"></canvas>';
      document.body.style.margin = '0';
      const canvas = document.getElementById('c');
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);
      const chunks = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      const done = new Promise(resolve => recorder.onstop = resolve);
      const images = await Promise.all(scenes.map(scene => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = scene.image;
      })));
      const fps = 30;
      const secondsPerScene = 12;
      recorder.start();
      for (let s = 0; s < scenes.length; s++) {
        for (let frame = 0; frame < fps * secondsPerScene; frame++) {
          drawScene(ctx, scenes[s], images[s], frame / (fps * secondsPerScene));
          await new Promise(requestAnimationFrame);
        }
      }
      recorder.stop();
      await done;
      const blob = new Blob(chunks, { type: 'video/webm' });
      const buffer = await blob.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      return btoa(binary);

      function drawScene(ctx, scene, img, progress) {
        ctx.fillStyle = '#FAFAF7';
        ctx.fillRect(0, 0, 1280, 720);
        const scale = Math.min(1160 / img.width, 520 / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (1280 - w) / 2;
        const y = 82;
        ctx.fillStyle = '#111';
        ctx.font = 'bold 34px Arial, sans-serif';
        ctx.fillText(scene.title, 60, 48);
        ctx.drawImage(img, x, y, w, h);
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = 'rgba(250,250,247,0.94)';
        ctx.fillRect(40, 626, 1200, 70);
        ctx.fillStyle = '#111';
        ctx.font = '22px Arial, sans-serif';
        wrapText(ctx, scene.narration, 60, 655, 1160, 28);
        ctx.fillStyle = '#4A4A4A';
        ctx.font = '16px Consolas, monospace';
        ctx.fillText('N2 Evoluir - Comparacao de Algoritmos de Busca em Strings', 60, 704);
      }

      function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        for (const word of words) {
          const testLine = line + word + ' ';
          if (ctx.measureText(testLine).width > maxWidth && line) {
            ctx.fillText(line, x, y);
            line = word + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, y);
      }
    })()
  `, true);
  const videoPath = resolve(outDir, "demo-n2-evoluir.webm");
  await writeFile(videoPath, Buffer.from(result, "base64"));
  return videoPath;
}

async function writeScriptFiles() {
  const roteiro = `# Roteiro de narracao do video

Video: demo-n2-evoluir.webm  
Duracao aproximada: 1 minuto e 12 segundos.  
Sugestao: gravar a voz em ritmo calmo, sem tentar ler rapido demais.

## 00:00 - 00:12 | Teste no frontend instrumentado
Neste video demonstramos a evolucao da aplicacao de comparacao de algoritmos de busca em strings. A primeira entrega ja possuia os quatro algoritmos: Naive, Rabin-Karp, KMP e Boyer-Moore. Nesta etapa, o foco passou a ser engenharia de software e observabilidade. Aqui o frontend esta executando em modo Backend instrumentado, ou seja, a busca nao fica apenas no navegador: ela chama o servico Node.js, que registra traces, metricas e logs usando OpenTelemetry.

## 00:12 - 00:24 | Resultados comparativos
Depois da execucao, a tabela compara os quatro algoritmos usando a mesma entrada. Cada algoritmo segue o padrao Strategy no backend e retorna uma estrutura padronizada chamada SearchResult. Essa estrutura contem o nome do algoritmo, tamanho do texto, tamanho do padrao, ocorrencias encontradas, numero de comparacoes, tempo de execucao, complexidade teorica e o traceId que permite rastrear a execucao nos sistemas de observabilidade.

## 00:24 - 00:36 | Dashboard Grafana
Agora abrimos o Grafana, que centraliza o monitoramento da aplicacao. O dashboard foi provisionado automaticamente pelo Docker Compose. Ele mostra o tempo medio por algoritmo, o numero total de execucoes, a quantidade de comparacoes e a latencia em percentis. Para facilitar a apresentacao, a stack tambem possui um servico chamado telemetry-seeder, que roda testes e gera trafego automaticamente quando o Docker sobe.

## 00:36 - 00:48 | Logs no dashboard
Na parte de logs, o Grafana consulta o Loki. Cada log estruturado mostra dados da execucao, como algoritmo, duracao, comparacoes, numero de matches, tamanho do texto, tamanho do padrao e principalmente trace_id e span_id. Isso e importante porque permite relacionar uma linha de log com uma trace especifica no Jaeger e com as metricas agregadas no Prometheus.

## 00:48 - 01:00 | Traces no Jaeger
No Jaeger conseguimos visualizar a execucao em forma de trace. Cada requisicao ao endpoint de busca cria um span principal chamado search.request. Dentro dele, existe um span para cada algoritmo executado, chamado search.algorithm. Assim conseguimos ver separadamente quanto cada estrategia levou, quantas comparacoes fez e como ela se comportou dentro de uma mesma requisicao.

## 01:00 - 01:12 | Consulta direta no Loki
Por fim, a consulta direta ao Loki confirma que os logs foram realmente ingeridos. A query filtra pelo service_name da aplicacao e pelo termo search. O resultado mostra os campos estruturados enviados pelo backend. Com isso, a aplicacao atende ao objetivo da etapa: alem de comparar algoritmos, ela agora possui organizacao de codigo, Strategy, SearchResult, traces, metricas, logs, dashboard e dados reais para analise.
`;
  await writeFile(resolve(outDir, "ROTEIRO_NARRACAO_VIDEO.md"), roteiro, "utf8");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
