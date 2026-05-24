# Video de demonstracao

Arquivos principais:

- `demo-n2-evoluir-narrado.mp4`: video final com narracao em voz sintetica.
- `demo-n2-evoluir.webm`: video sem narracao, mantido como versao base.
- `NARRACAO_FINAL.txt`: texto usado para gerar a voz.
- `ROTEIRO_NARRACAO_VIDEO.md`: texto de narracao dividido por tempo.
- `01-frontend-backend.png` a `06-loki-query.png`: telas usadas no video.

Para regenerar o video, deixe a stack Docker rodando e execute:

```bash
node scripts/create_demo_video.js
powershell -ExecutionPolicy Bypass -File scripts/generate_narration_wav.ps1
python scripts/make_narrated_video.py
```

O primeiro script abre o Chrome em modo headless, testa o frontend instrumentado, captura Grafana, Jaeger e Loki, e monta o WebM base. O segundo gera a voz local usando a voz `Microsoft Maria Desktop`. O terceiro usa as telas e a narracao para gerar o MP4 final.
