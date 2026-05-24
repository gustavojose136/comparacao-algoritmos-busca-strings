# Relatorio tecnico - N2 Evoluir

## Dados institucionais

Faculdade: Universidade Catolica de Santa Catarina  
Disciplina: Algoritmos Avancados  
Professor: Glauco Vinicius Scheffel  
Alunos: Caue Fernandes Caetano e Walter Theodoro

## Objetivo

Esta etapa evolui a primeira entrega de algoritmos de busca em strings. O foco deixa de ser apenas a implementacao dos algoritmos e passa a incluir engenharia de software, arquitetura, observabilidade, monitoramento e analise pratica.

## Arquitetura

O projeto foi reorganizado em camadas:

- `app/`: frontend com visualizacao e comparacao local.
- `service/`: backend Node.js responsavel pela execucao instrumentada.
- `observability/`: configuracoes de OTel Collector, Prometheus, Loki e Grafana.
- `data/`: arquivos reais usados nos benchmarks.
- `reports/`: resultados, graficos e analise dos benchmarks.
- `docs/`: entregaveis textuais da etapa.

## Boas praticas aplicadas

O backend usa o padrao Strategy. Cada algoritmo implementa a mesma interface por meio de uma classe concreta:

- `NaiveSearch`
- `RabinKarpSearch`
- `KMPSearch`
- `BoyerMooreSearch`

A criacao das estrategias fica concentrada em `service/src/algorithms/index.js`. Isso evita condicionais espalhadas pela aplicacao e facilita adicionar novos algoritmos.

O retorno e padronizado pela classe `SearchResult`, que contem:

- algoritmo.
- tamanho do texto.
- tamanho do padrao.
- padrao buscado.
- posicoes encontradas.
- quantidade de ocorrencias.
- comparacoes.
- tempo de execucao.
- complexidade teorica.
- `traceId`.

## Observabilidade

A aplicacao usa OpenTelemetry no backend. Cada execucao em `/search` cria:

- uma trace principal `search.request`.
- um span por algoritmo `search.algorithm`.
- metricas por algoritmo.
- logs estruturados correlacionados com `trace_id` e `span_id`.

Metricas implementadas:

- `search_executions_total`
- `search_duration_ms`
- `search_comparisons_total`
- `search_processed_chars_total`
- `search_matches_total`

## Monitoramento

O ambiente Docker inclui:

- OTel Collector para receber OTLP.
- Jaeger para visualizar traces.
- Prometheus para armazenar metricas.
- Loki para armazenar logs.
- Grafana para unificar visualizacao.

O dashboard mostra:

- tempo medio por algoritmo.
- numero de execucoes.
- comparacoes por segundo.
- latencia p50, p95 e p99.
- logs recentes correlacionados.

Para facilitar a apresentacao, o Docker Compose tambem inclui o servico `telemetry-seeder`. Esse servico aguarda o backend ficar saudavel, executa os testes unitarios do backend e gera trafego automatico para preencher Prometheus, Jaeger, Loki e Grafana logo apos a subida da aplicacao.

## Benchmarks com dados reais

Foram usados tres corpora:

- The Complete Works of William Shakespeare, Project Gutenberg.
- Don Quixote, Project Gutenberg.
- Genoma Escherichia coli K-12 MG1655, NCBI.

Os resultados completos estao em `reports/benchmark-results.json` e `reports/benchmark-results.csv`. A analise esta em `reports/benchmark-analysis.md`.

## Discussao teorica e pratica

KMP apresentou comportamento estavel, coerente com a complexidade O(n + m). Boyer-Moore teve bom desempenho quando o padrao era raro ou inexistente, pois conseguiu saltos maiores. Naive, apesar do pior caso O(n * m), foi competitivo em padroes curtos por ter implementacao simples e baixo custo constante. Rabin-Karp reduziu drasticamente as comparacoes diretas, mas o custo do rolling hash em JavaScript aumentou o tempo total em varios cenarios.

Essa diferenca mostra que a analise teorica e essencial, mas precisa ser complementada por observabilidade e medicoes reais.

## Conclusao

A aplicacao foi evoluida para uma solucao organizada, testavel e observavel. A etapa entrega nao apenas os algoritmos, mas tambem uma infraestrutura para entender seu comportamento em execucoes reais.
