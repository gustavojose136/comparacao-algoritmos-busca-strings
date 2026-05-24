# Especificações de UI — Visualizador de Algoritmos de Busca em Strings

## 1. Direção Estética

**Minimalismo acadêmico/editorial.** Referências: papers científicos da Bell Labs / Tufte, tipografia suíça, terminais Unix bem cuidados. Nenhum elemento decorativo: tudo na interface precisa ter função.

- Sem gradientes, sombras, bordas arredondadas excessivas, ícones coloridos ou animações chamativas.
- Tipografia faz o trabalho pesado da hierarquia.
- Cor usada apenas quando *funcional* (destacar comparação atual, match vs mismatch).
- Bordas hairline (1px) ao invés de containers com fundo colorido.
- Muito espaço em branco respirável.

## 2. Paleta

Todas as cores como variáveis CSS em `:root`. Tema único (claro), papel-like.

| Token              | Valor      | Uso                                                    |
|--------------------|------------|--------------------------------------------------------|
| `--bg`             | `#FAFAF7`  | Fundo principal (off-white com calor)                  |
| `--bg-elevated`    | `#FFFFFF`  | Fundo de painéis e tabelas                             |
| `--ink`            | `#111111`  | Texto principal                                        |
| `--ink-soft`       | `#4A4A4A`  | Texto secundário                                       |
| `--ink-muted`      | `#8A8A85`  | Labels, metadados, valores não-críticos                |
| `--rule`           | `#E5E5E0`  | Bordas hairline e separadores                          |
| `--rule-strong`    | `#1A1A1A`  | Bordas de ênfase (raras, para títulos de seção)        |
| `--highlight`      | `#F0EBE3`  | Background do caractere atualmente comparado           |
| `--match`          | `#2F5233`  | Texto de match (verde-escuro dessaturado)              |
| `--match-bg`       | `#E8EFE5`  | Background de match consolidado                        |
| `--mismatch`       | `#7A2E2E`  | Texto de mismatch (vinho dessaturado)                  |
| `--mismatch-bg`    | `#F0E5E5`  | Background de mismatch                                 |

Nenhuma outra cor. Sem azul, sem roxo, sem gradiente.

## 3. Tipografia

Três famílias, todas Google Fonts (carregadas via `<link>`):

- **Display (títulos):** `Fraunces` — serif variável com personalidade, peso 400/600, com `opsz` ativado para tamanhos grandes. Usado em `<h1>` e nomes de seção.
- **Body (interface):** `Geist` — sans-serif geométrica moderna, peso 400/500/600. Usado em labels, botões, parágrafos.
- **Mono (texto/algoritmo):** `JetBrains Mono` — monoespaçada para texto buscado, padrão, e estruturas auxiliares. Peso 400/700.

### Escala tipográfica

| Token         | Tamanho   | Família  | Peso | Uso                           |
|---------------|-----------|----------|------|-------------------------------|
| `--fs-h1`     | `2.5rem`  | Fraunces | 400  | Título da página              |
| `--fs-h2`     | `1.25rem` | Fraunces | 600  | Cabeçalhos de seção           |
| `--fs-label`  | `0.75rem` | Geist    | 500  | Labels (uppercase, letter-spacing 0.08em) |
| `--fs-body`   | `0.9375rem` | Geist  | 400  | Texto da interface            |
| `--fs-small`  | `0.8125rem` | Geist  | 400  | Metadados, log                |
| `--fs-mono`   | `0.9375rem` | JetBrains Mono | 400 | Visualização do texto/padrão |
| `--fs-mono-sm`| `0.8125rem` | JetBrains Mono | 400 | Tabelas auxiliares       |

## 4. Sistema de Espaçamento

Base 4px. Tokens em `rem`:

| Token       | Valor    |
|-------------|----------|
| `--space-1` | `0.25rem` |
| `--space-2` | `0.5rem`  |
| `--space-3` | `0.75rem` |
| `--space-4` | `1rem`    |
| `--space-6` | `1.5rem`  |
| `--space-8` | `2rem`    |
| `--space-12`| `3rem`    |
| `--space-16`| `4rem`    |

Padding interno padrão de painéis: `--space-6`. Gap entre seções principais: `--space-12`.

## 5. Layout Geral

Largura máxima do conteúdo: `1200px`, centralizado, com `padding` lateral de `--space-8` (desktop) e `--space-4` (mobile).

