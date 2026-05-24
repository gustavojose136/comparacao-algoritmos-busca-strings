# Roteiro de apresentacao do projeto

## Abertura

Ola, neste video vamos apresentar a evolucao do projeto de comparacao de algoritmos de busca em strings, desenvolvido para a disciplina de Algoritmos Avancados, na Universidade Catolica de Santa Catarina.

Na primeira etapa, o foco principal era implementar e comparar quatro algoritmos classicos de busca em strings: Naive, Rabin-Karp, KMP e Boyer-Moore.

Nesta segunda etapa, o objetivo foi evoluir a aplicacao com praticas de engenharia de software, padroes de projeto e observabilidade usando OpenTelemetry.

## Tela 1 - Frontend da aplicacao

Aqui temos a interface principal da aplicacao.

O usuario informa um texto, define o padrao que deseja buscar e escolhe como a execucao sera feita.

O frontend continua simples e direto, mas agora ele tambem consegue se comunicar com um backend instrumentado.

Isso significa que a aplicacao nao apenas executa os algoritmos, mas tambem registra informacoes sobre desempenho, execucoes, logs e traces.

## Tela 2 - Modo backend instrumentado

Nesta parte, a busca esta sendo executada pelo servico backend em Node.js.

O frontend envia os dados da busca para a API, e o backend executa os algoritmos usando o padrao Strategy.

Esse padrao permite que cada algoritmo tenha sua propria classe ou estrategia, mas todos sigam a mesma interface de execucao.

Com isso, fica mais facil manter o codigo organizado, adicionar novos algoritmos no futuro e comparar todos eles de forma padronizada.

## Tela 3 - Estrutura SearchResult

Depois da execucao, cada algoritmo retorna um resultado no mesmo formato, chamado SearchResult.

Esse retorno inclui o nome do algoritmo, o tamanho do texto, o tamanho do padrao pesquisado, as ocorrencias encontradas, o numero de comparacoes realizadas e o tempo de execucao.

Tambem sao retornadas informacoes de observabilidade, como o traceId, que permite localizar aquela execucao nos sistemas de monitoramento.

Essa estrutura padronizada ajuda tanto na visualizacao do usuario quanto na analise tecnica dos resultados.

## Tela 4 - Explicacao dos algoritmos

O primeiro algoritmo e o Naive.

Ele compara o padrao com o texto posicao por posicao. A vantagem e a simplicidade, mas no pior caso ele pode fazer muitas comparacoes.

O segundo algoritmo e o Rabin-Karp.

Ele usa uma tecnica de hash deslizante para comparar janelas do texto com o padrao. Isso pode ser eficiente em alguns cenarios, principalmente quando ha multiplos padroes ou quando o hash reduz comparacoes diretas.

O terceiro algoritmo e o KMP, ou Knuth-Morris-Pratt.

Ele cria uma tabela auxiliar chamada LPS, que indica o maior prefixo que tambem e sufixo. Com isso, quando ocorre uma falha, o algoritmo nao precisa voltar no texto, evitando comparacoes repetidas.

O quarto algoritmo e o Boyer-Moore.

Ele compara o padrao da direita para a esquerda e usa heuristicas para saltar posicoes no texto. Na pratica, costuma ser muito eficiente em textos grandes e alfabetos maiores.

## Tela 5 - Dashboard no Grafana

Agora entramos na parte principal desta etapa: a observabilidade.

O Grafana foi configurado para exibir os dados coletados da aplicacao.

No dashboard, conseguimos visualizar o tempo de execucao por algoritmo, o numero total de execucoes, a quantidade de comparacoes realizadas e a latencia da aplicacao.

Essas metricas ajudam a comparar o comportamento teorico dos algoritmos com o comportamento real em execucoes praticas.

## Tela 6 - Prometheus e metricas

As metricas exibidas no Grafana vem do Prometheus.

O backend exporta dados usando OpenTelemetry, e o OpenTelemetry Collector organiza essas informacoes para que o Prometheus consiga consulta-las.

Entre as metricas coletadas estao o total de execucoes, a duracao das buscas, o numero de comparacoes e o volume de texto processado.

Isso permite acompanhar nao apenas se a aplicacao esta funcionando, mas tambem como cada algoritmo se comporta ao longo do tempo.

## Tela 7 - Logs no Loki

Outra parte importante da observabilidade sao os logs.

Neste projeto, os logs estruturados sao enviados para o Loki e visualizados pelo Grafana.

Cada log registra informacoes como algoritmo executado, duracao, comparacoes, quantidade de ocorrencias encontradas, tamanho do texto e tamanho do padrao.

O ponto mais importante e que os logs tambem incluem trace_id e span_id.

Com esses campos, conseguimos relacionar um log especifico com uma trace no Jaeger e com as metricas do Prometheus.

## Tela 8 - Traces no Jaeger

No Jaeger, conseguimos visualizar as traces da aplicacao.

Cada requisicao para o endpoint de busca gera uma trace principal chamada search.request.

Dentro dessa trace, cada algoritmo executado gera um span chamado search.algorithm.

Isso permite analisar separadamente o tempo gasto por cada estrategia dentro da mesma requisicao.

Com as traces, fica mais facil identificar gargalos, comparar execucoes e entender o caminho completo de uma busca dentro da aplicacao.

## Tela 9 - Execucao automatica de testes

Para facilitar a demonstracao, o projeto tambem possui um servico chamado telemetry-seeder.

Quando o Docker sobe, esse servico espera o backend ficar saudavel, executa testes e gera trafego automaticamente.

Assim, o Grafana ja abre com dados nos graficos, sem precisar fazer varias buscas manualmente.

Isso atende ao requisito de monitoramento com dados reais de execucao.

## Tela 10 - Dados reais e comparacao pratica

Os testes usam arquivos reais e maiores, como textos literarios e sequencias genomicas.

Isso e importante porque o comportamento dos algoritmos pode mudar dependendo do tamanho do texto, do tamanho do padrao e do tipo de alfabeto.

Por exemplo, textos comuns possuem um alfabeto maior e mais variado, enquanto sequencias de DNA usam poucas letras.

Essa diferenca ajuda a comparar a teoria dos algoritmos com resultados praticos.

## Encerramento

Com essa evolucao, o projeto deixou de ser apenas uma implementacao dos algoritmos de busca.

Ele passou a ser uma aplicacao mais completa, com organizacao de codigo, separacao de responsabilidades, padrao Strategy, retorno padronizado com SearchResult, traces, metricas, logs, dashboard e analise com dados reais.

Assim, a segunda etapa atende ao foco principal da atividade: qualidade de codigo, arquitetura, observabilidade e monitoramento da execucao da aplicacao.
