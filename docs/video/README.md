# Video de demonstracao

Arquivos principais:

- `demo-n2-evoluir.webm`: video sem narracao, pronto para receber voz de fundo.
- `ROTEIRO_NARRACAO_VIDEO.md`: texto de narracao dividido por tempo.
- `01-frontend-backend.png` a `06-loki-query.png`: telas usadas no video.

Para regenerar o video, deixe a stack Docker rodando e execute:

```bash
node scripts/create_demo_video.js
```

O script abre o Chrome em modo headless, testa o frontend instrumentado, captura Grafana, Jaeger e Loki, e monta o WebM automaticamente.