### Estrutura vertical (de cima para baixo)

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                       │
│  Título + subtítulo (uma linha curta sobre o app)            │
├──────────────────────────────────────────────────────────────┤
│ SETUP (seção dobrável? não — sempre visível)                 │
│  ┌──────────────────────┬─────────────────────────────────┐  │
│  │ Upload de arquivos   │ Lista de arquivos carregados    │  │
│  │ [escolher arquivos]  │ • doc1.txt (1.2 KB) ●           │  │
│  │                      │ • doc2.txt (340 B)              │  │
│  └──────────────────────┴─────────────────────────────────┘  │
│  ┌──────────────────────┬─────────────┬───────────┬────────┐│
│  │ Padrão               │ Algoritmo   │ Executar  │ Passos ││
│  │ [texto______________]│ [select  ▾] │ [ button ]│ [ btn ]││
│  └──────────────────────┴─────────────┴───────────┴────────┘│
├──────────────────────────────────────────────────────────────┤
│ VISUALIZAÇÃO (grid 2 colunas: 2fr / 1fr)                     │
│  ┌────────────────────────────────┬─────────────────────────┐│
│  │ Texto (mono, com highlights)   │ ESTADO                  ││
│  │  Lorem ipsum dolor sit amet... │  i (texto)        12    ││
│  │            ▎                   │  j (padrão)        3    ││
│  │  Padrão alinhado embaixo       │  Comparações      42    ││
│  │            sit                 │  Tempo           0.3 ms ││
│  │                                │                         ││
│  │ [◀ Anterior] [Próximo ▶] [↻]   │ ESTRUTURA AUXILIAR      ││
│  │                                │  (LPS / bad-char / ...) ││
│  │                                │                         ││
│  └────────────────────────────────┴─────────────────────────┘│
├──────────────────────────────────────────────────────────────┤
│ LOG                                                          │
│  Lista cronológica de eventos da execução atual              │
├──────────────────────────────────────────────────────────────┤
│ RESULTADOS COMPARATIVOS                                      │
│  Tabela: algoritmo | comparações | tempo | complexidade      │
└──────────────────────────────────────────────────────────────┘
```

### Layout mobile (< 720px)

Tudo vira coluna única. O painel de estado aparece **abaixo** da visualização, não ao lado.

## 6. Componentes

### 6.1 Cabeçalhos de seção

Antes do conteúdo de cada seção, um cabeçalho com este padrão:

```
SETUP                                                     §1
═══════════════════════════════════════════════════════
```

- Label em uppercase (font: Geist 500, `--fs-label`).
- Numeração de seção pequena, alinhada à direita, em `--ink-muted` (referência editorial).
- Linha hairline (`--rule`) abaixo, full-width da seção.
- Margem superior `--space-12`, inferior `--space-6`.

### 6.2 Botões

Dois tipos apenas:

**Primário** (apenas 1 por contexto — "Executar"):
- Background `--ink`, texto `--bg`.
- Padding `0.5rem 1rem`. Sem border-radius (`0`).
- Font: Geist 500, `--fs-body`.
- Hover: background `--ink-soft`.

**Secundário** (todos os outros):
- Background transparente, texto `--ink`.
- Borda `1px solid --rule-strong`. Sem border-radius.
- Mesmo padding e tipografia.
- Hover: background `--highlight`.

Desabilitado: opacidade 0.4, `cursor: not-allowed`.

### 6.3 Inputs

- Borda `1px solid --rule`, sem border-radius.
- Padding `0.5rem 0.75rem`.
- Background `--bg-elevated`.
- Font: Geist 400 para texto comum, JetBrains Mono para o input do padrão.
- Focus: borda `--ink`, sem outline, sem glow.

### 6.4 Dropdown (`<select>`)

Estilo idêntico ao input. Custom-styled apenas o suficiente para harmonizar (sem reescrever o nativo).

### 6.5 Lista de arquivos carregados

```
● doc1.txt              1.2 KB
  doc2.txt              340 B
  doc3.txt              5.4 KB
