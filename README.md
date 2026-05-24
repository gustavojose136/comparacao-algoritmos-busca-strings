# N2 Evoluir - Comparacao de Algoritmos de Busca em Strings

Universidade Catolica de Santa Catarina  
Disciplina: Algoritmos Avancados  
Professor: Glauco Vinicius Scheffel  
Alunos: Caue Fernandes Caetano e Walter Theodoro

Esta versao evolui a entrega anterior de busca em strings. O foco agora e engenharia de software, arquitetura, observabilidade e analise com dados reais.

## O que foi entregue

- Frontend academico em HTML, CSS e JavaScript puro, mantido em `app/`.
- Backend Node.js em `service/` com Strategy, SearchResult e API REST.
- Instrumentacao OpenTelemetry com traces, metricas e logs.
- Stack local Docker com OTel Collector, Jaeger, Prometheus, Loki e Grafana.
- Dashboard Grafana provisionado em `observability/grafana/dashboards/`.
- Benchmarks reais em `reports/`, com dados em JSON, CSV, graficos SVG e analise.
- Roteiro de video e relatorio de uso de IA em `docs/`.

## Como executar tudo

```bash
docker compose up --build
```

Depois acesse:

- App web: http://localhost:8080
- Backend: http://localhost:3000/health
- Grafana: http://localhost:3001 (admin/admin)
- Jaeger: http://localhost:16686
- Prometheus: http://localhost:9090
- Loki: http://localhost:3100

No frontend, selecione `Backend instrumentado` no campo `Modo` para gerar traces, metricas e logs reais.

Para popular o dashboard sem usar a interface:

```bash
cd service
npm run traffic
```

Ao subir com Docker Compose, o servico `telemetry-seeder` ja roda automaticamente:

1. testes unitarios do backend.
2. 40 requisicoes instrumentadas contra o backend.
3. geracao de dados para Prometheus, Jaeger, Loki e Grafana.

Esse servico termina sozinho depois de preencher os graficos.

## API principal

```http
POST /search
Content-Type: application/json

{
  "text": "abracadabra",
  "pattern": "abra",
  "algorithm": "all",
  "source": "manual-test"
}
```

`algorithm` aceita: `all`, `naive`, `rabin-karp`, `kmp`, `boyer-moore`.

O retorno usa a estrutura `SearchResult`:

```json
{
  "algorithm": "Naive",
  "textLength": 11,
  "patternLength": 4,
  "pattern": "abra",
  "matches": [0, 7],
  "matchCount": 2,
  "comparisons": 16,
  "durationMs": 0.04,
  "complexity": "O(n * m)",
  "traceId": "..."
}
```

## Observabilidade

Cada chamada `/search` cria:

- 1 trace principal `search.request`.
- 1 span por algoritmo `search.algorithm`.
- metricas `search_executions_total`, `search_duration_ms`, `search_comparisons_total`, `search_processed_chars_total`, `search_matches_total`.
- logs estruturados com `trace_id`, `span_id`, algoritmo, tempo, comparacoes e ocorrencias.

O dashboard mostra tempo medio por algoritmo, numero de execucoes, comparacoes por segundo, latencia p50/p95/p99 e logs recentes.

## Benchmarks reais

Os dados usados ficam em `data/`:

- `shakespeare.txt` - The Complete Works of William Shakespeare, Project Gutenberg.
- `don-quixote.txt` - Don Quixote, Project Gutenberg.
- `ecoli.fna` - genoma Escherichia coli K-12 MG1655, NCBI.

Para baixar novamente:

```bash
cd service
npm run data:download
```

Para rodar benchmark e gerar analise/graficos:

```bash
cd service
npm run benchmark
npm run report:benchmarks
```

Os resultados atuais estao em `reports/benchmark-results.json`, `reports/benchmark-results.csv`, `reports/benchmark-analysis.md` e `reports/charts/`.

## Testes e validacao

Frontend original:

```bash
cd app
node test.js
```

Backend:

```bash
cd service
npm test
npm audit --audit-level=moderate
```

Validacoes feitas nesta entrega:

- Frontend: 144 testes passando.
- Backend: 4 suites de algoritmo passando.
- API: smoke test em `/health` e `/search`.
- Docker Compose: `docker compose config` OK.
- NPM audit: 0 vulnerabilidades.

## Estrutura

```text
app/                  frontend e testes da primeira etapa
service/              backend Node.js instrumentado
observability/        collector, Prometheus, Loki e Grafana
data/                 corpora reais usados nos benchmarks
reports/              resultados, graficos e analise
docs/                 roteiro de video e relatorios
docker-compose.yml    ambiente completo local
```
