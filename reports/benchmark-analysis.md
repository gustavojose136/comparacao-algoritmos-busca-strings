# Analise dos benchmarks reais

Os benchmarks foram executados com 5 iteracoes por combinacao em tres corpora publicos:

- `shakespeare.txt`: The Complete Works of William Shakespeare, Project Gutenberg.
- `don-quixote.txt`: Don Quixote, Project Gutenberg.
- `ecoli.fna`: genoma Escherichia coli K-12 MG1655, NCBI.

## Leitura dos resultados

| Algoritmo | Tempo medio geral | Comparacoes medias |
|---|---:|---:|
| Naive | 25,24 ms | 4.641.037 |
| Rabin-Karp | 73,55 ms | 32.895 |
| KMP | 21,03 ms | 4.514.224 |
| Boyer-Moore | 25,63 ms | 1.406.870 |

## Vencedores por cenario

| Corpus | Padrao | Mais rapido | Tempo medio | Comparacoes |
|---|---|---:|---:|---:|
| don-quixote.txt | `the` | KMP | 13,18 ms | 2.492.711 |
| don-quixote.txt | `love` | KMP | 9,77 ms | 2.426.679 |
| don-quixote.txt | `king` | KMP | 9,04 ms | 2.372.922 |
| don-quixote.txt | `algorithm` | Boyer-Moore | 7,02 ms | 333.753 |
| don-quixote.txt | `zzzzzz` | Boyer-Moore | 5,51 ms | 393.842 |
| ecoli.fna | `ATG` | KMP | 33,06 ms | 5.768.132 |
| ecoli.fna | `GATTACA` | KMP | 34,20 ms | 5.876.974 |
| ecoli.fna | `TTTTTTTT` | Boyer-Moore | 14,55 ms | 829.781 |
| ecoli.fna | `ACGTACGT` | Naive | 41,50 ms | 6.185.107 |
| ecoli.fna | `NNNN` | Boyer-Moore | 15,69 ms | 1.174.936 |
| shakespeare.txt | `the` | KMP | 23,72 ms | 5.627.981 |
| shakespeare.txt | `love` | KMP | 18,47 ms | 5.517.226 |
| shakespeare.txt | `king` | KMP | 20,15 ms | 5.390.031 |
| shakespeare.txt | `algorithm` | Boyer-Moore | 14,62 ms | 740.830 |
| shakespeare.txt | `zzzzzz` | Boyer-Moore | 11,50 ms | 893.502 |

## Discussao teorica x pratica

KMP manteve desempenho muito estavel nos textos em linguagem natural, refletindo sua complexidade linear garantida. Boyer-Moore foi forte quando o padrao era raro ou inexistente, porque a heuristica bad-character permitiu saltos maiores. Naive ficou competitivo em padroes curtos e frequentes porque seu custo constante e simples e baixo, mesmo tendo pior caso O(n * m). Rabin-Karp fez muito menos comparacoes diretas de caracteres, mas nesta implementacao JavaScript o custo de rolling hash dominou o tempo total; isso ilustra por que comparacoes teoricas precisam ser confrontadas com medicoes reais.

No corpus de DNA, o alfabeto pequeno reduziu os saltos do Boyer-Moore em alguns padroes e aumentou a chance de verificacoes locais. Ainda assim, para padroes repetitivos ou ausentes, ele venceu varios cenarios. O resultado mais importante para a etapa N2 e que a aplicacao agora permite observar esses efeitos por metricas, traces e logs, nao apenas por uma tabela final.