```

- Ponto preto sólido (●) marca o arquivo selecionado; demais ficam sem marca (espaço preservado).
- Linha inteira é clicável para selecionar.
- Hover: background `--highlight`.

### 6.6 Visualização do texto (peça central)

Renderização em monospace, com quebras de linha automáticas a cada N caracteres (configurável, default 60).

**Para textos grandes (> 2000 caracteres):** mostrar janela de ±200 caracteres ao redor do índice atual, com indicador `[...]` no início/fim quando truncado.

Cada caractere é um `<span>`. Classes possíveis:
- `.char-current` — caractere sendo comparado neste passo (background `--highlight`, peso 700).
- `.char-match` — match consolidado (background `--match-bg`, texto `--match`).
- `.char-mismatch` — mismatch já registrado (background `--mismatch-bg`, texto `--mismatch`).
- `.char-window` — janela atual do padrão (sublinhado fino).

**Padrão alinhado abaixo:** segunda linha monoespaçada, indentada com `padding-left: ch * shift` para se alinhar exatamente. Mesma lógica de classes.

### 6.7 Painel de estado

Lista de pares chave-valor, layout em duas colunas (label à esquerda em `--ink-muted` uppercase pequeno, valor à direita em mono):

```
I (TEXTO)          12
J (PADRÃO)          3
COMPARAÇÕES        42
DESLOCAMENTO        9
TEMPO          0.3 ms
```

### 6.8 Estruturas auxiliares

**LPS (KMP)** — tabela horizontal compacta:

```
índice    0  1  2  3  4  5
caractere a  b  a  b  a  c
LPS       0  0  1  2  3  0
```

Mono, font-size `--fs-mono-sm`. Coluna atualmente em uso recebe background `--highlight`.

**Bad character (Boyer-Moore)** — tabela de 2 colunas (caractere → último índice). Mesma tipografia.

**Good suffix (Boyer-Moore)** — tabela compacta similar ao LPS.

**Hash (Rabin-Karp)** — duas linhas: `hash(janela) = ...` e `hash(padrão) = ...`. Marcar visualmente quando são iguais (background `--match-bg`).

### 6.9 Log de eventos

`<ol>` com numeração discreta. Cada item em uma linha:

```
01  Início da busca. Texto: 1240 chars. Padrão: "exemplo" (7 chars).
02  Comparação em i=0, j=0 → match ('e' = 'e')
03  Comparação em i=1, j=1 → mismatch ('x' ≠ 'x')
...
```

Font: JetBrains Mono `--fs-mono-sm`. Altura máxima `300px`, scroll vertical. Borda hairline.

### 6.10 Tabela de resultados comparativos

```
ALGORITMO        COMPARAÇÕES   TEMPO      COMPLEXIDADE
─────────────────────────────────────────────────────────
Naive                  1.247    0.42 ms   O(n · m)
Rabin-Karp               892    0.31 ms   O(n + m) médio
KMP                      234    0.12 ms   O(n + m)
Boyer-Moore              178    0.09 ms   O(n / m) melhor
```

- Linhas separadas por hairline `--rule`.
- Sem zebra striping (poluiria).
- Algoritmo mais rápido recebe uma marca discreta `★` à esquerda — *única* concessão a "destaque visual".

## 7. Microinterações

Animações restritas e curtas (≤ 150ms). Apenas:

- Botões: transição de background no hover (`120ms ease-out`).
- Highlights de caractere: aparecem instantâneos (sem fade — atrapalha leitura no passo-a-passo rápido).
- Log: novos itens aparecem com `opacity 0 → 1` em 100ms.

Nada de scroll-triggered, parallax, ou qualquer coisa decorativa.

## 8. Acessibilidade

- Contraste mínimo AA em todos os pares (já garantido pela paleta).
- Foco visível em todos os elementos interativos: outline `2px solid --ink`, offset `2px`.
- Botões com `aria-label` quando o texto for ambíguo (ex: "↻").
- Log com `role="log"` e `aria-live="polite"`.
- Navegação por teclado: Tab funciona em ordem lógica; setas ←/→ avançam/retrocedem no passo a passo quando o foco está na área de visualização.

## 9. Estados do passo a passo

Três estados possíveis da aplicação, com UI distinta:

| Estado          | Botões habilitados                    | Visualização                            |
|-----------------|---------------------------------------|----------------------------------------|
| `idle`          | Executar, Passo a passo               | Texto carregado, sem highlights        |
| `running`       | (nenhum durante exec normal)          | Resultado após terminar                |
| `stepping`      | Anterior, Próximo, Reiniciar          | Estado atual destacado                 |
| `completed`     | Reiniciar, Executar de novo           | Todos os matches/mismatches visíveis   |

## 10. Resumo do que NÃO fazer

- ❌ Bordas arredondadas pronunciadas (max `2px` em casos raros, default `0`).
- ❌ Sombras (`box-shadow: none` global).
- ❌ Gradientes em qualquer lugar.
- ❌ Mais de duas cores acentuadas simultaneamente.
- ❌ Ícones coloridos. Usar caracteres unicode discretos (●, ◯, ▎, ★) ou nada.
- ❌ Emojis na interface.
- ❌ Animações de entrada de página, parallax, scroll-triggered.
- ❌ Tooltips coloridos. Se necessário, usar `title` nativo.
- ❌ Loaders/spinners — operações são síncronas e rápidas.
