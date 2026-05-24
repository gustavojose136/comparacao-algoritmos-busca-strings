# Roteiro de video - N2 Evoluir

Duracao sugerida: 6 a 8 minutos.

## 1. Abertura

Apresentar a equipe, disciplina e objetivo da evolucao:

- Universidade Catolica de Santa Catarina.
- Algoritmos Avancados.
- Professor Glauco Vinicius Scheffel.
- Alunos Caue Fernandes Caetano e Walter Theodoro.
- Tema: comparacao de algoritmos de busca em strings com foco em engenharia e observabilidade.

## 2. O que mudou em relacao a primeira entrega

Mostrar rapidamente o app original em `app/`:

- Naive, Rabin-Karp, KMP e Boyer-Moore.
- Visualizacao passo a passo.
- Testes de validacao.

Depois explicar a evolucao:

- backend Node.js.
- Strategy no servidor.
- `SearchResult` padronizado.
- API REST.
- OpenTelemetry.
- Dashboard.

## 3. Arquitetura

Mostrar a estrutura do repositorio:

```text
app/
service/
observability/
data/
reports/
docs/
```

Explicar fluxo:

1. Frontend envia texto, padrao e algoritmo.
2. Backend escolhe a estrategia.
3. Cada algoritmo retorna um `SearchResult`.
4. OpenTelemetry registra trace, metricas e logs.
5. OTel Collector envia dados para Jaeger, Prometheus e Loki.
6. Grafana apresenta tudo em dashboard.

## 4. Demonstracao

Rodar:

```bash
docker compose up --build
```

Explicar que, durante a subida, o servico `telemetry-seeder` executa automaticamente:

- testes unitarios do backend.
- requisicoes instrumentadas para preencher metricas, logs e traces.

Abrir:

- http://localhost:8080
- http://localhost:3001
- http://localhost:16686

No app:

1. Carregar um arquivo.
2. Informar um padrao.
3. Selecionar `Backend instrumentado`.
4. Executar `Todos`.
5. Mostrar o `trace_id` no log do frontend.

No Grafana:

- tempo medio por algoritmo.
- numero de execucoes.
- comparacoes por segundo.
- p50/p95/p99.
- logs com `trace_id`.

No Jaeger:

- abrir a trace.
- mostrar `search.request`.
- mostrar spans `search.algorithm`.

## 5. Benchmarks reais

Mostrar `reports/benchmark-analysis.md` e os graficos:

- Shakespeare.
- Don Quixote.
- Genoma E. coli.

Comentar:

- KMP foi estavel por ter complexidade linear.
- Boyer-Moore venceu quando o padrao era raro ou inexistente.
- Naive foi competitivo em padroes curtos por baixo custo constante.
- Rabin-Karp reduziu comparacoes diretas, mas teve custo de hash em JavaScript.

## 6. Fechamento

Concluir que a etapa evoluiu o projeto de um visualizador de algoritmos para uma aplicacao observavel, testavel e analisavel com dados reais.
