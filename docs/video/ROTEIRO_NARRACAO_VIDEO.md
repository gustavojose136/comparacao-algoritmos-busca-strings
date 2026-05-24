# Roteiro de narracao do video

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
