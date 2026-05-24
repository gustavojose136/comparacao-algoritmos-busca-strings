# Visualizador de Algoritmos de Busca em Strings

Aplicação web para comparar e visualizar passo a passo os algoritmos clássicos de busca de padrões em strings:

- **Naive** (força bruta) — O(n · m)
- **Rabin-Karp** (rolling hash) — O(n + m) médio
- **Knuth-Morris-Pratt (KMP)** — O(n + m)
- **Boyer-Moore** (heurística bad-character) — O(n / m) melhor caso

## Como executar

Não há build nem servidor. Basta abrir `index.html` no navegador.

```
# opção 1: clique duplo em index.html
# opção 2: via terminal (recomendado para evitar advertências de file://)
python3 -m http.server 8000
# depois abrir http://localhost:8000 no navegador
```

> **Importante:** algumas funcionalidades como a fonte do Google Fonts precisam de
> conexão à internet na primeira carga.

## Como usar

1. **Carregar arquivos**: clique em "Escolher arquivos" e selecione um ou mais `.txt`.
2. **Selecionar arquivo**: clique no nome do arquivo na lista para defini-lo como ativo (marcado por ●).
3. **Definir padrão**: digite a string a buscar no campo "Padrão".
4. **Escolher algoritmo**: no dropdown, pick um dos quatro — ou "Todos (comparativo)" para rodar os quatro de uma vez.
5. **Executar**:
   - **Executar** → execução normal, mostra apenas o resultado final + métricas.
   - **Passo a passo** → entra no modo interativo. Navegue com os botões Anterior/Próximo ou pelas setas do teclado (←/→).
6. **Reiniciar**: o botão `↻` volta o passo a passo ao primeiro estado.

## Estrutura do projeto

```
projeto/
├── index.html              # estrutura da página
├── styles.css              # sistema de design (ver UI_SPECS.md)
├── UI_SPECS.md             # especificação da interface
├── README.md               # este arquivo
├── test.js                 # suite de testes (rode com `node test.js`)
├── exemplos/
│   ├── lorem.txt           # texto em latim para testes
│   └── dna.txt             # sequência tipo DNA para testes
└── js/
    ├── metrics.js          # cronômetro + formatadores
    ├── ui.js               # camada de DOM e renderização
    ├── main.js             # orquestrador (eventos, fluxo)
    └── strategies/
        ├── SearchStrategy.js   # classe base abstrata (Strategy)
        ├── NaiveSearch.js
        ├── RabinKarpSearch.js
        ├── KMPSearch.js
        └── BoyerMooreSearch.js
```

## Arquitetura — padrão Strategy

A interface comum está em `SearchStrategy`:

```
            ┌─────────────────────────┐
            │    SearchStrategy       │  (abstrata)
            │    + search(t, p)       │
            │    + *steps(t, p)       │
            └────────────┬────────────┘
                         │
       ┌─────────────────┼─────────────────┬──────────────────┐
       ▼                 ▼                 ▼                  ▼
┌─────────────┐  ┌──────────────────┐ ┌──────────┐  ┌──────────────────┐
│ NaiveSearch │  │ RabinKarpSearch  │ │ KMPSearch│  │ BoyerMooreSearch │
└─────────────┘  └──────────────────┘ └──────────┘  └──────────────────┘
```

Cada estratégia implementa dois métodos:

- `search(text, pattern)` — versão otimizada para execução normal; retorna `{ matches, comparisons, timeMs }`.
- `*steps(text, pattern)` — generator que produz estados intermediários para a visualização passo a passo. Cada `yield` retorna um objeto com índices, contadores, estrutura auxiliar e mensagem para o log.

A separação entre as duas APIs permite que a execução normal seja livre do overhead dos `yield`s, dando métricas de tempo realistas, enquanto o passo a passo tem todos os detalhes necessários para a visualização.

## Métricas

Para cada execução, a aplicação coleta e exibe:

- **Tempo de execução** — via `performance.now()`, precisão sub-milissegundo.
- **Número de comparações de caractere** — contador interno da estratégia.
- **Tamanho do texto e do padrão** — em caracteres.
- **Complexidade teórica** — rotulada para cada algoritmo.
- **Ocorrências encontradas**.

Na tabela comparativa (quando se roda "Todos"), o algoritmo mais rápido recebe uma marca `★`.

## Validação

O script `test.js` roda 18 casos de teste contra cada um dos 4 algoritmos (versão `search()` e versão `*steps()` separadamente), validando os resultados contra `String.prototype.indexOf`. Total: 144 asserções.

```
node test.js
```

## Detalhes de implementação dignos de nota

- **Generators do JavaScript** (`function*` + `yield`) são a chave do passo a passo limpo: o mesmo algoritmo é usado, ele apenas pausa em cada comparação.
- **Pré-coleta dos estados**: no modo passo a passo, todos os estados são coletados antecipadamente em um array. Isso simplifica a navegação prev/next para O(1) e permite o "Reiniciar" sem reexecutar o algoritmo.
- **Janela de visualização**: para textos grandes (> 80 chars), a área de visualização mostra apenas uma janela centrada no índice atual, com indicadores `[...]` para o conteúdo truncado.
- **Boyer-Moore — bad-character only**: foi implementada a heurística bad-character apenas. A versão completa com good-suffix é uma extensão possível para o relatório.
- **Rabin-Karp — hash polinomial**: base `d=256` (ASCII estendido), módulo `q=1000003` (primo). Verificação caractere a caractere protege contra colisões.

## Próximos passos / extensões possíveis

- Suporte a busca case-insensitive (toggle).
- Heurística good-suffix no Boyer-Moore (versão completa do algoritmo).
- Exportar log e tabela de resultados como CSV.
- Modo "benchmark" rodando cada algoritmo N vezes e tirando estatísticas.
