# Relatorio de uso de IA

## Identificacao

Projeto: N2 Evoluir - Comparacao de Algoritmos de Busca em Strings  
Equipe: Caue Fernandes Caetano e Walter Theodoro  
Disciplina: Algoritmos Avancados  
Professor: Glauco Vinicius Scheffel

## Ferramenta utilizada

Foi utilizado um assistente de IA para apoiar a evolucao tecnica do projeto, especialmente na organizacao da arquitetura, escrita de codigo repetitivo, documentacao e validacao.

## Como a IA foi usada

A IA ajudou em:

- Planejamento da evolucao da aplicacao para uma arquitetura com frontend, backend e observabilidade.
- Criacao da estrutura `service/`, `observability/`, `data/`, `reports/` e `docs/`.
- Portabilidade dos algoritmos para o backend mantendo o padrao Strategy.
- Definicao da estrutura `SearchResult`.
- Instrumentacao OpenTelemetry com traces, metricas e logs.
- Criacao de arquivos Docker Compose, OTel Collector, Prometheus, Loki e Grafana.
- Escrita dos scripts de download de dados reais e benchmarks.
- Geracao de graficos SVG e analise dos resultados.
- Elaboracao deste relatorio e do roteiro de video.

## O que foi revisado pela equipe

A equipe revisou:

- Se os quatro algoritmos retornam as mesmas ocorrencias esperadas.
- Se a estrutura de retorno contem os campos solicitados.
- Se a instrumentacao gera informacoes uteis para comparacao.
- Se os benchmarks usam arquivos reais e grandes.
- Se o README permite executar a aplicacao localmente.

## Limites do uso

A IA nao substituiu a verificacao tecnica. Foram executados testes automatizados, smoke test da API, `docker compose config`, benchmark real e `npm audit`.

## Comandos de validacao executados

```bash
cd app
node test.js

cd service
npm test
npm audit --audit-level=moderate
npm run benchmark
npm run report:benchmarks

cd ..
docker compose config
```

## Consideracoes finais

O uso da IA acelerou tarefas de implementacao e documentacao, mas as decisoes principais permaneceram orientadas pelos requisitos da atividade: qualidade de codigo, separacao de responsabilidades, padrao Strategy, observabilidade com OpenTelemetry, dashboard e analise pratica com dados reais.
